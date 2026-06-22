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
    addLabel: "Lägg till",
    selectedLabel: "✓ Vald",
    currency: "kr",
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
    intro: "Pick what you'd like. We'll email you a secure payment link so you can pay by card from anywhere.",
    already: "You've already ordered:",
    pcs: (n: number) => `${n}×`,
    perPerson: "SEK/person",
    perStay: "SEK",
    total: "Total",
    submit: "Send request",
    sending: "Sending…",
    success: "Thank you! We've received your request.",
    error: "Something went wrong. Please try again shortly.",
    pending: "Awaiting payment",
    confirmed: "Confirmed",
    paid: "Paid",
    addLabel: "Add",
    selectedLabel: "✓ Selected",
    currency: "SEK",
    payTitle: "Payment instructions on the way",
    payIntro: "We'll email you a secure payment link within a few hours so you can pay by card. Your request is reserved until then.",
    payAmountLabel: "Amount",
    payRefLabel: "Reference",
    payContact: "Questions? Email info@auroramedia.se",
    copy: "Copy",
    copied: "Copied!",
  },
  de: {
    loading: "Lade deinen Aufenthalt…",
    notFound: "Kein Aufenthalt für diesen Link gefunden.",
    welcome: (n: string) => `Hallo ${n}! 🌿`,
    welcomeNoName: "Willkommen! 🌿",
    stayInfo: "Dein Aufenthalt",
    nights: (n: number) => `${n} ${n === 1 ? "Nacht" : "Nächte"}`,
    tooLate: "Leider ist es zu spät, Extras hinzuzufügen — Bestellungen schließen zwei Tage vor Check-in.",
    addons: "Extras hinzufügen",
    intro: "Wähle aus, was du möchtest. Wir senden dir per E-Mail einen sicheren Zahlungslink, mit dem du bequem mit Karte bezahlen kannst.",
    already: "Bereits bestellt:",
    pcs: (n: number) => `${n}×`,
    perPerson: "SEK/Person",
    perStay: "SEK",
    total: "Summe",
    submit: "Anfrage senden",
    sending: "Sende…",
    success: "Danke! Wir haben deine Anfrage erhalten.",
    error: "Etwas ist schiefgelaufen. Bitte versuche es gleich erneut.",
    pending: "Wartet auf Zahlung",
    confirmed: "Bestätigt",
    paid: "Bezahlt",
    addLabel: "Hinzufügen",
    selectedLabel: "✓ Gewählt",
    currency: "SEK",
    payTitle: "Zahlungsanweisungen folgen",
    payIntro: "Du erhältst innerhalb weniger Stunden einen sicheren Zahlungslink per E-Mail, mit dem du mit Karte bezahlen kannst. Deine Anfrage ist bis dahin reserviert.",
    payAmountLabel: "Betrag",
    payRefLabel: "Referenz",
    payContact: "Fragen? info@auroramedia.se",
    copy: "Kopieren",
    copied: "Kopiert!",
  },
  da: {
    loading: "Indlæser dit ophold…",
    notFound: "Vi kunne ikke finde et ophold til dette link.",
    welcome: (n: string) => `Hej ${n}! 🌿`,
    welcomeNoName: "Velkommen! 🌿",
    stayInfo: "Dit ophold",
    nights: (n: number) => `${n} ${n === 1 ? "nat" : "nætter"}`,
    tooLate: "Desværre er det for sent at tilføje ekstra — bestillinger lukker to dage før ankomst.",
    addons: "Tilføj ekstra",
    intro: "Vælg hvad du vil have. Vi sender dig et sikkert betalingslink på mail, så du kan betale med kort.",
    already: "Allerede bestilt:",
    pcs: (n: number) => `${n}×`,
    perPerson: "SEK/person",
    perStay: "SEK",
    total: "Total",
    submit: "Send ønske",
    sending: "Sender…",
    success: "Tak! Vi har modtaget dit ønske.",
    error: "Noget gik galt. Prøv igen om lidt.",
    pending: "Afventer betaling",
    confirmed: "Bekræftet",
    paid: "Betalt",
    addLabel: "Tilføj",
    selectedLabel: "✓ Valgt",
    currency: "SEK",
    payTitle: "Betalingsinstruktioner er på vej",
    payIntro: "Du får et sikkert betalingslink på mail inden for få timer, så du kan betale med kort. Din bestilling er reserveret indtil da.",
    payAmountLabel: "Beløb",
    payRefLabel: "Reference",
    payContact: "Spørgsmål? info@auroramedia.se",
    copy: "Kopiér",
    copied: "Kopieret!",
  },
  no: {
    loading: "Laster oppholdet ditt…",
    notFound: "Fant ingen reservasjon for denne lenken.",
    welcome: (n: string) => `Hei ${n}! 🌿`,
    welcomeNoName: "Velkommen! 🌿",
    stayInfo: "Ditt opphold",
    nights: (n: number) => `${n} ${n === 1 ? "natt" : "netter"}`,
    tooLate: "Beklager, det er for sent å legge til tillegg — bestillinger lukkes to dager før ankomst.",
    addons: "Legg til tillegg",
    intro: "Velg det du vil ha. Vi sender en sikker betalingslenke på e-post slik at du kan betale med kort.",
    already: "Allerede bestilt:",
    pcs: (n: number) => `${n}×`,
    perPerson: "SEK/person",
    perStay: "SEK",
    total: "Total",
    submit: "Send ønske",
    sending: "Sender…",
    success: "Takk! Vi har mottatt ønsket ditt.",
    error: "Noe gikk galt. Prøv igjen om litt.",
    pending: "Venter på betaling",
    confirmed: "Bekreftet",
    paid: "Betalt",
    addLabel: "Legg til",
    selectedLabel: "✓ Valgt",
    currency: "SEK",
    payTitle: "Betalingsinstruksjoner på vei",
    payIntro: "Du får en sikker betalingslenke på e-post innen få timer slik at du kan betale med kort. Bestillingen er reservert til da.",
    payAmountLabel: "Beløp",
    payRefLabel: "Referanse",
    payContact: "Spørsmål? info@auroramedia.se",
    copy: "Kopier",
    copied: "Kopiert!",
  },
  nl: {
    loading: "Verblijf wordt geladen…",
    notFound: "We konden geen verblijf vinden voor deze link.",
    welcome: (n: string) => `Hallo ${n}! 🌿`,
    welcomeNoName: "Welkom! 🌿",
    stayInfo: "Jouw verblijf",
    nights: (n: number) => `${n} ${n === 1 ? "nacht" : "nachten"}`,
    tooLate: "Helaas is het te laat om extra's toe te voegen — bestellingen sluiten twee dagen voor aankomst.",
    addons: "Extra's toevoegen",
    intro: "Kies wat je wilt. We sturen je per e-mail een veilige betaallink waarmee je met kaart kunt betalen.",
    already: "Al besteld:",
    pcs: (n: number) => `${n}×`,
    perPerson: "SEK/persoon",
    perStay: "SEK",
    total: "Totaal",
    submit: "Verzoek versturen",
    sending: "Bezig…",
    success: "Bedankt! We hebben je verzoek ontvangen.",
    error: "Er ging iets mis. Probeer het zo opnieuw.",
    pending: "Wacht op betaling",
    confirmed: "Bevestigd",
    paid: "Betaald",
    addLabel: "Toevoegen",
    selectedLabel: "✓ Gekozen",
    currency: "SEK",
    payTitle: "Betaalinstructies onderweg",
    payIntro: "Je ontvangt binnen enkele uren een veilige betaallink per e-mail om met kaart te betalen. Je verzoek blijft tot dan gereserveerd.",
    payAmountLabel: "Bedrag",
    payRefLabel: "Referentie",
    payContact: "Vragen? info@auroramedia.se",
    copy: "Kopiëren",
    copied: "Gekopieerd!",
  },
  fr: {
    loading: "Chargement de votre séjour…",
    notFound: "Aucun séjour trouvé pour ce lien.",
    welcome: (n: string) => `Bonjour ${n} ! 🌿`,
    welcomeNoName: "Bienvenue ! 🌿",
    stayInfo: "Votre séjour",
    nights: (n: number) => `${n} ${n === 1 ? "nuit" : "nuits"}`,
    tooLate: "Désolé, il est trop tard pour ajouter des options — les commandes ferment deux jours avant l'arrivée.",
    addons: "Ajouter des options",
    intro: "Choisissez ce que vous souhaitez. Nous vous enverrons par e-mail un lien de paiement sécurisé pour payer par carte.",
    already: "Déjà commandé :",
    pcs: (n: number) => `${n}×`,
    perPerson: "SEK/pers.",
    perStay: "SEK",
    total: "Total",
    submit: "Envoyer la demande",
    sending: "Envoi…",
    success: "Merci ! Nous avons reçu votre demande.",
    error: "Une erreur est survenue. Réessayez dans un instant.",
    pending: "En attente de paiement",
    confirmed: "Confirmé",
    paid: "Payé",
    addLabel: "Ajouter",
    selectedLabel: "✓ Choisi",
    currency: "SEK",
    payTitle: "Instructions de paiement en route",
    payIntro: "Vous recevrez sous quelques heures un lien de paiement sécurisé par e-mail pour régler par carte. Votre demande est réservée d'ici là.",
    payAmountLabel: "Montant",
    payRefLabel: "Référence",
    payContact: "Questions ? info@auroramedia.se",
    copy: "Copier",
    copied: "Copié !",
  },
} as const;

type LangKey = keyof typeof COPY;
function pickLang(raw: string | null | undefined): LangKey {
  const l = (raw ?? "").toLowerCase().slice(0, 2);
  if (l in COPY) return l as LangKey;
  if (l === "nb" || l === "nn") return "no";
  return "en";
}

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
  const [paidTotal, setPaidTotal] = useState<number>(0);

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
      setPaidTotal(total);
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
            <div className="font-medium text-base">{({sjobris:'Sjöbrisretreatet',naturkarnan:'Naturkärnan',lugnetsyta:'Lugnets Yta'} as Record<string,string>)[data.booking.tent_id] || data.booking.tent_name}</div>
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
          <SwishCard
            t={t}
            amount={paidTotal}
            reference={data.booking.booking_number || data.booking.public_token.slice(0, 8).toUpperCase()}
            swishNumber={data.settings?.swish_number || "1230628289"}
            payee={data.settings?.swish_payee || "Aurora Media AB"}
          />
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

function SwishCard({
  t, amount, reference, swishNumber, payee,
}: {
  t: any; amount: number; reference: string; swishNumber: string; payee: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (val: string, key: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopied(key);
      toast.success(t.swishCopied);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch { /* noop */ }
  };
  // Swish deep link (mobile opens the app, desktop ignores)
  const swishUrl = `https://app.swish.nu/1/p/sw/?sw=${swishNumber}&amt=${amount}&cur=SEK&msg=${encodeURIComponent(reference)}&src=qr`;

  const Row = ({ label, value, copyKey }: { label: string; value: string; copyKey: string }) => (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-medium text-base">{value}</div>
      </div>
      <Button size="sm" variant="ghost" onClick={() => copy(value, copyKey)} className="shrink-0">
        {copied === copyKey ? "✓" : t.copy}
      </Button>
    </div>
  );

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-primary shrink-0" />
          <div>
            <h2 className="font-serif text-xl text-primary">{t.success}</h2>
            <p className="text-sm text-muted-foreground">{t.swishIntro}</p>
          </div>
        </div>

        <div className="rounded-lg bg-background border p-3">
          <Row label={t.swishNumber} value={swishNumber} copyKey="num" />
          <Row label={t.swishPayee} value={payee} copyKey="payee" />
          <Row label={t.swishAmount} value={`${amount} kr`} copyKey="amt" />
          <Row label={t.swishRef} value={reference} copyKey="ref" />
        </div>

        <a href={swishUrl} className="block">
          <Button className="w-full" size="lg">{t.swishOpen}</Button>
        </a>
      </CardContent>
    </Card>
  );
}
