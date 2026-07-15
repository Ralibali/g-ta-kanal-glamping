import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, CheckCircle2, Coffee, Cookie, Clock, ShieldCheck, CreditCard, MessageCircle, Bed, Sparkles, Trees, Car, MapPin, Wifi, Key, UtensilsCrossed, ShowerHead, Phone, Info, Dog, Flame, Cigarette, Wheat, Sprout, Leaf, Milk as MilkIcon, Nut, Volume2, Droplets, AlertTriangle, RefreshCw, Download } from "lucide-react";
import jsPDF from "jspdf";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import addonEarlyCheckinImg from "@/assets/glamping-exterior-deck.jpg";
import heroImg from "@/assets/glamping-sunset.jpg";
import addonBreakfastImg from "@/assets/glamping-interior-cozy.jpg";
import addonFikaImg from "@/assets/glamping-reading.jpg";

// Använder endast riktiga bilder från hemsidan.
const ADDON_IMAGES: Record<string, string> = {
  early_checkin: addonEarlyCheckinImg,
  late_checkout: addonEarlyCheckinImg,
  breakfast: addonBreakfastImg,
  fika_bag: addonFikaImg,
  pet: addonEarlyCheckinImg,
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
  checked_in_at?: string | null;
}
interface Order { id: string; addon_id: string; quantity: number; total_sek: number; status: string; paid_at?: string | null }
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
    intro: "Pricka i vad du vill lägga till. Du betalar tryggt med kort i nästa steg — vi bekräftar direkt när betalningen är genomförd.",
    already: "Du har redan beställt:",
    pcs: (n: number) => `${n} st`,
    perPerson: "kr/person",
    perStay: "kr",
    total: "Summa",
    submit: "Gå till betalning",
    sending: "Öppnar betalning…",
    success: "Tack! Betalningen är genomförd och din beställning är bekräftad.",
    error: "Något gick fel. Försök igen om en stund.",
    pending: "Avvaktar betalning",
    confirmed: "Bekräftad",
    paid: "Betald",
    addLabel: "Lägg till",
    selectedLabel: "✓ Vald",
    currency: "kr",
    swishTitle: "Betalning genomförd",
    swishIntro: "Din betalning är genomförd och beställningen är bekräftad.",
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
    intro: "Pick what you'd like to add. You'll pay securely by card in the next step — we confirm as soon as the payment is complete.",
    already: "You've already ordered:",
    pcs: (n: number) => `${n}×`,
    perPerson: "SEK/person",
    perStay: "SEK",
    total: "Total",
    submit: "Continue to payment",
    sending: "Opening payment…",
    success: "Thank you! Your payment is complete and your order is confirmed.",
    error: "Something went wrong. Please try again shortly.",
    pending: "Awaiting payment",
    confirmed: "Confirmed",
    paid: "Paid",
    addLabel: "Add",
    selectedLabel: "✓ Selected",
    currency: "SEK",
    payTitle: "Payment complete",
    payIntro: "Your payment is complete and your add-ons are confirmed.",
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
    intro: "Wähle aus, was du hinzufügen möchtest. Im nächsten Schritt bezahlst du sicher per Karte — wir bestätigen, sobald die Zahlung abgeschlossen ist.",
    already: "Bereits bestellt:",
    pcs: (n: number) => `${n}×`,
    perPerson: "SEK/Person",
    perStay: "SEK",
    total: "Summe",
    submit: "Weiter zur Zahlung",
    sending: "Zahlung wird geöffnet…",
    success: "Danke! Die Zahlung ist abgeschlossen und deine Bestellung ist bestätigt.",
    error: "Etwas ist schiefgelaufen. Bitte versuche es gleich erneut.",
    pending: "Wartet auf Zahlung",
    confirmed: "Bestätigt",
    paid: "Bezahlt",
    addLabel: "Hinzufügen",
    selectedLabel: "✓ Gewählt",
    currency: "SEK",
    payTitle: "Zahlungsanweisungen folgen",
    payIntro: "Du erhältst Zahlungsinformationen und wir bestätigen deine Bestellung, sobald die Zahlung eingegangen ist.",
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
    intro: "Vælg, hvad du vil tilføje. Du betaler sikkert med kort i næste trin — vi bekræfter, så snart betalingen er gennemført.",
    already: "Allerede bestilt:",
    pcs: (n: number) => `${n}×`,
    perPerson: "SEK/person",
    perStay: "SEK",
    total: "Total",
    submit: "Fortsæt til betaling",
    sending: "Åbner betaling…",
    success: "Tak! Betalingen er gennemført, og din bestilling er bekræftet.",
    error: "Noget gik galt. Prøv igen om lidt.",
    pending: "Afventer betaling",
    confirmed: "Bekræftet",
    paid: "Betalt",
    addLabel: "Tilføj",
    selectedLabel: "✓ Valgt",
    currency: "SEK",
    payTitle: "Betalingsinstruktioner er på vej",
    payIntro: "Du får betalingsinstruktioner, og vi bekræfter din bestilling, når betalingen er modtaget.",
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
    intro: "Velg hva du vil legge til. Du betaler trygt med kort i neste steg — vi bekrefter så snart betalingen er gjennomført.",
    already: "Allerede bestilt:",
    pcs: (n: number) => `${n}×`,
    perPerson: "SEK/person",
    perStay: "SEK",
    total: "Total",
    submit: "Fortsett til betaling",
    sending: "Åpner betaling…",
    success: "Takk! Betalingen er gjennomført og bestillingen er bekreftet.",
    error: "Noe gikk galt. Prøv igjen om litt.",
    pending: "Venter på betaling",
    confirmed: "Bekreftet",
    paid: "Betalt",
    addLabel: "Legg til",
    selectedLabel: "✓ Valgt",
    currency: "SEK",
    payTitle: "Betalingsinstruksjoner på vei",
    payIntro: "Du får betalingsinstruksjoner, og vi bekrefter bestillingen når betalingen er mottatt.",
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
    intro: "Kies wat je wilt toevoegen. Je betaalt veilig met kaart in de volgende stap — we bevestigen zodra de betaling is voltooid.",
    already: "Al besteld:",
    pcs: (n: number) => `${n}×`,
    perPerson: "SEK/persoon",
    perStay: "SEK",
    total: "Totaal",
    submit: "Doorgaan naar betaling",
    sending: "Betaling openen…",
    success: "Bedankt! De betaling is voltooid en je bestelling is bevestigd.",
    error: "Er ging iets mis. Probeer het zo opnieuw.",
    pending: "Wacht op betaling",
    confirmed: "Bevestigd",
    paid: "Betaald",
    addLabel: "Toevoegen",
    selectedLabel: "✓ Gekozen",
    currency: "SEK",
    payTitle: "Betaalinstructies onderweg",
    payIntro: "Je ontvangt betaalinstructies en we bevestigen je bestelling zodra de betaling is ontvangen.",
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
    intro: "Choisissez ce que vous souhaitez ajouter. Vous paierez par carte en toute sécurité à l’étape suivante — nous confirmerons dès que le paiement sera effectué.",
    already: "Déjà commandé :",
    pcs: (n: number) => `${n}×`,
    perPerson: "SEK/pers.",
    perStay: "SEK",
    total: "Total",
    submit: "Continuer vers le paiement",
    sending: "Ouverture du paiement…",
    success: "Merci ! Le paiement est terminé et votre commande est confirmée.",
    error: "Une erreur est survenue. Réessayez dans un instant.",
    pending: "En attente de paiement",
    confirmed: "Confirmé",
    paid: "Payé",
    addLabel: "Ajouter",
    selectedLabel: "✓ Choisi",
    currency: "SEK",
    payTitle: "Instructions de paiement en route",
    payIntro: "Vous recevrez les instructions de paiement et nous confirmerons votre commande dès réception du paiement.",
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
  if (slug === "late_checkout") return <Clock className="h-5 w-5" />;
  if (slug === "pet") return <Dog className="h-5 w-5" />;
  return null;
}

// Detaljerad info per produkt — visas under beskrivningen så gästen vet exakt vad de får.
const ADDON_DETAILS: Record<string, Record<string, { tagline: string; bullets: string[]; note?: string }>> = {
  breakfast: {
    sv: {
      tagline: "Nybakat från Boställets Vedugnsbageri — ställs vid portalen runt kl 08:30.",
      bullets: [
        "En nygräddad fröbulle med smör, ost, sallad & skinka",
        "Ett hårdkokt ägg — en klassiker som mättar och ger energi",
        "Naturell yoghurt med hemlagad müsli och säsongens frukt vid sidan",
        "En hembakad småkaka",
        "Juice (33 cl) — vid bokning för två delar ni på en förpackning",
      ],
      note: "Kaffe finns i tältet för egen servering. Frukosten ställs vid portalen ca kl 08:30 — vi skickar ett SMS så fort den är på plats. Pris per person och per dag.",
    },
    en: {
      tagline: "Freshly baked from Boställets Vedugnsbageri — placed at the portal around 8:30.",
      bullets: [
        "A freshly baked seed roll with butter, cheese, lettuce and ham",
        "A hard-boiled egg — a classic that keeps you going",
        "Plain yoghurt with homemade muesli and seasonal fruit on the side",
        "A homemade cookie",
        "Juice (33 cl) — when booking for two, you share one package",
      ],
      note: "Coffee is available in the tent for self-service. Breakfast is placed at the portal around 8:30 — we'll send a text as soon as it's there. Price per person per day.",
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
      tagline: "Kom redan kl 12:00 istället för ordinarie kl 15:00 — tre extra timmar vid kanalen.",
      bullets: [
        "Incheckning från kl 12:00",
        "Tre extra timmar att njuta",
        "Tältet är bäddat och klart när ni kommer",
        "Garanterad tillgänglighet (bokningsbart tillval)",
      ],
      note: "399 kr per bokning, oavsett antal gäster.",
    },
    en: {
      tagline: "Arrive at 12:00 instead of the usual 15:00 — three extra hours by the canal.",
      bullets: [
        "Check-in from 12:00",
        "Three extra hours to enjoy",
        "Tent made up and ready when you arrive",
        "Guaranteed availability (bookable extra)",
      ],
      note: "399 SEK per booking, regardless of number of guests.",
    },
  },
  late_checkout: {
    sv: {
      tagline: "Stanna kvar till kl 12:00 istället för ordinarie kl 10:00 — två lugna extratimmar innan hemresan.",
      bullets: [
        "Utcheckning senast kl 12:00",
        "Två extra timmar på morgonen",
        "Perfekt för en långfrukost vid kanalen",
        "Garanterad tid (bokningsbart tillval)",
      ],
      note: "399 kr per bokning, oavsett antal gäster.",
    },
    en: {
      tagline: "Stay until 12:00 instead of the usual 10:00 — two calm extra hours before heading home.",
      bullets: [
        "Check-out by 12:00",
        "Two extra hours in the morning",
        "Perfect for a slow breakfast by the canal",
        "Guaranteed time (bookable extra)",
      ],
      note: "399 SEK per booking, regardless of number of guests.",
    },
  },
  pet: {
    sv: {
      tagline: "Husdjur som tillval — 399 kr per djur.",
      bullets: [
        "Lägg till om ni tar med hund eller annat husdjur",
        "Pris per djur",
        "Vi förbereder tältet så att vistelsen blir smidig för alla",
      ],
      note: "Tälten är fortsatt helt rökfria och husdjur ska hållas under uppsikt på området.",
    },
    en: {
      tagline: "Pets as an add-on — 399 SEK per pet.",
      bullets: [
        "Add this if you bring a dog or another pet",
        "Price per pet",
        "We'll prepare the tent so the stay works smoothly for everyone",
      ],
      note: "The tents remain strictly non-smoking and pets must be supervised on site.",
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<StayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [dietary, setDietary] = useState<string[]>([]);
  const [dietaryNote, setDietaryNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ title: string; detail: string; method: 'stripe' | 'swish' } | null>(null);
  const [done, setDone] = useState(false);
  const [paidTotal, setPaidTotal] = useState<number>(0);
  const [swishInfo, setSwishInfo] = useState<{ amount: number; reference: string } | null>(null);
  const [extraTents, setExtraTents] = useState<string[]>([]);

  const loadStay = async () => {
    if (!token) { setLoading(false); return; }
    const { data: rpc, error } = await (supabase as any).rpc("get_stay_by_token", { p_token: token });
    if (error) console.error(error);
    const sd = rpc as StayData | null;
    setData(sd);
    const fromRpc = sd?.booking?.tent_ids;
    if (Array.isArray(fromRpc) && fromRpc.length > 0) {
      setExtraTents(fromRpc);
    } else if (sd?.booking?.booking_number) {
      const { data: stays } = await (supabase as any)
        .from("tent_stays")
        .select("tent_id")
        .eq("booking_number", sd.booking.booking_number);
      if (stays) setExtraTents((stays as { tent_id: string }[]).map(s => s.tent_id));
    }
    setLoading(false);
  };

  useEffect(() => { loadStay(); }, [token]);

  // Auto-refresh medan någon betalning fortfarande är pågående (Swish/Stripe).
  // Uppdaterar status och tidslinje så snart backend markerar den som paid/confirmed/cancelled.
  useEffect(() => {
    if (!token) return;
    const orders = data?.orders ?? [];
    const hasPending = orders.some(o => o.status === "requested" || o.status === "pending");
    if (!hasPending) return;
    const interval = window.setInterval(() => { loadStay(); }, 5000);
    const onFocus = () => loadStay();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, data?.orders?.map(o => `${o.id}:${o.status}`).join("|")]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || searchParams.get("payment") !== "success") return;
    let active = true;
    setSubmitting(true);
    (async () => {
      try {
        const { data: verified, error } = await (supabase as any).functions.invoke("verify-addon-payment", {
          body: { session_id: sessionId },
        });
        if (error || (verified as any)?.error) throw new Error((verified as any)?.error ?? error?.message);
        if (!active) return;
        setPaidTotal(Number((verified as any)?.total ?? 0));
        setDone(true);
        toast.success("Betalningen är genomförd.");
        trackEvent("Add-on Purchased", {
          product_category: "addon",
          payment_method: "stripe",
        });
        await loadStay();
        const next = new URLSearchParams(searchParams);
        next.delete("session_id");
        next.delete("payment");
        setSearchParams(next, { replace: true });
      } catch (err: any) {
        if (active) toast.error(err?.message ?? "Kunde inte bekräfta betalningen.");
      } finally {
        if (active) setSubmitting(false);
      }
    })();
    return () => { active = false; };
    // Kör bara när länken öppnas med Stripe-session i URL:en.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Frukost levereras inte på måndagar. Om vistelsen innehåller en måndagsmorgon
  // (checkin+1 … checkout) kan gästen inte beställa frukost alls.
  const stayHasMondayMorning = (() => {
    const start = new Date(`${data.booking.checkin_date}T12:00:00Z`);
    const end = new Date(`${data.booking.checkout_date}T12:00:00Z`);
    for (let d = new Date(start.getTime() + 86400000); d.getTime() <= end.getTime(); d = new Date(d.getTime() + 86400000)) {
      if (d.getUTCDay() === 1) return true;
    }
    return false;
  })();


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
  const hasLate = orderedSlugs.has("late_checkout");
  const hasAnyAddon = orderedSlugs.size > 0;
  const lockRevealHour = hasEarly ? 12 : 15;
  const [year, month, day] = data.booking.checkin_date.split("-").map(Number);
  const lockCodeVisible = Boolean(data.booking.checked_in_at) || Date.now() >= new Date(year, month - 1, day, lockRevealHour, 0, 0).getTime();

  const scrollToAddons = () => {
    document.getElementById("addons-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const friendlyError = (raw: string | undefined, method: 'stripe' | 'swish'): { title: string; detail: string } => {
    const code = String(raw ?? '').toLowerCase();
    const sv = isSv;
    if (code.includes('too_late')) return {
      title: sv ? 'För sent att beställa' : 'Too late to order',
      detail: sv ? 'Beställning stänger två dygn före incheckning. Hör av dig direkt till oss så löser vi det.' : 'Orders close two days before check-in. Please contact us directly.',
    };
    if (code.includes('breakfast_unavailable_monday')) return {
      title: sv ? 'Frukost ej tillgänglig på måndagar' : 'Breakfast unavailable on Mondays',
      detail: sv ? 'Ta bort frukost ur beställningen för att fortsätta.' : 'Please remove breakfast to continue.',
    };
    if (code.includes('missing_stripe_price') || code.includes('stripe_not_configured')) return {
      title: sv ? 'Kortbetalning ur funktion' : 'Card payment unavailable',
      detail: sv ? 'Just nu går det inte att betala med kort. Använd Swish istället, eller försök igen om en stund.' : 'Card payment is temporarily unavailable. Please use Swish or try again shortly.',
    };
    if (code.includes('no_valid_items') || code.includes('items required')) return {
      title: sv ? 'Inga tillval valda' : 'No items selected',
      detail: sv ? 'Välj minst ett tillval för att fortsätta.' : 'Please select at least one item.',
    };
    if (code.includes('not_found')) return {
      title: sv ? 'Länken fungerar inte' : 'Link not valid',
      detail: sv ? 'Vi kunde inte hitta din bokning. Kontrollera länken eller kontakta oss.' : "We couldn't find your booking. Please check the link or contact us.",
    };
    if (code.includes('failed to fetch') || code.includes('networkerror') || code.includes('load failed')) return {
      title: sv ? 'Ingen internetanslutning' : 'No internet connection',
      detail: sv ? 'Kontrollera din uppkoppling och försök igen.' : 'Check your connection and try again.',
    };
    return {
      title: sv ? 'Betalningen kunde inte startas' : 'Payment could not start',
      detail: method === 'swish'
        ? (sv ? 'Vi kunde inte registrera din Swish-beställning. Försök igen eller välj kortbetalning.' : 'We could not register your Swish order. Try again or pay by card.')
        : (sv ? 'Vi kunde inte skapa kortbetalningen. Försök igen eller välj Swish.' : 'We could not create the card payment. Try again or use Swish.'),
    };
  };

  const submit = async (method: 'stripe' | 'swish' = 'stripe') => {
    const items = data.addons
      .filter((a) => (qty[a.id] ?? 0) > 0)
      .map((a) => ({ addon_id: a.id, quantity: qty[a.id] }));
    if (items.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    trackEvent("Add-on Checkout Started", {
      product_category: "addon",
      payment_method: method,
      language: lang,
    });
    try {
      const { data: res, error } = await (supabase as any).functions.invoke("submit-addon-request", {
        body: { public_token: token, items, dietary, dietary_note: dietaryNote.trim() || undefined, payment_method: method },
      });
      const rawError = (res as any)?.error ?? error?.message;
      if (error || (res as any)?.error) throw new Error(rawError);
      if (method === 'swish') {
        const totalPaid = Number((res as any)?.total ?? total);
        const reference = String((res as any)?.reference ?? data.booking.booking_number ?? '');
        setSwishInfo({ amount: totalPaid, reference });
        setQty({});
        setSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.success(isSv ? "Beställningen är registrerad — öppna Swish för att betala." : "Order registered — open Swish to pay.");
        await loadStay();
        return;
      }
      const url = (res as any)?.url;
      if (!url) throw new Error("missing_stripe_price");
      window.location.href = url;
    } catch (err: any) {
      const friendly = friendlyError(err?.message, method);
      setSubmitError({ ...friendly, method });
      setSubmitting(false);
      // Scroll error into view
      setTimeout(() => document.getElementById('stay-error-banner')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero — riktig bild från hemsidan med varm välkomst */}
      <header className="relative h-[260px] sm:h-[320px] w-full overflow-hidden">
        <img
          src={heroImg}
          alt="Glamping vid Göta kanal, Bergs Slussar"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-background" />
        <div className="relative h-full max-w-2xl mx-auto px-4 flex flex-col justify-end pb-6">
          <p className="text-white/80 text-xs uppercase tracking-[0.2em] mb-2 font-sans">
            {isSv ? "Välkomna till" : "Welcome to"} Bergs Slussar Glamping
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-white drop-shadow-md">
            {firstName ? t.welcome(firstName) : t.welcomeNoName}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-5 -mt-4 relative">

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
                  {lockCodeVisible ? (
                    <div className="font-medium text-foreground">
                      🔒 {isSv ? "Kod till hänglåset" : "Code for the lock"}: <span className="font-mono text-lg tracking-widest">2018</span>
                    </div>
                  ) : (
                    <div className="font-medium text-foreground">
                      🔒 {isSv ? "Koden till hänglåset visas här när det är dags att checka in." : "The lock code appears here when it is time to check in."}
                    </div>
                  )}
                  {lockCodeVisible && multi && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {isSv ? `Samma kod till alla ${tentNames.length} tälten.` : `Same code for all ${tentNames.length} tents.`}
                    </div>
                  )}
                </div>
                {/* Snabbåtgärder — direkt access till det gästen behöver mest */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=Go+Glamping+Sweden+Bergs+Slussar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 rounded-lg border bg-card hover:bg-muted/40 transition-colors p-2.5 text-center"
                  >
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">{isSv ? "Hitta hit" : "Directions"}</span>
                  </a>
                  <a
                    href="tel:+46722254993"
                    className="flex flex-col items-center gap-1 rounded-lg border bg-card hover:bg-muted/40 transition-colors p-2.5 text-center"
                  >
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">{isSv ? "Ring oss" : "Call us"}</span>
                  </a>
                  <a
                    href="mailto:info@auroramedia.se"
                    className="flex flex-col items-center gap-1 rounded-lg border bg-card hover:bg-muted/40 transition-colors p-2.5 text-center"
                  >
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">{isSv ? "Mejla" : "Email"}</span>
                  </a>
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
                <span>
                  {hasLate
                    ? (isSv ? "Sen utcheckning — ni kan stanna till kl 12:00 🌤️" : "Late check-out — you can stay until 12:00 🌤️")
                    : (isSv ? "Utcheckning senast kl 10:00." : "Check-out by 10:00 am.")}
                </span>
              </li>
              {hasBreakfast && (
                <li className="flex items-start gap-3">
                  <Coffee className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{isSv
                    ? "Frukosten kommer varm och nybakad från Boställets Vedugnsbageri runt kl 08:30 — vi skickar ett litet SMS så fort den står klar vid portalen, så kan ni ta den när det passar. ☕"
                    : "Breakfast arrives warm and freshly baked from Boställets Vedugnsbageri around 8:30 — we'll send you a little text as soon as it's waiting at the portal, so you can pick it up whenever suits you. ☕"}</span>
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
                    ? "Vill ni förgylla vistelsen? Lägg till frukost eller mer tid vid kanalen nedan 👇"
                  : "Want to make your stay even better? Add breakfast or more time by the canal below 👇"}
              </button>
            )}
          </CardContent>
        </Card>

        {data.orders.length > 0 && (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                {isSv ? "Dina beställningar" : "Your orders"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.orders.map((o) => {
                const a = data.addons.find((x) => x.id === o.addon_id);
                if (!a) return null;
                return (
                  <OrderStatusRow
                    key={o.id}
                    name={isSv ? a.name_sv : a.name_en}
                    quantity={o.quantity}
                    total={o.total_sek}
                    status={o.status}
                    isSv={isSv}
                    onDownloadReceipt={() => downloadReceipt({
                      order: o,
                      addonName: isSv ? a.name_sv : a.name_en,
                      booking: data.booking,
                      isSv,
                    })}
                  />
                );
              })}
            </CardContent>
          </Card>
        )}

        {swishInfo && !done && (
          <SwishCard
            t={t}
            amount={swishInfo.amount}
            reference={swishInfo.reference}
            swishNumber={data.settings?.swish_number ?? '1230628289'}
            payee={data.settings?.swish_payee ?? 'Aurora Media AB'}
          />
        )}

        {done ? (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <h2 className="font-serif text-xl text-primary">{t.success}</h2>
                  <p className="text-sm text-muted-foreground">{isSv ? "Bekräftelsen skickas även till din e-post." : "A confirmation is also sent to your email."}</p>
                </div>
              </div>
              {paidTotal > 0 && <div className="text-sm font-medium">{t.total}: {paidTotal} {t.currency}</div>}
            </CardContent>
          </Card>
        ) : tooLate ? (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-5 text-sm">{t.tooLate}</CardContent>
          </Card>
        ) : data.addons.filter((a) => a.slug !== 'sup_rental' && !data.orders.some((o) => o.addon_id === a.id && ['requested','confirmed','paid'].includes(o.status)) && !(stayHasMondayMorning && a.slug === 'breakfast')).length === 0 ? null : (
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

            {stayHasMondayMorning && !data.orders.some((o) => {
              const a = data.addons.find((x) => x.id === o.addon_id);
              return a?.slug === 'breakfast' && ['requested','confirmed','paid'].includes(o.status);
            }) && (
              <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 flex items-start gap-3">
                <Info className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
                <div className="text-sm text-amber-900">
                  {isSv
                    ? "Frukost går tyvärr inte att beställa denna vistelse — vårt lokala bageri levererar inte på måndagar. Fikapåsen finns fortfarande som ett mysigt alternativ. 🍪"
                    : "Breakfast can't be ordered for this stay — our local bakery doesn't deliver on Mondays. The fika bag is still available as a cozy alternative. 🍪"}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {data.addons.filter((a) => a.slug !== 'sup_rental' && !data.orders.some((o) => o.addon_id === a.id && ['requested','confirmed','paid'].includes(o.status)) && !(stayHasMondayMorning && a.slug === 'breakfast')).map((a) => {
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
                        {a.slug === "fika_bag" && (
                          <div className="absolute top-2 left-2 rounded-full bg-accent text-accent-foreground px-3 py-1 text-[11px] font-semibold shadow-sm uppercase tracking-wider">
                            {isSv ? "Lokalt bageri" : "Local bakery"}
                          </div>
                        )}
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
                    <div className="font-medium text-foreground">{isSv ? "Enkelt att beställa" : "Easy to order"}</div>
                    <div className="text-muted-foreground">{isSv ? "Pricka i och betala direkt här på sidan" : "Tick your choices and pay directly on this page"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">{isSv ? "Snabb bekräftelse" : "Fast confirmation"}</div>
                    <div className="text-muted-foreground">{isSv ? "Direkt när betalningen är genomförd" : "As soon as the payment is complete"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">{isSv ? "Säker betalning" : "Secure payment"}</div>
                    <div className="text-muted-foreground">{isSv ? "Swish eller kort — Visa, Mastercard, Apple/Google Pay via Stripe" : "Card, Apple Pay and Google Pay via Stripe"}</div>
                  </div>
                </div>
              </div>
            </div>



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

            {submitError && (
              <Card id="stay-error-banner" className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-semibold text-destructive">{submitError.title}</div>
                      <div className="text-sm text-foreground/80">{submitError.detail}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button size="sm" onClick={() => submit(submitError.method)} disabled={submitting}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${submitting ? 'animate-spin' : ''}`} />
                      {isSv ? "Försök igen" : "Try again"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => submit(submitError.method === 'swish' ? 'stripe' : 'swish')}
                      disabled={submitting}
                    >
                      {submitError.method === 'swish'
                        ? (isSv ? "Prova kortbetalning" : "Try card payment")
                        : (isSv ? "Prova Swish istället" : "Try Swish instead")}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {isSv ? "Kvarstår problemet? Ring oss på " : "Still stuck? Call us at "}
                    <a href="tel:+46722254993" className="underline">072-225 49 93</a>.
                  </p>
                </CardContent>
              </Card>
            )}

            {itemCount > 0 && (
              <Card className="sticky bottom-4 border-primary shadow-xl bg-card/95 backdrop-blur">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{t.total}</div>
                      <div className="font-serif text-3xl text-primary leading-none">{total} <span className="text-lg">{t.currency}</span></div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {itemCount} {isSv ? (itemCount === 1 ? "vald" : "valda") : (itemCount === 1 ? "item" : "items")}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      size="lg"
                      onClick={() => submit('swish')}
                      disabled={submitting}
                      className="w-full bg-[#5b2c91] hover:bg-[#4a2478] text-white font-semibold"
                    >
                      <span className="mr-2 inline-flex items-center justify-center rounded-sm bg-white text-[#5b2c91] px-1.5 py-0.5 text-[10px] font-bold tracking-wider">SWISH</span>
                      {isSv ? "Betala med Swish" : "Pay with Swish"}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => submit('stripe')}
                      disabled={submitting}
                      className="w-full border-primary/40"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {isSv ? "Betala med kort" : "Pay by card"}
                    </Button>
                  </div>
                  <p className="text-[11px] text-center text-muted-foreground">
                    {submitting ? t.sending : (isSv ? "Trygg betalning • bekräftelse via mejl" : "Secure payment • email confirmation")}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* "Ingår redan" — positionerar tillvalen som extra lyx, inte basbehov. Visas alltid. */}
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

        {/* Mer information om ditt besök — visas alltid, även efter cutoff. */}
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
                <>Bergs Slussar, 590 77 Vreta Kloster. Sök på <strong>"Bergs Slussar Glamping"</strong> i Google Maps eller Waze — du kommer rätt fram till parkeringen. <a href="https://www.google.com/maps/dir/?api=1&destination=Bergs+Slussar+Glamping" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">Öppna i Google Maps →</a></>
              ) : (
                <>Bergs Slussar, 590 77 Vreta Kloster, Sweden. Search <strong>"Bergs Slussar Glamping"</strong> in Google Maps or Waze — it leads straight to the parking lot. <a href="https://www.google.com/maps/dir/?api=1&destination=Bergs+Slussar+Glamping" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">Open in Google Maps →</a></>
              )}
            </InfoRow>

            <InfoRow icon={<Car className="h-4 w-4" />} title={isSv ? "Parkering" : "Parking"}>
              {isSv
                ? "Ni parkerar enklast på den allmänna parkeringen vid Berg (liten avgift, smidigt och nära). Vill ni hellre parkera gratis finns en mysig pendlarparkering precis vid infarten till Berg — några minuters promenad bort. Sedan väntar en kort och fin stig ner till tälten."
                : "The easiest option is the public parking at Berg — a small fee, but wonderfully close. If you'd rather park for free, there's a lovely commuter lot right at the entrance to Berg, just a few minutes' walk away. From there, a short and pretty path leads down to the tents."}
            </InfoRow>

            <InfoRow icon={<Clock className="h-4 w-4" />} title={isSv ? "Incheckning & utcheckning" : "Check-in & check-out"}>
              {isSv
                ? "Incheckning från kl 15:00, utcheckning senast kl 10:00. Vill ni ha mer tid? Tidig incheckning (kl 12:00) och sen utcheckning (till kl 12:00) finns som tillval här ovan, 399 kr styck. Ni checkar in själva, i lugn och ro — koden till tältet visas här på sidan när det är dags att checka in."
                : "Check-in from 3:00 pm, check-out by 10:00 am. Want more time? Early check-in (12:00) and late check-out (until 12:00) are available as extras above, 399 SEK each. You check in yourselves at your own pace — the code to the tent appears here on this page when it's time to check in."}
            </InfoRow>

            <InfoRow icon={<ShowerHead className="h-4 w-4" />} title={isSv ? "Servicehus & servicekort" : "Service house & service card"}>
              {isSv
                ? "Fräscht servicehus med varma duschar, toaletter och skötrum ca 150 m från tälten, öppet dygnet runt under hela er vistelse. I tältet ligger ett servicekort — det är nyckeln dit, så ta det gärna med i fickan när ni går, men glöm inte att lämna det åter när ni checkar ut genom att lägga det i tältet. Koden till servicehuset får ni i samband med incheckningen."
                : "A fresh service house with warm showers, toilets and a changing room about 150 m from the tents — open around the clock throughout your stay. In your tent you'll find a service card; it's the key over there, so pop it in your pocket when you walk down, but please leave it back in the tent when you check out. The code to the service house is provided at check-in."}
            </InfoRow>

            <InfoRow icon={<UtensilsCrossed className="h-4 w-4" />} title={isSv ? "Mat & frukost" : "Food & breakfast"}>
              {isSv
                ? "Har ni beställt frukost bakas den av Boställets Vedugnsbageri och ställs vid portalen runt kl 08:30 — vi pingar er på SMS så fort den är på plats. Vill ni fixa mat själva funkar det fint att gå till restaurangen vid slussarna (ca 200 m), matvagnarna vid bron eller caféet i Vreta Kloster. Matlagning inne i tälten låter vi bli — men grillen står gärna redo, det finns gratis kol i det gråa skåpet."
                : "If you've ordered breakfast, it's baked by Boställets Vedugnsbageri and placed at the portal around 8:30 — we'll ping you by text as soon as it's there. Prefer to sort food yourselves? The restaurant by the locks (~200 m), the food trucks up by the bridge and the café in Vreta Kloster are all lovely options. We leave cooking inside the tents alone — but the BBQ is happy to be used, and there's free charcoal in the grey cabinet."}
            </InfoRow>

            <InfoRow icon={<Droplets className="h-4 w-4" />} title={isSv ? "Diska i servicehuset" : "Washing up in the service house"}>
              {isSv
                ? "Det finns inget kök vid tälten, men det går fint att diska i servicehuset — vid tvättmaskinerna, genom dörren till höger sett framifrån. I det gråa skåpet till vänster hittar ni diskmedel, diskborste och en vit korg att ta med koppar och glas i. Enkelt och nära."
                : "There's no kitchen by the tents, but you're very welcome to wash up in the service house — over by the washing machines, through the door on the right as you face the building. In the grey cabinet on the left you'll find washing-up liquid, a brush and a white basket to carry cups and glasses in. Simple and just around the corner."}
            </InfoRow>

            <InfoRow icon={<Volume2 className="h-4 w-4" />} title={isSv ? "Gräsklippning dagtid" : "Lawn mowing in the daytime"}>
              {isSv
                ? "Vår robot klipper gräset dagtid mellan kl 10 och 15 så att platsen håller sig fin och välskött åt er. Skulle ljudet störa er precis då — säg bara till, så pausar vi direkt."
                : "Our robot mows the lawn during the day, between 10:00 and 15:00, to keep the place looking its best for you. If the sound bothers you right then, just say the word and we'll pause it."}
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
                ? "Tälten är helt rökfria. Rökning är endast tillåten utomhus, väl bort från tältdukar — och fimpa alltid i medhavd askkopp."
                : "All tents are strictly non-smoking. Smoking is only allowed outdoors, well away from the canvas — and always extinguish butts in a portable ashtray."}
            </InfoRow>

            <InfoRow icon={<Dog className="h-4 w-4" />} title={isSv ? "Husdjur" : "Pets"}>
              {isSv
                ? "Husdjur kan läggas till som tillval — 399 kr per djur. Kontakta oss innan ankomst så ordnar vi det."
                : "Pets can be added as an extra — 399 SEK per pet. Contact us before arrival and we'll sort it."}
            </InfoRow>

            <InfoRow icon={<Trees className="h-4 w-4" />} title={isSv ? "Att göra i närheten" : "Things to do nearby"}>
              {isSv
                ? "Se båtarna slussa på Göta kanal, hyr cykel eller kanot, vandra till Roxen, besök Vreta klosterkyrka eller åk in till Linköping (20 min med bil)."
                : "Watch boats pass through the Göta Canal locks, rent a bike or canoe, hike to Lake Roxen, visit Vreta Abbey Church, or drive into Linköping (20 min by car)."}
            </InfoRow>

            <InfoRow icon={<Phone className="h-4 w-4" />} title={isSv ? "Kontakt under vistelsen" : "Contact during your stay"}>
              {isSv ? (
                <>Christoffer svarar i mobilen per sms: <a href="sms:+46722254993" className="text-primary underline font-medium">072-225 49 93</a>. Mejl: <a href="mailto:info@auroramedia.se" className="text-primary underline">info@auroramedia.se</a>. Vi finns nära till hands om något behövs.</>
              ) : (
                <>Christoffer replies by text on mobile: <a href="sms:+46722254993" className="text-primary underline font-medium">+46 72-225 49 93</a>. Email: <a href="mailto:info@auroramedia.se" className="text-primary underline">info@auroramedia.se</a>. We're close by if anything comes up.</>
              )}
            </InfoRow>
          </CardContent>
        </Card>



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
            {isSv ? "Christoffer — Bergs Slussar Glamping" : "Christoffer — Bergs Slussar Glamping"}
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
  const [linkFailed, setLinkFailed] = useState(false);
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const copy = async (val: string, key: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopied(key);
      toast.success(t.swishCopied);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      toast.error(t.copy + ' ✗');
    }
  };
  // Swish deep link (mobile opens the app, desktop ignores)
  const swishUrl = `https://app.swish.nu/1/p/sw/?sw=${swishNumber}&amt=${amount}&cur=SEK&msg=${encodeURIComponent(reference)}&src=qr`;

  const openSwish = () => {
    if (!isMobile) {
      setLinkFailed(true);
      return;
    }
    // Detect whether the Swish app took focus. If not within 1.5s, show fallback.
    const start = Date.now();
    const onVisibility = () => {
      if (document.hidden) {
        // App opened successfully
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.location.href = swishUrl;
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (!document.hidden && Date.now() - start >= 1400) setLinkFailed(true);
    }, 1500);
  };

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

        <Button className="w-full" size="lg" onClick={openSwish}>{t.swishOpen}</Button>

        {linkFailed && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm space-y-2">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-900 dark:text-amber-200">
                  {t === undefined || typeof t.swishFallback !== 'string'
                    ? 'Öppnades inte Swish? Öppna Swish-appen manuellt och använd uppgifterna ovan.'
                    : t.swishFallback}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isMobile
                    ? 'Kopiera nummer, belopp och meddelande ovan.'
                    : 'Öppna Swish-appen på din mobil och slå in uppgifterna manuellt.'}
                </div>
              </div>
            </div>
          </div>
        )}
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

function OrderStatusRow({
  name, quantity, total, status, isSv,
}: {
  name: string; quantity: number; total: number; status: string; isSv: boolean;
}) {
  const isCancelled = status === 'cancelled';
  const isDone = status === 'paid' || status === 'confirmed';
  // pending = Stripe checkout not completed; requested = Swish awaiting owner confirmation
  const isSwish = status === 'requested';
  const isStripePending = status === 'pending';

  const steps = [
    { key: 'ordered', label: isSv ? 'Beställd' : 'Ordered', done: true },
    {
      key: 'paid',
      label: isSwish
        ? (isSv ? 'Väntar på Swish' : 'Awaiting Swish')
        : isStripePending
          ? (isSv ? 'Kortbetalning startad' : 'Card payment started')
          : (isSv ? 'Betald' : 'Paid'),
      done: isDone,
      active: !isDone && !isCancelled,
    },
    {
      key: 'confirmed',
      label: isSv ? 'Bekräftad' : 'Confirmed',
      done: isDone,
    },
  ];

  const badge = isCancelled
    ? { text: isSv ? 'Avbruten' : 'Cancelled', cls: 'bg-destructive/15 text-destructive border-destructive/30' }
    : isDone
      ? { text: isSv ? 'Klar' : 'Done', cls: 'bg-primary/15 text-primary border-primary/30' }
      : isSwish
        ? { text: isSv ? 'Väntar på Swish' : 'Awaiting Swish', cls: 'bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-300' }
        : { text: isSv ? 'Väntar' : 'Pending', cls: 'bg-amber-500/15 text-amber-700 border-amber-500/40 dark:text-amber-300' };

  return (
    <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{quantity}× {name}</div>
          <div className="text-xs text-muted-foreground">{total} kr</div>
        </div>
        <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
          {badge.text}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {steps.map((s, i) => {
          const dotCls = isCancelled && i > 0
            ? 'bg-destructive/30 text-destructive'
            : s.done
              ? 'bg-primary text-primary-foreground'
              : (s as any).active
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-muted text-muted-foreground';
          const lineCls = isCancelled
            ? 'bg-destructive/20'
            : steps[i]?.done && steps[i + 1]?.done
              ? 'bg-primary'
              : 'bg-muted';
          return (
            <div key={s.key} className="flex-1 flex items-center gap-1.5 min-w-0">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${dotCls}`}>
                {isCancelled && i > 0 ? (
                  <span className="text-[10px] leading-none">✕</span>
                ) : s.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-[10px] font-bold">{i + 1}</span>
                )}
              </div>
              <div className="flex-1 flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] text-muted-foreground truncate">{s.label}</span>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${lineCls}`} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
