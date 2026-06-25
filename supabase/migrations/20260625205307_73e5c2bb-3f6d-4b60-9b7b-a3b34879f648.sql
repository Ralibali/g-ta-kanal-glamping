CREATE OR REPLACE FUNCTION public.recalculate_booking_addon_sync(p_booking_id uuid, p_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_booking_number text;
  v_has_active boolean;
BEGIN
  IF p_booking_id IS NULL OR p_slug IS NULL THEN
    RETURN;
  END IF;

  SELECT b.booking_number
  INTO v_booking_number
  FROM public.bookings b
  WHERE b.id = p_booking_id;

  IF v_booking_number IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.addon_orders o
    JOIN public.addons a ON a.id = o.addon_id
    WHERE o.booking_id = p_booking_id
      AND a.slug = p_slug
      AND o.status IN ('requested', 'confirmed', 'paid')
  ) INTO v_has_active;

  IF p_slug = 'breakfast' THEN
    UPDATE public.tent_stays
    SET breakfast = v_has_active
    WHERE booking_number = v_booking_number;

  ELSIF p_slug = 'fika_bag' THEN
    UPDATE public.tent_stays
    SET fikapase = v_has_active
    WHERE booking_number = v_booking_number;

  ELSIF p_slug = 'late_checkout' THEN
    UPDATE public.tent_stays
    SET late_checkout = v_has_active
    WHERE booking_number = v_booking_number;

  ELSIF p_slug = 'early_checkin' THEN
    IF v_has_active THEN
      UPDATE public.early_checkin_flags
      SET active = true
      WHERE booking_id = p_booking_id;

      INSERT INTO public.early_checkin_flags (tent_id, date, booking_id, active)
      SELECT ts.tent_id, ts.checkin_date, p_booking_id, true
      FROM public.tent_stays ts
      WHERE ts.booking_number = v_booking_number
        AND NOT EXISTS (
          SELECT 1
          FROM public.early_checkin_flags ef
          WHERE ef.booking_id = p_booking_id
            AND ef.tent_id = ts.tent_id
            AND ef.date = ts.checkin_date
        );
    ELSE
      UPDATE public.early_checkin_flags
      SET active = false
      WHERE booking_id = p_booking_id;
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_addon_order_to_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_slug text;
  v_old_slug text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT slug INTO v_new_slug FROM public.addons WHERE id = NEW.addon_id;
    PERFORM public.recalculate_booking_addon_sync(NEW.booking_id, v_new_slug);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT slug INTO v_new_slug FROM public.addons WHERE id = NEW.addon_id;
    SELECT slug INTO v_old_slug FROM public.addons WHERE id = OLD.addon_id;

    IF OLD.booking_id IS DISTINCT FROM NEW.booking_id OR OLD.addon_id IS DISTINCT FROM NEW.addon_id THEN
      PERFORM public.recalculate_booking_addon_sync(OLD.booking_id, v_old_slug);
      PERFORM public.recalculate_booking_addon_sync(NEW.booking_id, v_new_slug);
    ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM public.recalculate_booking_addon_sync(NEW.booking_id, v_new_slug);
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT slug INTO v_old_slug FROM public.addons WHERE id = OLD.addon_id;
    PERFORM public.recalculate_booking_addon_sync(OLD.booking_id, v_old_slug);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_tent_stays_from_addon_order ON public.addon_orders;
DROP TRIGGER IF EXISTS trg_sync_addon_order_to_operations ON public.addon_orders;

CREATE TRIGGER trg_sync_addon_order_to_operations
AFTER INSERT OR UPDATE OR DELETE ON public.addon_orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_addon_order_to_operations();