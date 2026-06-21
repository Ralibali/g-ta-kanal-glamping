CREATE TABLE public.self_clean_dates (
  date date PRIMARY KEY,
  note text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.self_clean_dates TO authenticated;
GRANT ALL ON public.self_clean_dates TO service_role;
ALTER TABLE public.self_clean_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cleaner_admin_read_self_clean"
ON public.self_clean_dates FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'cleaner'::app_role)
  OR public.has_role(auth.uid(), 'breakfast'::app_role)
);

CREATE POLICY "admin_write_self_clean"
ON public.self_clean_dates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));