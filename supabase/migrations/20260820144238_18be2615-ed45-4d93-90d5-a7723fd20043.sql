CREATE OR REPLACE FUNCTION public.lock_tent_after_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_bn text;
  v_checkout date;
BEGIN
  IF NEW.tent_id IS NOT DISTINCT FROM OLD.tent_id THEN
    RETURN NEW;
  END IF;
  v_bn := NEW.booking_number;
  v_checkout := COALESCE(NEW.checkout_date, OLD.checkout_date);
  IF v_checkout IS NULL OR v_checkout < ((now() AT TIME ZONE 'Europe/Stockholm')::date) THEN
    RETURN NEW;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.check_ins ci
    WHERE ci.booking_number = v_bn
      AND ci.tent_id = OLD.tent_id
      AND ci.checked_in_at >= (now() - interval '14 days')
  ) THEN
    -- Gästen har redan checkat in i det gamla tältet: behåll det.
    NEW.tent_id := OLD.tent_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_tent_after_checkin_bookings ON public.bookings;
CREATE TRIGGER trg_lock_tent_after_checkin_bookings
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.lock_tent_after_checkin();

DROP TRIGGER IF EXISTS trg_lock_tent_after_checkin_stays ON public.tent_stays;
CREATE TRIGGER trg_lock_tent_after_checkin_stays
BEFORE UPDATE ON public.tent_stays
FOR EACH ROW EXECUTE FUNCTION public.lock_tent_after_checkin();