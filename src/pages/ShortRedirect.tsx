import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ShortRedirect() {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) {
        window.location.replace("/");
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke("resolve-link", {
          method: "GET" as any,
          // pass slug via query string
        });
        // supabase-js doesn't support GET query easily; fall back to direct fetch
        if (error || !data?.target_url) throw error || new Error("no target");
        if (!cancelled) window.location.replace(data.target_url);
      } catch {
        try {
          const projectRef = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID;
          const base = (import.meta as any).env?.VITE_SUPABASE_URL;
          const url = `${base}/functions/v1/resolve-link?slug=${encodeURIComponent(slug!)}`;
          const r = await fetch(url, {
            headers: {
              apikey: (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
            },
          });
          if (!r.ok) throw new Error("not found");
          const j = await r.json();
          if (j?.target_url && !cancelled) {
            window.location.replace(j.target_url);
            return;
          }
          if (!cancelled) window.location.replace("/");
        } catch {
          if (!cancelled) window.location.replace("/");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", color: "#2c5f2e" }}>
      <p>Omdirigerar…</p>
    </div>
  );
}
