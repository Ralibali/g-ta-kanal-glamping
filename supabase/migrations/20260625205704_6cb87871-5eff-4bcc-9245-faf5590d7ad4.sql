DROP TRIGGER IF EXISTS trg_sync_addon_order_to_operations ON public.addon_orders;
DROP TRIGGER IF EXISTS trg_sync_tent_stays_from_addon_order ON public.addon_orders;

CREATE TRIGGER trg_sync_addon_order_to_operations
AFTER INSERT OR UPDATE OR DELETE ON public.addon_orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_addon_order_to_operations();

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT o.booking_id, a.slug
    FROM public.addon_orders o
    JOIN public.addons a ON a.id = o.addon_id
    WHERE o.booking_id IS NOT NULL
      AND a.slug IN ('breakfast', 'fika_bag', 'late_checkout', 'early_checkin')
  LOOP
    PERFORM public.recalculate_booking_addon_sync(r.booking_id, r.slug);
  END LOOP;
END $$;