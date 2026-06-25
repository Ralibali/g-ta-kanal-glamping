DROP POLICY IF EXISTS "Early checkin flags readable" ON public.early_checkin_flags;
REVOKE SELECT ON public.early_checkin_flags FROM anon;
CREATE POLICY "Cleaners and admins read early checkin"
  ON public.early_checkin_flags
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'cleaner'::app_role)
  );