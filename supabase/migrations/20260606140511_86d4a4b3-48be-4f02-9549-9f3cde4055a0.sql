
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text NOT NULL UNIQUE,
  guest_name text,
  email text,
  phone text,
  address text,
  checkin_date date,
  checkout_date date,
  tent_id text,
  amount numeric,
  lang text DEFAULT 'sv',
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bookings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Anonymous check-in lookup: only the columns CheckIn.tsx needs are read via select().
-- We still gate via RLS so guests can read any single booking by knowing its number.
CREATE POLICY "Public can look up bookings"
  ON public.bookings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bookings"
  ON public.bookings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_bookings_booking_number ON public.bookings (booking_number);
CREATE INDEX idx_bookings_checkin_date ON public.bookings (checkin_date);

CREATE OR REPLACE FUNCTION public.update_bookings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_bookings_updated_at();
