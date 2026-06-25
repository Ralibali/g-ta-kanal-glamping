import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, CheckCircle2, Coffee, Cookie, Clock, ShieldCheck, CreditCard, MessageCircle, Bed, Sparkles, Trees, Car, MapPin, Wifi, Key, UtensilsCrossed, ShowerHead, Phone, Info, Dog, Flame, Cigarette, Wheat, Sprout, Leaf, Milk as MilkIcon, Nut } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import addonEarlyCheckinImg from "@/assets/glamping-exterior-deck.jpg";
import heroImg from "@/assets/glamping-sunset.jpg";
import addonBreakfastImg from "@/assets/glamping-interior-cozy.jpg";
import addonFikaImg from "@/assets/glamping-reading.jpg";

// Använder endast riktiga bilder från hemsidan.
const ADDON_IMAGES: Record<string, string> = {
  early_checkin: addonEarlyCheckinImg,
  breakfast: addonBreakfastImg,
  fika_bag: addonFikaImg,
};


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
  tent_ids?: string[] | null;
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
    payContact: "Questions? Email hej@goglampingsweden.se",
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
    payContact: "Fragen? hej@goglampingsweden.se",
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
    payContact: "Spørgsmål? hej@goglampingsweden.se",
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
    payContact: "Spørsmål? hej@goglampingsweden.se",
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
    payContact: "Vragen? hej@goglampingsweden.se",
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
    payContact: "Questions ? hej@goglampingsweden.se",
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

// Detaljerad info per produkt — visas under beskrivningen så gästen vet exakt vad de får.
const ADDON_DETAILS: Record<string, Record<string, { tagline: string; bullets: string[]; note?: string }>> = {
  breakfast: {
    sv: {
      tagline: "Nybakat från Bostället — levereras direkt till ditt tält.",
      bullets: [
        "Färska frallor & croissant från bageriet",
        "Ost, skinka, smör & marmelad",
        "Yoghurt med müsli och säsongens frukt",
        "Termos med kaffe eller te",
        "Färskpressad juice",
      ],
      note: "Levereras till tältet kl 08:30. Pris per person.",
    },
    en: {
      tagline: "Freshly baked from Bostället — delivered to your tent.",
      bullets: [
        "Fresh rolls & croissant from the bakery",
        "Cheese, ham, butter & jam",
        "Yoghurt with muesli and seasonal fruit",
        "Thermos of coffee or tea",
        "Freshly pressed juice",
      ],
      note: "Delivered to your tent at 8:30 AM. Price per person.",
    },
  },
  fika_bag: {
    sv: {
      tagline: "En mysig fikapåse som väntar i tältet vid ankomst.",
      bullets: [
        "Två hembakta kanelbullar",
        "Lokalrostat kaffe & ekologiskt te",
        "En liten chokladbit till kvällen",
        "Servetter och allt du behöver",
      ],
      note: "Står framme i tältet när du checkar in. Perfekt till första kvällen vid kanalen.",
    },
    en: {
      tagline: "A cozy fika bag waiting in the tent on arrival.",
      bullets: [
        "Two home-baked cinnamon buns",
        "Locally roasted coffee & organic tea",
        "A small piece of chocolate for the evening",
        "Napkins and everything you need",
      ],
      note: "Ready in the tent at check-in. Perfect for your first evening by the canal.",
    },
  },
  early_checkin: {
    sv: {
      tagline: "Kom redan kl 12:00 istället för ordinarie 15:00 — tre extra timmar att njuta.",
      bullets: [
        "Incheckning från kl 12:00",
        "Tre extra timmar vid kanalen",
        "Tältet är bäddat och klart när du kommer",
        "Garanterad tillgänglighet (bokningsbart)",
      ],
      note: "Pris per bokning, oavsett antal gäster.",
    },
    en: {
      tagline: "Arrive at 12:00 PM instead of the usual 3:00 PM — three extra hours to enjoy.",
      bullets: [
        "Check-in from 12:00 PM",
        "Three extra hours by the canal",
        "Tent made and ready when you arrive",
        "Guaranteed availability (bookable)",
      ],
      note: "Price per booking, regardless of number of guests.",
    },
  },
};

function getDetails(slug: string, lang: string) {
  const byLang = ADDON_DETAILS[slug];
  if (!byLang) return null;
  return byLang[lang] ?? byLang.en ?? byLang.sv;
}

export default function Stay() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<StayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [dietary, setDietary] = useState<string[]>([]);
  const [dietaryNote, setDietaryNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [paidTotal, setPaidTotal] = useState<number>(0);
  const [extraTents, setExtraTents] = useState<string[]>([]);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    (async () => {
      const { data: rpc, error } = await (supabase as any).rpc("get_stay_by_token", { p_token: token });
      if (error) console.error(error);
      const sd = rpc as StayData | null;
      setData(sd);
      if (sd?.booking?.booking_number) {
        const { data: stays } = await (supabase as any)
          .from("tent_stays")
          .select("tent_id")
          .eq("booking_number", sd.booking.booking_number);
        if (stays) setExtraTents((stays as { tent_id: string }[]).map(s => s.tent_id));
      }
      setLoading(false);
    })();
  }, [token]);


  if (loading) return <Centered>{COPY.sv.loading}</Centered>;
  if (!data || !data.booking) return <Centered>{COPY.sv.notFound}</Centered>;

  const lang: LangKey = pickLang(data.booking.language);
  const t = COPY[lang];
  const isSv = lang === "sv";
  const cutoff = data.settings?.order_cutoff_days ?? 2;
  const todayMs = new Date(new Date().toISOString().slice(0, 10)).getTime();
  const checkinMs = new Date(data.booking.checkin_date).getTime();
  const daysLeft = Math.floor((checkinMs - todayMs) / 86400000);
  const tooLate = daysLeft < cutoff;

  const firstName = data.booking.guest_first_name;
  const dateLocale = ({ sv: "sv-SE", en: "en-GB", de: "de-DE", da: "da-DK", no: "nb-NO", nl: "nl-NL", fr: "fr-FR" } as Record<LangKey, string>)[lang];
  const ci = new Date(data.booking.checkin_date).toLocaleDateString(dateLocale, { weekday: "short", day: "numeric", month: "short" });
  const co = new Date(data.booking.checkout_date).toLocaleDateString(dateLocale, { weekday: "short", day: "numeric", month: "short" });

  const setQ = (id: string, n: number, max: number) => {
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(max, n)) }));
  };

  const total = data.addons.reduce((sum, a) => sum + (qty[a.id] ?? 0) * a.price_sek, 0);
  const itemCount = Object.values(qty).reduce((s, n) => s + n, 0);

  // Vad gästen redan har beställt — styr personlig text, inte bokningsmöjlighet
  const orderedSlugs = new Set<string>(
    (data.orders ?? [])
      .filter((o) => ["requested", "confirmed", "paid"].includes(o.status))
      .map((o) => data.addons.find((a) => a.id === o.addon_id)?.slug)
      .filter((s): s is string => !!s),
  );
  const hasBreakfast = orderedSlugs.has("breakfast");
  const hasFika = orderedSlugs.has("fika_bag");
  const hasEarly = orderedSlugs.has("early_checkin");
  const hasAnyAddon = orderedSlugs.size > 0;

  const scrollToAddons = () => {
    document.getElementById("addons-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = async () => {
    const items = data.addons
      .filter((a) => (qty[a.id] ?? 0) > 0)
      .map((a) => ({ addon_id: a.id, quantity: qty[a.id] }));
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const { data: res, error } = await (supabase as any).functions.invoke("submit-addon-request", {
        body: { public_token: token, items, dietary, dietary_note: dietaryNote.trim() || undefined },
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
        {(() => {
          const TENT_NAMES: Record<string,string> = { sjobris: 'Sjöbrisretreatet', naturkarnan: 'Naturkärnan', lugnetsyta: 'Lugnets Yta' };
          const allTents = Array.from(new Set([data.booking.tent_id, ...extraTents])).filter(Boolean);
          const tentNames = allTents.map(id => TENT_NAMES[id] || id);
          const multi = tentNames.length > 1;
          return (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-lg">{t.stayInfo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {multi ? (
                  <>
                    <div className="font-medium text-base">
                      {isSv ? `Era ${tentNames.length} tält` : `Your ${tentNames.length} tents`}
                    </div>
                    <ul className="space-y-1 pl-1">
                      {tentNames.map(n => (
                        <li key={n} className="flex items-center gap-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>{n}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="font-medium text-base">{tentNames[0] || data.booking.tent_name}</div>
                )}
                <div className="text-muted-foreground">
                  {ci} → {co} · {t.nights(data.booking.nights ?? 1)}
                </div>
                <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-3">
                  <div className="font-medium text-foreground">
                    🔒 {isSv ? "Kod till hänglåset" : "Code for the lock"}: <span className="font-mono text-lg tracking-widest">2018</span>
                  </div>
                  {multi && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {isSv ? "Samma kod till båda tälten." : "Same code for both tents."}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })()}


        {/* Det här väntar er — personlig, varm sammanfattning baserat på beställda tillval */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {isSv ? "Det här väntar er" : "Here's what awaits you"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-foreground/85 leading-relaxed">
              {isSv
                ? "Vad roligt att ni snart kommer till oss vid kanalen! Här är allt ni behöver inför vistelsen."
                : "We're so happy you're coming to stay with us by the canal! Here's everything you need before your visit."}
            </p>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>
                  {hasEarly
                    ? (isSv ? "Tidig incheckning — välkomna redan från kl 12:00 🌅" : "Early check-in — welcome from 12:00 noon 🌅")
                    : (isSv ? "Incheckning från kl 15:00." : "Check-in from 3:00 pm.")}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{isSv ? "Utcheckning senast kl 10:00." : "Check-out by 10:00 am."}</span>
              </li>
              {hasBreakfast && (
                <li className="flex items-start gap-3">
                  <Coffee className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{isSv ? "Frukost levereras till ert tält kl 08:30 varje morgon. ☕" : "Breakfast delivered to your tent at 8:30 every morning. ☕"}</span>
                </li>
              )}
              {hasFika && (
                <li className="flex items-start gap-3">
                  <Cookie className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{isSv ? "En fikapåse står framme i tältet när ni checkar in. 🍪" : "A fika bag will be waiting in your tent at check-in. 🍪"}</span>
                </li>
              )}
            </ul>
            {!hasAnyAddon && (
              <button
                type="button"
                onClick={scrollToAddons}
                className="mt-1 w-full text-left rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors p-3 text-sm text-foreground/90"
              >
                {isSv
                  ? "Vill ni förgylla vistelsen? Lägg till frukost eller fikapåse nedan 👇"
                  : "Want to make your stay even sweeter? Add breakfast or a fika bag below 👇"}
              </button>
            )}
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
                    <span>{o.quantity}× {isSv ? a.name_sv : a.name_en}</span>
                    <Badge variant="secondary">{o.status === "confirmed" || o.status === "paid" ? t.confirmed : t.pending}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {done ? (
          isSv ? (
            <SwishCard
              t={t}
              amount={paidTotal}
              reference={data.booking.booking_number || data.booking.public_token.slice(0, 8).toUpperCase()}
              swishNumber={data.settings?.swish_number || "1230628289"}
              payee={data.settings?.swish_payee || "Aurora Media AB"}
            />
          ) : (
            <PaymentLinkCard
              t={t}
              amount={paidTotal}
              reference={data.booking.booking_number || data.booking.public_token.slice(0, 8).toUpperCase()}
            />
          )
        ) : tooLate ? (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-5 text-sm">{t.tooLate}</CardContent>
          </Card>
        ) : data.addons.filter((a) => !data.orders.some((o) => o.addon_id === a.id && ['requested','confirmed','paid'].includes(o.status))).length === 0 ? null : (
          <>
            <div id="addons-section" className="scroll-mt-4">
              <h2 className="font-serif text-xl text-primary mb-1">{t.addons}</h2>
              <p className="text-sm text-muted-foreground">{t.intro}</p>
            </div>

            {/* Deadline-banner — skapar urgens med riktigt datum */}
            {(() => {
              const deadlineMs = checkinMs - cutoff * 86400000;
              const deadline = new Date(deadlineMs);
              const deadlineLabel = deadline.toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" });
              const daysToDeadline = Math.max(0, Math.ceil((deadlineMs - todayMs) / 86400000));
              const urgent = daysToDeadline <= 2;
              const deadlineCopy: Record<string, { title: string; sub: (d: string) => string; urgent: (n: number) => string }> = {
                sv: { title: "Sista beställningsdag", sub: (d) => `Beställ senast ${d}`, urgent: (n) => n === 0 ? "Sista chansen — beställningen stänger ikväll" : n === 1 ? "Bara 1 dag kvar att beställa" : `Bara ${n} dagar kvar att beställa` },
                en: { title: "Order by", sub: (d) => `Place your order by ${d}`, urgent: (n) => n === 0 ? "Last chance — orders close tonight" : n === 1 ? "Only 1 day left to order" : `Only ${n} days left to order` },
                de: { title: "Bestellschluss", sub: (d) => `Bestelle bis ${d}`, urgent: (n) => n <= 1 ? "Letzte Chance" : `Nur noch ${n} Tage` },
                da: { title: "Bestil senest", sub: (d) => `Bestil senest ${d}`, urgent: (n) => n <= 1 ? "Sidste chance" : `Kun ${n} dage tilbage` },
                no: { title: "Bestill innen", sub: (d) => `Bestill senest ${d}`, urgent: (n) => n <= 1 ? "Siste sjanse" : `Kun ${n} dager igjen` },
                nl: { title: "Bestel uiterlijk", sub: (d) => `Bestel uiterlijk ${d}`, urgent: (n) => n <= 1 ? "Laatste kans" : `Nog ${n} dagen` },
                fr: { title: "Commandez avant", sub: (d) => `Commandez avant le ${d}`, urgent: (n) => n <= 1 ? "Dernière chance" : `Plus que ${n} jours` },
              };
              const dc = deadlineCopy[lang] ?? deadlineCopy.en;
              return (
                <div className={`rounded-lg border p-3 flex items-center gap-3 ${urgent ? "border-amber-500/60 bg-amber-500/10" : "border-primary/30 bg-primary/5"}`}>
                  <Clock className={`h-5 w-5 shrink-0 ${urgent ? "text-amber-700" : "text-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${urgent ? "text-amber-900" : "text-foreground"}`}>
                      {urgent ? dc.urgent(daysToDeadline) : dc.title}
                    </div>
                    <div className="text-xs text-muted-foreground">{dc.sub(deadlineLabel)}</div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-3">
              {data.addons.filter((a) => !data.orders.some((o) => o.addon_id === a.id && ['requested','confirmed','paid'].includes(o.status))).map((a) => {
                const q = qty[a.id] ?? 0;
                const name = isSv ? a.name_sv : a.name_en;
                const desc = isSv ? a.description_sv : a.description_en;
                const priceLabel = a.unit === "per_quantity" ? t.perPerson : t.perStay;
                const addCta: Record<string, string> = {
                  sv: `Lägg till ${name.toLowerCase()} • ${a.price_sek} kr`,
                  en: `Add ${name.toLowerCase()} • ${a.price_sek} SEK`,
                };
                const ctaLabel = addCta[lang as 'sv'|'en'] ?? `+ ${name} • ${a.price_sek} ${t.currency}`;
                return (
                  <Card key={a.id} className={`overflow-hidden ${q > 0 ? "border-primary/50 shadow-sm" : ""}`}>
                    {ADDON_IMAGES[a.slug] && (
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                        <img
                          src={ADDON_IMAGES[a.slug]}
                          alt={name}
                          loading="lazy"
                          width={1536}
                          height={1024}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 rounded-full bg-background/90 backdrop-blur px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                          {a.price_sek} {priceLabel}
                        </div>
                      </div>
                    )}
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
                          {(() => {
                            const details = getDetails(a.slug, lang);
                            if (details) {
                              return (
                                <div className="mb-3 space-y-2">
                                  <p className="text-sm text-foreground/80 leading-relaxed">{details.tagline}</p>
                                  <ul className="space-y-1">
                                    {details.bullets.map((b, i) => (
                                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <span className="text-primary mt-1 shrink-0">•</span>
                                        <span>{b}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  {details.note && (
                                    <p className="text-xs text-muted-foreground italic pt-1">{details.note}</p>
                                  )}
                                </div>
                              );
                            }
                            return desc ? <p className="text-sm text-muted-foreground mb-3">{desc}</p> : null;
                          })()}
                          {a.unit === "per_quantity" ? (
                            <div className="flex items-center gap-3">
                              <Button size="icon" variant="outline" onClick={() => setQ(a.id, q - 1, a.max_quantity)} disabled={q === 0} aria-label="–"><Minus className="h-4 w-4" /></Button>
                              <span className="font-medium text-lg w-8 text-center">{q}</span>
                              <Button size="icon" variant="outline" onClick={() => setQ(a.id, q + 1, a.max_quantity)} disabled={q >= a.max_quantity} aria-label="+"><Plus className="h-4 w-4" /></Button>
                              {q > 0 && <span className="text-sm text-muted-foreground ml-auto font-medium">{q * a.price_sek} {t.currency}</span>}
                            </div>
                          ) : (
                            <Button
                              variant={q > 0 ? "default" : "outline"}
                              size="default"
                              className="w-full sm:w-auto"
                              onClick={() => setQ(a.id, q > 0 ? 0 : 1, 1)}
                            >
                              {q > 0 ? t.selectedLabel : ctaLabel}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Trygghetsrad — minskar friktion innan beslut */}
            <div className="rounded-lg border bg-card/50 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">{isSv ? "Inga förskottsbetalningar" : "No upfront payment"}</div>
                    <div className="text-muted-foreground">{isSv ? "Betala först när vi bekräftat din beställning" : "Pay only after we confirm your order"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">{isSv ? "Snabbt svar" : "Fast response"}</div>
                    <div className="text-muted-foreground">{isSv ? "Vi bekräftar inom några timmar" : "We confirm within a few hours"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">{isSv ? "Säker betalning" : "Secure payment"}</div>
                    <div className="text-muted-foreground">{isSv ? "Swish eller kortlänk" : "Card link by email"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* "Ingår redan" — positionerar tillvalen som extra lyx, inte basbehov */}
            <Card className="bg-muted/40 border-dashed">
              <CardContent className="p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {isSv ? "Detta ingår alltid i din bokning" : "Always included in your booking"}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div className="flex items-start gap-2"><Bed className="h-4 w-4 text-primary/70 mt-0.5 shrink-0" /><span>{isSv ? "Bäddade sängar med sänglinne & handdukar" : "Made beds with linens & towels"}</span></div>
                  <div className="flex items-start gap-2"><Flame className="h-4 w-4 text-primary/70 mt-0.5 shrink-0" /><span>{isSv ? "El, värme & fläkt" : "Electricity, heat & fan"}</span></div>
                  <div className="flex items-start gap-2"><UtensilsCrossed className="h-4 w-4 text-primary/70 mt-0.5 shrink-0" /><span>{isSv ? "Minikylskåp i tältet" : "Mini-fridge in the tent"}</span></div>
                  <div className="flex items-start gap-2"><Coffee className="h-4 w-4 text-primary/70 mt-0.5 shrink-0" /><span>{isSv ? "Kaffe, te & en flaska vatten" : "Coffee, tea & a bottle of water"}</span></div>
                  <div className="flex items-start gap-2"><Sparkles className="h-4 w-4 text-primary/70 mt-0.5 shrink-0" /><span>{isSv ? "Städning vid utcheckning" : "Cleaning at check-out"}</span></div>
                  <div className="flex items-start gap-2"><ShowerHead className="h-4 w-4 text-primary/70 mt-0.5 shrink-0" /><span>{isSv ? "Servicehus: toalett, dusch & skötrum" : "Service house: toilet, shower & changing room"}</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Mer information om ditt besök */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  {isSv ? "Mer information om ditt besök" : "More info about your visit"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <InfoRow icon={<MapPin className="h-4 w-4" />} title={isSv ? "Adress & hitta hit" : "Address & getting here"}>
                  {isSv ? (
                    <>Bergs Slussar, 590 77 Vreta Kloster. Sök på <strong>"Go Glamping Sweden, Bergs Slussar"</strong> i Google Maps eller Waze — du kommer rätt fram till parkeringen.</>
                  ) : (
                    <>Bergs Slussar, 590 77 Vreta Kloster, Sweden. Search <strong>"Go Glamping Sweden, Bergs Slussar"</strong> in Google Maps or Waze — it leads straight to the parking lot.</>
                  )}
                </InfoRow>

                <InfoRow icon={<Car className="h-4 w-4" />} title={isSv ? "Parkering" : "Parking"}>
                  {isSv
                    ? "Gratis parkering finns i direkt anslutning till slussområdet, ca 100 meter från tälten. Sommartid kan det vara fullt mitt på dagen — kom du gärna lite tidigare eller senare på eftermiddagen. Ingen parkering vid själva tälten (det är gångavstånd med era väskor)."
                    : "Free parking is available right by the lock area, about 100 m from the tents. In peak summer the lot can fill up midday — arrive a little earlier or later in the afternoon. No parking next to the tents themselves (short walk with your bags)."}
                </InfoRow>

                <InfoRow icon={<Clock className="h-4 w-4" />} title={isSv ? "Incheckning & utcheckning" : "Check-in & check-out"}>
                  {isSv
                    ? "Incheckning från kl 15:00, utcheckning senast kl 10:00. Sen utcheckning till kl 12:00 kan bokas i mån av plats (400 kr via Swish — meddela oss i förväg). Du checkar in själv — vi mejlar tydliga instruktioner och en kodlås-kod dagen före ankomst."
                    : "Check-in from 3:00 pm, check-out by 10:00 am. Late check-out until 12:00 noon can be booked subject to availability (400 SEK via Swish — let us know in advance). Self check-in — we email clear instructions and a lock code the day before arrival."}
                </InfoRow>

                <InfoRow icon={<ShowerHead className="h-4 w-4" />} title={isSv ? "Servicehus (toalett & dusch)" : "Service house (toilet & shower)"}>
                  {isSv
                    ? "Fräscht servicehus med varma duschar, toaletter och handfat ca 150 meter från tälten. Öppet dygnet runt under hela din vistelse — koden får du i incheckningsmejlet."
                    : "Fresh service house with warm showers, toilets and sinks about 150 m from the tents. Open 24/7 throughout your stay — the code arrives with your check-in email."}
                </InfoRow>

                <InfoRow icon={<UtensilsCrossed className="h-4 w-4" />} title={isSv ? "Mat & matlagning" : "Food & cooking"}>
                  {isSv
                    ? "Av brandsäkerhetsskäl är matlagning inte tillåten i eller vid tälten. Beställ vår frukost eller fikapåse — eller gå till restaurangen vid slussarna (ca 200 m). I Berg och Vreta Kloster finns även café, glasskiosk och livsmedelsbutik."
                    : "For fire safety reasons, cooking is not allowed in or next to the tents. Order our breakfast or fika bag — or walk to the restaurant by the locks (~200 m). The villages of Berg and Vreta Kloster also have a café, ice-cream kiosk and grocery store nearby."}
                </InfoRow>

                <InfoRow icon={<Wifi className="h-4 w-4" />} title={isSv ? "Wifi & täckning" : "Wifi & coverage"}>
                  {isSv
                    ? "Vi har medvetet valt att inte installera wifi — platsen är till för att koppla av från skärmar. 4G/5G-täckningen är dock utmärkt om du behöver vara uppkopplad."
                    : "We've intentionally skipped wifi — this place is for unplugging. 4G/5G coverage is excellent if you do need to stay connected."}
                </InfoRow>

                <InfoRow icon={<Flame className="h-4 w-4" />} title={isSv ? "Eldning & grill" : "Fire & BBQ"}>
                  {isSv
                    ? "Öppen eld, marschaller och engångsgrillar är inte tillåtna. Under sommaren råder ofta eldningsförbud i Östergötland — vi följer länsstyrelsens beslut."
                    : "Open fires, torches and disposable BBQs are not permitted. Fire bans are common in Östergötland during summer — we follow the county board's regulations."}
                </InfoRow>

                <InfoRow icon={<Cigarette className="h-4 w-4" />} title={isSv ? "Rökning" : "Smoking"}>
                  {isSv
                    ? "Tälten är helt rökfria. Rökning är endast tillåten utomhus, väl bort från tältdukar — och fimpa alltid i medhavd asköra."
                    : "All tents are strictly non-smoking. Smoking is only allowed outdoors, well away from the canvas — and always extinguish butts properly."}
                </InfoRow>

                <InfoRow icon={<Dog className="h-4 w-4" />} title={isSv ? "Husdjur" : "Pets"}>
                  {isSv
                    ? "Tyvärr tar vi inte emot husdjur i tälten — av hänsyn till allergiker och tältdukens skick."
                    : "Sorry, pets are not allowed in the tents — out of consideration for allergy-sensitive guests and to protect the canvas."}
                </InfoRow>

                <InfoRow icon={<Trees className="h-4 w-4" />} title={isSv ? "Att göra i närheten" : "Things to do nearby"}>
                  {isSv
                    ? "Se båtarna slussa på Göta kanal, hyr cykel eller kanot, vandra till Roxen, besök Vreta klosterkyrka eller åk in till Linköping (20 min med bil)."
                    : "Watch boats pass through the Göta Canal locks, rent a bike or canoe, hike to Lake Roxen, visit Vreta Abbey Church, or drive into Linköping (20 min by car)."}
                </InfoRow>

                <InfoRow icon={<Phone className="h-4 w-4" />} title={isSv ? "Kontakt under vistelsen" : "Contact during your stay"}>
                  {isSv ? (
                    <>Christoffer svarar i mobilen: <a href="tel:+46722254993" className="text-primary underline font-medium">072-225 49 93</a>. Mejl: <a href="mailto:hej@goglampingsweden.se" className="text-primary underline">hej@goglampingsweden.se</a>. Vi finns nära till hands om något behövs.</>
                  ) : (
                    <>Christoffer is reachable on mobile: <a href="tel:+46722254993" className="text-primary underline font-medium">+46 72-225 49 93</a>. Email: <a href="mailto:hej@goglampingsweden.se" className="text-primary underline">hej@goglampingsweden.se</a>. We're close by if anything comes up.</>
                  )}
                </InfoRow>
              </CardContent>
            </Card>

            {(() => {
              const foodSelected = data.addons.some(
                (a) => (a.slug === "breakfast" || a.slug === "fika_bag") && (qty[a.id] ?? 0) > 0
              );
              if (!foodSelected) return null;
              const DIETS: { id: string; sv: string; en: string; Icon: typeof Wheat }[] = [
                { id: "gluten_free", sv: "Glutenfritt", en: "Gluten-free", Icon: Wheat },
                { id: "vegan", sv: "Veganskt", en: "Vegan", Icon: Sprout },
                { id: "vegetarian", sv: "Vegetariskt", en: "Vegetarian", Icon: Leaf },
                { id: "lactose_free", sv: "Laktosfritt", en: "Lactose-free", Icon: MilkIcon },
                { id: "nut_allergy", sv: "Nötallergi", en: "Nut allergy", Icon: Nut },
              ];
              const toggle = (id: string) =>
                setDietary((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
              return (
                <Card className="border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      <Leaf className="h-5 w-5 text-primary" />
                      {isSv ? "Specialkost & allergier" : "Dietary needs & allergies"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {isSv
                        ? "Bocka i vad som gäller så anpassar Karin frukosten/fikapåsen."
                        : "Tick anything that applies — Karin will adapt your breakfast / fika bag."}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {DIETS.map(({ id, sv, en, Icon }) => {
                        const active = dietary.includes(id);
                        return (
                          <button
                            type="button"
                            key={id}
                            onClick={() => toggle(id)}
                            className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm text-left transition ${active ? "border-primary bg-primary/10 text-foreground" : "border-border hover:bg-muted/40"}`}
                          >
                            <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="flex-1">{isSv ? sv : en}</span>
                            {active && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dietary-note" className="text-xs text-muted-foreground">
                        {isSv ? "Övriga önskemål eller allergier (valfritt)" : "Other requests or allergies (optional)"}
                      </Label>
                      <Textarea
                        id="dietary-note"
                        value={dietaryNote}
                        onChange={(e) => setDietaryNote(e.target.value.slice(0, 500))}
                        placeholder={isSv ? "Ex: skaldjursallergi, inga råa lökar…" : "E.g. shellfish allergy, no raw onion…"}
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {itemCount > 0 && (
              <Card className="sticky bottom-4 border-primary shadow-lg">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{t.total}</div>
                    <div className="font-serif text-2xl text-primary">{total} {t.currency}</div>
                  </div>
                  <Button size="lg" onClick={submit} disabled={submitting}>
                    {submitting ? t.sending : t.submit}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Avbokning & villkor — varm sammanfattning, inte juridisk vägg */}
        <Card className="bg-card border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <div className="font-medium text-foreground mb-1">
                  {isSv ? "Avbokning & villkor" : "Cancellation & terms"}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {isSv
                    ? "Avbokning är kostnadsfri fram till 5 dagar före ankomst. Skulle något oförutsett hända — hör av er, så löser vi det tillsammans."
                    : "Free cancellation up to 5 days before arrival. If something unexpected comes up, just reach out and we'll sort it out together."}
                </p>
              </div>
            </div>
            <Link to="/bokningsvillkor" className="inline-flex items-center gap-1 text-sm text-primary underline font-medium">
              {isSv ? "Läs alla bokningsvillkor" : "Read the full booking terms"}
            </Link>
          </CardContent>
        </Card>

        {/* Avslutande hälsning */}
        <div className="text-center pt-4 pb-2">
          <p className="font-serif text-lg text-primary">
            {isSv ? "Vi ser så fram emot att välkomna er! 🌿" : "We can't wait to welcome you! 🌿"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isSv ? "Christoffer & Karin — Go Glamping Sweden" : "Christoffer & Karin — Go Glamping Sweden"}
          </p>
        </div>

        <div className="text-center text-xs text-muted-foreground pt-2">
          <Link to="/" className="underline">goglampingsweden.se</Link>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="rounded-full bg-primary/10 text-primary p-2 h-8 w-8 flex items-center justify-center shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground mb-0.5">{title}</div>
        <div className="text-muted-foreground leading-relaxed">{children}</div>
      </div>
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

function PaymentLinkCard({ t, amount, reference }: { t: any; amount: number; reference: string }) {
  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-primary shrink-0" />
          <div>
            <h2 className="font-serif text-xl text-primary">{t.payTitle}</h2>
            <p className="text-sm text-muted-foreground">{t.payIntro}</p>
          </div>
        </div>
        <div className="rounded-lg bg-background border p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.payAmountLabel}</span>
            <span className="font-medium">{amount} SEK</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.payRefLabel}</span>
            <span className="font-medium">{reference}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">{t.payContact}</p>
      </CardContent>
    </Card>
  );
}
