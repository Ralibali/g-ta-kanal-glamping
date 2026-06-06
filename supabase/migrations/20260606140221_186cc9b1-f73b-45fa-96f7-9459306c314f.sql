
CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text NOT NULL,
  tent_id text NOT NULL,
  lang text NOT NULL,
  user_agent text,
  checked_in_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.check_ins TO anon, authenticated;
GRANT SELECT ON public.check_ins TO authenticated;
GRANT ALL ON public.check_ins TO service_role;

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a check-in"
  ON public.check_ins FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view check-ins"
  ON public.check_ins FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_check_ins_checked_in_at ON public.check_ins (checked_in_at DESC);
