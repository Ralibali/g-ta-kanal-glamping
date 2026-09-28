import { useEffect, useId, useRef, useState } from "react";
import { useLang, t } from "@/i18n/LanguageContext";

interface Props { formId?: string; className?: string; }
const SCRIPT_SRC = "https://secured.sirvoy.com/widget/sirvoy.js";

const SirvoyBookingWidget = ({ formId = "9482eece181add59", className }: Props) => {
  const lang = useLang();
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackName = `sirvoyReady${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "slow">("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let active = true;
    setStatus("loading");
    const callbacks = window as unknown as Record<string, unknown>;
    const timeout = window.setTimeout(() => {
      if (active) setStatus("slow");
    }, 15000);
    // Sirvoy calls this when a booking page is actually displayed.
    // Returning undefined preserves Sirvoy's existing tracking behavior.
    callbacks[callbackName] = (event: { event?: string; form_id?: string }) => {
      if (!active || event.form_id !== formId || !event.event?.startsWith("page_")) return;
      window.clearTimeout(timeout);
      setStatus("ready");
    };
    const script = document.createElement("script");
    script.async = true;
    script.src = SCRIPT_SRC;
    script.setAttribute("data-form-id", formId);
    script.setAttribute("data-lang", lang);
    script.setAttribute("data-callback", callbackName);
    script.onerror = () => {
      if (!active) return;
      window.clearTimeout(timeout);
      setStatus("error");
    };
    container.appendChild(script);
    return () => {
      active = false;
      window.clearTimeout(timeout);
      script.onerror = null;
      delete callbacks[callbackName];
      container.replaceChildren();
    };
  }, [formId, lang, callbackName, attempt]);

  return (
    <div className={className}>
      <div aria-live="polite">
        {status === "loading" && (
          <p role="status" className="py-4 text-center text-sm text-[#5e6b5a]">
            {t(lang, "Laddar bokningen…", "Loading the booking form…", "Buchungsformular wird geladen…")}
          </p>
        )}
        {(status === "error" || status === "slow") && (
          <div className="mb-6 rounded-xl bg-[#f4f1eb] p-6 text-center">
            <p className="font-serif text-xl text-[#243027] mb-2">
              {status === "slow"
                ? t(lang, "Bokningen tar längre tid att ladda", "The booking form is taking longer to load", "Das Buchungsformular lädt länger als erwartet")
                : t(lang, "Bokningen kunde inte laddas", "The booking form could not be loaded", "Das Buchungsformular konnte nicht geladen werden")}
            </p>
            <p className="text-sm text-[#5e6b5a] mb-4">
              {t(lang, "Försök igen eller ring oss:", "Try again or call us:", "Versuchen Sie es erneut oder rufen Sie uns an:")}{" "}
              <a href="tel:+46722254993" className="underline text-[#617457]">+46 72 225 49 93</a>
            </p>
            <button type="button" onClick={() => setAttempt(value => value + 1)}
              className="inline-flex items-center justify-center rounded-full bg-[#617457] text-[#FFFDF8] px-6 py-3 text-sm font-sans font-medium hover:bg-[#4f5f47] transition-colors">
              {t(lang, "Försök igen", "Try again", "Erneut versuchen")}
            </button>
          </div>
        )}
      </div>
      {/* Sirvoy owns this subtree; React status updates must not remove its DOM. */}
      <div ref={containerRef} className="w-full min-h-[420px] relative" />
    </div>
  );
};
export default SirvoyBookingWidget;
