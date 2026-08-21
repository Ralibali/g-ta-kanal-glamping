import { useEffect, useRef, useState } from "react";

interface Props {
  formId?: string;
  className?: string;
}

const SCRIPT_SRC = "https://secured.sirvoy.com/widget/sirvoy.js";

type WidgetStatus = "loading" | "ready" | "error";

type FallbackCopy = {
  title: string;
  body: string;
  retry: string;
  call: string;
  email: string;
  loading: string;
};

const COPY: Record<"sv" | "en" | "de", FallbackCopy> = {
  sv: {
    title: "Bokningen kunde inte laddas",
    body: "Bokningskalendern svarar inte just nu. Försök igen, eller kontakta oss så hjälper vi dig att kontrollera lediga datum.",
    retry: "Försök igen",
    call: "Ring oss",
    email: "Mejla oss",
    loading: "Laddar bokningen…",
  },
  en: {
    title: "Booking could not be loaded",
    body: "The booking calendar is not responding right now. Try again, or contact us and we will help you check available dates.",
    retry: "Try again",
    call: "Call us",
    email: "Email us",
    loading: "Loading booking…",
  },
  de: {
    title: "Die Buchung konnte nicht geladen werden",
    body: "Der Buchungskalender antwortet gerade nicht. Versuchen Sie es erneut oder kontaktieren Sie uns – wir helfen Ihnen gerne bei der Verfügbarkeit.",
    retry: "Erneut versuchen",
    call: "Anrufen",
    email: "E-Mail senden",
    loading: "Buchung wird geladen…",
  },
};

function currentLanguage(): "sv" | "en" | "de" {
  if (window.location.pathname.startsWith("/en")) return "en";
  if (window.location.pathname.startsWith("/de")) return "de";
  return "sv";
}

const SirvoyBookingWidget = ({ formId = "9482eece181add59", className }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setStatus("loading");
    container.innerHTML = "";

    let settled = false;
    const markError = () => {
      settled = true;
      setStatus("error");
    };

    const inspect = () => {
      const text = (container.textContent || "").toLowerCase();
      const hasSirvoyError =
        text.includes("sirvoy booking widget could not load") ||
        text.includes("failed to fetch") ||
        text.includes("an error occurred");

      if (hasSirvoyError) {
        markError();
        return;
      }

      const hasRenderedUi = Boolean(
        container.querySelector("iframe, form, input, select, button") ||
          container.children.length > 1,
      );

      if (hasRenderedUi && !settled) {
        settled = true;
        setStatus("ready");
      }
    };

    const observer = new MutationObserver(inspect);
    observer.observe(container, { childList: true, subtree: true, characterData: true });

    const script = document.createElement("script");
    script.async = true;
    script.src = SCRIPT_SRC;
    script.setAttribute("data-form-id", formId);
    script.setAttribute("data-sirvoy-injected", "true");

    script.onload = () => {
      window.setTimeout(inspect, 250);
      window.setTimeout(() => {
        if (!settled) {
          settled = true;
          setStatus("ready");
        }
      }, 1600);
    };

    script.onerror = markError;
    container.appendChild(script);

    const hardTimeout = window.setTimeout(() => {
      if (!settled) markError();
    }, 12000);

    return () => {
      observer.disconnect();
      window.clearTimeout(hardTimeout);
      container.innerHTML = "";
    };
  }, [formId, attempt]);

  const copy = COPY[currentLanguage()];

  return (
    <div className={className}>
      <div className={status === "error" ? "hidden" : "relative min-h-[420px]"}>
        <div ref={containerRef} className="w-full min-h-[420px]" aria-live="polite" />

        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FFFDF8]/90 text-[#5e6b5a]" aria-live="polite">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-[#617457]/30 border-t-[#617457] animate-spin" />
              <p className="text-sm font-sans">{copy.loading}</p>
            </div>
          </div>
        )}
      </div>

      {status === "error" && (
        <div className="rounded-3xl border border-[#617457]/20 bg-[#F6F2E9] px-6 py-8 text-center">
          <p className="font-serif text-2xl text-[#243027] mb-2">{copy.title}</p>
          <p className="mx-auto max-w-xl text-sm leading-6 text-[#5e6b5a] mb-5">{copy.body}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setAttempt((value) => value + 1)}
              className="inline-flex items-center justify-center rounded-full bg-[#617457] text-[#FFFDF8] px-6 py-3 text-sm font-sans font-medium hover:bg-[#4f5f47] transition-colors"
            >
              {copy.retry}
            </button>
            <a
              href="tel:+46722254993"
              className="inline-flex items-center justify-center rounded-full border border-[#617457]/30 bg-white px-6 py-3 text-sm font-sans font-medium text-[#617457] hover:bg-[#FFFDF8] transition-colors"
            >
              {copy.call}
            </a>
            <a
              href="mailto:hej@goglampingsweden.se?subject=Bokningsf%C3%B6rfr%C3%A5gan%20Bergs%20Slussar%20Glamping"
              className="inline-flex items-center justify-center rounded-full border border-[#617457]/30 bg-white px-6 py-3 text-sm font-sans font-medium text-[#617457] hover:bg-[#FFFDF8] transition-colors"
            >
              {copy.email}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SirvoyBookingWidget;
