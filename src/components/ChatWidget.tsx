import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/i18n/LanguageContext";
import { z } from "zod";

const STORAGE_KEY = "bsg_chat_token";
const SITE_URL = "https://goglampingsweden.se";

interface Message {
  id: string;
  conversation_id: string;
  sender: "visitor" | "admin";
  body: string;
  created_at: string;
}

interface Conversation {
  id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_token: string;
}

const startSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(4000),
});

function genToken() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

const ChatWidget = () => {
  const lang = useLang();
  const t = (sv: string, en: string) => (lang === "en" ? en : sv);

  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore conversation from localStorage
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) return;
    (async () => {
      const { data } = await supabase
        .from("chat_conversations")
        .select("id, visitor_name, visitor_email, visitor_token")
        .eq("visitor_token", token)
        .maybeSingle();
      if (data) {
        setConversation(data as Conversation);
        const { data: msgs } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("conversation_id", data.id)
          .order("created_at", { ascending: true });
        setMessages((msgs ?? []) as Message[]);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    })();
  }, []);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversation) return;
    const channel = supabase
      .channel(`chat-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === (payload.new as Message).id)) return prev;
            return [...prev, payload.new as Message];
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const startConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = startSchema.safeParse(form);
    if (!parsed.success) {
      setError(t("Fyll i namn, e-post och meddelande.", "Please fill in name, email and message."));
      return;
    }
    setLoading(true);
    const token = genToken();
    const { data: convo, error: convoErr } = await supabase
      .from("chat_conversations")
      .insert({
        visitor_name: parsed.data.name,
        visitor_email: parsed.data.email,
        visitor_token: token,
      })
      .select("id, visitor_name, visitor_email, visitor_token")
      .single();

    if (convoErr || !convo) {
      setLoading(false);
      setError(t("Något gick fel. Försök igen.", "Something went wrong. Please try again."));
      return;
    }

    const { data: msg, error: msgErr } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: convo.id,
        sender: "visitor",
        body: parsed.data.message,
      })
      .select()
      .single();

    if (msgErr || !msg) {
      setLoading(false);
      setError(t("Kunde inte skicka meddelandet.", "Couldn't send message."));
      return;
    }

    localStorage.setItem(STORAGE_KEY, token);
    setConversation(convo as Conversation);
    setMessages([msg as Message]);
    setForm({ name: "", email: "", message: "" });
    setLoading(false);

    // Fire-and-forget notification to admin
    supabase.functions
      .invoke("send-transactional-email", {
        body: {
          templateName: "chat-notification",
          recipientEmail: "info@auroramedia.se",
          idempotencyKey: `chat-notify-${msg.id}`,
          templateData: {
            visitorName: convo.visitor_name,
            visitorEmail: convo.visitor_email,
            messageBody: parsed.data.message,
            adminUrl: `${SITE_URL}/admin/chat`,
          },
        },
      })
      .catch((err) => console.error("Notification email failed", err));
  };

  const sendMessage = async () => {
    if (!conversation || !draft.trim()) return;
    const body = draft.trim().slice(0, 4000);
    setDraft("");
    const { data: msg, error: msgErr } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversation.id,
        sender: "visitor",
        body,
      })
      .select()
      .single();

    if (msgErr || !msg) {
      setError(t("Kunde inte skicka meddelandet.", "Couldn't send message."));
      return;
    }

    // Optimistic add (realtime may also deliver it)
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg as Message]));

    supabase.functions
      .invoke("send-transactional-email", {
        body: {
          templateName: "chat-notification",
          recipientEmail: "info@auroramedia.se",
          idempotencyKey: `chat-notify-${msg.id}`,
          templateData: {
            visitorName: conversation.visitor_name,
            visitorEmail: conversation.visitor_email,
            messageBody: body,
            adminUrl: `${SITE_URL}/admin/chat`,
          },
        },
      })
      .catch((err) => console.error("Notification email failed", err));
  };

  return (
    <>
      {/* Toggle button + label */}
      <div className="fixed bottom-5 right-5 md:bottom-6 md:right-6 z-[60] flex flex-col items-end gap-2">
        <AnimatePresence>
          {!open && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border text-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-md whitespace-nowrap"
            >
              {t("Kontakta oss här", "Contact us here")}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          onClick={() => setOpen((v) => !v)}
          aria-label={t("Öppna chatt", "Open chat")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        >
          {open ? <X size={22} /> : <MessageCircle size={24} />}
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-5 md:right-6 z-[60] w-[min(380px,calc(100vw-2.5rem))] h-[min(560px,calc(100vh-8rem))] rounded-2xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden"
            role="dialog"
            aria-label={t("Chatt med Bergs Slussar Glamping", "Chat with Bergs Slussar Glamping")}
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-serif font-semibold text-base leading-tight">
                  {t("Chatta med oss", "Chat with us")}
                </p>
                <p className="text-xs opacity-80">
                  {t("Vi svarar inom 24 timmar", "We reply within 24 hours")}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={t("Stäng", "Close")}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            {!conversation ? (
              <form onSubmit={startConversation} className="flex-1 overflow-y-auto p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Skriv ett meddelande så svarar vi på mail och här i chatten.",
                    "Send us a message — we reply by email and right here in the chat.",
                  )}
                </p>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("Ditt namn", "Your name")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <input
                  type="email"
                  required
                  maxLength={255}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={t("Din e-post", "Your email")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <textarea
                  required
                  maxLength={4000}
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={t("Skriv ditt meddelande...", "Type your message...")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground rounded-full py-2.5 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  {t("Skicka", "Send")}
                </button>
              </form>
            ) : (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/30">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.sender === "visitor" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                          m.sender === "visitor"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-card border border-border text-foreground rounded-bl-sm"
                        }`}
                      >
                        {m.body}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border p-2 flex gap-2 bg-card">
                  <input
                    type="text"
                    maxLength={4000}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={t("Skriv ett meddelande...", "Type a message...")}
                    className="flex-1 rounded-full border border-input bg-background px-3 py-2 text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!draft.trim()}
                    aria-label={t("Skicka", "Send")}
                    className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
