CREATE TABLE IF NOT EXISTS public.sirvoy_import_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sirvoy_import_staging TO authenticated;
GRANT ALL ON public.sirvoy_import_staging TO service_role;

ALTER TABLE public.sirvoy_import_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sirvoy import staging"
ON public.sirvoy_import_staging FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.apply_sirvoy_import_staging()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_numbers text[];
  v_bookings int := 0;
  v_stays int := 0;
BEGIN
  SELECT array_agg(DISTINCT (payload->>'booking_number'))
    INTO v_numbers FROM public.sirvoy_import_staging WHERE kind = 'booking';
  IF v_numbers IS NULL THEN
    RETURN jsonb_build_object('bookings', 0, 'stays', 0);
  END IF;

  INSERT INTO public.bookings AS b (
    booking_number, sirvoy_booking_no, guest_name, guest_first_name, email, phone,
    address, country_code, checkin_date, checkout_date, tent_id, tent_name,
    amount, lang, language, nights, raw
  )
  SELECT r.booking_number, r.sirvoy_booking_no, r.guest_name, r.guest_first_name, r.email, r.phone,
         r.address, r.country_code, r.checkin_date, r.checkout_date, r.tent_id, r.tent_name,
         r.amount, r.lang, r.language, r.nights, COALESCE(r.raw, '{}'::jsonb)
  FROM public.sirvoy_import_staging s
  CROSS JOIN LATERAL jsonb_to_record(s.payload) AS r(
    booking_number text, sirvoy_booking_no text, guest_name text, guest_first_name text,
    email text, phone text, address text, country_code text, checkin_date date,
    checkout_date date, tent_id text, tent_name text, amount numeric, lang text,
    language text, nights integer, raw jsonb
  )
  WHERE s.kind = 'booking'
  ON CONFLICT (booking_number) DO UPDATE SET
    sirvoy_booking_no = COALESCE(EXCLUDED.sirvoy_booking_no, b.sirvoy_booking_no),
    guest_name = COALESCE(EXCLUDED.guest_name, b.guest_name),
    guest_first_name = COALESCE(EXCLUDED.guest_first_name, b.guest_first_name),
    email = COALESCE(NULLIF(EXCLUDED.email, ''), b.email),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), b.phone),
    address = COALESCE(EXCLUDED.address, b.address),
    country_code = COALESCE(EXCLUDED.country_code, b.country_code),
    checkin_date = COALESCE(EXCLUDED.checkin_date, b.checkin_date),
    checkout_date = COALESCE(EXCLUDED.checkout_date, b.checkout_date),
    tent_id = COALESCE(EXCLUDED.tent_id, b.tent_id),
    tent_name = COALESCE(EXCLUDED.tent_name, b.tent_name),
    amount = COALESCE(EXCLUDED.amount, b.amount),
    lang = COALESCE(EXCLUDED.lang, b.lang),
    language = COALESCE(EXCLUDED.language, b.language),
    nights = COALESCE(EXCLUDED.nights, b.nights),
    raw = COALESCE(b.raw, '{}'::jsonb) || COALESCE(EXCLUDED.raw, '{}'::jsonb);
  GET DIAGNOSTICS v_bookings = ROW_COUNT;

  IF EXISTS (SELECT 1 FROM public.sirvoy_import_staging WHERE kind = 'stay') THEN
    DELETE FROM public.tent_stays WHERE booking_number = ANY(v_numbers);

    INSERT INTO public.tent_stays (
      booking_number, room_id, tent_id, checkin_date, checkout_date, adults, children,
      breakfast, fikapase, late_checkout, late_checkout_csv,
      breakfast_csv_quantity, breakfast_addon_quantity, fikapase_csv_quantity, fikapase_addon_quantity,
      guest_name, phone, email, lang, note, dietary, dietary_note, raw, import_source, imported_at
    )
    SELECT r.booking_number, r.room_id, r.tent_id, r.checkin_date, r.checkout_date,
           COALESCE(r.adults, 1), COALESCE(r.children, 0),
           COALESCE(r.breakfast, false), COALESCE(r.fikapase, false),
           COALESCE(r.late_checkout, false), COALESCE(r.late_checkout_csv, false),
           COALESCE(r.breakfast_csv_quantity, 0), COALESCE(r.breakfast_addon_quantity, 0),
           COALESCE(r.fikapase_csv_quantity, 0), COALESCE(r.fikapase_addon_quantity, 0),
           r.guest_name, r.phone, r.email, COALESCE(r.lang, 'sv'), r.note,
           COALESCE(r.dietary, ARRAY[]::text[]), r.dietary_note,
           COALESCE(r.raw, '{}'::jsonb), COALESCE(r.import_source, 'sirvoy_booking_content'),
           COALESCE(r.imported_at, now())
    FROM public.sirvoy_import_staging s
    CROSS JOIN LATERAL jsonb_to_record(s.payload) AS r(
      booking_number text, room_id text, tent_id text, checkin_date date, checkout_date date,
      adults integer, children integer, breakfast boolean, fikapase boolean,
      late_checkout boolean, late_checkout_csv boolean,
      breakfast_csv_quantity integer, breakfast_addon_quantity integer,
      fikapase_csv_quantity integer, fikapase_addon_quantity integer,
      guest_name text, phone text, email text, lang text, note text,
      dietary text[], dietary_note text, raw jsonb, import_source text, imported_at timestamptz
    )
    WHERE s.kind = 'stay';
    GET DIAGNOSTICS v_stays = ROW_COUNT;
  END IF;

  DELETE FROM public.sirvoy_import_staging;

  RETURN jsonb_build_object('bookings', v_bookings, 'stays', v_stays);
END;
$$;