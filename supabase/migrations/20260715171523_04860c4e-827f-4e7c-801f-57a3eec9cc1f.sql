CREATE OR REPLACE FUNCTION public.notify_addon_order_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row public.addon_orders;
  v_token uuid;
BEGIN
  v_row := COALESCE(NEW, OLD);
  IF v_row.booking_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  SELECT public_token INTO v_token FROM public.bookings WHERE id = v_row.booking_id;
  IF v_token IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  PERFORM realtime.send(
    jsonb_build_object(
      'op', TG_OP,
      'id', v_row.id,
      'booking_id', v_row.booking_id,
      'addon_id', v_row.addon_id,
      'quantity', v_row.quantity,
      'total_sek', v_row.total_sek,
      'status', v_row.status,
      'paid_at', v_row.paid_at,
      'created_at', v_row.created_at,
      'updated_at', v_row.updated_at
    ),
    'order_change',
    'booking:' || v_token::text,
    false
  );
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Aldrig blockera skrivningar pga realtime-fel
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS addon_orders_realtime_notify ON public.addon_orders;
CREATE TRIGGER addon_orders_realtime_notify
AFTER INSERT OR UPDATE OR DELETE ON public.addon_orders
FOR EACH ROW EXECUTE FUNCTION public.notify_addon_order_change();