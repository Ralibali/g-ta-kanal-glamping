
ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_batch text;

CREATE INDEX IF NOT EXISTS time_entries_user_paid_idx
  ON public.time_entries (user_id, paid_at);

CREATE OR REPLACE FUNCTION public.mark_time_entries_paid(
  p_user_id uuid,
  p_from date,
  p_to date,
  p_batch text DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE v_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin_required';
  END IF;
  WITH upd AS (
    UPDATE public.time_entries
       SET paid_at = COALESCE(paid_at, now()),
           paid_batch = COALESCE(paid_batch, p_batch)
     WHERE user_id = p_user_id
       AND paid_at IS NULL
       AND ended_at IS NOT NULL
       AND started_at >= (p_from::timestamp AT TIME ZONE 'Europe/Stockholm')
       AND started_at <  ((p_to + 1)::timestamp AT TIME ZONE 'Europe/Stockholm')
     RETURNING 1
  )
  SELECT count(*) INTO v_count FROM upd;
  RETURN v_count;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.unmark_time_entries_paid(
  p_user_id uuid,
  p_from date,
  p_to date
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE v_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin_required';
  END IF;
  WITH upd AS (
    UPDATE public.time_entries
       SET paid_at = NULL, paid_batch = NULL
     WHERE user_id = p_user_id
       AND paid_at IS NOT NULL
       AND started_at >= (p_from::timestamp AT TIME ZONE 'Europe/Stockholm')
       AND started_at <  ((p_to + 1)::timestamp AT TIME ZONE 'Europe/Stockholm')
     RETURNING 1
  )
  SELECT count(*) INTO v_count FROM upd;
  RETURN v_count;
END;
$fn$;
