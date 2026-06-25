import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Waves, ShieldCheck, Clock, Lock, CheckCircle2, Info, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/glamping-sunset.jpg";

const SWISH = "0722254993"; // never shown to guests
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
    document.title = lang === "sv"
      ? "Hyra SUP · Go Glamping Sweden"
      : "Rent a SUP · Go Glamping Sweden";
    return () => { document.head.removeChild(meta); };
  }, [lang]);

  const amount = qty * 100;

  const t = lang === "sv" ? {
    sub: "SUP-uthyrning",
    h1: "Paddla på kanalen",
    intro: "Hyr en SUP ett helt dygn — flytväst ingår. Vi har två stycken, först till kvarn.",
    chooseTitle: "Hur många SUP:ar?",
    one: "1 SUP",
    two: "2 SUP:ar",
    perDay: "/ dygn",
    incl: "Flytväst ingår",
    totalLabel: "Att betala",
    payCta: "Swisha Christoffer",
    revealedTitle: "Koden till hänglåset",
    revealedHint: "Lås upp skåpet vid bryggan. SUP:arna ligger uppblåsta tillsammans med pump och flytvästar. Lås tillbaka när ni är klara — nästa gäst kommer också vilja paddla.",
    waitingTitle: "Koden visas här",
    waitingHint: "Tryck på Swisha Christoffer ovan — koden dyker upp automatiskt.",
    rules: "Bra att veta",
    r1: "Hyrtiden är 24 timmar från upplåsning.",
    r2: "Vuxen ansvarig krävs. Barn paddlar på eget/förälders ansvar.",
    r3: "Flytväst ska bäras på vattnet.",
    r4: "Skölj av SUP:en innan ni lägger tillbaka den.",
    r5: "Skador eller borttappad utrustning ersätts av hyrestagaren.",
    confirm: "Beställning registrerad — koden visas nedan",
  } : {
    sub: "SUP rental",
    h1: "Paddle the canal",
    intro: "Rent a SUP for a full 24 hours — life vest included. Two SUPs, first come first served.",
    chooseTitle: "How many SUPs?",
    one: "1 SUP",
    two: "2 SUPs",
    perDay: "/ 24h",
    incl: "Life vest included",
    totalLabel: "Total",
    payCta: "Swish Christoffer",
    revealedTitle: "Lock code",
    revealedHint: "Unlock the cabinet by the jetty. The SUPs are inflated with pumps and life vests. Lock it back when you're done — the next guest will want to paddle too.",
    waitingTitle: "Your code appears here",
    waitingHint: "Tap Swish Christoffer above — the code reveals automatically.",
    rules: "Good to know",
    r1: "Rental period is 24 hours from unlock.",
    r2: "Adult responsibility required. Children paddle at parent's risk.",
    r3: "Life vest must be worn on the water.",
    r4: "Rinse the SUP before putting it back.",
    r5: "Damage or lost gear is covered by the renter.",
    confirm: "Booked — your code is shown below",
  };

  const handlePay = async () => {
    const msg = encodeURIComponent("SUP");
    const swishUrl = `swish://payment?data=${encodeURIComponent(
      JSON.stringify({ version: 1, payee: { value: SWISH }, amount: { value: amount }, message: { value: "SUP" } })
    )}`;
    const webUrl = `https://app.swish.nu/1/p/sw/?sw=${SWISH}&amt=${amount}&cur=SEK&msg=${msg}&src=qr`;

    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("t") || params.get("token") || undefined;
      supabase.functions.invoke("record-purchase", {
        body: { kind: "sup_rental", quantity: qty, public_token: token },
      }).catch(() => {});
    } catch {}

    setRevealed(true);
    toast.success(t.confirm);

    const start = Date.now();
    window.open(swishUrl, "_self");
    setTimeout(() => {
      if (Date.now() - start < 1600) {
        window.open(webUrl, "_blank", "noopener,noreferrer");
      }
    }, 800);
    setTimeout(() => {
      document.getElementById("lock-code-block")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Hero */}
      <div className="relative h-[280px] sm:h-[340px] overflow-hidden">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-[hsl(var(--background))]" />
        <div className="relative z-10 max-w-[560px] mx-auto px-5 pt-6 flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white">
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
        <div className="relative z-10 max-w-[560px] mx-auto px-5 mt-10 sm:mt-14">
          <h1 className="font-serif text-white text-4xl sm:text-5xl leading-[1.05] drop-shadow-sm">{t.h1}</h1>
          <p className="text-white/90 mt-2 text-sm max-w-sm">{t.intro}</p>
        </div>
      </div>

      <main className="max-w-[560px] mx-auto px-5 -mt-6 relative z-10 space-y-4 pb-12">
        {/* Quantity selector */}
        <Card className="rounded-3xl shadow-xl border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> {t.chooseTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {[1, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => { setQty(n as 1 | 2); setRevealed(false); }}
                  className={`rounded-2xl border-2 p-4 text-left transition-all ${qty === n ? "border-primary bg-primary/5 shadow-sm" : "border-border/70 hover:border-primary/40"}`}
                >
                  <div className="font-semibold text-foreground text-base">{n === 1 ? t.one : t.two}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n * 100} kr {t.perDay}</div>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> {t.incl}</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> 24h</span>
            </div>
          </CardContent>
        </Card>

        {/* Pay */}
        <Card className="rounded-3xl border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">{t.totalLabel}</span>
              <span className="font-serif text-4xl text-foreground">{amount} kr</span>
            </div>
            <button
              onClick={handlePay}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99] transition-all py-4 text-base font-semibold shadow-md"
            >
              {t.payCta}
            </button>
          </CardContent>
        </Card>

        {/* Lock code */}
        <Card id="lock-code-block" className={`rounded-3xl transition-all ${revealed ? "ring-2 ring-primary shadow-xl" : "opacity-90"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" /> {revealed ? t.revealedTitle : t.waitingTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {revealed ? (
              <>
                <div className="rounded-2xl border-2 border-primary bg-primary/5 p-5 text-center">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{t.revealedTitle}</div>
                  <div className="font-mono text-6xl tracking-[0.4em] text-foreground mt-2">{LOCK_CODE}</div>
                </div>
                <div className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{t.revealedHint}</span>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center">
                <div className="font-mono text-5xl tracking-[0.4em] text-muted-foreground/40">– – – –</div>
                <p className="text-xs text-muted-foreground mt-3">{t.waitingHint}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rules */}
        <Card className="rounded-3xl border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" /> {t.rules}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-sm text-foreground/85">
              {[t.r1, t.r2, t.r3, t.r4, t.r5].map((r, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground pt-2">Go Glamping Sweden · Bergs Slussar</p>
      </main>
    </div>
  );
}
