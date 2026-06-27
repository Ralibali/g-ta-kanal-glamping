-- Two-step breakfast workflow for Bostället: prepared -> delivered.
ALTER TABLE public.breakfast_deliveries
  ADD COLUMN IF NOT EXISTS prepared_at timestamptz,
  ADD COLUMN IF NOT EXISTS prepared_by uuid,
  ADD COLUMN IF NOT EXISTS prepared_quantity integer;

CREATE INDEX IF NOT EXISTS idx_breakfast_deliveries_date_status
  ON public.breakfast_deliveries (delivery_date, status);
