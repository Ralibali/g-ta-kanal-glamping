
CREATE TABLE public.short_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  target_url text NOT NULL,
  booking_id uuid NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX short_links_slug_idx ON public.short_links(slug);
CREATE INDEX short_links_booking_idx ON public.short_links(booking_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.short_links TO authenticated;
GRANT ALL ON public.short_links TO service_role;

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage short_links" ON public.short_links
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reminder_5d_sent_at timestamptz NULL;
