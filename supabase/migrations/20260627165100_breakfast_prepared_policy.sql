ALTER TABLE public.breakfast_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Breakfast staff manage deliveries" ON public.breakfast_deliveries;
CREATE POLICY "Breakfast staff manage deliveries"
ON public.breakfast_deliveries
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'breakfast'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'breakfast'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);
