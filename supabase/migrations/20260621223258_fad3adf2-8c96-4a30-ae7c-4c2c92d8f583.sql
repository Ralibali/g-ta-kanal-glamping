-- Allow admins to read bookings via the API
CREATE POLICY "Admins can read bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Restrict UPDATE and DELETE on cleaning-photos bucket to admins
CREATE POLICY "Admins can update cleaning photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'cleaning-photos' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'cleaning-photos' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete cleaning photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cleaning-photos' AND public.has_role(auth.uid(), 'admin'::app_role));