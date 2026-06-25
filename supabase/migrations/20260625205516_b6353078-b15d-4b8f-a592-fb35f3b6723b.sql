REVOKE EXECUTE ON FUNCTION public.recalculate_booking_addon_sync(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_addon_order_to_operations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalculate_booking_addon_sync(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_addon_order_to_operations() TO service_role;