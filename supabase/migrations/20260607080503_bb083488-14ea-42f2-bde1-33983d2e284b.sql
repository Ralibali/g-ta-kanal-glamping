
-- 1. Bookings: stop public read; add admin-only RPC for check-in lookup
DROP POLICY IF EXISTS "Public can look up bookings" ON public.bookings;

CREATE OR REPLACE FUNCTION public.lookup_booking_for_checkin(p_booking_number text)
RETURNS TABLE (tent_id text, lang text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.tent_id, b.lang
  FROM public.bookings b
  WHERE b.booking_number = p_booking_number
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.lookup_booking_for_checkin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_booking_for_checkin(text) TO anon, authenticated;

-- 2. Chat conversations: remove public read; add admin read + token-scoped RPC
DROP POLICY IF EXISTS "Public can read conversation by token" ON public.chat_conversations;

CREATE POLICY "Admins can read conversations"
ON public.chat_conversations
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Chat messages: remove public read & impersonable insert; admins only via RLS
DROP POLICY IF EXISTS "Anyone can read messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.chat_messages;

CREATE POLICY "Admins can read messages"
ON public.chat_messages
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert messages"
ON public.chat_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender = 'admin'
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND length(body) BETWEEN 1 AND 4000
);

-- 4. Token-scoped RPCs for visitor chat
CREATE OR REPLACE FUNCTION public.get_chat_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_conv public.chat_conversations%ROWTYPE;
  v_msgs jsonb;
BEGIN
  IF p_token IS NULL OR length(p_token) < 32 THEN
    RETURN NULL;
  END IF;
  SELECT * INTO v_conv FROM public.chat_conversations WHERE visitor_token = p_token LIMIT 1;
  IF v_conv.id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', m.id,
    'conversation_id', m.conversation_id,
    'sender', m.sender,
    'body', m.body,
    'created_at', m.created_at
  ) ORDER BY m.created_at), '[]'::jsonb)
  INTO v_msgs
  FROM public.chat_messages m WHERE m.conversation_id = v_conv.id;
  RETURN jsonb_build_object(
    'conversation', jsonb_build_object(
      'id', v_conv.id,
      'visitor_name', v_conv.visitor_name,
      'visitor_email', v_conv.visitor_email,
      'visitor_token', v_conv.visitor_token
    ),
    'messages', v_msgs
  );
END;
$$;
REVOKE ALL ON FUNCTION public.get_chat_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_chat_by_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.post_visitor_chat_message(p_token text, p_body text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_conv_id uuid;
  v_msg public.chat_messages%ROWTYPE;
BEGIN
  IF p_token IS NULL OR length(p_token) < 32 THEN
    RAISE EXCEPTION 'invalid token';
  END IF;
  IF p_body IS NULL OR length(btrim(p_body)) = 0 OR length(p_body) > 4000 THEN
    RAISE EXCEPTION 'invalid body';
  END IF;
  SELECT id INTO v_conv_id FROM public.chat_conversations WHERE visitor_token = p_token LIMIT 1;
  IF v_conv_id IS NULL THEN
    RAISE EXCEPTION 'conversation not found';
  END IF;
  INSERT INTO public.chat_messages (conversation_id, sender, body)
  VALUES (v_conv_id, 'visitor', p_body)
  RETURNING * INTO v_msg;
  RETURN jsonb_build_object(
    'id', v_msg.id,
    'conversation_id', v_msg.conversation_id,
    'sender', v_msg.sender,
    'body', v_msg.body,
    'created_at', v_msg.created_at
  );
END;
$$;
REVOKE ALL ON FUNCTION public.post_visitor_chat_message(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.post_visitor_chat_message(text, text) TO anon, authenticated;

-- 5. Tighten check_ins INSERT: require matching booking (db or hardcoded allowlist) and known tent
DROP POLICY IF EXISTS "Anyone can log a check-in" ON public.check_ins;
CREATE POLICY "Anyone can log a check-in"
ON public.check_ins
FOR INSERT TO anon, authenticated
WITH CHECK (
  tent_id IN ('sjobris', 'naturkarnan')
  AND length(booking_number) BETWEEN 3 AND 32
  AND (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.booking_number = check_ins.booking_number)
    OR check_ins.booking_number IN ('JM06JI38XT', '26431')
  )
);

-- 6. Realtime: restrict subscriptions to authenticated admins only
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins only realtime" ON realtime.messages;
CREATE POLICY "Admins only realtime"
ON realtime.messages
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. Fix mutable search_path on pgmq helper SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pgmq
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pgmq
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pgmq
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pgmq
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;

-- 8. Revoke EXECUTE from anon/authenticated on internal SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
