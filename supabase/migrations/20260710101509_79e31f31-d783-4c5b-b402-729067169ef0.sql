-- Cleaner profiles (per person)
CREATE TABLE public.cleaner_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  full_name TEXT,
  personnummer TEXT,
  email TEXT,
  bank_account TEXT,
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  vacation_pct NUMERIC(5,2) NOT NULL DEFAULT 12,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaner_profiles TO authenticated;
GRANT ALL ON public.cleaner_profiles TO service_role;
ALTER TABLE public.cleaner_profiles ENABLE ROW LEVEL SECURITY;

-- Own profile (incl. own hourly_rate/personnummer/bank)
CREATE POLICY "Users view own cleaner profile"
  ON public.cleaner_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admin sees all
CREATE POLICY "Admins view all cleaner profiles"
  ON public.cleaner_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admin manages profiles
CREATE POLICY "Admins insert cleaner profiles"
  ON public.cleaner_profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update cleaner profiles"
  ON public.cleaner_profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete cleaner profiles"
  ON public.cleaner_profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_cleaner_profiles
  BEFORE UPDATE ON public.cleaner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Public helper: everyone with a cleaner/admin role can read display_name for schedule
CREATE OR REPLACE FUNCTION public.list_cleaner_display_names()
RETURNS TABLE(user_id UUID, display_name TEXT, sort_order INT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp.user_id, cp.display_name, cp.sort_order
  FROM public.cleaner_profiles cp
  WHERE cp.active = true
    AND (
      public.has_role(auth.uid(), 'cleaner'::app_role)
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  ORDER BY cp.sort_order, cp.display_name
$$;
GRANT EXECUTE ON FUNCTION public.list_cleaner_display_names() TO authenticated;

-- Cleaning assignments (one per date)
CREATE TABLE public.cleaning_assignments (
  work_date DATE PRIMARY KEY,
  assigned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaning_assignments TO authenticated;
GRANT ALL ON public.cleaning_assignments TO service_role;
ALTER TABLE public.cleaning_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cleaners view assignments"
  ON public.cleaning_assignments FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'cleaner'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins manage assignments"
  ON public.cleaning_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_cleaning_assignments
  BEFORE UPDATE ON public.cleaning_assignments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Salary calculator (private to owner + admin)
CREATE OR REPLACE FUNCTION public.get_cleaner_salary(
  p_user_id UUID,
  p_from DATE,
  p_to DATE
)
RETURNS TABLE(
  hours NUMERIC,
  hourly_rate NUMERIC,
  vacation_pct NUMERIC,
  gross NUMERIC,
  vacation_pay NUMERIC,
  total NUMERIC
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate NUMERIC := 0;
  v_vac NUMERIC := 12;
  v_hours NUMERIC := 0;
  v_gross NUMERIC := 0;
  v_vp NUMERIC := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF auth.uid() <> p_user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT COALESCE(cp.hourly_rate, 0), COALESCE(cp.vacation_pct, 12)
    INTO v_rate, v_vac
  FROM public.cleaner_profiles cp WHERE cp.user_id = p_user_id;

  SELECT COALESCE(SUM(
    CASE
      WHEN te.hours IS NOT NULL THEN te.hours
      WHEN te.ended_at IS NOT NULL THEN EXTRACT(EPOCH FROM (te.ended_at - te.started_at))/3600.0
      ELSE 0
    END
  ), 0)
  INTO v_hours
  FROM public.time_entries te
  WHERE te.user_id = p_user_id
    AND te.started_at >= (p_from::timestamp AT TIME ZONE 'Europe/Stockholm')
    AND te.started_at <  ((p_to + 1)::timestamp AT TIME ZONE 'Europe/Stockholm');

  v_gross := ROUND(v_hours * v_rate, 2);
  v_vp := ROUND(v_gross * v_vac / 100.0, 2);

  hours := ROUND(v_hours, 2);
  hourly_rate := v_rate;
  vacation_pct := v_vac;
  gross := v_gross;
  vacation_pay := v_vp;
  total := v_gross + v_vp;
  RETURN NEXT;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_cleaner_salary(UUID, DATE, DATE) TO authenticated;