CREATE OR REPLACE FUNCTION public.is_valid_checkin_booking(p_booking_number text, p_tent_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p_tent_id = ANY (ARRAY['sjobris'::text, 'naturkarnan'::text, 'lugnetsyta'::text])
    AND length(p_booking_number) >= 3
    AND length(p_booking_number) <= 32
    AND (
      EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.booking_number = p_booking_number
          AND b.tent_id = p_tent_id
      )
      OR p_booking_number = ANY (ARRAY['JM06JI38XT'::text, '26431'::text])
    );
$function$;