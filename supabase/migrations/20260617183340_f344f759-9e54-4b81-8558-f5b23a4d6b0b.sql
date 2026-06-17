-- Add breakfast role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'breakfast';

-- Table to track breakfast / fikapåse deliveries
CREATE TABLE IF NOT EXISTS public.breakfast_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text NOT NULL,
  tent_id text NOT NULL,
  delivery_date date NOT NULL,
  kind text NOT NULL DEFAULT 'breakfast',
  status text NOT NULL DEFAULT 'pending',
  delivered_at timestamptz,
  delivered_by uuid,
  sms_status text,
  sms_error text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_number, delivery_date, kind)
);

GRANT SELECT, INSERT, UPDATE ON public.breakfast_deliveries TO authenticated;
GRANT ALL ON public.breakfast_deliveries TO service_role;

ALTER TABLE public.breakfast_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Breakfast/admin read deliveries"
  ON public.breakfast_deliveries FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text = 'breakfast'
    )
  );

CREATE POLICY "Breakfast/admin write deliveries"
  ON public.breakfast_deliveries FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text = 'breakfast'
    )
  );

CREATE POLICY "Breakfast/admin update deliveries"
  ON public.breakfast_deliveries FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text = 'breakfast'
    )
  );

CREATE TRIGGER breakfast_deliveries_touch
  BEFORE UPDATE ON public.breakfast_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Allow breakfast role to read tent_stays (extend existing policy)
DROP POLICY IF EXISTS "Cleaner/admin read stays" ON public.tent_stays;
CREATE POLICY "Cleaner/breakfast/admin read stays"
  ON public.tent_stays FOR SELECT
  USING (
    has_role(auth.uid(), 'cleaner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text = 'breakfast'
    )
  );