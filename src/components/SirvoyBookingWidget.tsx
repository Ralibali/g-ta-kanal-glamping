import { useEffect, useRef, useState } from "react";

interface Props {
  formId?: string;
  className?: string;
}

const SCRIPT_SRC = "https://secured.sirvoy.com/widget/sirvoy.js";

const SirvoyBookingWidget = ({ formId = "9482eece181add59", className }: Props) => {
  const [enabled, setEnabled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    // Avoid double-injection
    if (container.querySelector("script[data-sirvoy-injected]")) {
      setStatus("ready");
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = SCRIPT_SRC;
    script.setAttribute("data-form-id", formId);
    script.setAttribute("data-sirvoy-injected", "true");

    const readyTimer = window.setTimeout(() => setStatus("ready"), 600);

    script.onerror = () => {
      window.clearTimeout(readyTimer);
      setStatus("error");
    };

    container.appendChild(script);

  return () => {
      window.clearTimeout(readyTimer);
      if (container) container.innerHTML = "";
    };
  }, [formId, enabled]);

  if (!enabled) return <div className={className}>
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border p-6 text-center">
      <p className="max-w-md text-sm">Bokningen hanteras av Sirvoy. När du öppnar bokningsformuläret ansluter din webbläsare till Sirvoy, som får din IP-adress och webbläsarinformation.</p>
      <a href="/integritet" className="text-sm underline">Läs vår integritetspolicy</a>
      <button type="button" onClick={() => setEnabled(true)} className="rounded-full bg-[#617457] px-6 py-3 text-sm font-medium text-white">Öppna bokningsformuläret</button>
    </div>
  </div>;

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="w-full min-h-[420px] relative"
        aria-live="polite"
      >
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-[#5e6b5a]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-[#617457]/30 border-t-[#617457] animate-spin" />
              <p className="text-sm font-sans">Laddar bokningen…</p>
            </div>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="text-center max-w-md">
              <p className="font-serif text-xl text-[#243027] mb-2">Bokningen kunde inte laddas</p>
              <p className="text-sm text-[#5e6b5a] mb-4">
                Kontrollera din internetanslutning eller försök igen om en stund. Du kan också ringa oss på <a href="tel:+46722254993" className="underline text-[#617457]">0722-25 49 93</a>.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-full bg-[#617457] text-[#FFFDF8] px-6 py-3 text-sm font-sans font-medium hover:bg-[#4f5f47] transition-colors"
              >
                Försök igen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SirvoyBookingWidget;
