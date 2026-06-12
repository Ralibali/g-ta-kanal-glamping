import { useState } from "react";
import { CheckCircle, KeyRound, ShieldCheck, ArrowLeft, MapPin, AlertCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ─── Aktiva bokningsnummer ───────────────────────────────────
// Koppla bokningsnummer till tält: "sjobris", "naturkarnan" eller "lugnetsyta"
type TentId = "sjobris" | "naturkarnan" | "lugnetsyta";
type Lang = "sv" | "da" | "en";

interface Booking {
  tentId: TentId;
  lang: Lang;
}

const VALID_BOOKINGS: Record<string, Booking> = {
  "JM06JI38XT": { tentId: "sjobris", lang: "da" }, // Michael Vinge, 2026-06-03 till 2026-06-05
  "26431": { tentId: "sjobris", lang: "sv" }, // Elin Pettersson, 2026-06-06 till 2026-06-07
};

const VALID_TENT_IDS: TentId[] = ["sjobris", "naturkarnan", "lugnetsyta"];

const TENT_INFO: Record<Lang, Record<TentId, { name: string; directions: string }>> = {
  sv: {
    sjobris: {
      name: "Sjöbrisretreatet (Tält 1)",
      directions: "Tältet längst till höger – gå rakt fram från QR-koden.",
    },
    naturkarnan: {
      name: "Naturkärnan (Tält 2)",
      directions: "Tältet längst till vänster – gå till vänster och följ stigen.",
    },
    lugnetsyta: {
      name: "Lugnetsytan (Tält 3)",
      directions: "Tältet i mitten – följ stigen rakt fram.",
    },
  },
  da: {
    sjobris: {
      name: "Sjöbrisretreatet (Telt 1)",
      directions: "Teltet længst til højre – gå ligeud fra QR-koden.",
    },
    naturkarnan: {
      name: "Naturkärnan (Telt 2)",
      directions: "Teltet længst til venstre – gå til venstre og følg stien.",
    },
    lugnetsyta: {
      name: "Lugnetsytan (Telt 3)",
      directions: "Teltet i midten – følg stien ligeud.",
    },
  },
  en: {
    sjobris: {
      name: "Sjöbrisretreatet (Tent 1)",
      directions: "The tent furthest to the right – walk straight ahead from the QR code.",
    },
    naturkarnan: {
      name: "Naturkärnan (Tent 2)",
      directions: "The tent furthest to the left – go left and follow the path.",
    },
    lugnetsyta: {
      name: "Lugnetsytan (Tent 3)",
      directions: "The middle tent – follow the path straight ahead.",
    },
  },
};

// Låskod (samma för alla tält)
const LOCK_CODE = "2018";

// ─── Översättningar ──────────────────────────────────────────
const T: Record<Lang, Record<string, string>> = {
  sv: {
    backToHome: "Tillbaka till startsidan",
    digitalCheckin: "Digital incheckning",
    welcome: "Välkommen!",
    enterBooking: "Ange ditt bokningsnummer eller namn för att checka in.",
    bookingPlaceholder: "Bokningsnummer eller namn",
    enterBookingError: "Ange ditt bokningsnummer eller namn.",
    bookingNotFound: "Bokningen hittades inte. Kontrollera och försök igen.",
    notFoundTitle: "Vi hittade ingen bokning",
    notFoundHelp: "Dubbelkolla stavning och siffror. Hittar systemet fortfarande inte din bokning – SMS:a Christoffer direkt så löser vi det på en minut.",
    smsNow: "SMS:a Christoffer nu",
    callNow: "Ring 072-225 49 93",
    continue: "Fortsätt",
    problemSms: "Problem?",
    smsContact: "SMS:a Christoffer",
    termsTitle: "Villkor för vistelsen",
    termsSubtitle: "Godkänn villkoren för att få din låskod.",
    back: "Tillbaka",
    showLockCode: "Visa låskod",
    checkinComplete: "Incheckning klar!",
    yourTent: "Ditt tält",
    lockCodeLabel: "Din kod till låset:",
    goodToKnow: "Bra att veta",
    checkinFrom: "Incheckning från kl. 15:00",
    checkoutBy: "Utcheckning senast kl. 10:00",
    washDishes: "Diska i servicehuset (~150 m bort) och lämna köksytan ren",
    wasteSorting: "Allt skräp slängs i den svarta papperskorgen vid ingången. Pant lämnas i den vänstra soptunnan och allt annat avfall i den högra.",
    lateCheckoutTitle: "♡ Vill du checka ut lite senare? Du kan förlänga till kl. 12:00 för 400 kr. Swisha och meddela oss – så är det fixat.",
    swish: "Swisha",
    notifyUs: "Meddela oss",
    notWorking: "Fungerar något inte?",
    contactChristoffer: "Kontakta Christoffer via SMS",
    goHome: "Gå till startsidan →",
  },
  da: {
    backToHome: "Tilbage til forsiden",
    digitalCheckin: "Digital indtjekning",
    welcome: "Velkommen!",
    enterBooking: "Indtast dit bookingsnummer eller navn for at checke ind.",
    bookingPlaceholder: "Bookingsnummer eller navn",
    enterBookingError: "Indtast dit bookingsnummer eller navn.",
    bookingNotFound: "Bookingen blev ikke fundet. Tjek og prøv igen.",
    notFoundTitle: "Vi fandt ingen booking",
    notFoundHelp: "Tjek stavning og tal. Hvis systemet stadig ikke kan finde din booking – send Christoffer en SMS, så løser vi det på et minut.",
    smsNow: "SMS Christoffer nu",
    callNow: "Ring +46 72-225 49 93",
    continue: "Fortsæt",
    problemSms: "Problemer?",
    smsContact: "SMS Christoffer",
    termsTitle: "Vilkår for opholdet",
    termsSubtitle: "Accepter vilkårene for at få din låsekode.",
    back: "Tilbage",
    showLockCode: "Vis låsekode",
    checkinComplete: "Indtjekning gennemført!",
    yourTent: "Dit telt",
    lockCodeLabel: "Din kode til låsen:",
    goodToKnow: "Godt at vide",
    checkinFrom: "Indtjekning fra kl. 15:00",
    checkoutBy: "Udtjekning senest kl. 10:00",
    washDishes: "Vask dit service i servicehuset (~150 m væk) og efterlad køkkenoverfladen ren",
    wasteSorting: "Alt affald smides i den sorte papirkurv ved indgangen. Pantflasker lægges i den venstre skraldespand og alt andet affald i den højre.",
    lateCheckoutTitle: "♡ Vil du checke ud lidt senere? Du kan forlænge til kl. 12:00 for 400 kr. Swish og giv os besked – så er det ordnet.",
    swish: "Swish",
    notifyUs: "Giv os besked",
    notWorking: "Fungerer noget ikke?",
    contactChristoffer: "Kontakt Christoffer via SMS",
    goHome: "Gå til forsiden →",
  },
  en: {
    backToHome: "Back to homepage",
    digitalCheckin: "Digital check-in",
    welcome: "Welcome!",
    enterBooking: "Enter your booking number or name to check in.",
    bookingPlaceholder: "Booking number or name",
    enterBookingError: "Enter your booking number or name.",
    bookingNotFound: "Booking not found. Please check and try again.",
    notFoundTitle: "We couldn't find your booking",
    notFoundHelp: "Double-check the spelling and numbers. If the system still can't find your booking – text Christoffer right away and we'll sort it in a minute.",
    smsNow: "Text Christoffer now",
    callNow: "Call +46 72-225 49 93",
    continue: "Continue",
    problemSms: "Problem?",
    smsContact: "Text Christoffer",
    termsTitle: "Terms of stay",
    termsSubtitle: "Accept the terms to get your lock code.",
    back: "Back",
    showLockCode: "Show lock code",
    checkinComplete: "Check-in complete!",
    yourTent: "Your tent",
    lockCodeLabel: "Your code for the lock:",
    goodToKnow: "Good to know",
    checkinFrom: "Check-in from 3:00 PM",
    checkoutBy: "Check-out by 10:00 AM",
    washDishes: "Wash dishes in the service house (~150 m away) and leave the kitchen area clean",
    wasteSorting: "All rubbish goes in the black paper bin at the entrance. Deposit bottles go in the left bin and all other waste in the right one.",
    lateCheckoutTitle: "♡ Would you like to check out a bit later? You can extend until 12:00 PM for 400 SEK. Swish and let us know – and it's sorted.",
    swish: "Swish",
    notifyUs: "Notify us",
    notWorking: "Something not working?",
    contactChristoffer: "Contact Christoffer via SMS",
    goHome: "Go to homepage →",
  },
};


// ─── Villkor ─────────────────────────────────────────────────
const TERMS: Record<Lang, string[]> = {
  sv: [
    "Jag förstår att incheckning sker från kl. 15:00 och utcheckning senast kl. 10:00.",
    "Jag lämnar tältet i rimligt skick – städning ingår, men personliga tillhörigheter, skräp och matrester tas med vid utcheckning.",
    "Jag diskar mina egna kärl och bestick i servicehuset och lämnar köksytan ren efter användning.",
    "Allt skräp slängs i den svarta papperskorgen vid ingången. Pant lämnas i den vänstra soptunnan och allt annat avfall i den högra.",
    "Rökning är inte tillåten i eller i närheten av tälten.",
    "Jag visar hänsyn till medgäster, grannar och natur – och håller ljudnivån nere, särskilt kvällstid.",
    "Jag har läst och godkänner bokningsvillkoren.",
  ],
  da: [
    "Jeg forstår, at indtjekning er fra kl. 15:00 og udtjekning senest kl. 10:00.",
    "Jeg efterlader teltet i rimelig stand – rengøring er inkluderet, men personlige ejendele, affald og madrester medtages ved udtjekning.",
    "Jeg vasker mit eget service og bestik i servicehuset og efterlader køkkenoverfladen ren efter brug.",
    "Alt affald smides i den sorte papirkurv ved indgangen. Pantflasker lægges i den venstre skraldespand og alt andet affald i den højre.",
    "Rygning er ikke tilladt i eller i nærheden af teltene.",
    "Jeg viser hensyn til medgæster, naboer og natur – og holder lydniveauet nede, især om aftenen.",
    "Jeg har læst og accepterer bookingsbetingelserne.",
  ],
  en: [
    "I understand that check-in is from 3:00 PM and check-out is by 10:00 AM at the latest.",
    "I will leave the tent in reasonable condition – cleaning is included, but personal belongings, trash and food scraps will be taken with me at check-out.",
    "I will wash my own dishes and cutlery in the service house and leave the kitchen area clean after use.",
    "All rubbish goes in the black paper bin at the entrance. Deposit bottles go in the left bin and all other waste in the right one.",
    "Smoking is not allowed in or near the tents.",
    "I will be considerate of other guests, neighbours and nature – and keep noise levels down, especially in the evening.",
    "I have read and accept the booking terms.",
  ],
};

type Step = "booking" | "terms" | "code";

const CheckIn = () => {
  const [step, setStep] = useState<Step>("booking");
  const [bookingNumber, setBookingNumber] = useState("");
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [tentId, setTentId] = useState<TentId | null>(null);
  const [lang, setLang] = useState<Lang>("sv");
  const [termsAccepted, setTermsAccepted] = useState<boolean[]>([]);

  const t = T[lang];
  const currentTerms = TERMS[lang];

  const [lookupLoading, setLookupLoading] = useState(false);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = bookingNumber.trim();
    if (!raw) {
      setError(t.enterBookingError);
      return;
    }
    const trimmedUpper = raw.toUpperCase();

    // 1) Hårdkodade bokningar (fallback)
    let matchedBooking: Booking | null = VALID_BOOKINGS[trimmedUpper] ?? null;
    let resolvedBookingNumber = trimmedUpper;

    // Heuristik: innehåller bokstav + mellanslag => troligen namn
    const hasLetters = /[A-Za-zÀ-ÿ]/.test(raw);
    const hasDigits = /\d/.test(raw);

    // 2) Slå upp på bokningsnummer först (om det ser ut som ett)
    if (!matchedBooking && !(hasLetters && !hasDigits && /\s/.test(raw))) {
      setLookupLoading(true);
      const { data } = await supabase.rpc("lookup_booking_for_checkin", {
        p_booking_number: trimmedUpper,
      });
      setLookupLoading(false);
      const row = Array.isArray(data) ? data[0] : null;
      if (row && VALID_TENT_IDS.includes(row.tent_id as TentId)) {
        const dbLang: Lang = row.lang === "da" ? "da" : row.lang === "en" ? "en" : "sv";
        // Respektera användarens valda språk om det skiljer sig
        matchedBooking = { tentId: row.tent_id as TentId, lang: lang !== "sv" ? lang : dbLang };
      }
    }

    // 3) Slå upp på namn om vi inte hittade något och inputet innehåller bokstäver
    if (!matchedBooking && hasLetters && raw.length >= 3) {
      setLookupLoading(true);
      const { data } = await supabase.rpc("lookup_booking_for_checkin_by_name", {
        p_name: raw,
      });
      setLookupLoading(false);
      const row = Array.isArray(data) ? data[0] : null;
      if (row && VALID_TENT_IDS.includes(row.tent_id as TentId)) {
        const dbLang: Lang = row.lang === "da" ? "da" : row.lang === "en" ? "en" : "sv";
        matchedBooking = { tentId: row.tent_id as TentId, lang: lang !== "sv" ? lang : dbLang };
        resolvedBookingNumber = row.booking_number ?? trimmedUpper;
      }
    }

    if (!matchedBooking) {
      setError(t.bookingNotFound);
      return;
    }
    setBookingNumber(resolvedBookingNumber);
    setTentId(matchedBooking.tentId);
    setLang(matchedBooking.lang);
    setTermsAccepted(TERMS[matchedBooking.lang].map(() => false));
    setError("");
    setStep("terms");
  };

  const allTermsAccepted = termsAccepted.every(Boolean);

  const handleTermsSubmit = async () => {
    if (allTermsAccepted && tentId) {
      setStep("code");
      // Logga incheckning (fire-and-forget)
      try {
        await supabase.from("check_ins").insert({
          booking_number: bookingNumber.trim().toUpperCase(),
          tent_id: tentId,
          lang,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        });
      } catch (err) {
        console.error("Failed to log check-in", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Language switcher */}
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-full bg-primary-foreground/10 p-1 text-xs font-medium">
            {(["sv", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-full uppercase tracking-wider transition-colors ${
                  lang === l
                    ? "bg-accent text-accent-foreground"
                    : "text-primary-foreground/60 hover:text-primary-foreground"
                }`}
                aria-pressed={lang === l}
              >
                {l === "sv" ? "SV" : "EN"}
              </button>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <a href="/" className="inline-flex items-center gap-2 text-primary-foreground/50 hover:text-primary-foreground/80 text-sm mb-6 transition-colors">
            <ArrowLeft size={14} />
            {t.backToHome}
          </a>
          <p className="font-serif text-2xl font-bold text-primary-foreground">
            Bergs Slussar
          </p>
          <p className="text-[10px] font-sans font-medium tracking-[0.35em] uppercase text-primary-foreground/50 mt-1">
            {t.digitalCheckin}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {(["booking", "terms", "code"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step === s
                    ? "bg-accent text-accent-foreground scale-110"
                    : (["booking", "terms", "code"].indexOf(step) > i)
                    ? "bg-accent/30 text-primary-foreground"
                    : "bg-primary-foreground/10 text-primary-foreground/40"
                }`}
              >
                {["booking", "terms", "code"].indexOf(step) > i ? (
                  <CheckCircle size={16} />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div
                  className={`w-10 h-0.5 rounded-full transition-colors ${
                    ["booking", "terms", "code"].indexOf(step) > i
                      ? "bg-accent/50"
                      : "bg-primary-foreground/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Booking number */}
        {step === "booking" && (
          <div className="bg-card rounded-3xl p-8 shadow-2xl animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <KeyRound className="text-primary" size={24} />
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground text-center mb-2">
              {t.welcome}
            </h1>
            <p className="text-muted-foreground text-center text-sm mb-8">
              {t.enterBooking}
            </p>
            <form onSubmit={handleBookingSubmit}>
              <input
                type="text"
                value={bookingNumber}
                onChange={(e) => {
                  setBookingNumber(e.target.value);
                  setError("");
                }}
                placeholder={t.bookingPlaceholder}
                className="w-full bg-muted border border-border rounded-xl px-5 py-4 text-foreground text-center text-base placeholder:text-muted-foreground/50 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                autoFocus
                maxLength={80}
              />
              {error && (
                <p className="text-destructive text-sm mt-3 text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={lookupLoading}
                className="w-full mt-6 bg-accent text-accent-foreground py-4 rounded-xl font-semibold hover:scale-[1.02] transition-transform shadow-md disabled:opacity-60 disabled:hover:scale-100"
              >
                {lookupLoading ? "..." : t.continue}
              </button>
            </form>
            <p className="text-muted-foreground text-xs text-center mt-5">
              {t.problemSms}{" "}<a href="sms:0722254993" className="text-accent font-semibold hover:underline">{t.smsContact}</a>
            </p>
          </div>
        )}

        {/* Step 2: Terms */}
        {step === "terms" && (
          <div className="bg-card rounded-3xl p-8 shadow-2xl animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="text-primary" size={24} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground text-center mb-2">
              {t.termsTitle}
            </h2>
            <p className="text-muted-foreground text-center text-sm mb-8">
              {t.termsSubtitle}
            </p>
            <div className="space-y-4 mb-8">
              {currentTerms.map((term, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <div className="pt-0.5">
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        termsAccepted[i]
                          ? "bg-accent border-accent"
                          : "border-border group-hover:border-accent/50"
                      }`}
                      onClick={() => {
                        const updated = [...termsAccepted];
                        updated[i] = !updated[i];
                        setTermsAccepted(updated);
                      }}
                    >
                      {termsAccepted[i] && (
                        <CheckCircle size={14} className="text-accent-foreground" />
                      )}
                    </div>
                  </div>
                  <span
                    className="text-sm text-foreground leading-relaxed"
                    onClick={() => {
                      const updated = [...termsAccepted];
                      updated[i] = !updated[i];
                      setTermsAccepted(updated);
                    }}
                  >
                    {term}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("booking")}
                className="px-5 py-4 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
              >
                {t.back}
              </button>
              <button
                onClick={handleTermsSubmit}
                disabled={!allTermsAccepted}
                className={`flex-1 py-4 rounded-xl font-semibold transition-all shadow-md ${
                  allTermsAccepted
                    ? "bg-accent text-accent-foreground hover:scale-[1.02]"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {t.showLockCode}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Lock code */}
        {step === "code" && tentId && (
          <div className="bg-card rounded-3xl p-8 shadow-2xl animate-fade-in text-center">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-accent" size={36} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
              {t.checkinComplete}
            </h2>

            {/* Tent info */}
            <div className="bg-secondary rounded-xl p-5 mb-6 text-left">
              <p className="text-sm font-semibold text-foreground mb-1">{t.yourTent}</p>
              <p className="font-serif text-lg font-bold text-foreground">{TENT_INFO[lang][tentId].name}</p>
              <div className="flex items-start gap-2 mt-3">
                <MapPin className="text-accent shrink-0 mt-0.5" size={16} />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {TENT_INFO[lang][tentId].directions}
                </p>
              </div>
            </div>

            <p className="text-muted-foreground text-sm mb-4">
              {t.lockCodeLabel}
            </p>
            <div className="bg-primary rounded-2xl py-8 px-6 mb-8">
              <p className="font-mono text-6xl font-bold text-primary-foreground tracking-[0.3em]">
                {LOCK_CODE}
              </p>
            </div>
            <div className="bg-muted rounded-xl p-5 text-left space-y-2 mb-6">
              <p className="text-sm font-semibold text-foreground">{t.goodToKnow}:</p>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• {t.checkinFrom}</li>
                <li>• {t.checkoutBy}</li>
                <li>• {t.washDishes}</li>
                <li>• {t.wasteSorting}</li>
              </ul>
            </div>

            {/* Late checkout option */}
            <div className="bg-muted/50 rounded-xl p-5 text-left mb-6">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {t.lateCheckoutTitle}
              </p>
              <div className="flex gap-2">
                <a
                  href="https://app.swish.nu/1/p/sw/?token=0722254993&amt=400&msg=Sen%20utcheckning&edit=msg,amt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 border border-border text-foreground py-2.5 px-4 rounded-lg font-medium hover:bg-muted transition-colors text-sm"
                >
                  {t.swish}
                </a>
                <a
                  href={`sms:0722254993?body=${encodeURIComponent(
                    lang === "en"
                      ? `Hi! I've Swished 400 SEK for late check-out (12:00). Booking: ${bookingNumber} / ${TENT_INFO[lang][tentId].name}`
                      : lang === "da"
                      ? `Hej! Jeg har Swishet 400 kr for sen udtjekning (kl. 12). Booking: ${bookingNumber} / ${TENT_INFO[lang][tentId].name}`
                      : `Hej! Jag har swishat 400 kr för sen utcheckning (kl 12). Bokning: ${bookingNumber} / ${TENT_INFO[lang][tentId].name}`
                  )}`}
                  className="flex items-center justify-center gap-2 border border-border text-foreground py-2.5 px-4 rounded-lg font-medium hover:bg-muted transition-colors text-sm"
                >
                  {t.notifyUs}
                </a>
              </div>
            </div>

            {/* Contact support */}
            <div className="bg-muted rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground text-center">
                {t.notWorking}{" "}
                <a href="sms:0722254993" className="text-accent font-semibold hover:underline">
                  {t.contactChristoffer}
                </a>
              </p>
            </div>

            <a
              href="/"
              className="inline-block text-accent hover:underline text-sm font-medium"
            >
              {t.goHome}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckIn;
