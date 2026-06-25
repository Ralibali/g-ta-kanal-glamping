import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Waves, ShieldCheck, Clock, Lock, CheckCircle2, Zap, MapPin, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ChatWidget from "@/components/ChatWidget";
import heroImg from "@/assets/sup-canal.jpg";

const SWISH = "0722254993";
const LOCK_CODE = "1234";

type Lang = "sv" | "en";

export default function Sup() {
  const [lang, setLang] = useState<Lang>("sv");
  const [qty, setQty] = useState<1 | 2>(1);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    document.title = lang === "sv" ? "SUPa på kanalen · Go Glamping Sweden" : "Paddle the canal · Go Glamping Sweden";
    return () => { document.head.removeChild(meta); };
  }, [lang]);

  const amount = qty * 100;

  const t = lang === "sv" ? {
    sub: "SUP · Bergs Slussar",
    h1: "SUPa på kanalen",
    intro: "Glid ut på Göta kanal. Ett helt dygn på vattnet — flytväst ingår.",
    badge1: "Endast två SUP:ar",
    badge2: "Koden visas direkt",
    badge3: "Betala med Swish",
    choose: "Välj antal",
    one: "1 SUP",
    two: "2 SUP:ar",
    perOne: "100 kr / dygn",
    perTwo: "200 kr / dygn",
    popular: "Vanligast",
    incl1: "Flytväst",
    incl2: "Paddel ingår",
    incl3: "24 timmar",
    payCta: "Swisha",
    paySub: "Koden visas direkt efteråt",
    paid: "Betalt — koden är upplåst",
    waitTitle: "Koden låses upp efter betalning",
    waitHint: "Tryck på Swisha ovan så öppnas Swish och koden visas här.",
    codeLabel: "Kod till hänglåset",
    codeHint: "Skåpet står vid bryggan. Lås tillbaka när ni paddlat klart — nästa gäst vill också SUPa.",
    rulesTitle: "Bra att veta innan ni paddlar",
    r1: "Hyrtiden är 24 timmar från upplåsning.",
    r2: "Flytväst ska bäras på vattnet — alltid.",
    r3: "Vuxen ansvarig. Barn paddlar på förälders ansvar.",
    r4: "Skölj av SUP:en innan ni låser tillbaka den.",
    r5: "Skador eller borttappad utrustning ersätts av hyrestagaren.",
    safety: "Paddla aldrig ensam i sluss eller nära slussportar.",
  } : {
    sub: "SUP · Bergs Slussar",
    h1: "Paddle the canal",
    intro: "Glide out onto Göta Kanal. A full 24 hours on the water — life vest included.",
    badge1: "Only two SUPs",
    badge2: "Instant unlock code",
    badge3: "Pay with Swish",
    choose: "Choose how many",
    one: "1 SUP",
    two: "2 SUPs",
    perOne: "100 kr / 24h",
    perTwo: "200 kr / 24h",
    popular: "Most popular",
    incl1: "Life vest",
    incl2: "Paddle included",
    incl3: "24 hours",
    payCta: "Swish",
    paySub: "Code reveals right after",
    paid: "Paid — code unlocked",
    waitTitle: "Code unlocks after payment",
    waitHint: "Tap Swish above — Swish opens and the code appears here.",
    codeLabel: "Lock code",
    codeHint: "The cabinet is by the jetty. Lock it back when you're done — the next guest wants to SUP too.",
    rulesTitle: "Good to know before you paddle",
    r1: "Rental period is 24 hours from unlock.",
    r2: "Life vest must be worn on the water — always.",
    r3: "Adult responsibility. Children paddle at parent's risk.",
    r4: "Rinse the SUP before locking it back.",
    r5: "Damage or lost gear is covered by the renter.",
    safety: "Never paddle alone inside or near the lock gates.",
  };

  const handlePay = async () => {
    const msg = encodeURIComponent("SUP");
    const webUrl = `https://app.swish.nu/1/p/sw/?sw=${SWISH}&amt=${amount}&cur=SEK&msg=${msg}&src=qr`;

    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("t") || params.get("token") || undefined;
      supabase.functions.invoke("record-purchase", {
        body: { kind: "sup_rental", quantity: qty, public_token: token },
      }).catch(() => {});
    } catch {}

    setRevealed(true);
    toast.success(t.paid);
    window.open(webUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => {
      document.getElementById("lock-code-block")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] pb-28">
      {/* Hero */}
      <header className="relative h-[58vh] min-h-[420px] max-h-[560px] overflow-hidden">
        <img src={heroImg} alt="" width={1536} height={1024} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[hsl(var(--background))]" />

        <div className="relative z-10 max-w-[600px] mx-auto px-5 pt-5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white">
            <Waves className="h-3 w-3" /> {t.sub}
          </span>
          <div className="flex gap-1">
            {(["sv", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`text-[11px] px-2.5 py-1 rounded-full border backdrop-blur-md transition-colors ${lang === l ? "bg-white/25 border-white/50 text-white" : "border-white/25 text-white/80 hover:bg-white/10"}`}
              >{l.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 max-w-[600px] mx-auto px-5 pb-8">
          <h1 className="font-serif text-white text-[2.6rem] sm:text-6xl leading-[1.02] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
            {t.h1}
          </h1>
          <p className="text-white/95 mt-3 text-[15px] sm:text-base max-w-[420px] leading-relaxed">{t.intro}</p>

          <div className="mt-5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-2.5 py-1 text-[11px] text-white">
              <AlertTriangle className="h-3 w-3" /> {t.badge1}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-2.5 py-1 text-[11px] text-white">
              <Zap className="h-3 w-3" /> {t.badge2}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-5 -mt-10 relative z-10 space-y-4">
        {/* Quantity */}
        <section className="rounded-3xl bg-card border border-border/60 shadow-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg text-foreground">{t.choose}</h2>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">2 / 2</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {([1, 2] as const).map((n) => {
              const active = qty === n;
              return (
                <button
                  key={n}
                  onClick={() => { setQty(n); setRevealed(false); }}
                  className={`relative rounded-2xl border-2 p-4 text-left transition-all ${active ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:border-primary/40"}`}
                >
                  {n === 2 && (
                    <span className="absolute -top-2 right-3 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-[9px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full font-semibold">{t.popular}</span>
                  )}
                  <div className="flex items-center gap-1.5 mb-1">
                    {Array.from({ length: n }).map((_, i) => (
                      <Waves key={i} className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <div className="font-semibold text-foreground text-[15px]">{n === 1 ? t.one : t.two}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n === 1 ? t.perOne : t.perTwo}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> {t.incl1}</div>
            <div className="flex items-center gap-1.5"><Waves className="h-3.5 w-3.5 text-primary" /> {t.incl2}</div>
            <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> {t.incl3}</div>
          </div>
        </section>

        {/* Lock code */}
        <section id="lock-code-block" className={`rounded-3xl border bg-card p-5 transition-all ${revealed ? "border-primary shadow-xl" : "border-border/60"}`}>
          <div className="flex items-center gap-2 mb-3">
            <Lock className={`h-4 w-4 ${revealed ? "text-primary" : "text-muted-foreground"}`} />
            <h2 className="font-serif text-lg text-foreground">{revealed ? t.codeLabel : t.waitTitle}</h2>
          </div>

          {revealed ? (
            <>
              <div className="relative rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 text-center overflow-hidden">
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">
                    <CheckCircle2 className="h-3 w-3" /> {t.paid}
                  </span>
                </div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">{t.codeLabel}</div>
                <div className="font-mono text-[4.5rem] sm:text-7xl tracking-[0.35em] text-foreground font-light leading-none">{LOCK_CODE}</div>
              </div>
              <p className="text-xs text-foreground/75 leading-relaxed mt-3 flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>{t.codeHint}</span>
              </p>
            </>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center">
              <div className="font-mono text-5xl tracking-[0.4em] text-muted-foreground/35">– – – –</div>
              <p className="text-xs text-muted-foreground mt-3">{t.waitHint}</p>
            </div>
          )}
        </section>

        {/* Rules */}
        <section className="rounded-3xl border border-border/60 bg-card p-5">
          <h2 className="font-serif text-lg text-foreground mb-3">{t.rulesTitle}</h2>
          <ul className="space-y-2.5 text-sm text-foreground/85">
            {[t.r1, t.r2, t.r3, t.r4, t.r5].map((r, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="leading-snug">{r}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/30 p-3 text-xs text-foreground/85">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--accent))] shrink-0 mt-0.5" />
            <span className="leading-snug">{t.safety}</span>
          </div>
        </section>

        <p className="text-center text-[11px] text-muted-foreground pt-2">Go Glamping Sweden · Bergs Slussar</p>
      </main>

      {/* Sticky pay bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-[hsl(var(--background))]/95 backdrop-blur-lg border-t border-border/60 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)]">
        <div className="max-w-[600px] mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="font-serif text-2xl text-foreground leading-none">{amount} kr</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">{qty === 1 ? t.one : t.two} · {t.incl3}</div>
          </div>
          <button
            onClick={handlePay}
            className="flex-1 inline-flex flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99] transition-all py-3 font-semibold shadow-md"
          >
            <span className="text-base leading-tight">{t.payCta} {amount} kr</span>
            <span className="text-[10px] font-normal opacity-80 mt-0.5">{t.paySub}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
