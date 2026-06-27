-- ============================================================
-- 20260627093000_sirvoy_import_v2.sql
-- ============================================================
ALTER TABLE public.tent_stays
  ADD COLUMN IF NOT EXISTS breakfast_csv_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS breakfast_addon_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fikapase_csv_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fikapase_addon_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_checkout_csv boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS late_checkout_addon boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS import_source text NOT NULL DEFAULT 'legacy';

CREATE INDEX IF NOT EXISTS idx_tent_stays_booking_dates
  ON public.tent_stays (booking_number, checkin_date, checkout_date);

CREATE OR REPLACE FUNCTION public.recalculate_booking_operation_quantities(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_booking_number text;
  v_primary_stay_id uuid;
  v_breakfast integer := 0;
  v_fika integer := 0;
  v_late boolean := false;
  v_early boolean := false;
BEGIN
  IF p_booking_id IS NULL THEN RETURN; END IF;
  SELECT b.booking_number INTO v_booking_number FROM public.bookings b WHERE b.id = p_booking_id;
  IF v_booking_number IS NULL THEN RETURN; END IF;

  SELECT
    COALESCE(SUM(o.quantity) FILTER (WHERE a.slug = 'breakfast'), 0)::integer,
    COALESCE(SUM(o.quantity) FILTER (WHERE a.slug = 'fika_bag'), 0)::integer,
    COALESCE(BOOL_OR(a.slug = 'late_checkout'), false),
    COALESCE(BOOL_OR(a.slug = 'early_checkin'), false)
  INTO v_breakfast, v_fika, v_late, v_early
  FROM public.addon_orders o
  JOIN public.addons a ON a.id = o.addon_id
  WHERE o.booking_id = p_booking_id
    AND o.status IN ('requested', 'confirmed', 'paid');

  UPDATE public.tent_stays
  SET
    breakfast_addon_quantity = 0,
    fikapase_addon_quantity = 0,
    late_checkout_addon = v_late,
    breakfast = breakfast_csv_quantity > 0,
    fikapase = fikapase_csv_quantity > 0,
    late_checkout = late_checkout_csv OR v_late
  WHERE booking_number = v_booking_number;

  SELECT ts.id INTO v_primary_stay_id
  FROM public.tent_stays ts
  WHERE ts.booking_number = v_booking_number
  ORDER BY ts.checkin_date, ts.room_id NULLS LAST, ts.tent_id, ts.id
  LIMIT 1;

  IF v_primary_stay_id IS NOT NULL THEN
    UPDATE public.tent_stays
    SET
      breakfast_addon_quantity = v_breakfast,
      fikapase_addon_quantity = v_fika,
      breakfast = (breakfast_csv_quantity + v_breakfast) > 0,
      fikapase = (fikapase_csv_quantity + v_fika) > 0
    WHERE id = v_primary_stay_id;
  END IF;

  UPDATE public.early_checkin_flags SET active = v_early WHERE booking_id = p_booking_id;

  IF v_early THEN
    INSERT INTO public.early_checkin_flags (tent_id, date, booking_id, active)
    SELECT ts.tent_id, ts.checkin_date, p_booking_id, true
    FROM public.tent_stays ts
    WHERE ts.booking_number = v_booking_number
      AND NOT EXISTS (
        SELECT 1 FROM public.early_checkin_flags ef
        WHERE ef.booking_id = p_booking_id AND ef.tent_id = ts.tent_id AND ef.date = ts.checkin_date
      );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_booking_addon_sync(p_booking_id uuid, p_slug text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN PERFORM public.recalculate_booking_operation_quantities(p_booking_id); END; $$;

CREATE OR REPLACE FUNCTION public.sync_addon_order_to_operations()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recalculate_booking_operation_quantities(NEW.booking_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.booking_id IS DISTINCT FROM NEW.booking_id THEN
      PERFORM public.recalculate_booking_operation_quantities(OLD.booking_id);
    END IF;
    PERFORM public.recalculate_booking_operation_quantities(NEW.booking_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_booking_operation_quantities(OLD.booking_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_tent_stays_from_addon_order ON public.addon_orders;
DROP TRIGGER IF EXISTS trg_sync_addon_order_to_operations ON public.addon_orders;

CREATE TRIGGER trg_sync_addon_order_to_operations
AFTER INSERT OR UPDATE OR DELETE ON public.addon_orders
FOR EACH ROW EXECUTE FUNCTION public.sync_addon_order_to_operations();

CREATE OR REPLACE FUNCTION public.recalculate_operations_for_booking_numbers(p_booking_numbers text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE r record;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin_required';
  END IF;
  FOR r IN SELECT b.id FROM public.bookings b WHERE b.booking_number = ANY(COALESCE(p_booking_numbers, ARRAY[]::text[]))
  LOOP PERFORM public.recalculate_booking_operation_quantities(r.id); END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.recalculate_booking_operation_quantities(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalculate_booking_addon_sync(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_addon_order_to_operations() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalculate_operations_for_booking_numbers(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalculate_booking_operation_quantities(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_booking_addon_sync(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_addon_order_to_operations() TO service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_operations_for_booking_numbers(text[]) TO authenticated, service_role;

-- ============================================================
-- 20260627094500_preserve_sirvoy_basic_info.sql
-- ============================================================
CREATE OR REPLACE FUNCTION public.merge_booking_raw_on_update()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $$
BEGIN
  NEW.raw := COALESCE(OLD.raw, '{}'::jsonb) || COALESCE(NEW.raw, '{}'::jsonb);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_merge_booking_raw_on_update ON public.bookings;
CREATE TRIGGER trg_merge_booking_raw_on_update
BEFORE UPDATE OF raw ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.merge_booking_raw_on_update();

-- ============================================================
-- 20260627095000_breakfast_notes_rpc.sql
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_breakfast_booking_notes(p_booking_numbers text[])
RETURNS TABLE (booking_number text, guest_name text, raw jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('breakfast'::public.app_role, 'admin'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'breakfast_access_required';
  END IF;
  RETURN QUERY
  SELECT b.booking_number, b.guest_name, b.raw
  FROM public.bookings b
  WHERE b.booking_number = ANY(COALESCE(p_booking_numbers, ARRAY[]::text[]));
END;
$$;

REVOKE ALL ON FUNCTION public.get_breakfast_booking_notes(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_breakfast_booking_notes(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_breakfast_booking_notes(text[]) TO service_role;

-- ============================================================
-- 20260627165000_breakfast_prepared_status.sql
-- ============================================================
ALTER TABLE public.breakfast_deliveries
  ADD COLUMN IF NOT EXISTS prepared_at timestamptz,
  ADD COLUMN IF NOT EXISTS prepared_by uuid,
  ADD COLUMN IF NOT EXISTS prepared_quantity integer;

CREATE INDEX IF NOT EXISTS idx_breakfast_deliveries_date_status
  ON public.breakfast_deliveries (delivery_date, status);

-- ============================================================
-- 20260627165100_breakfast_prepared_policy.sql
-- ============================================================
ALTER TABLE public.breakfast_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Breakfast staff manage deliveries" ON public.breakfast_deliveries;
CREATE POLICY "Breakfast staff manage deliveries"
ON public.breakfast_deliveries FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'breakfast'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'breakfast'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);