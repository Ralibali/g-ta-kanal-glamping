DROP POLICY IF EXISTS "Anyone can log a check-in" ON public.check_ins;

CREATE POLICY "Anyone can log a valid check-in"
ON public.check_ins
FOR INSERT
TO anon, authenticated
WITH CHECK (
  tent_id = ANY (ARRAY['sjobris'::text, 'naturkarnan'::text])
  AND length(booking_number) >= 3
  AND length(booking_number) <= 32
  AND (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.booking_number = check_ins.booking_number
        AND b.tent_id = check_ins.tent_id
    )
    OR booking_number = ANY (ARRAY['JM06JI38XT'::text, '26431'::text])
  )
);