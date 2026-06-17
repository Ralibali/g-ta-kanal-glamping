
CREATE TABLE public.tent_stays (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text NOT NULL,
  room_id        text,
  tent_id        text NOT NULL,
  checkin_date   date NOT NULL,
  checkout_date  date NOT NULL,
  adults         integer NOT NULL DEFAULT 0,
  children       integer NOT NULL DEFAULT 0,
  guests         integer GENERATED ALWAYS AS (COALESCE(adults,0)+COALESCE(children,0)) STORED,
  breakfast      boolean NOT NULL DEFAULT false,
  fikapase       boolean NOT NULL DEFAULT false,
  late_checkout  boolean NOT NULL DEFAULT false,
  guest_name     text,
  phone          text,
  email          text,
  lang           text NOT NULL DEFAULT 'sv',
  note           text,
  raw            jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_number, room_id, checkin_date)
);

CREATE TABLE public.cleaning_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tent_id          text NOT NULL,
  cleaning_date    date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Stockholm')::date,
  arrival_booking  text,
  guests           integer,
  sofa_bed_needed  boolean NOT NULL DEFAULT false,
  checklist        jsonb NOT NULL DEFAULT '{}'::jsonb,
  status           text NOT NULL DEFAULT 'in_progress',
  completed_at     timestamptz,
  completed_by     uuid REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tent_id, cleaning_date)
);

CREATE TABLE public.cleaning_issues (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid REFERENCES public.cleaning_sessions(id) ON DELETE CASCADE,
  tent_id      text NOT NULL,
  description  text NOT NULL,
  photo_path   text,
  resolved     boolean NOT NULL DEFAULT false,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sms_outbox (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number    text,
  tent_id           text NOT NULL,
  cleaning_date_key date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Stockholm')::date,
  to_phone          text,
  lang              text NOT NULL DEFAULT 'sv',
  body              text NOT NULL,
  status            text NOT NULL DEFAULT 'queued',
  provider_id       text,
  error             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  sent_at           timestamptz,
  UNIQUE (tent_id, cleaning_date_key)
);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_cleaning_sessions_updated_at
BEFORE UPDATE ON public.cleaning_sessions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tent_stays TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.cleaning_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.cleaning_issues   TO authenticated;
GRANT SELECT ON public.sms_outbox TO authenticated;
GRANT ALL ON public.tent_stays TO service_role;
GRANT ALL ON public.cleaning_sessions TO service_role;
GRANT ALL ON public.cleaning_issues TO service_role;
GRANT ALL ON public.sms_outbox TO service_role;

ALTER TABLE public.tent_stays        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_issues   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_outbox        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cleaner/admin read stays" ON public.tent_stays FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'cleaner') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin write stays"  ON public.tent_stays FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update stays" ON public.tent_stays FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete stays" ON public.tent_stays FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Cleaner/admin read sessions" ON public.cleaning_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'cleaner') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Cleaner/admin write sessions" ON public.cleaning_sessions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'cleaner') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Cleaner/admin update sessions" ON public.cleaning_sessions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'cleaner') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'cleaner') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Cleaner/admin read issues" ON public.cleaning_issues FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'cleaner') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Cleaner/admin write issues" ON public.cleaning_issues FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'cleaner') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update issues" ON public.cleaning_issues FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admin read sms" ON public.sms_outbox FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_tent_stays_checkin  ON public.tent_stays (checkin_date);
CREATE INDEX idx_tent_stays_checkout ON public.tent_stays (checkout_date);
CREATE INDEX idx_cleaning_sessions_date ON public.cleaning_sessions (cleaning_date DESC);
CREATE INDEX idx_cleaning_issues_session ON public.cleaning_issues (session_id);
