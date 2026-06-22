import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, CheckCircle2, Coffee, Cookie, Clock } from "lucide-react";
import { toast } from "sonner";

interface Addon {
  id: string; slug: string;
  name_sv: string; name_en: string;
  description_sv: string; description_en: string;
  price_sek: number; unit: string; max_quantity: number; sort_order: number;
}
interface BookingInfo {
  id: string; public_token: string;
  guest_first_name: string | null;
  tent_id: string; tent_name: string;
  checkin_date: string; checkout_date: string;
  nights: number; language: string;
}
interface Order { id: string; addon_id: string; quantity: number; total_sek: number; status: string }
interface StayData {
  booking: BookingInfo & { booking_number?: string };
  addons: Addon[];
  orders: Order[];
  settings: { order_cutoff_days?: number; swish_number?: string; swish_payee?: string };
}

const COPY = {
  sv: {
    loading: "Laddar din vistelse…",
    notFound: "Hittade ingen vistelse för den här länken.",
    welcome: (n: string) => `Hej ${n}! 🌿`,
    welcomeNoName: "Välkommen! 🌿",
    stayInfo: "Din vistelse",
    nights: (n: number) => `${n} ${n === 1 ? "natt" : "nätter"}`,
    tooLate: "Tyvärr är det för sent att lägga till tillval inför den här vistelsen — beställning stänger två dygn före incheckning. Hör av dig till oss om något är akut!",
    addons: "Lägg till tillval",
    intro: "Pricka i vad du vill, så får du betalningsinstruktioner direkt. Vi tar Swish till vårt företagsnummer.",
    already: "Du har redan beställt:",
    pcs: (n: number) => `${n} st`,
    perPerson: "kr/person",
    perStay: "kr",
    total: "Summa",
    submit: "Skicka önskemål",
    sending: "Skickar…",
    success: "Tack! Vi har tagit emot ditt önskemål.",
    error: "Något gick fel. Försök igen om en stund.",
    pending: "Avvaktar betalning",
    confirmed: "Bekräftad",
    paid: "Betald",
    swishTitle: "Betala med Swish",
    swishIntro: "Swisha summan nedan så bekräftar vi din beställning så snart vi ser betalningen.",
    swishNumber: "Swish-nummer",
    swishPayee: "Mottagare",
    swishAmount: "Belopp",
    swishRef: "Meddelande / referens",
    swishOpen: "Öppna Swish-appen",
    swishCopied: "Kopierat!",
    copy: "Kopiera",
  },
  en: {
    loading: "Loading your stay…",
    notFound: "We couldn't find a stay for this link.",
    welcome: (n: string) => `Hi ${n}! 🌿`,
    welcomeNoName: "Welcome! 🌿",
    stayInfo: "Your stay",
    nights: (n: number) => `${n} ${n === 1 ? "night" : "nights"}`,
    tooLate: "Sorry, it's too late to add extras for this stay — orders close two days before check-in. Reach out if it's urgent!",
    addons: "Add extras",
    intro: "Pick what you'd like and we'll email you an invoice. We handle payment manually so Swish and cards both work.",
    already: "You've already ordered:",
    pcs: (n: number) => `${n}×`,
    perPerson: "SEK/person",
    perStay: "SEK",
    total: "Total",
    submit: "Send request",
    sending: "Sending…",
    success: "Thank you! We've received your request.",
    error: "Something went wrong. Please try again shortly.",
    pending: "Pending",
    confirmed: "Confirmed",
    paid: "Confirmed",
  },
} as const;

function iconFor(slug: string) {
  if (slug === "breakfast") return <Coffee className="h-5 w-5" />;
  if (slug === "fika_bag") return <Cookie className="h-5 w-5" />;
  if (slug === "early_checkin") return <Clock className="h-5 w-5" />;
  return null;
}

export default function Stay() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<StayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    (async () => {
      const { data: rpc, error } = await (supabase as any).rpc("get_stay_by_token", { p_token: token });
      if (error) console.error(error);
      setData(rpc as StayData | null);
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <Centered>{COPY.sv.loading}</Centered>;
  if (!data || !data.booking) return <Centered>{COPY.sv.notFound}</Centered>;

  const lang: "sv" | "en" = data.booking.language?.toLowerCase().startsWith("sv") ? "sv" : "en";
  const t = COPY[lang];
  const cutoff = data.settings?.order_cutoff_days ?? 2;
  const todayMs = new Date(new Date().toISOString().slice(0, 10)).getTime();
  const checkinMs = new Date(data.booking.checkin_date).getTime();
  const daysLeft = Math.floor((checkinMs - todayMs) / 86400000);
  const tooLate = daysLeft < cutoff;

  const firstName = data.booking.guest_first_name;
  const dateLocale = lang === "sv" ? "sv-SE" : "en-GB";
  const ci = new Date(data.booking.checkin_date).toLocaleDateString(dateLocale, { weekday: "short", day: "numeric", month: "short" });
  const co = new Date(data.booking.checkout_date).toLocaleDateString(dateLocale, { weekday: "short", day: "numeric", month: "short" });

  const setQ = (id: string, n: number, max: number) => {
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(max, n)) }));
  };

  const total = data.addons.reduce((sum, a) => sum + (qty[a.id] ?? 0) * a.price_sek, 0);
  const itemCount = Object.values(qty).reduce((s, n) => s + n, 0);

  const submit = async () => {
    const items = data.addons
      .filter((a) => (qty[a.id] ?? 0) > 0)
      .map((a) => ({ addon_id: a.id, quantity: qty[a.id] }));
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const { data: res, error } = await (supabase as any).functions.invoke("submit-addon-request", {
        body: { public_token: token, items },
      });
      if (error || (res as any)?.error) throw new Error((res as any)?.error ?? error?.message);
      setDone(true);
      toast.success(t.success);
    } catch (err: any) {
      toast.error(err?.message ?? t.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="font-serif text-2xl md:text-3xl text-primary">
            {firstName ? t.welcome(firstName) : t.welcomeNoName}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg">{t.stayInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-medium text-base">{data.booking.tent_name}</div>
            <div className="text-muted-foreground">
              {ci} → {co} · {t.nights(data.booking.nights ?? 1)}
            </div>
          </CardContent>
        </Card>

        {data.orders.length > 0 && (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                {t.already}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {data.orders.map((o) => {
                const a = data.addons.find((x) => x.id === o.addon_id);
                if (!a) return null;
                return (
                  <div key={o.id} className="flex justify-between">
                    <span>{o.quantity}× {lang === "sv" ? a.name_sv : a.name_en}</span>
                    <Badge variant="secondary">{o.status === "confirmed" || o.status === "paid" ? t.confirmed : t.pending}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {done ? (
          <Card className="border-primary/50 bg-primary/10">
            <CardContent className="p-6 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
              <p className="font-serif text-xl">{t.success}</p>
            </CardContent>
          </Card>
        ) : tooLate ? (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-5 text-sm">{t.tooLate}</CardContent>
          </Card>
        ) : (
          <>
            <div>
              <h2 className="font-serif text-xl text-primary mb-1">{t.addons}</h2>
              <p className="text-sm text-muted-foreground">{t.intro}</p>
            </div>

            <div className="space-y-3">
              {data.addons.map((a) => {
                const q = qty[a.id] ?? 0;
                const name = lang === "sv" ? a.name_sv : a.name_en;
                const desc = lang === "sv" ? a.description_sv : a.description_en;
                const priceLabel = a.unit === "per_quantity" ? t.perPerson : t.perStay;
                return (
                  <Card key={a.id} className={q > 0 ? "border-primary/50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2.5 text-primary shrink-0">{iconFor(a.slug)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2 mb-1">
                            <h3 className="font-serif text-lg">{name}</h3>
                            <div className="text-sm font-semibold text-primary whitespace-nowrap">
                              {a.price_sek} {priceLabel}
                            </div>
                          </div>
                          {desc && <p className="text-xs text-muted-foreground mb-3">{desc}</p>}
                          {a.unit === "per_quantity" ? (
                            <div className="flex items-center gap-3">
                              <Button size="icon" variant="outline" onClick={() => setQ(a.id, q - 1, a.max_quantity)} disabled={q === 0} aria-label="–"><Minus className="h-4 w-4" /></Button>
                              <span className="font-medium text-lg w-8 text-center">{q}</span>
                              <Button size="icon" variant="outline" onClick={() => setQ(a.id, q + 1, a.max_quantity)} disabled={q >= a.max_quantity} aria-label="+"><Plus className="h-4 w-4" /></Button>
                              {q > 0 && <span className="text-sm text-muted-foreground ml-auto">{q * a.price_sek} {lang === "sv" ? "kr" : "SEK"}</span>}
                            </div>
                          ) : (
                            <Button
                              variant={q > 0 ? "default" : "outline"}
                              size="sm"
                              onClick={() => setQ(a.id, q > 0 ? 0 : 1, 1)}
                            >
                              {q > 0 ? (lang === "sv" ? "✓ Vald" : "✓ Selected") : (lang === "sv" ? "Lägg till" : "Add")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {itemCount > 0 && (
              <Card className="sticky bottom-4 border-primary shadow-lg">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{t.total}</div>
                    <div className="font-serif text-2xl text-primary">{total} {lang === "sv" ? "kr" : "SEK"}</div>
                  </div>
                  <Button size="lg" onClick={submit} disabled={submitting}>
                    {submitting ? t.sending : t.submit}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="text-center text-xs text-muted-foreground pt-6">
          <Link to="/" className="underline">goglampingsweden.se</Link>
        </div>
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex items-center justify-center p-6 text-center text-muted-foreground">{children}</div>;
}
