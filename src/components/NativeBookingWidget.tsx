import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, CreditCard, Loader2, Minus, Plus, ShieldCheck, Users } from "lucide-react";

export type NativeBookingLang = "sv" | "en" | "de";

type Unit = {
  id: string;
  name: string;
  description: string | null;
  maxGuests: number;
  basePrice: number;
  weekendPct: number;
  minStay: number;
  cleaningFee: number;
  monthlyMult: number[];
  booked: { from: string; to: string }[];
};

type Addon = {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  price: number;
  price_type: string;
  max_quantity: number;
  slug: string | null;
};

type EngineData = {
  property: {
    name: string;
    slug: string;
    currency: string;
    checkinTime: string;
    checkoutTime: string;
    contactEmail: string | null;
    contactPhone: string | null;
    stripeAvailable: boolean;
  };
  units: Unit[];
  addons: Addon[];
};

const FUNCTIONS_BASE = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "");
const PROPERTY_SLUG = (import.meta.env.VITE_NATIVE_BOOKING_PROPERTY_SLUG as string | undefined) || "bergs-slussar-glamping";
const today = () => new Date().toISOString().slice(0, 10);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const copy = {
  sv: {
    loading: "Hämtar lediga datum…",
    unavailable: "Det egna bokningssystemet är inte redo på den här miljön ännu.",
    chooseTent: "1. Välj tält",
    chooseDates: "2. Välj datum",
    details: "3. Dina uppgifter",
    extras: "Tillval",
    guests: "Gäster",
    checkin: "Incheckning",
    checkout: "Utcheckning",
    from: "Från",
    perNight: "/natt",
    nights: "nätter",
    night: "natt",
    name: "Namn",
    email: "E-post",
    phone: "Mobilnummer",
    terms: "Jag godkänner bokningsvillkoren",
    total: "Totalt",
    pay: "Fortsätt till säker betalning",
    secure: "Betalningen sker säkert hos Stripe. Tältet hålls åt dig medan du betalar.",
    sold: "Tältet är inte ledigt hela den valda perioden.",
    invalid: "Kontrollera datum och kontaktuppgifter innan du fortsätter.",
    failed: "Bokningen kunde inte slutföras. Försök igen eller kontakta oss.",
    paidTitle: "Betalningen är mottagen!",
    paidBody: "Din bokning är bekräftad. En bekräftelse skickas till din e-post.",
    pendingTitle: "Vi kontrollerar betalningen…",
    cancelled: "Betalningen avbröts. Inga pengar har dragits.",
    max: "Max",
    included: "Direktbokning · Stripe · Omedelbar bekräftelse",
  },
  en: {
    loading: "Loading available dates…",
    unavailable: "The direct booking system is not ready in this environment yet.",
    chooseTent: "1. Choose tent",
    chooseDates: "2. Choose dates",
    details: "3. Your details",
    extras: "Extras",
    guests: "Guests",
    checkin: "Check-in",
    checkout: "Check-out",
    from: "From",
    perNight: "/night",
    nights: "nights",
    night: "night",
    name: "Name",
    email: "Email",
    phone: "Mobile number",
    terms: "I accept the booking terms",
    total: "Total",
    pay: "Continue to secure payment",
    secure: "Payment is handled securely by Stripe. Your tent is held while you pay.",
    sold: "The tent is not available for the whole selected period.",
    invalid: "Check your dates and contact details before continuing.",
    failed: "The booking could not be completed. Please try again or contact us.",
    paidTitle: "Payment received!",
    paidBody: "Your booking is confirmed. A confirmation is being sent by email.",
    pendingTitle: "Checking your payment…",
    cancelled: "Payment was cancelled. No money has been charged.",
    max: "Max",
    included: "Direct booking · Stripe · Instant confirmation",
  },
  de: {
    loading: "Verfügbare Daten werden geladen…",
    unavailable: "Das Direktbuchungssystem ist in dieser Umgebung noch nicht bereit.",
    chooseTent: "1. Zelt wählen",
    chooseDates: "2. Daten wählen",
    details: "3. Ihre Angaben",
    extras: "Extras",
    guests: "Gäste",
    checkin: "Check-in",
    checkout: "Check-out",
    from: "Ab",
    perNight: "/Nacht",
    nights: "Nächte",
    night: "Nacht",
    name: "Name",
    email: "E-Mail",
    phone: "Mobilnummer",
    terms: "Ich akzeptiere die Buchungsbedingungen",
    total: "Gesamt",
    pay: "Weiter zur sicheren Zahlung",
    secure: "Die Zahlung erfolgt sicher über Stripe. Das Zelt wird während der Zahlung reserviert.",
    sold: "Das Zelt ist im gewählten Zeitraum nicht durchgehend verfügbar.",
    invalid: "Bitte prüfen Sie Daten und Kontaktdaten.",
    failed: "Die Buchung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.",
    paidTitle: "Zahlung erhalten!",
    paidBody: "Ihre Buchung ist bestätigt. Eine Bestätigung wird per E-Mail gesendet.",
    pendingTitle: "Zahlung wird geprüft…",
    cancelled: "Die Zahlung wurde abgebrochen. Es wurde nichts berechnet.",
    max: "Max",
    included: "Direktbuchung · Stripe · Sofortige Bestätigung",
  },
} as const;

const rangesOverlap = (aFrom: string, aTo: string, bFrom: string, bTo: string) => aFrom < bTo && aTo > bFrom;
const nightsBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

function nightlyPrice(unit: Unit, iso: string) {
  const date = new Date(`${iso}T12:00:00Z`);
  const monthPct = Number(unit.monthlyMult?.[date.getUTCMonth()] ?? 100);
  const weekday = date.getUTCDay();
  const weekendPct = weekday === 5 || weekday === 6 ? Number(unit.weekendPct ?? 0) : 0;
  return Math.round(unit.basePrice * (monthPct / 100) * (1 + weekendPct / 100));
}

function quote(unit: Unit | null, from: string, to: string) {
  if (!unit || !from || !to || to <= from) return null;
  const nights = nightsBetween(from, to);
  if (nights <= 0) return null;
  let accommodation = 0;
  for (let i = 0; i < nights; i++) accommodation += nightlyPrice(unit, addDays(from, i));
  return { nights, accommodation, total: accommodation + unit.cleaningFee };
}

function addonTotal(addon: Addon, quantity: number, nights: number, guests: number) {
  switch (addon.price_type) {
    case "per_night": return addon.price * quantity * nights;
    case "per_person": return addon.price * quantity * guests;
    case "per_person_per_night": return addon.price * quantity * guests * nights;
    default: return addon.price * quantity;
  }
}

const kr = (value: number, lang: NativeBookingLang) => `${Math.round(value).toLocaleString(lang === "sv" ? "sv-SE" : lang === "de" ? "de-DE" : "en-GB")} kr`;

export default function NativeBookingWidget({ lang = "sv" }: { lang?: NativeBookingLang }) {
  const t = copy[lang];
  const [data, setData] = useState<EngineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [unitId, setUnitId] = useState("");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addons, setAddons] = useState<Record<string, number>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<"paid" | "pending" | "cancelled" | null>(null);

  useEffect(() => {
    if (!FUNCTIONS_BASE) {
      setLoadError(true);
      setLoading(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const nativeState = params.get("native");
    if (nativeState === "cancelled") setPaymentState("cancelled");

    const load = async () => {
      try {
        if (nativeState === "success" && sessionId) {
          const statusRes = await fetch(`${FUNCTIONS_BASE}/functions/v1/booking-engine?session_id=${encodeURIComponent(sessionId)}`);
          if (statusRes.ok) {
            const statusPayload = await statusRes.json();
            setPaymentState(statusPayload.booking?.payment_status === "paid" ? "paid" : "pending");
          }
        }

        const res = await fetch(`${FUNCTIONS_BASE}/functions/v1/booking-engine?slug=${encodeURIComponent(PROPERTY_SLUG)}`);
        if (!res.ok) throw new Error("engine unavailable");
        const payload = (await res.json()) as EngineData;
        setData(payload);
        const first = payload.units[0];
        if (first) {
          setUnitId(first.id);
          setGuests(Math.min(2, first.maxGuests));
        }
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const unit = data?.units.find((item) => item.id === unitId) ?? null;
  const stayQuote = useMemo(() => quote(unit, checkin, checkout), [unit, checkin, checkout]);
  const rangeFree = Boolean(
    unit && checkin && checkout && checkout > checkin &&
    !unit.booked.some((range) => rangesOverlap(checkin, checkout, range.from, range.to)),
  );
  const addOnTotal = useMemo(() => {
    if (!data || !stayQuote) return 0;
    return data.addons.reduce((sum, addon) => sum + addonTotal(addon, addons[addon.id] ?? 0, stayQuote.nights, guests), 0);
  }, [data, stayQuote, addons, guests]);
  const grandTotal = (stayQuote?.total ?? 0) + addOnTotal;

  if (loading) return <div className="flex min-h-[280px] items-center justify-center gap-3 text-[#617457]"><Loader2 className="animate-spin" size={22} /><span>{t.loading}</span></div>;
  if (loadError || !data || !data.units.length) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-900">{t.unavailable}</div>;

  if (paymentState === "paid") return (
    <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-8 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-700 text-white"><Check size={22} /></span>
      <h3 className="mt-4 font-serif text-3xl text-[#243027]">{t.paidTitle}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#496052]">{t.paidBody}</p>
    </div>
  );

  return (
    <div className="space-y-7">
      {paymentState === "pending" && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{t.pendingTitle}</div>}
      {paymentState === "cancelled" && <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{t.cancelled}</div>}

      <section>
        <h3 className="mb-3 flex items-center gap-2 font-serif text-2xl text-[#243027]"><CalendarDays size={20} className="text-[#617457]" />{t.chooseTent}</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {data.units.map((candidate) => {
            const selected = candidate.id === unitId;
            return <button key={candidate.id} type="button" onClick={() => { setUnitId(candidate.id); setGuests(Math.min(guests, candidate.maxGuests)); setError(null); }} className={`rounded-2xl border p-4 text-left transition ${selected ? "border-[#617457] bg-[#edf2ed] shadow-sm" : "border-black/10 bg-white hover:border-[#617457]/50"}`}>
              <div className="flex items-start justify-between gap-3"><span className="font-semibold text-[#243027]">{candidate.name}</span>{selected ? <Check size={17} className="text-[#617457]" /> : null}</div>
              {candidate.description ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#657067]">{candidate.description}</p> : null}
              <p className="mt-3 text-xs font-semibold text-[#617457]">{t.from} {kr(candidate.basePrice, lang)} {t.perNight} · {t.max} {candidate.maxGuests}</p>
            </button>;
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-serif text-2xl text-[#243027]">{t.chooseDates}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-[#334239]">{t.checkin}<input type="date" min={today()} value={checkin} onChange={(e) => { setCheckin(e.target.value); if (checkout && e.target.value >= checkout) setCheckout(""); setError(null); }} className="mt-2 h-12 w-full rounded-xl border border-black/10 bg-white px-3" /></label>
          <label className="text-sm font-medium text-[#334239]">{t.checkout}<input type="date" min={checkin || today()} value={checkout} onChange={(e) => { setCheckout(e.target.value); setError(null); }} className="mt-2 h-12 w-full rounded-xl border border-black/10 bg-white px-3" /></label>
        </div>
        {checkin && checkout && !rangeFree ? <p className="mt-3 text-sm font-medium text-red-700">{t.sold}</p> : null}
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 font-serif text-2xl text-[#243027]"><Users size={20} className="text-[#617457]" />{t.details}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm font-medium text-[#334239]">{t.guests}<div className="mt-2 inline-flex h-12 items-center rounded-xl border border-black/10 bg-white"><button type="button" onClick={() => setGuests(Math.max(1, guests - 1))} className="grid h-12 w-12 place-items-center" aria-label="minus"><Minus size={16} /></button><span className="min-w-10 text-center font-semibold">{guests}</span><button type="button" onClick={() => setGuests(Math.min(unit?.maxGuests ?? 1, guests + 1))} className="grid h-12 w-12 place-items-center" aria-label="plus"><Plus size={16} /></button></div></label>
          <label className="text-sm font-medium text-[#334239]">{t.name}<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-2 h-12 w-full rounded-xl border border-black/10 bg-white px-3" /></label>
          <label className="text-sm font-medium text-[#334239]">{t.email}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="mt-2 h-12 w-full rounded-xl border border-black/10 bg-white px-3" /></label>
          <label className="sm:col-span-2 text-sm font-medium text-[#334239]">{t.phone}<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className="mt-2 h-12 w-full rounded-xl border border-black/10 bg-white px-3" /></label>
        </div>
      </section>

      {data.addons.length && stayQuote ? <section>
        <h3 className="mb-3 font-serif text-2xl text-[#243027]">{t.extras}</h3>
        <div className="space-y-2">
          {data.addons.map((addon) => {
            const qty = addons[addon.id] ?? 0;
            const label = lang === "en" ? addon.name_en || addon.name : addon.name;
            const description = lang === "en" ? addon.description_en || addon.description : addon.description;
            return <div key={addon.id} className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-4"><div className="min-w-0 flex-1"><p className="font-semibold text-[#243027]">{label}</p>{description ? <p className="mt-1 text-xs leading-5 text-[#657067]">{description}</p> : null}<p className="mt-1 text-xs font-semibold text-[#617457]">{kr(addon.price, lang)}</p></div><div className="inline-flex items-center rounded-xl border border-black/10"><button type="button" onClick={() => setAddons((prev) => ({ ...prev, [addon.id]: Math.max(0, qty - 1) }))} className="grid h-10 w-10 place-items-center"><Minus size={14} /></button><span className="w-7 text-center text-sm font-semibold">{qty}</span><button type="button" onClick={() => setAddons((prev) => ({ ...prev, [addon.id]: Math.min(addon.max_quantity, qty + 1) }))} className="grid h-10 w-10 place-items-center"><Plus size={14} /></button></div></div>;
          })}
        </div>
      </section> : null}

      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#f5f3ed] p-4 text-sm text-[#334239]"><input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 h-4 w-4" /><span>{t.terms} · <a href="/bokningsvillkor" target="_blank" className="underline">/bokningsvillkor</a></span></label>

      {stayQuote && rangeFree ? <div className="rounded-[22px] border border-[#617457]/20 bg-[#edf2ed] p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#617457]">{stayQuote.nights} {stayQuote.nights === 1 ? t.night : t.nights}</p><p className="mt-1 font-serif text-2xl text-[#243027]">{t.total}</p></div><p className="font-serif text-3xl font-semibold text-[#243027]">{kr(grandTotal, lang)}</p></div></div> : null}

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <button type="button" disabled={sending || !stayQuote || !rangeFree || !data.property.stripeAvailable} onClick={async () => {
        if (!unit || !stayQuote || !rangeFree || name.trim().length < 2 || !EMAIL.test(email.trim()) || !termsAccepted) { setError(t.invalid); return; }
        setSending(true); setError(null);
        try {
          const res = await fetch(`${FUNCTIONS_BASE}/functions/v1/booking-engine`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: data.property.slug, unitId: unit.id, checkin, checkout, guest_name: name.trim(), guest_email: email.trim(), guest_phone: phone.trim(), guests, language: lang, addons: Object.entries(addons).filter(([, quantity]) => quantity > 0).map(([id, quantity]) => ({ id, quantity })), termsAccepted, returnPath: window.location.pathname, website: "" }) });
          const payload = await res.json();
          if (!res.ok || !payload.checkoutUrl) { setError(payload.error === "unavailable" ? t.sold : t.failed); return; }
          window.location.href = payload.checkoutUrl;
        } catch { setError(t.failed); } finally { setSending(false); }
      }} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#617457] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#506249] disabled:cursor-not-allowed disabled:opacity-50"><CreditCard size={18} />{sending ? <Loader2 className="animate-spin" size={18} /> : t.pay}</button>
      <p className="flex items-center justify-center gap-2 text-center text-xs text-[#657067]"><ShieldCheck size={14} />{t.secure}</p>
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[#617457]/70">{t.included}</p>
    </div>
  );
}
