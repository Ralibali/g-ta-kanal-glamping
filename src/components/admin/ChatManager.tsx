import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Trash2, Mail, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

const SITE_URL = "https://goglampingsweden.se";

interface Conversation {
  id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_token: string;
  status: string;
  last_message_at: string;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender: "visitor" | "admin";
  body: string;
  created_at: string;
}

export const ChatManager = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    const { data } = await supabase
      .from("chat_conversations")
      .select("*")
      .order("last_message_at", { ascending: false });
    setConversations((data ?? []) as Conversation[]);
    setLoading(false);
  };

  useEffect(() => {
    loadConversations();
    const channel = supabase
      .channel("admin-chat-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_conversations" },
        () => loadConversations(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true });
      if (!cancelled) setMessages((data ?? []) as Message[]);
    })();

    const channel = supabase
      .channel(`admin-chat-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${activeId}`,
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
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [activeId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const active = conversations.find((c) => c.id === activeId) || null;

  const sendReply = async () => {
    if (!active || !draft.trim()) return;
    const body = draft.trim().slice(0, 4000);
    setSending(true);
    const { data: msg, error } = await supabase
      .from("chat_messages")
      .insert({ conversation_id: active.id, sender: "admin", body })
      .select()
      .single();
    setSending(false);
    if (error || !msg) return;
    setDraft("");
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg as Message]));

    // Notify visitor by email
    supabase.functions
      .invoke("send-transactional-email", {
        body: {
          templateName: "chat-reply",
          recipientEmail: active.visitor_email,
          idempotencyKey: `chat-reply-${msg.id}`,
          templateData: {
            visitorName: active.visitor_name,
            replyBody: body,
            chatUrl: `${SITE_URL}/chat?token=${active.visitor_token}`,
          },
        },
      })
      .catch((err) => console.error("Reply email failed", err));
  };

  const deleteConversation = async () => {
    if (!active) return;
    if (!confirm(`Ta bort konversationen med ${active.visitor_name}?`)) return;
    await supabase.from("chat_conversations").delete().eq("id", active.id);
    setActiveId(null);
    setMessages([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold">Chattmeddelanden</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {conversations.length === 0
            ? "Inga meddelanden ännu."
            : `${conversations.length} konversation${conversations.length === 1 ? "" : "er"}`}
        </p>
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Conversation list */}
        <div className="border border-border rounded-lg overflow-hidden bg-card flex flex-col">
          <div className="overflow-y-auto flex-1">
            {conversations.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Ingen konversation.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left px-3 py-3 border-b border-border hover:bg-muted/50 transition-colors ${
                    activeId === c.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User size={14} className="text-muted-foreground shrink-0" />
                    <span className="font-medium text-sm truncate">{c.visitor_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail size={12} className="shrink-0" />
                    <span className="truncate">{c.visitor_email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(c.last_message_at), {
                      addSuffix: true,
                      locale: sv,
                    })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation view */}
        <div className="border border-border rounded-lg overflow-hidden bg-card flex flex-col">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Välj en konversation till vänster.
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div>
                  <p className="font-medium">{active.visitor_name}</p>
                  <p className="text-xs text-muted-foreground">{active.visitor_email}</p>
                </div>
                <button
                  onClick={deleteConversation}
                  className="text-destructive hover:bg-destructive/10 p-2 rounded"
                  aria-label="Ta bort"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/20">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                        m.sender === "admin"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-card border border-border rounded-bl-sm"
                      }`}
                    >
                      {m.body}
                      <p className="text-[10px] opacity-60 mt-1">
                        {new Date(m.created_at).toLocaleString("sv-SE", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border p-2 flex gap-2 bg-card">
                <textarea
                  rows={2}
                  maxLength={4000}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder="Skriv ditt svar... (Enter för att skicka)"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !draft.trim()}
                  className="self-stretch px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {sending ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  Skicka
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
