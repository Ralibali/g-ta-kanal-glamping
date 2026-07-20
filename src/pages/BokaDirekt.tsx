import { useEffect, useMemo, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Users,
  ArrowLeft,
} from "lucide-react";
import Footer from "@/components/Footer";
import {
  nightlyPrice,
  quoteStay,
  rangesOverlap,
  type UnitPricing,
} from "../lib/be-pricing";

/** Publik direktbokningssida — /boka-direkt/:slug
 * Använder Supabase Edge Function `booking-engine` (verify_jwt=false).
 * Överlappsskydd, prissättning och betalning sker server-side.
 */

const FUNCTIONS_BASE = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "");

type EngineUnit = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  basePrice: number;
  weekendPct: number;
  minStay: number;
  cleaningFee: number;
  monthlyMult: number[];
  booked: { from: string; to: string }[];
};

type EngineAddon = {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  price: number;
  price_type: "per_booking" | "per_night" | "per_guest";
  image_url: string | null;
  max_quantity: number;
  sort_order: number;
};

type EngineData = {
  property: {
    name: string;
    slug: string;
    checkinTime: string;
    checkoutTime: string;
    currency: string;
    swishNumber: string | null;
    stripeAvailable: boolean;
  };
  units: EngineUnit[];
  addons: EngineAddon[];
};

const svDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
const fmtKr = (n: number) => `${n.toLocaleString("sv-SE")} kr`;

const pricingOf = (u: EngineUnit): UnitPricing => ({
  base_price: u.basePrice,
  weekend_pct: u.weekendPct,
  cleaning_fee: u.cleaningFee,
  monthly_mult: (u.monthlyMult ?? []).map(Number),
});

const isBooked = (u: EngineUnit, iso: string) =>
  u.booked.some((r) => iso >= r.from && iso < r.to);

const rangeFree = (u: EngineUnit, from: string, to: string) =>
  !u.booked.some((r) => rangesOverlap(from, to, r.from, r.to));

export default function BokaDirekt() {
  const { slug = "go-glamping-sweden" } = useParams();
  const [params] = useSearchParams();
  const paidNotice = params.get("paid") === "1";
  const cancelNotice = params.get("cancel") === "1";

  const [data, setData] = useState<EngineData | null>(null);
  const [error, setError] = useState(false);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [checkin, setCheckin] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(2);
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});
  const [payChoice, setPayChoice] = useState<"stripe" | "swish" | null>(null);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    publicToken: string;
    total: number;
    swishNumber?: string;
    paymentRef?: string;
    method: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!FUNCTIONS_BASE) { setError(true); return; }
    fetch(`${FUNCTIONS_BASE}/functions/v1/booking-engine?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: EngineData) => {
        setData(d);
        if (d.units.length > 0) setUnitId(d.units[0].id);
      })
      .catch(() => setError(true));
  }, [slug]);

  const unit = data?.units.find((u) => u.id === unitId) ?? null;
  const pricing = unit ? pricingOf(unit) : null;

  const quote = useMemo(
    () => (pricing && checkin && checkout ? quoteStay(pricing, checkin, checkout) : null),
    [pricing, checkin, checkout],
  );

  const chosenAddons = useMemo(() => {
    if (!data || !quote) return [];
    return data.addons
      .filter((a) => (addonQty[a.id] ?? 0) > 0)
      .map((a) => {
        const qty = addonQty[a.id];
        const lineTotal =
          a.price_type === "per_night" ? a.price * qty * quote.nights :
          a.price_type === "per_guest" ? a.price * qty * guests :
          a.price * qty;
        return { ...a, qty, lineTotal };
      });
  }, [data, quote, addonQty, guests]);
  const addonsTotal = chosenAddons.reduce((s, a) => s + a.lineTotal, 0);
  const grandTotal = (quote?.total ?? 0) + addonsTotal;

  const pick = (iso: string) => {
    if (!unit) return;
    if (isBooked(unit, iso)) return;
    if (!checkin || (checkin && checkout) || iso < checkin) {
      setCheckin(iso); setCheckout(null); return;
    }
    if (iso === checkin) return;
    if (!rangeFree(unit, checkin, iso)) return;
    setCheckout(iso);
  };

  const minStayOk = !quote || !unit || quote.nights >= unit.minStay;
  const overCapacity = unit ? guests > unit.capacity : false;
  const canSubmit =
    unit && quote && minStayOk && !overCapacity && (email.trim() || phone.trim()) && !sending;

  const payMethods = data
    ? ([
        ...(data.property.stripeAvailable ? (["stripe"] as const) : []),
        ...(data.property.swishNumber ? (["swish"] as const) : []),
      ] as ("stripe" | "swish")[])
    : [];
  const payMethod = payChoice && payMethods.includes(payChoice) ? payChoice : (payMethods[0] ?? null);

  const submit = async () => {
    if (!canSubmit || !unit || !checkin || !checkout) return;
    setSending(true);
    setFormError(null);
    try {
      const r = await fetch(`${FUNCTIONS_BASE}/functions/v1/booking-engine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          unitId: unit.id,
          checkin,
          checkout,
          guest_name: name.trim(),
          guest_email: email.trim(),
          guest_phone: phone.trim(),
          guests,
          language: "sv",
          addons: Object.entries(addonQty)
            .filter(([, q]) => q > 0)
            .map(([id, quantity]) => ({ id, quantity })),
          ...(payMethod ? { paymentMethod: payMethod } : {}),
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        const map: Record<string, string> = {
          unavailable: "Datumen hann tyvärr bokas av någon annan — välj andra datum.",
          min_stay: `Minsta vistelse är ${d.minStay} nätter.`,
          contact_required: "Ange e-post eller telefon så vi kan skicka bekräftelsen.",
          stripe_failed: "Kortbetalningen kunde inte startas — försök igen eller välj Swish.",
          over_capacity: `Denna enhet rymmer max ${d.capacity} personer.`,
          past_checkin: "Incheckningsdatumet har passerat.",
        };
        setFormError(map[d.error] ?? "Något gick fel — försök igen om en stund.");
      } else if (d.checkoutUrl) {
        window.location.href = d.checkoutUrl;
        return;
      } else {
        setDone({
          publicToken: d.publicToken,
          total: d.grandTotal ?? d.price?.total ?? 0,
          swishNumber: d.swishNumber,
          paymentRef: d.paymentRef,
          method: d.paymentMethod,
        });
      }
    } catch {
      setFormError("Något gick fel — försök igen om en stund.");
    }
    setSending(false);
  };

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F6F2E9] px-6 text-center">
        <div>
          <p className="font-serif text-3xl">Bokningssidan hittades inte</p>
          <p className="mt-3 text-[15px] text-[#243027]/60">
            Kontrollera länken — eller hör av dig till oss så hjälper vi dig.
          </p>
          <Link to="/" className="mt-4 inline-block text-[#617457] underline">Tillbaka</Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F6F2E9]">
        <Loader2 className="animate-spin text-[#617457]" size={32} />
      </div>
    );
  }

  const stayUrl = done ? `${window.location.origin}/stay/${done.publicToken}` : null;

  return (
    <HelmetProvider>
      <Helmet>
        <title>Boka direkt — {data.property.name}</title>
        <meta name="description" content={`Boka din vistelse direkt hos ${data.property.name}. Bästa pris, ingen mellanhand.`} />
        <link rel="canonical" href={`https://goglampingsweden.se/boka-direkt/${slug}`} />
      </Helmet>

      <div className="min-h-screen bg-[#F6F2E9] pb-20 font-sans text-[#243027]">
        <div className="mx-auto max-w-lg px-4 pt-6">
          <Link to="/" className="inline-flex items-center gap-1 text-[13px] text-[#617457] hover:underline">
            <ArrowLeft size={14} /> Tillbaka
          </Link>

          {/* Hero */}
          <div className="mt-3 overflow-hidden rounded-3xl bg-[#617457] text-white shadow-lg">
            <div className="p-6">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">Boka direkt · Bästa pris</p>
              <h1 className="mt-1 font-serif text-[28px] leading-tight">{data.property.name}</h1>
              <p className="mt-2 text-[14px] text-white/80">
                Incheckning från {data.property.checkinTime} · Utcheckning senast {data.property.checkoutTime}
              </p>
            </div>
          </div>

          {cancelNotice && !done && (
            <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-[13px] text-amber-900 ring-1 ring-amber-200">
              Kortbetalningen avbröts. Du kan försöka igen eller välja Swish istället.
            </div>
          )}
          {paidNotice && !done && (
            <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-[13px] text-emerald-900 ring-1 ring-emerald-200">
              Betalningen mottagen! Bekräftelsen är på väg med all praktisk information.
            </div>
          )}

          {done ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-3xl bg-white p-6 text-center shadow ring-1 ring-black/5"
            >
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl">✅</span>
              <h2 className="mt-4 font-serif text-2xl">Bokningen är registrerad!</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#243027]/70">
                {unit?.name} · {svDate(checkin!)} – {svDate(checkout!)} · {fmtKr(done.total)}
              </p>

              {done.method === "swish" && done.swishNumber && (
                <div className="mt-5 rounded-2xl bg-[#B59465]/10 p-4 text-left">
                  <p className="text-[14px] font-bold">Betala med Swish</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#243027]/70">
                    Swisha <strong>{fmtKr(done.total)}</strong> inom 24 timmar för att säkra din bokning.
                  </p>
                  <div className="mt-3 space-y-2">
                    {[
                      { label: "Swish-nummer", value: done.swishNumber, key: "nr" },
                      { label: "Meddelande", value: done.paymentRef!, key: "ref" },
                    ].map((r) => (
                      <button
                        key={r.key}
                        onClick={() => {
                          navigator.clipboard.writeText(r.value);
                          setCopied(r.key);
                          setTimeout(() => setCopied(null), 1500);
                        }}
                        className="flex w-full items-center justify-between rounded-xl bg-white px-3.5 py-2.5 text-left ring-1 ring-black/10 transition hover:ring-[#B59465]"
                      >
                        <span>
                          <span className="block text-[11px] text-[#243027]/50">{r.label} — tryck för att kopiera</span>
                          <span className="font-mono text-[15px] font-semibold tracking-wide">{r.value}</span>
                        </span>
                        {copied === r.key ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} className="text-[#243027]/40" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {stayUrl && (
                <a
                  href={stayUrl}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#617457] px-4 py-3 text-[15px] font-semibold text-white hover:bg-[#4d5c45]"
                >
                  Öppna din vistelsesida →
                </a>
              )}
            </motion.div>
          ) : (
            <>
              {/* Enhetsval */}
              {data.units.length > 1 && (
                <div className="mt-5 grid gap-2">
                  {data.units.map((u) => {
                    const lowestMult = Math.min(...(u.monthlyMult ?? [70]).map(Number));
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          setUnitId(u.id); setCheckin(null); setCheckout(null);
                        }}
                        className={`flex items-center justify-between rounded-2xl bg-white p-4 text-left shadow-sm ring-1 transition ${
                          u.id === unitId ? "ring-2 ring-[#617457]" : "ring-black/5"
                        }`}
                      >
                        <span>
                          <span className="block text-[15px] font-semibold">{u.name}</span>
                          <span className="text-[12px] text-[#243027]/60">Max {u.capacity} personer</span>
                        </span>
                        <span className="text-[13px] text-[#243027]/70">
                          från {fmtKr(Math.round((u.basePrice * lowestMult) / 100))}/natt
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Kalender */}
              {unit && (
                <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setMonthOffset((o) => Math.max(0, o - 1))}
                      disabled={monthOffset === 0}
                      className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#F6F2E9] disabled:opacity-30"
                      aria-label="Föregående månad"
                    >
                      <ChevronLeft size={17} />
                    </button>
                    <span className="text-[14px] font-bold capitalize">
                      {new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() + monthOffset, 1,
                      ).toLocaleDateString("sv-SE", { month: "long", year: "numeric" })}
                    </span>
                    <button
                      onClick={() => setMonthOffset((o) => Math.min(11, o + 1))}
                      className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#F6F2E9]"
                      aria-label="Nästa månad"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                  <MonthCalendar
                    monthOffset={monthOffset}
                    unit={unit}
                    pricing={pricing!}
                    checkin={checkin}
                    checkout={checkout}
                    onPick={pick}
                  />
                  <div className="mt-3 flex items-center justify-between text-[12px] text-[#243027]/50">
                    <span className="flex items-center gap-1">
                      <Users size={13} /> Minst {unit.minStay} {unit.minStay === 1 ? "natt" : "nätter"}
                    </span>
                    <span>Helgpåslag +{unit.weekendPct}% fre/lör</span>
                  </div>
                </div>
              )}

              {/* Tillval */}
              {unit && data.addons.length > 0 && (
                <div className="mt-6">
                  <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#243027]/50">
                    Gör vistelsen ännu bättre
                  </p>
                  <div className="mt-2 divide-y divide-black/5 rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                    {data.addons.map((a) => {
                      const qty = addonQty[a.id] ?? 0;
                      const suffix =
                        a.price_type === "per_night" ? "/natt" :
                        a.price_type === "per_guest" ? "/gäst" : "";
                      return (
                        <div key={a.id} className="flex items-center gap-3.5 px-4 py-3.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-semibold">{a.name}</p>
                            {a.description && (
                              <p className="mt-0.5 line-clamp-2 text-[12px] text-[#243027]/55">{a.description}</p>
                            )}
                            <p className="mt-0.5 text-[12px] font-semibold text-[#B59465]">
                              {fmtKr(a.price)}{suffix}
                            </p>
                          </div>
                          {qty === 0 ? (
                            <button
                              onClick={() => setAddonQty({ ...addonQty, [a.id]: 1 })}
                              className="rounded-lg bg-[#617457] px-3 py-1.5 text-[13px] font-semibold text-white"
                            >
                              Lägg till
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setAddonQty({ ...addonQty, [a.id]: Math.max(0, qty - 1) })}
                                className="grid h-7 w-7 place-items-center rounded-full bg-[#F6F2E9] text-[15px]"
                              >−</button>
                              <span className="w-6 text-center text-[14px] font-semibold">{qty}</span>
                              <button
                                onClick={() => setAddonQty({ ...addonQty, [a.id]: Math.min(a.max_quantity, qty + 1) })}
                                className="grid h-7 w-7 place-items-center rounded-full bg-[#F6F2E9] text-[15px]"
                              >+</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Formulär + betalning */}
              {unit && checkin && checkout && (
                <div className="mt-6 space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="col-span-2 text-[13px] font-semibold">
                      Namn
                      <input value={name} onChange={(e) => setName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-[14px]" />
                    </label>
                    <label className="text-[13px] font-semibold">
                      E-post
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-[14px]" />
                    </label>
                    <label className="text-[13px] font-semibold">
                      Telefon
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-[14px]" />
                    </label>
                    <label className="text-[13px] font-semibold">
                      Antal gäster
                      <input type="number" min={1} max={unit.capacity} value={guests}
                        onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                        className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-[14px]" />
                    </label>
                  </div>
                  {overCapacity && (
                    <p className="text-[12px] text-red-600">Enheten rymmer max {unit.capacity} personer.</p>
                  )}

                  {/* Sammanfattning */}
                  {quote && (
                    <div className="rounded-xl bg-[#F6F2E9] p-3 text-[13px]">
                      <div className="flex justify-between"><span>{quote.nights} nätter</span><span>{fmtKr(quote.subtotal)}</span></div>
                      {quote.cleaningFee > 0 && (
                        <div className="flex justify-between"><span>Städ</span><span>{fmtKr(quote.cleaningFee)}</span></div>
                      )}
                      {addonsTotal > 0 && (
                        <div className="flex justify-between"><span>Tillval</span><span>{fmtKr(addonsTotal)}</span></div>
                      )}
                      <div className="mt-2 flex justify-between border-t border-black/10 pt-2 font-semibold">
                        <span>Totalt</span><span>{fmtKr(grandTotal)}</span>
                      </div>
                    </div>
                  )}

                  {/* Betalsätt */}
                  {payMethods.length > 1 && (
                    <div className="grid grid-cols-2 gap-2">
                      {payMethods.map((m) => (
                        <button
                          key={m}
                          onClick={() => setPayChoice(m)}
                          className={`rounded-lg px-3 py-2 text-[13px] font-semibold ring-1 ${
                            payMethod === m ? "bg-[#617457] text-white ring-[#617457]" : "bg-white ring-black/10"
                          }`}
                        >
                          {m === "stripe" ? "Kortbetalning" : "Swish"}
                        </button>
                      ))}
                    </div>
                  )}

                  {formError && (
                    <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-800 ring-1 ring-red-200">
                      {formError}
                    </div>
                  )}

                  <button
                    disabled={!canSubmit}
                    onClick={submit}
                    className="w-full rounded-xl bg-[#617457] px-4 py-3 text-[15px] font-semibold text-white hover:bg-[#4d5c45] disabled:opacity-50"
                  >
                    {sending ? "Skickar..." : `Slutför bokning · ${fmtKr(grandTotal)}`}
                  </button>
                  <p className="text-center text-[11px] text-[#243027]/50">
                    Genom att boka godkänner du våra <Link to="/bokningsvillkor" className="underline">bokningsvillkor</Link>.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        <Footer />
      </div>
    </HelmetProvider>
  );
}

/* ---------- Kalender ---------- */

function MonthCalendar({
  monthOffset, unit, pricing, checkin, checkout, onPick,
}: {
  monthOffset: number;
  unit: EngineUnit;
  pricing: UnitPricing;
  checkin: string | null;
  checkout: string | null;
  onPick: (iso: string) => void;
}) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const startWd = (first.getDay() + 6) % 7; // Mån=0
  const today = new Date().toISOString().slice(0, 10);

  const cells: (string | null)[] = [];
  for (let i = 0; i < startWd; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push(iso);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const inRange = (iso: string) =>
    checkin && checkout && iso >= checkin && iso < checkout;

  return (
    <div className="mt-3">
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-[#243027]/40">
        {["mån", "tis", "ons", "tor", "fre", "lör", "sön"].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((iso, i) => {
          if (!iso) return <div key={i} />;
          const past = iso < today;
          const booked = isBooked(unit, iso);
          const isCheckin = iso === checkin;
          const isCheckout = iso === checkout;
          const inR = inRange(iso);
          const price = past || booked ? null : nightlyPrice(pricing, iso);
          const dayNum = Number(iso.slice(8, 10));
          return (
            <button
              key={i}
              disabled={past || booked}
              onClick={() => onPick(iso)}
              className={`relative aspect-square rounded-lg text-[12px] transition ${
                past ? "text-[#243027]/20" :
                booked ? "bg-[#F6F2E9] text-[#243027]/30 line-through" :
                isCheckin || isCheckout ? "bg-[#617457] text-white font-semibold" :
                inR ? "bg-[#617457]/15 text-[#243027]" :
                "hover:bg-[#F6F2E9]"
              }`}
            >
              <span className="block leading-tight">{dayNum}</span>
              {price && !isCheckin && !isCheckout && !inR && (
                <span className="block text-[9px] text-[#B59465]">{price}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
