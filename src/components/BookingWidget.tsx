import { useEffect, useRef, useState } from "react";
import { useLang, t } from "@/i18n/LanguageContext";
import { allowedCheckoutUrl, BOOKING_CONTACT, bookingConfig, STAYBOOST_ORIGIN, stayboostBookingUrl } from "@/lib/booking-provider";
import SirvoyBookingWidget from "./SirvoyBookingWidget";

function BookingHelp() {
  const lang = useLang();
  return <p className="p-6 text-center text-foreground" role="status">
    {t(lang, "Bokningen är tillfälligt otillgänglig. Kontakta oss så hjälper vi dig.", "Booking is temporarily unavailable. Please contact us for help.", "Die Buchung ist vorübergehend nicht verfügbar. Bitte kontaktieren Sie uns.")}{" "}
    <a href={`mailto:${BOOKING_CONTACT}`} className="underline">{BOOKING_CONTACT}</a>
  </p>;
}

function StayboostFrame({ slug }: { slug: string }) {
  const lang = useLang();
  const frame = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setStatus("loading");
    const timeout = window.setTimeout(() => setStatus("error"), 20000);
    const receive = (event: MessageEvent) => {
      if (event.origin !== STAYBOOST_ORIGIN || !frame.current?.contentWindow || event.source !== frame.current.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "stayboost:ready" || data.type === "stayboost:error") {
        window.clearTimeout(timeout);
        setStatus(data.type === "stayboost:ready" ? "ready" : "error");
      }
      if (data.type === "stayboost:checkout") {
        const url = allowedCheckoutUrl(data.url);
        if (url) window.location.assign(url);
      }
    };
    window.addEventListener("message", receive);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", receive);
    };
  }, [slug, lang, attempt]);

  return <div className="bg-card rounded-2xl overflow-hidden">
    <div aria-live="polite">
      {status === "loading" && <p role="status" className="p-4 text-center text-muted-foreground">{t(lang, "Laddar bokningen…", "Loading booking…", "Buchung wird geladen…")}</p>}
      {status === "error" && <><BookingHelp /><div className="pb-4 text-center"><button type="button" onClick={() => setAttempt(value => value + 1)} className="underline text-foreground">{t(lang, "Försök igen", "Try again", "Erneut versuchen")}</button></div></>}
    </div>
    <iframe
      key={`${slug}-${lang}-${attempt}`}
      ref={frame}
      src={stayboostBookingUrl(slug, lang)}
      title={t(lang, "Boka Bergs Slussar Glamping", "Book Bergs Slussar Glamping", "Bergs Slussar Glamping buchen")}
      className="w-full border-0 min-h-[1100px]"
      hidden={status === "error"}
      referrerPolicy="strict-origin-when-cross-origin"
      onError={() => setStatus("error")}
    />
    <p className="p-4 text-center text-sm text-foreground"><a href={stayboostBookingUrl(slug, lang, false)} target="_blank" rel="noopener noreferrer" className="underline">{t(lang, "Öppna bokningen i ett eget fönster", "Open booking in a separate window", "Buchung in einem eigenen Fenster öffnen")}</a></p>
  </div>;
}

function StayboostWidget({ slug }: { slug: string }) {
  const lang = useLang();
  const [enabled, setEnabled] = useState(false);
  if (enabled) return <StayboostFrame slug={slug} />;
  return <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border bg-card p-6 text-center text-foreground">
    <p className="max-w-md text-sm">{t(lang,
      "Bokningen hanteras av StayBoost. När du öppnar bokningsformuläret ansluter din webbläsare till StayBoost, som får din IP-adress och webbläsarinformation.",
      "Booking is handled by StayBoost. Opening the booking form connects your browser to StayBoost, which receives your IP address and browser information.",
      "Die Buchung erfolgt über StayBoost. Wenn Sie das Buchungsformular öffnen, verbindet sich Ihr Browser mit StayBoost und übermittelt Ihre IP-Adresse und Browserinformationen.",
    )}</p>
    <a href="/integritet" className="text-sm underline">{t(lang, "Läs vår integritetspolicy", "Read our privacy policy", "Unsere Datenschutzerklärung lesen")}</a>
    <button type="button" onClick={() => setEnabled(true)} className="rounded-full bg-[#617457] px-6 py-3 text-sm font-medium text-white">{t(lang, "Öppna bokningsformuläret", "Open booking form", "Buchungsformular öffnen")}</button>
  </div>;
}

export default function BookingWidget() {
  if (bookingConfig.provider === "sirvoy") return <SirvoyBookingWidget />;
  if (bookingConfig.provider === "unavailable") return <BookingHelp />;
  return <StayboostWidget slug={bookingConfig.slug} />;
}
