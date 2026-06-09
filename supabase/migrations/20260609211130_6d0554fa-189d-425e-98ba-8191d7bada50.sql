CREATE OR REPLACE FUNCTION public.is_valid_checkin_booking(p_booking_number text, p_tent_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_tent_id = ANY (ARRAY['sjobris'::text, 'naturkarnan'::text])
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
$$;

REVOKE ALL ON FUNCTION public.is_valid_checkin_booking(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_valid_checkin_booking(text, text) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Anyone can log a valid check-in" ON public.check_ins;
DROP POLICY IF EXISTS "Anyone can log a check-in" ON public.check_ins;

CREATE POLICY "Anyone can log a valid check-in"
ON public.check_ins
FOR INSERT
TO anon, authenticated
WITH CHECK (public.is_valid_checkin_booking(booking_number, tent_id));