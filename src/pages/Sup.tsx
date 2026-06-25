import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Waves, ShieldCheck, Clock, Lock, CheckCircle2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
    h1: "Hyr SUP på kanalen",
    intro: "Paddla på Göta kanal ett helt dygn. Flytväst ingår. Vi har två SUP:ar — först till kvarn.",
    chooseTitle: "Hur många SUP:ar?",
    one: "1 SUP",
    two: "2 SUP:ar",
    perDay: "/ dygn",
    incl: "Flytväst ingår",
    totalLabel: "Att swisha",
    payCta: `Swisha ${amount} kr`,
    payHint: `Swish-appen öppnas med ${amount} kr förifyllt. När du betalat dyker koden upp automatiskt här nedanför.`,
    afterPaid: "Tryck Swisha först – sedan visas koden",
    revealCta: "Jag har redan swishat – visa koden",
    revealedTitle: "Koden till hänglåset",
    revealedHint: "Lås upp skåpet vid bryggan. SUP:arna ligger uppblåsta tillsammans med pump och flytvästar. Lås tillbaka när ni är klara — nästa gäst kommer också vilja paddla.",
    rules: "Bra att veta",
    r1: "Hyrtiden är 24 timmar från upplåsning.",
    r2: "Vuxen ansvarig krävs. Barn paddlar på eget/förälders ansvar.",
    r3: "Flytväst ska bäras på vattnet.",
    r4: "Skölj av SUP:en innan ni lägger tillbaka den.",
    r5: "Skador eller borttappad utrustning ersätts av hyrestagaren.",
  } : {
    sub: "SUP rental",
    h1: "Rent a SUP on the canal",
    intro: "Paddle Göta Canal for a full 24 hours. Life vest included. We have two SUPs — first come, first served.",
    chooseTitle: "How many SUPs?",
    one: "1 SUP",
    two: "2 SUPs",
    perDay: "/ 24h",
    incl: "Life vest included",
    totalLabel: "To Swish",
    payCta: `Swish ${amount} SEK`,
    payHint: `The Swish app opens with ${amount} SEK prefilled. Once paid the lock code appears below automatically.`,
    afterPaid: "Tap Swish first — then the code appears",
    revealCta: "I've already paid — show the code",
    revealedTitle: "Lock code",
    revealedHint: "Unlock the cabinet by the jetty. The SUPs are inflated and stored with pumps and life vests. Lock it back when you're done — the next guest will want to paddle too.",
    rules: "Good to know",
    r1: "Rental period is 24 hours from unlock.",
    r2: "Adult responsibility required. Children paddle at parent's risk.",
    r3: "Life vest must be worn on the water.",
    r4: "Rinse the SUP before putting it back.",
    r5: "Damage or lost gear is covered by the renter.",
  };


  const handlePay = async () => {
    // Try to open Swish app with prefilled payment
    const msg = encodeURIComponent("SUP");
    const swishUrl = `swish://payment?data=${encodeURIComponent(
      JSON.stringify({ version: 1, payee: { value: SWISH }, amount: { value: amount }, message: { value: "SUP" } })
    )}`;
    const webUrl = `https://app.swish.nu/1/p/sw/?sw=${SWISH}&amt=${amount}&cur=SEK&msg=${msg}&src=qr`;

    // Record purchase (owner email + admin order) — fire-and-forget
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("t") || params.get("token") || undefined;
      supabase.functions.invoke("record-purchase", {
        body: { kind: "sup_rental", quantity: qty, public_token: token },
      }).catch(() => {});
    } catch {}

    setRevealed(true);
    toast.success(isSv("Beställning registrerad — visar koden", "Booked — showing your code"));

    const start = Date.now();
    window.open(swishUrl, "_self");
    setTimeout(() => {
      if (Date.now() - start < 1600) {
        window.open(webUrl, "_blank", "noopener,noreferrer");
      }
    }, 800);
    setTimeout(() => {
      document.getElementById("lock-code-block")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  };

  function isSv(sv: string, en: string) { return lang === "sv" ? sv : en; }


  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-[520px] mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">{t.sub}</p>
            <h1 className="font-serif text-2xl leading-tight mt-0.5">{t.h1}</h1>
          </div>
          <div className="flex gap-1">
            {(["sv", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`text-xs px-2 py-0.5 rounded-full border ${lang === l ? "bg-white/20 border-white/40" : "border-white/20 hover:bg-white/10"}`}
              >{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-[520px] mx-auto p-4 space-y-5">
        <p className="text-foreground/85 leading-relaxed text-sm">{t.intro}</p>

        {/* Quantity selector */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Waves className="h-5 w-5 text-primary" /> {t.chooseTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[1, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => { setQty(n as 1 | 2); setRevealed(false); }}
                  className={`rounded-xl border-2 p-3 text-left transition-colors ${qty === n ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                >
                  <div className="font-semibold text-foreground">{n === 1 ? t.one : t.two}</div>
                  <div className="text-xs text-muted-foreground">{n * 100} kr {t.perDay}</div>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> {t.incl}
              <Clock className="h-4 w-4 text-primary ml-2" /> 24h
            </div>
          </CardContent>
        </Card>

        {/* Pay */}
        <Card className="rounded-2xl border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">{t.totalLabel}</span>
              <span className="font-serif text-3xl text-foreground">{amount} kr</span>
            </div>
            <button
              onClick={handlePay}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors py-3 text-sm font-semibold"
            >
              {t.payCta}
            </button>
            <p className="text-xs text-muted-foreground leading-relaxed">{t.payHint}</p>

          </CardContent>
        </Card>

        {/* Reveal code */}
        <Card id="lock-code-block" className={`rounded-2xl ${revealed ? "ring-2 ring-primary" : ""}`}>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> {revealed ? t.revealedTitle : t.afterPaid}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {revealed ? (
              <>
                <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 text-center">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.revealedTitle}</div>
                  <div className="font-mono text-5xl tracking-[0.4em] text-foreground mt-1">{LOCK_CODE}</div>
                </div>
                <div className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{t.revealedHint}</span>
                </div>
              </>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary text-primary hover:bg-primary/5 transition-colors py-3 text-sm font-medium"
              >
                <Lock className="h-4 w-4" /> {t.revealCta}
              </button>
            )}
          </CardContent>
        </Card>

        {/* Rules */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" /> {t.rules}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-foreground/85">
              {[t.r1, t.r2, t.r3, t.r4, t.r5].map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground pt-2 pb-6">Go Glamping Sweden · Bergs Slussar</p>
      </main>
    </div>
  );
}
