
CREATE POLICY "Cleaner/admin upload cleaning photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='cleaning-photos' AND (public.has_role(auth.uid(),'cleaner') OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "Cleaner/admin read cleaning photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='cleaning-photos' AND (public.has_role(auth.uid(),'cleaner') OR public.has_role(auth.uid(),'admin')));
