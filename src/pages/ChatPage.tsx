import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, ArrowLeft } from "lucide-react";

interface Message {
  id: string;
  sender: "visitor" | "admin";
  body: string;
  created_at: string;
}

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || localStorage.getItem("bsg_chat_token");
  const [conversation, setConversation] = useState<{ id: string; visitor_name: string; visitor_email: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    (async () => {
      const { data: convo } = await supabase
        .from("chat_conversations")
        .select("id, visitor_name, visitor_email")
        .eq("visitor_token", token)
        .maybeSingle();
      if (!convo) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      localStorage.setItem("bsg_chat_token", token);
      setConversation(convo);
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", convo.id)
        .order("created_at", { ascending: true });
      setMessages((msgs ?? []) as Message[]);
      setLoading(false);
    })();
  }, [token]);

  useEffect(() => {
    if (!conversation) return;
    const channel = supabase
      .channel(`chat-page-${conversation.id}`)
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

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    if (!conversation || !draft.trim()) return;
    const body = draft.trim().slice(0, 4000);
    setDraft("");
    const { data: msg } = await supabase
      .from("chat_messages")
      .insert({ conversation_id: conversation.id, sender: "visitor", body })
      .select()
      .single();
    if (!msg) return;
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
            adminUrl: "https://goglampingsweden.se/admin/chat",
          },
        },
      })
      .catch((err) => console.error("Notification failed", err));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-2xl font-bold mb-3">Chatten kunde inte hittas</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Länken är ogiltig eller har gått ut. Starta en ny chatt från startsidan.
          </p>
          <Link to="/" className="text-primary underline text-sm">
            Tillbaka till startsidan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3">
        <Link to="/" className="hover:opacity-80" aria-label="Tillbaka">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="font-serif font-semibold leading-tight">Bergs Slussar Glamping</p>
          <p className="text-xs opacity-80">{conversation?.visitor_name}</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 max-w-2xl w-full mx-auto">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "visitor" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                m.sender === "visitor"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border border-border rounded-bl-sm"
              }`}
            >
              {m.body}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-3 bg-card max-w-2xl w-full mx-auto flex gap-2">
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
          placeholder="Skriv ett meddelande..."
          className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={!draft.trim()}
          aria-label="Skicka"
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
