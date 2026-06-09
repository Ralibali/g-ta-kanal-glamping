CREATE OR REPLACE FUNCTION public.lookup_booking_for_checkin_by_name(p_name text)
RETURNS TABLE(booking_number text, tent_id text, lang text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.booking_number, b.tent_id, b.lang
  FROM public.bookings b
  WHERE b.guest_name IS NOT NULL
    AND length(btrim(p_name)) >= 3
    AND lower(b.guest_name) LIKE '%' || lower(btrim(p_name)) || '%'
  ORDER BY
    CASE WHEN b.checkin_date = CURRENT_DATE THEN 0
         WHEN b.checkin_date IS NULL THEN 2
         ELSE 1 END,
    ABS(COALESCE(b.checkin_date, CURRENT_DATE) - CURRENT_DATE)
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.lookup_booking_for_checkin_by_name(text) TO anon, authenticated;