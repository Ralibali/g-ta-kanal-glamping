
-- Make booking_id nullable for walk-in purchases (SUP)
ALTER TABLE public.addon_orders ALTER COLUMN booking_id DROP NOT NULL;

-- Add late_checkout and sup_rental addons
INSERT INTO public.addons (slug, name_sv, name_en, description_sv, description_en, price_sek, unit, max_quantity, sort_order, active)
VALUES
  ('late_checkout', 'Sen utcheckning till 12:00', 'Late check-out until 12:00', 'Stanna kvar till klockan tolv istället för tio.', 'Stay until noon instead of 10:00.', 400, 'st', 1, 50, true),
  ('sup_rental', 'SUP-uthyrning (24 h)', 'SUP rental (24h)', 'En SUP med flytväst, ett dygn på kanalen.', 'One SUP with life vest, 24 hours on the canal.', 100, 'st', 2, 60, true)
ON CONFLICT (slug) DO NOTHING;

-- Backfill tent_stays from existing addon orders (active statuses)
UPDATE public.tent_stays ts
SET breakfast = true
FROM public.addon_orders ao
JOIN public.addons a ON a.id = ao.addon_id
JOIN public.bookings b ON b.id = ao.booking_id
WHERE a.slug = 'breakfast'
  AND ao.status IN ('requested', 'confirmed', 'paid')
  AND ts.booking_number = b.booking_number
  AND ts.tent_id = b.tent_id
  AND ts.breakfast = false;

UPDATE public.tent_stays ts
SET fikapase = true
FROM public.addon_orders ao
JOIN public.addons a ON a.id = ao.addon_id
JOIN public.bookings b ON b.id = ao.booking_id
WHERE a.slug = 'fika_bag'
  AND ao.status IN ('requested', 'confirmed', 'paid')
  AND ts.booking_number = b.booking_number
  AND ts.tent_id = b.tent_id
  AND ts.fikapase = false;

-- Trigger: keep tent_stays in sync with addon_orders no matter how they were created
CREATE OR REPLACE FUNCTION public.sync_tent_stays_from_addon_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text;
  v_booking_number text;
  v_tent_id text;
BEGIN
  IF NEW.booking_id IS NULL THEN RETURN NEW; END IF;
  SELECT slug INTO v_slug FROM public.addons WHERE id = NEW.addon_id;
  SELECT booking_number, tent_id INTO v_booking_number, v_tent_id
    FROM public.bookings WHERE id = NEW.booking_id;
  IF v_booking_number IS NULL OR v_tent_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.status IN ('requested', 'confirmed', 'paid') THEN
    IF v_slug = 'breakfast' THEN
      UPDATE public.tent_stays SET breakfast = true
        WHERE booking_number = v_booking_number AND tent_id = v_tent_id;
    ELSIF v_slug = 'fika_bag' THEN
      UPDATE public.tent_stays SET fikapase = true
        WHERE booking_number = v_booking_number AND tent_id = v_tent_id;
    END IF;
  ELSIF NEW.status = 'cancelled' THEN
    IF v_slug = 'breakfast' THEN
      UPDATE public.tent_stays SET breakfast = false
        WHERE booking_number = v_booking_number AND tent_id = v_tent_id;
    ELSIF v_slug = 'fika_bag' THEN
      UPDATE public.tent_stays SET fikapase = false
        WHERE booking_number = v_booking_number AND tent_id = v_tent_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_tent_stays_from_addon_order ON public.addon_orders;
CREATE TRIGGER trg_sync_tent_stays_from_addon_order
AFTER INSERT OR UPDATE OF status ON public.addon_orders
FOR EACH ROW EXECUTE FUNCTION public.sync_tent_stays_from_addon_order();
