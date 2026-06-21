ALTER TABLE public.tent_stays
  ADD COLUMN IF NOT EXISTS dietary text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dietary_note text;

CREATE OR REPLACE FUNCTION public.set_stay_dietary(
  p_booking_number text,
  p_tent_id text,
  p_dietary text[],
  p_dietary_note text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'breakfast'::app_role)
    OR public.has_role(auth.uid(), 'cleaner'::app_role)
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.tent_stays
  SET dietary = COALESCE(p_dietary, '{}'),
      dietary_note = NULLIF(btrim(COALESCE(p_dietary_note, '')), '')
  WHERE booking_number = p_booking_number AND tent_id = p_tent_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_stay_dietary(text, text, text[], text) TO authenticated;