import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "valid" | "invalid" | "already" | "success" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: supabaseAnonKey } },
        );
        const json = await res.json();
        if (res.ok && json.valid) setState("valid");
        else if (json.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    setBusy(false);
    if (error) {
      setState("error");
      return;
    }
    if (data?.success) setState("success");
    else if (data?.reason === "already_unsubscribed") setState("already");
    else setState("error");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/20">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
        <h1 className="font-serif text-2xl font-bold mb-4">Avregistrera e-post</h1>

        {state === "loading" && (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        )}

        {state === "valid" && (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Klicka nedan för att bekräfta att du inte längre vill ta emot mail från Bergs Slussar Glamping.
            </p>
            <button
              onClick={confirm}
              disabled={busy}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold text-sm disabled:opacity-60"
            >
              {busy ? "Avregistrerar..." : "Bekräfta avregistrering"}
            </button>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="text-primary mx-auto mb-3" size={40} />
            <p className="text-sm text-muted-foreground mb-6">
              Du är nu avregistrerad och kommer inte få fler mail från oss.
            </p>
            <Link to="/" className="text-primary underline text-sm">
              Tillbaka till startsidan
            </Link>
          </>
        )}

        {state === "already" && (
          <>
            <CheckCircle2 className="text-muted-foreground mx-auto mb-3" size={40} />
            <p className="text-sm text-muted-foreground mb-6">Du är redan avregistrerad.</p>
            <Link to="/" className="text-primary underline text-sm">
              Tillbaka till startsidan
            </Link>
          </>
        )}

        {(state === "invalid" || state === "error") && (
          <>
            <XCircle className="text-destructive mx-auto mb-3" size={40} />
            <p className="text-sm text-muted-foreground mb-6">
              Länken är ogiltig eller har gått ut.
            </p>
            <Link to="/" className="text-primary underline text-sm">
              Tillbaka till startsidan
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
