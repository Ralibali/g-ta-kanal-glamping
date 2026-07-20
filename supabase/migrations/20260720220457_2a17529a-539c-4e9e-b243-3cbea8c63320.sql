-- Booking engine: iCal feed token per unit (public token for calendar export)
ALTER TABLE public.be_units
  ADD COLUMN IF NOT EXISTS ical_feed_token text
    NOT NULL DEFAULT substr(encode(extensions.gen_random_bytes(12), 'hex'), 1, 24);

CREATE UNIQUE INDEX IF NOT EXISTS be_units_ical_feed_token_uniq
  ON public.be_units (ical_feed_token);

-- Allow public (anon) to read the exported units by token via the edge function's
-- service-role client; no RLS change needed. Ensure existing rows have unique tokens.
UPDATE public.be_units
  SET ical_feed_token = substr(encode(extensions.gen_random_bytes(12), 'hex'), 1, 24)
  WHERE ical_feed_token IS NULL;