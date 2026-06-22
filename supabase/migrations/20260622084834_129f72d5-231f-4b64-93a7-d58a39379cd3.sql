
-- ============================================================
-- 1. EXTEND BOOKINGS
-- ============================================================
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS public_token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS guest_first_name text,
  ADD COLUMN IF NOT EXISTS tent_name text,
  ADD COLUMN IF NOT EXISTS nights integer,
  ADD COLUMN IF NOT EXISTS sirvoy_booking_no text;

UPDATE public.bookings SET language = COALESCE(language, lang, 'en') WHERE language IS NULL;
UPDATE public.bookings SET public_token = gen_random_uuid() WHERE public_token IS NULL;
UPDATE public.bookings SET sirvoy_booking_no = COALESCE(sirvoy_booking_no, booking_number);
UPDATE public.bookings
SET guest_first_name = COALESCE(guest_first_name,
  CASE
    WHEN guest_name LIKE '%,%' THEN btrim(split_part(guest_name, ',', 2))
    ELSE split_part(guest_name, ' ', 1)
  END)
WHERE guest_first_name IS NULL AND guest_name IS NOT NULL;
UPDATE public.bookings SET nights = COALESCE(nights, (checkout_date - checkin_date)) WHERE nights IS NULL;
UPDATE public.bookings SET tent_name = COALESCE(tent_name,
  CASE tent_id
    WHEN 'sjobris' THEN 'Sjöbris'
    WHEN 'naturkarnan' THEN 'Naturkärnan'
    WHEN 'lugnetsyta' THEN 'Lugnetsyta'
    ELSE tent_id
  END) WHERE tent_name IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_public_token_idx ON public.bookings(public_token);
CREATE UNIQUE INDEX IF NOT EXISTS bookings_sirvoy_no_idx ON public.bookings(sirvoy_booking_no) WHERE sirvoy_booking_no IS NOT NULL;

-- ============================================================
-- 2. ADDONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_sv text NOT NULL,
  name_en text NOT NULL,
  description_sv text,
  description_en text,
  price_sek integer NOT NULL,
  unit text NOT NULL DEFAULT 'per_stay',
  max_quantity integer NOT NULL DEFAULT 10,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.addons TO anon, authenticated;
GRANT ALL ON public.addons TO service_role;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active addons are public" ON public.addons FOR SELECT USING (active = true);
CREATE POLICY "Admins manage addons" ON public.addons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER addons_touch_updated_at BEFORE UPDATE ON public.addons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- 3. ADDON ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.addon_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES public.addons(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price_sek integer NOT NULL,
  total_sek integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  stripe_session_id text,
  stripe_payment_intent text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS addon_orders_booking_idx ON public.addon_orders(booking_id);
CREATE INDEX IF NOT EXISTS addon_orders_session_idx ON public.addon_orders(stripe_session_id);

GRANT SELECT, INSERT, UPDATE ON public.addon_orders TO authenticated;
GRANT ALL ON public.addon_orders TO service_role;
ALTER TABLE public.addon_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage addon orders" ON public.addon_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER addon_orders_touch_updated_at BEFORE UPDATE ON public.addon_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- 4. PREARRIVAL MESSAGES (idempotency)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prearrival_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id, channel)
);
GRANT SELECT ON public.prearrival_messages TO authenticated;
GRANT ALL ON public.prearrival_messages TO service_role;
ALTER TABLE public.prearrival_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read prearrival" ON public.prearrival_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 5. EARLY CHECK-IN FLAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.early_checkin_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tent_id text NOT NULL,
  date date NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tent_id, date)
);
GRANT SELECT ON public.early_checkin_flags TO anon, authenticated;
GRANT ALL ON public.early_checkin_flags TO service_role;
ALTER TABLE public.early_checkin_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Early checkin flags readable" ON public.early_checkin_flags FOR SELECT USING (true);
CREATE POLICY "Admins manage early checkin" ON public.early_checkin_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 6. APP SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage settings" ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.app_settings (key, value) VALUES
  ('prearrival_lead_days', '5'::jsonb),
  ('order_cutoff_days', '2'::jsonb),
  ('owner_email', '"info@auroramedia.se"'::jsonb),
  ('public_base_url', '"https://goglampingsweden.se"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 7. SEED ADDONS
-- ============================================================
INSERT INTO public.addons (slug, name_sv, name_en, description_sv, description_en, price_sek, unit, max_quantity, sort_order) VALUES
  ('breakfast', 'Frukost', 'Breakfast',
   'Lokalt bakad frukost levererad till tältet på morgonen.',
   'Locally baked breakfast delivered to your tent in the morning.',
   209, 'per_quantity', 12, 1),
  ('fika_bag', 'Fikapåse', 'Fika bag',
   'En god start på vistelsen – lokalt fikabröd att mysa med.',
   'A sweet local treat to enjoy on arrival.',
   89, 'per_quantity', 12, 2),
  ('early_checkin', 'Tidig incheckning (kl 12.00)', 'Early check-in (12:00)',
   'Checka in redan kl 12.00 istället för ordinarie tid.',
   'Check in from 12:00 instead of standard time.',
   399, 'per_stay', 1, 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 8. RPC: get_stay_by_token (public, no PII leak)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_stay_by_token(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_b public.bookings%ROWTYPE;
  v_addons jsonb;
  v_orders jsonb;
  v_settings jsonb;
BEGIN
  IF p_token IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO v_b FROM public.bookings WHERE public_token = p_token LIMIT 1;
  IF v_b.id IS NULL THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', a.id, 'slug', a.slug,
    'name_sv', a.name_sv, 'name_en', a.name_en,
    'description_sv', a.description_sv, 'description_en', a.description_en,
    'price_sek', a.price_sek, 'unit', a.unit, 'max_quantity', a.max_quantity,
    'sort_order', a.sort_order
  ) ORDER BY a.sort_order), '[]'::jsonb)
  INTO v_addons FROM public.addons a WHERE a.active = true;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', o.id, 'addon_id', o.addon_id, 'quantity', o.quantity,
    'total_sek', o.total_sek, 'status', o.status, 'paid_at', o.paid_at
  )), '[]'::jsonb)
  INTO v_orders FROM public.addon_orders o
  WHERE o.booking_id = v_b.id AND o.status IN ('paid', 'confirmed');

  SELECT jsonb_object_agg(key, value) INTO v_settings
  FROM public.app_settings
  WHERE key IN ('order_cutoff_days', 'prearrival_lead_days');

  RETURN jsonb_build_object(
    'booking', jsonb_build_object(
      'id', v_b.id,
      'public_token', v_b.public_token,
      'guest_first_name', v_b.guest_first_name,
      'tent_id', v_b.tent_id,
      'tent_name', v_b.tent_name,
      'checkin_date', v_b.checkin_date,
      'checkout_date', v_b.checkout_date,
      'nights', v_b.nights,
      'language', COALESCE(v_b.language, 'en')
    ),
    'addons', v_addons,
    'orders', v_orders,
    'settings', COALESCE(v_settings, '{}'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_stay_by_token(uuid) TO anon, authenticated;

-- ============================================================
-- 9. RPC: list_bookings_missing_contact (admin)
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_bookings_missing_contact(p_window_days integer DEFAULT 30)
RETURNS TABLE(id uuid, booking_number text, guest_name text, tent_id text,
              checkin_date date, has_email boolean, has_phone boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.booking_number, b.guest_name, b.tent_id, b.checkin_date,
         (b.email IS NOT NULL AND length(btrim(b.email)) > 0) AS has_email,
         (b.phone IS NOT NULL AND length(btrim(b.phone)) > 0) AS has_phone
  FROM public.bookings b
  WHERE b.checkin_date >= ((now() AT TIME ZONE 'Europe/Stockholm')::date)
    AND b.checkin_date <= ((now() AT TIME ZONE 'Europe/Stockholm')::date + p_window_days)
    AND (b.email IS NULL OR length(btrim(b.email)) = 0
         OR b.phone IS NULL OR length(btrim(b.phone)) = 0)
  ORDER BY b.checkin_date ASC
$$;

REVOKE ALL ON FUNCTION public.list_bookings_missing_contact(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_bookings_missing_contact(integer) TO authenticated;
