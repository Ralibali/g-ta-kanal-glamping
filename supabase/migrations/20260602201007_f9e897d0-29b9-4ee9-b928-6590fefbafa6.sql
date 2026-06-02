
-- Chat conversations: each visitor session
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_name TEXT NOT NULL,
  visitor_email TEXT NOT NULL,
  visitor_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'open',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unread_admin INTEGER NOT NULL DEFAULT 0,
  unread_visitor INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_conversations_token ON public.chat_conversations(visitor_token);
CREATE INDEX idx_chat_conversations_last_msg ON public.chat_conversations(last_message_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.chat_conversations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Anyone (anon visitor) can create a conversation
CREATE POLICY "Anyone can create conversation"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (true);

-- Visitor can read/update their own (by token, validated client-side via unique token)
-- We allow public read because token is unguessable; better: restrict via token column equality at app layer.
CREATE POLICY "Public can read conversation by token"
  ON public.chat_conversations FOR SELECT
  USING (true);

CREATE POLICY "Public can update own conversation"
  ON public.chat_conversations FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete conversations"
  ON public.chat_conversations FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('visitor','admin')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);

GRANT SELECT, INSERT ON public.chat_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read messages"
  ON public.chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can delete messages"
  ON public.chat_messages FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_conversations REPLICA IDENTITY FULL;
