
-- =============================================================
-- Booking Engine (portat från StayBoost) — allt prefixat `be_`
-- så inget kolliderar med befintliga `bookings` / `addons`.
-- =============================================================

-- ---------- be_properties ----------
CREATE TABLE public.be_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE DEFAULT ('property-' || substr(encode(gen_random_bytes(3), 'hex'), 1, 6)),
  name text NOT NULL,
  checkin_time text NOT NULL DEFAULT '15:00',
  checkout_time text NOT NULL DEFAULT '11:00',
  directions text,
  wifi_name text,
  wifi_password text,
  house_rules text,
  contact_phone text,
  contact_email text,
  review_url text,
  swish_number text,
  currency text NOT NULL DEFAULT 'SEK',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.be_properties TO authenticated;
GRANT ALL ON public.be_properties TO service_role;
ALTER TABLE public.be_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages properties" ON public.be_properties
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public reads active properties by slug" ON public.be_properties
  FOR SELECT TO anon, authenticated USING (active = true);

-- ---------- be_units ----------
CREATE TABLE public.be_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.be_properties(id) ON DELETE CASCADE,
  legacy_tent_id text,  -- 'sjobris' | 'naturkarnan' | 'lugnetsyta' för mappning
  external_ref text,    -- Sirvoy room id
  name text NOT NULL,
  description text,
  door_code text,
  capacity int NOT NULL DEFAULT 2 CHECK (capacity > 0),
  base_price int NOT NULL DEFAULT 1995,
  weekend_pct int NOT NULL DEFAULT 15,
  min_stay int NOT NULL DEFAULT 1,
  cleaning_fee int NOT NULL DEFAULT 0,
  monthly_mult numeric[] NOT NULL DEFAULT '{60,60,60,70,85,100,110,110,85,70,60,60}',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX be_units_legacy_uniq ON public.be_units (property_id, legacy_tent_id)
  WHERE legacy_tent_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.be_units TO authenticated;
GRANT ALL ON public.be_units TO service_role;
GRANT SELECT ON public.be_units TO anon;
ALTER TABLE public.be_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages units" ON public.be_units
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public reads active units" ON public.be_units
  FOR SELECT TO anon, authenticated USING (active = true);

-- ---------- be_ical_sources ----------
CREATE TABLE public.be_ical_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.be_properties(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.be_units(id) ON DELETE CASCADE,
  name text NOT NULL,        -- 'Sirvoy', 'Booking.com', 'Airbnb', ...
  url text NOT NULL,
  last_synced_at timestamptz,
  last_status text,
  last_error text,
  events_count int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.be_ical_sources TO authenticated;
GRANT ALL ON public.be_ical_sources TO service_role;
ALTER TABLE public.be_ical_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages ical sources" ON public.be_ical_sources
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- be_bookings ----------
CREATE TABLE public.be_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.be_properties(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.be_units(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'direct'
    CHECK (source IN ('direct', 'manual', 'ical', 'sirvoy', 'admin')),
  ical_source_id uuid REFERENCES public.be_ical_sources(id) ON DELETE SET NULL,
  ical_uid text,
  external_id text,
  guest_name text,
  guest_email text,
  guest_phone text,
  guests int CHECK (guests IS NULL OR guests > 0),
  checkin_date date NOT NULL,
  checkout_date date NOT NULL,
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('pending','confirmed','cancelled')),
  payment_status text NOT NULL DEFAULT 'none'
    CHECK (payment_status IN ('none','pending','paid','refunded')),
  payment_method text NOT NULL DEFAULT 'none'
    CHECK (payment_method IN ('none','swish','stripe')),
  payment_amount int,
  payment_ref text,
  stripe_session_id text,
  addons_total int NOT NULL DEFAULT 0,
  total_amount int NOT NULL DEFAULT 0,
  guest_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  public_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  language text NOT NULL DEFAULT 'sv',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (checkout_date > checkin_date)
);
ALTER TABLE public.be_bookings
  ADD CONSTRAINT be_bookings_ical_dedup UNIQUE (ical_source_id, ical_uid);
CREATE UNIQUE INDEX be_bookings_external_dedup
  ON public.be_bookings (property_id, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX be_bookings_unit_dates ON public.be_bookings (unit_id, checkin_date);
CREATE INDEX be_bookings_property_dates ON public.be_bookings (property_id, checkin_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.be_bookings TO authenticated;
GRANT ALL ON public.be_bookings TO service_role;
ALTER TABLE public.be_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages be_bookings" ON public.be_bookings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- be_addons ----------
CREATE TABLE public.be_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.be_properties(id) ON DELETE CASCADE,
  legacy_addon_id uuid REFERENCES public.addons(id) ON DELETE SET NULL,
  slug text,
  name text NOT NULL,
  name_en text,
  description text,
  description_en text,
  price int NOT NULL DEFAULT 0 CHECK (price >= 0),
  price_type text NOT NULL DEFAULT 'per_booking'
    CHECK (price_type IN ('per_booking','per_night','per_guest')),
  image_url text,
  max_quantity int NOT NULL DEFAULT 1 CHECK (max_quantity > 0),
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX be_addons_property_idx ON public.be_addons (property_id, sort_order);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.be_addons TO authenticated;
GRANT ALL ON public.be_addons TO service_role;
GRANT SELECT ON public.be_addons TO anon;
ALTER TABLE public.be_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages be_addons" ON public.be_addons
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public reads active be_addons" ON public.be_addons
  FOR SELECT TO anon, authenticated USING (active = true);

-- ---------- be_booking_addons ----------
CREATE TABLE public.be_booking_addons (
  booking_id uuid NOT NULL REFERENCES public.be_bookings(id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES public.be_addons(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price int NOT NULL CHECK (unit_price >= 0),
  price_type text NOT NULL DEFAULT 'per_booking',
  line_total int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (booking_id, addon_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.be_booking_addons TO authenticated;
GRANT ALL ON public.be_booking_addons TO service_role;
ALTER TABLE public.be_booking_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages be_booking_addons" ON public.be_booking_addons
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- updated_at-triggrar ----------
CREATE TRIGGER be_properties_touch BEFORE UPDATE ON public.be_properties
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER be_units_touch BEFORE UPDATE ON public.be_units
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER be_ical_sources_touch BEFORE UPDATE ON public.be_ical_sources
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER be_bookings_touch BEFORE UPDATE ON public.be_bookings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER be_addons_touch BEFORE UPDATE ON public.be_addons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- Seed anläggning + tre tält ----------
INSERT INTO public.be_properties
  (slug, name, checkin_time, checkout_time, contact_phone, contact_email,
   wifi_name, wifi_password, swish_number)
VALUES
  ('go-glamping-sweden', 'Go Glamping Sweden', '15:00', '11:00',
   '0722254993', 'info@auroramedia.se',
   'Mercusys_6858', '70048594', '1230628289');

INSERT INTO public.be_units
  (property_id, legacy_tent_id, name, description, capacity, base_price, weekend_pct, min_stay, sort_order)
SELECT p.id, u.legacy_tent_id, u.name, u.description, u.capacity, u.base_price, u.weekend_pct, u.min_stay, u.sort_order
FROM public.be_properties p, (VALUES
  ('sjobris',    'Sjöbrisretreatet', 'Fyrabäddstält vid vattnet',       4, 1995, 15, 1, 1),
  ('naturkarnan','Naturkärnan',      'Tvåbäddstält med naturkänsla',    2, 1795, 15, 1, 2),
  ('lugnetsyta', 'Lugnets Yta',      'Fyrabäddstält på lugnaste läget', 4, 1995, 15, 1, 3)
) AS u(legacy_tent_id, name, description, capacity, base_price, weekend_pct, min_stay, sort_order)
WHERE p.slug = 'go-glamping-sweden';

-- Spegla befintliga aktiva tillval från `addons` in i `be_addons` för start
INSERT INTO public.be_addons
  (property_id, legacy_addon_id, slug, name, name_en, description, description_en,
   price, price_type, max_quantity, active, sort_order)
SELECT
  p.id, a.id, a.slug, a.name_sv, a.name_en, a.description_sv, a.description_en,
  a.price_sek,
  CASE WHEN a.slug IN ('breakfast','fika_bag') THEN 'per_guest' ELSE 'per_booking' END,
  COALESCE(a.max_quantity, 1),
  a.active,
  a.sort_order
FROM public.addons a
CROSS JOIN public.be_properties p
WHERE p.slug = 'go-glamping-sweden' AND a.active = true;

-- ---------- Sammansatt vy: Sirvoy + booking-engine ----------
CREATE OR REPLACE VIEW public.all_bookings_v
WITH (security_invoker = true) AS
SELECT
  'sirvoy'::text                        AS engine,
  b.id                                  AS id,
  b.booking_number                      AS reference,
  b.public_token                        AS public_token,
  b.guest_name                          AS guest_name,
  b.email                               AS guest_email,
  b.phone                               AS guest_phone,
  b.tent_id                             AS legacy_tent_id,
  NULL::uuid                            AS unit_id,
  b.checkin_date                        AS checkin_date,
  b.checkout_date                       AS checkout_date,
  b.nights                              AS nights,
  COALESCE(b.language, b.lang, 'sv')    AS language,
  'confirmed'::text                     AS status,
  'none'::text                          AS payment_status,
  0                                     AS total_amount,
  b.created_at                          AS created_at
FROM public.bookings b
UNION ALL
SELECT
  'engine'::text                        AS engine,
  be.id                                 AS id,
  ('BE-' || substr(be.id::text, 1, 8))  AS reference,
  be.public_token                       AS public_token,
  be.guest_name                         AS guest_name,
  be.guest_email                        AS guest_email,
  be.guest_phone                        AS guest_phone,
  u.legacy_tent_id                      AS legacy_tent_id,
  be.unit_id                            AS unit_id,
  be.checkin_date                       AS checkin_date,
  be.checkout_date                      AS checkout_date,
  (be.checkout_date - be.checkin_date)  AS nights,
  be.language                           AS language,
  be.status                             AS status,
  be.payment_status                     AS payment_status,
  be.total_amount                       AS total_amount,
  be.created_at                         AS created_at
FROM public.be_bookings be
LEFT JOIN public.be_units u ON u.id = be.unit_id
WHERE be.status <> 'cancelled';

GRANT SELECT ON public.all_bookings_v TO authenticated, service_role;

-- ---------- Publik RPC: tillgänglighetskontroll ----------
CREATE OR REPLACE FUNCTION public.be_check_availability(
  p_property_slug text,
  p_checkin date,
  p_checkout date
) RETURNS TABLE (
  unit_id uuid,
  unit_name text,
  capacity int,
  base_price int,
  cleaning_fee int,
  available boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH p AS (
    SELECT id FROM public.be_properties WHERE slug = p_property_slug AND active = true LIMIT 1
  )
  SELECT
    u.id, u.name, u.capacity, u.base_price, u.cleaning_fee,
    -- Tillgängligt om det INTE finns någon överlappande bokning i vare sig
    -- booking-engine eller i importerade Sirvoy-bokningar för samma tält.
    NOT (
      EXISTS (
        SELECT 1 FROM public.be_bookings b
        WHERE b.unit_id = u.id
          AND b.status <> 'cancelled'
          AND b.checkin_date < p_checkout
          AND b.checkout_date > p_checkin
      )
      OR EXISTS (
        SELECT 1 FROM public.bookings sb
        WHERE sb.tent_id = u.legacy_tent_id
          AND sb.checkin_date < p_checkout
          AND sb.checkout_date > p_checkin
      )
    ) AS available
  FROM p, public.be_units u
  WHERE u.property_id = p.id AND u.active = true
  ORDER BY u.sort_order;
$$;
GRANT EXECUTE ON FUNCTION public.be_check_availability(text, date, date) TO anon, authenticated;
