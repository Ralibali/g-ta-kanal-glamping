CREATE OR REPLACE FUNCTION public.get_stay_by_token(p_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_b public.bookings%ROWTYPE;
  v_addons jsonb;
  v_orders jsonb;
  v_settings jsonb;
  v_tents jsonb;
  v_checked_in_at timestamptz;
BEGIN
  IF p_token IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO v_b FROM public.bookings WHERE public_token = p_token LIMIT 1;
  IF v_b.id IS NULL THEN RETURN NULL; END IF;

  SELECT ci.checked_in_at INTO v_checked_in_at
  FROM public.check_ins ci
  WHERE ci.booking_number = v_b.booking_number
    AND (v_b.tent_id IS NULL OR ci.tent_id = v_b.tent_id)
  ORDER BY ci.checked_in_at DESC
  LIMIT 1;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', a.id, 'slug', a.slug,
    'name_sv', a.name_sv, 'name_en', a.name_en,
    'description_sv', a.description_sv, 'description_en', a.description_en,
    'price_sek', a.price_sek, 'unit', a.unit, 'max_quantity', a.max_quantity,
    'sort_order', a.sort_order
  ) ORDER BY a.sort_order), '[]'::jsonb)
  INTO v_addons FROM public.addons a WHERE a.active = true;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', o.id, 'addon_id', o.addon_id, 'quantity', o.quantity,
    'total_sek', o.total_sek, 'status', o.status, 'paid_at', o.paid_at,
    'created_at', o.created_at, 'updated_at', o.updated_at
  )), '[]'::jsonb)
  INTO v_orders FROM public.addon_orders o
  WHERE o.booking_id = v_b.id AND o.status IN ('paid', 'confirmed', 'requested', 'pending', 'cancelled');

  SELECT jsonb_object_agg(key, value) INTO v_settings
  FROM public.app_settings
  WHERE key IN ('order_cutoff_days', 'prearrival_lead_days', 'swish_number', 'swish_payee');

  SELECT COALESCE(jsonb_agg(DISTINCT ts.tent_id), '[]'::jsonb)
  INTO v_tents FROM public.tent_stays ts
  WHERE ts.booking_number = v_b.booking_number;

  RETURN jsonb_build_object(
    'booking', jsonb_build_object(
      'id', v_b.id,
      'public_token', v_b.public_token,
      'booking_number', v_b.booking_number,
      'guest_first_name', v_b.guest_first_name,
      'tent_id', v_b.tent_id,
      'tent_name', v_b.tent_name,
      'tent_ids', v_tents,
      'checkin_date', v_b.checkin_date,
      'checkout_date', v_b.checkout_date,
      'nights', v_b.nights,
      'language', COALESCE(v_b.language, 'en'),
      'checked_in_at', v_checked_in_at
    ),
    'addons', v_addons,
    'orders', v_orders,
    'settings', COALESCE(v_settings, '{}'::jsonb)
  );
END;
$function$;