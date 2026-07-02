
CREATE OR REPLACE FUNCTION public.auto_assign_tent_for_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tent text;
  v_name text;
  v_adults integer;
  v_children integer;
  v_guests integer;
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

  v_guests := COALESCE(NULLIF((NEW.raw->>'number_of_guests'),'')::int, 2);
  v_children := COALESCE(NULLIF((NEW.raw->>'children_total'),'')::int, 0);
  v_adults := GREATEST(v_guests - v_children, 1);

  INSERT INTO public.tent_stays (booking_number, tent_id, checkin_date, checkout_date, adults, children, guest_name, phone, email, lang)
  VALUES (NEW.booking_number, v_tent, NEW.checkin_date, NEW.checkout_date, v_adults, v_children, NEW.guest_name, NEW.phone, NEW.email, COALESCE(NEW.lang, 'sv'))
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_assign_missing_tents()
 RETURNS TABLE(booking_number text, assigned_tent text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r record;
  v_tent text;
  v_name text;
  v_adults integer;
  v_children integer;
  v_guests integer;
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
    v_guests := COALESCE(NULLIF((r.raw->>'number_of_guests'),'')::int, 2);
    v_children := COALESCE(NULLIF((r.raw->>'children_total'),'')::int, 0);
    v_adults := GREATEST(v_guests - v_children, 1);

    UPDATE public.bookings SET tent_id = v_tent, tent_name = COALESCE(tent_name, v_name) WHERE id = r.id;
    INSERT INTO public.tent_stays (booking_number, tent_id, checkin_date, checkout_date, adults, children, guest_name, phone, email, lang)
    VALUES (r.booking_number, v_tent, r.checkin_date, r.checkout_date, v_adults, v_children, r.guest_name, r.phone, r.email, COALESCE(r.lang, 'sv'))
    ON CONFLICT DO NOTHING;

    booking_number := r.booking_number;
    assigned_tent := v_tent;
    RETURN NEXT;
  END LOOP;
END;
$function$;
