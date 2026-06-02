
-- Drop the overly permissive UPDATE policy on conversations
DROP POLICY IF EXISTS "Public can update own conversation" ON public.chat_conversations;
REVOKE UPDATE ON public.chat_conversations FROM anon;
REVOKE UPDATE ON public.chat_conversations FROM authenticated;
GRANT UPDATE ON public.chat_conversations TO service_role;

-- Drop unread columns (we'll compute dynamically)
ALTER TABLE public.chat_conversations DROP COLUMN unread_admin;
ALTER TABLE public.chat_conversations DROP COLUMN unread_visitor;

-- Tighten INSERT on conversations: require non-trivial token + basic fields
DROP POLICY IF EXISTS "Anyone can create conversation" ON public.chat_conversations;
CREATE POLICY "Anyone can create conversation"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (
    length(visitor_token) >= 32
    AND length(visitor_name) BETWEEN 1 AND 100
    AND length(visitor_email) BETWEEN 3 AND 255
    AND visitor_email LIKE '%_@_%.__%'
  );

-- Tighten INSERT on messages: non-empty body, valid sender, conversation must exist
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.chat_messages;
CREATE POLICY "Anyone can insert messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    length(body) BETWEEN 1 AND 4000
    AND sender IN ('visitor','admin')
    AND EXISTS (SELECT 1 FROM public.chat_conversations c WHERE c.id = conversation_id)
  );

-- Add trigger to bump last_message_at on new message (service-role bypasses RLS)
CREATE OR REPLACE FUNCTION public.bump_chat_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bump_chat_last_message() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_bump_chat_last_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.bump_chat_last_message();
