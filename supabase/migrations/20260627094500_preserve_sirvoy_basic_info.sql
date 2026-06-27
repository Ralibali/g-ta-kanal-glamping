-- Preserve contact notes from Sirvoy Basic info when Booking content is imported afterwards.
-- The two CSV files may be selected together, so the second upsert must merge raw JSON
-- instead of replacing the first file's raw payload.

CREATE OR REPLACE FUNCTION public.merge_booking_raw_on_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.raw := COALESCE(OLD.raw, '{}'::jsonb) || COALESCE(NEW.raw, '{}'::jsonb);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_merge_booking_raw_on_update ON public.bookings;

CREATE TRIGGER trg_merge_booking_raw_on_update
BEFORE UPDATE OF raw ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.merge_booking_raw_on_update();
