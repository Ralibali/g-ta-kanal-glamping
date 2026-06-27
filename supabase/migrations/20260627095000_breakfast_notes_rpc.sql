-- Breakfast staff need guest comments for allergy and multi-day breakfast handling,
-- but should not receive unrestricted access to the full bookings table.

CREATE OR REPLACE FUNCTION public.get_breakfast_booking_notes(p_booking_numbers text[])
RETURNS TABLE (
  booking_number text,
  guest_name text,
  raw jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
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
