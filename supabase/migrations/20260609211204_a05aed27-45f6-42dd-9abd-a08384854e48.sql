GRANT INSERT ON public.check_ins TO anon;
GRANT SELECT, INSERT ON public.check_ins TO authenticated;
GRANT ALL ON public.check_ins TO service_role;