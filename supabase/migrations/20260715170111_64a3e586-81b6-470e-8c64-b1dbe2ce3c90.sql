ALTER TABLE public.addon_orders
  ADD COLUMN IF NOT EXISTS swish_reminder_30m_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS swish_reminder_2h_at TIMESTAMPTZ;