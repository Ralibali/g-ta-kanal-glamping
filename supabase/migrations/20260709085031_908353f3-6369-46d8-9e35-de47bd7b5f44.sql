
-- Availability
CREATE TABLE public.employee_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, work_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_availability TO authenticated;
GRANT ALL ON public.employee_availability TO service_role;
ALTER TABLE public.employee_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own availability"
  ON public.employee_availability FOR ALL TO authenticated
  USING (
    auth.uid() = user_id AND (
      public.has_role(auth.uid(), 'cleaner'::app_role)
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND (
      public.has_role(auth.uid(), 'cleaner'::app_role)
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Admins view all availability"
  ON public.employee_availability FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_employee_availability
  BEFORE UPDATE ON public.employee_availability
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Time entries
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  hours NUMERIC(6,2),
  note TEXT,
  source TEXT NOT NULL DEFAULT 'clock',
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_entries TO authenticated;
GRANT ALL ON public.time_entries TO service_role;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own time entries"
  ON public.time_entries FOR ALL TO authenticated
  USING (
    auth.uid() = user_id AND (
      public.has_role(auth.uid(), 'cleaner'::app_role)
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND (
      public.has_role(auth.uid(), 'cleaner'::app_role)
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Admins view all time entries"
  ON public.time_entries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update all time entries"
  ON public.time_entries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX time_entries_user_started_idx ON public.time_entries (user_id, started_at DESC);
CREATE INDEX employee_availability_date_idx ON public.employee_availability (work_date);

CREATE TRIGGER touch_time_entries
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
