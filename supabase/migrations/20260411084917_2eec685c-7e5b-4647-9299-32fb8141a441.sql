-- Tighten analytics INSERT policies: user_id must be NULL or match auth.uid()
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views"
ON public.page_views
FOR INSERT
TO public
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert click events" ON public.click_events;
CREATE POLICY "Anyone can insert click events"
ON public.click_events
FOR INSERT
TO public
WITH CHECK (user_id IS NULL OR user_id = auth.uid());