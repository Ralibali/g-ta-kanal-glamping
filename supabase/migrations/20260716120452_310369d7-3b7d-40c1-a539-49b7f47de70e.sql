CREATE OR REPLACE FUNCTION public.list_tents_for_booking(p_booking_number text)
RETURNS TABLE(tent_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT t FROM (
    SELECT ts.tent_id AS t
    FROM public.tent_stays ts
    WHERE ts.booking_number = p_booking_number
      AND ts.tent_id IS NOT NULL
    UNION
    SELECT b.tent_id AS t
    FROM public.bookings b
    WHERE b.booking_number = p_booking_number
      AND b.tent_id IS NOT NULL
  ) x
  WHERE t = ANY (ARRAY['sjobris','naturkarnan','lugnetsyta'])
  ORDER BY 1;
$$;

GRANT EXECUTE ON FUNCTION public.list_tents_for_booking(text) TO anon, authenticated;