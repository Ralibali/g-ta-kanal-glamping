import { useEffect } from "react";
import { useParams } from "react-router-dom";

export default function ShortRedirect() {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    (async () => {
      if (!slug) {
        window.location.replace("/");
        return;
      }
      try {
        const base = import.meta.env.VITE_SUPABASE_URL as string;
        const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
        const r = await fetch(`${base}/functions/v1/resolve-link?slug=${encodeURIComponent(slug)}`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        });
        if (!r.ok) throw new Error("not found");
        const j = await r.json();
        if (j?.target_url) {
          window.location.replace(j.target_url);
          return;
        }
        window.location.replace("/");
      } catch {
        window.location.replace("/");
      }
    })();
  }, [slug]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", color: "#2c5f2e" }}>
      <p>Omdirigerar…</p>
    </div>
  );
}
