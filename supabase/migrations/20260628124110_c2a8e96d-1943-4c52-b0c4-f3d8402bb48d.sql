
CREATE OR REPLACE FUNCTION public.find_free_tent(p_checkin date, p_checkout date, p_exclude_booking text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tent text;
BEGIN
  IF p_checkin IS NULL OR p_checkout IS NULL OR p_checkout <= p_checkin THEN
    RETURN NULL;
  END IF;
  FOR v_tent IN SELECT unnest(ARRAY['sjobris','naturkarnan','lugnetsyta']) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.tent_stays ts
      WHERE ts.tent_id = v_tent
        AND ts.checkin_date < p_checkout
        AND ts.checkout_date > p_checkin
        AND (p_exclude_booking IS NULL OR ts.booking_number <> p_exclude_booking)
    ) THEN
      RETURN v_tent;
    END IF;
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_assign_tent_for_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tent text;
  v_name text;
  v_adults integer;
  v_children integer;
BEGIN
  IF NEW.tent_id IS NOT NULL AND length(btrim(NEW.tent_id)) > 0 THEN
    RETURN NEW;
  END IF;
  IF NEW.checkin_date IS NULL OR NEW.checkout_date IS NULL THEN
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM public.tent_stays ts WHERE ts.booking_number = NEW.booking_number) THEN
    RETURN NEW;
  END IF;

  v_tent := public.find_free_tent(NEW.checkin_date, NEW.checkout_date, NEW.booking_number);
  IF v_tent IS NULL THEN
    RETURN NEW;
  END IF;

  v_name := CASE v_tent
    WHEN 'sjobris' THEN 'Sjöbris'
    WHEN 'naturkarnan' THEN 'Naturkärnan'
    WHEN 'lugnetsyta' THEN 'Lugnets Yta'
  END;

  NEW.tent_id := v_tent;
  NEW.tent_name := COALESCE(NEW.tent_name, v_name);

  v_adults := GREATEST(COALESCE(NEW.guests, 2) - COALESCE(NEW.children, 0), 1);
  v_children := COALESCE(NEW.children, 0);

  INSERT INTO public.tent_stays (booking_number, tent_id, checkin_date, checkout_date, adults, children, guest_name, phone, email, lang)
  VALUES (NEW.booking_number, v_tent, NEW.checkin_date, NEW.checkout_date, v_adults, v_children, NEW.guest_name, NEW.phone, NEW.email, COALESCE(NEW.lang, 'sv'))
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_assign_tent ON public.bookings;
CREATE TRIGGER trg_auto_assign_tent
BEFORE INSERT OR UPDATE OF tent_id, checkin_date, checkout_date ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.auto_assign_tent_for_booking();

CREATE OR REPLACE FUNCTION public.auto_assign_missing_tents()
RETURNS TABLE(booking_number text, assigned_tent text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_tent text;
  v_name text;
  v_adults integer;
  v_children integer;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin_required';
  END IF;

  FOR r IN
    SELECT b.* FROM public.bookings b
    WHERE (b.tent_id IS NULL OR length(btrim(b.tent_id)) = 0)
      AND b.checkin_date IS NOT NULL
      AND b.checkout_date IS NOT NULL
      AND b.checkout_date > b.checkin_date
      AND NOT EXISTS (SELECT 1 FROM public.tent_stays ts WHERE ts.booking_number = b.booking_number)
    ORDER BY b.checkin_date
  LOOP
    v_tent := public.find_free_tent(r.checkin_date, r.checkout_date, r.booking_number);
    CONTINUE WHEN v_tent IS NULL;
    v_name := CASE v_tent
      WHEN 'sjobris' THEN 'Sjöbris'
      WHEN 'naturkarnan' THEN 'Naturkärnan'
      WHEN 'lugnetsyta' THEN 'Lugnets Yta'
    END;
    v_adults := GREATEST(COALESCE(r.guests, 2) - COALESCE(r.children, 0), 1);
    v_children := COALESCE(r.children, 0);

    UPDATE public.bookings SET tent_id = v_tent, tent_name = COALESCE(tent_name, v_name) WHERE id = r.id;
    INSERT INTO public.tent_stays (booking_number, tent_id, checkin_date, checkout_date, adults, children, guest_name, phone, email, lang)
    VALUES (r.booking_number, v_tent, r.checkin_date, r.checkout_date, v_adults, v_children, r.guest_name, r.phone, r.email, COALESCE(r.lang, 'sv'))
    ON CONFLICT DO NOTHING;

    booking_number := r.booking_number;
    assigned_tent := v_tent;
    RETURN NEXT;
  END LOOP;
END;
$$;
