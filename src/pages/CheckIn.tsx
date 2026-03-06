import { useState } from "react";
import { CheckCircle, KeyRound, ShieldCheck, ArrowLeft, MapPin } from "lucide-react";

// ─── Aktiva bokningsnummer ───────────────────────────────────
// Koppla bokningsnummer till tält: "sjobris", "naturkarnan" eller "lugnets"
type TentId = "sjobris" | "naturkarnan" | "lugnets";

const VALID_BOOKINGS: Record<string, TentId> = {
  "DEMO-1234": "sjobris",   // Ta bort dessa och lägg in riktiga
  "DEMO-5678": "naturkarnan",
  "DEMO-9012": "lugnets",
};

const TENT_INFO: Record<TentId, { name: string; directions: string }> = {
  sjobris: {
    name: "Sjöbrisretreatet",
    directions: "Gå rakt fram från QR-koden – tältet ligger rakt upp framför dig.",
  },
  naturkarnan: {
    name: "Naturkärnan",
    directions: "Gå till vänster och följ stigen – tältet ligger längst bort till vänster.",
  },
  lugnets: {
    name: "Lugnets Yta",
    directions: "Gå rakt fram och ta sedan mitten – tältet ligger i mitten av de tre.",
  },
};

// Låskod (samma för alla tält)
const LOCK_CODE = "2018";

// ─── Villkor ─────────────────────────────────────────────────
const TERMS = [
  "Jag förstår att incheckning sker från kl. 15:00 och utcheckning senast kl. 10:00.",
  "Jag lämnar tältet i rimligt skick – städning ingår, men personliga tillhörigheter, skräp och matrester tas med vid utcheckning.",
  "Jag diskar mina egna kärl och bestick i servicehuset och lämnar köksytan ren efter användning.",
  "Rökning är inte tillåten i eller i närheten av tälten.",
  "Jag har läst och godkänner bokningsvillkoren.",
];

type Step = "booking" | "terms" | "code";

const CheckIn = () => {
  const [step, setStep] = useState<Step>("booking");
  const [bookingNumber, setBookingNumber] = useState("");
  const [error, setError] = useState("");
  const [tentId, setTentId] = useState<TentId | null>(null);
  const [termsAccepted, setTermsAccepted] = useState<boolean[]>(
    TERMS.map(() => false)
  );

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = bookingNumber.trim().toUpperCase();
    if (!trimmed) {
      setError("Ange ditt bokningsnummer.");
      return;
    }
    const matchedTent = VALID_BOOKINGS[trimmed];
    if (!matchedTent) {
      setError("Bokningsnumret hittades inte. Kontrollera och försök igen.");
      return;
    }
    setTentId(matchedTent);
    setError("");
    setStep("terms");
  };

  const allTermsAccepted = termsAccepted.every(Boolean);

  const handleTermsSubmit = () => {
    if (allTermsAccepted) {
      setStep("code");
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <a href="/" className="inline-flex items-center gap-2 text-primary-foreground/50 hover:text-primary-foreground/80 text-sm mb-6 transition-colors">
            <ArrowLeft size={14} />
            Tillbaka till startsidan
          </a>
          <p className="font-serif text-2xl font-bold text-primary-foreground">
            Bergs Slussar
          </p>
          <p className="text-[10px] font-sans font-medium tracking-[0.35em] uppercase text-primary-foreground/50 mt-1">
            Digital incheckning
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
              Välkommen!
            </h1>
            <p className="text-muted-foreground text-center text-sm mb-8">
              Ange ditt bokningsnummer för att checka in.
            </p>
            <form onSubmit={handleBookingSubmit}>
              <input
                type="text"
                value={bookingNumber}
                onChange={(e) => {
                  setBookingNumber(e.target.value);
                  setError("");
                }}
                placeholder="T.ex. BSG-12345"
                className="w-full bg-muted border border-border rounded-xl px-5 py-4 text-foreground text-center text-lg font-mono tracking-widest placeholder:text-muted-foreground/50 placeholder:font-sans placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                autoFocus
                maxLength={30}
              />
              {error && (
                <p className="text-destructive text-sm mt-3 text-center">{error}</p>
              )}
              <button
                type="submit"
                className="w-full mt-6 bg-accent text-accent-foreground py-4 rounded-xl font-semibold hover:scale-[1.02] transition-transform shadow-md"
              >
                Fortsätt
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Terms */}
        {step === "terms" && (
          <div className="bg-card rounded-3xl p-8 shadow-2xl animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="text-primary" size={24} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground text-center mb-2">
              Villkor för vistelsen
            </h2>
            <p className="text-muted-foreground text-center text-sm mb-8">
              Godkänn villkoren för att få din låskod.
            </p>
            <div className="space-y-4 mb-8">
              {TERMS.map((term, i) => (
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
                Tillbaka
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
                Visa låskod
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Lock code */}
        {step === "code" && (
          <div className="bg-card rounded-3xl p-8 shadow-2xl animate-fade-in text-center">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-accent" size={36} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
              Incheckning klar!
            </h2>
            <p className="text-muted-foreground text-sm mb-8">
              Din kod till låset:
            </p>
            <div className="bg-primary rounded-2xl py-8 px-6 mb-8">
              <p className="font-mono text-6xl font-bold text-primary-foreground tracking-[0.3em]">
                {LOCK_CODE}
              </p>
            </div>
            <div className="bg-muted rounded-xl p-5 text-left space-y-2 mb-6">
              <p className="text-sm font-semibold text-foreground">Bra att veta:</p>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• Incheckning från kl. 15:00</li>
                <li>• Utcheckning senast kl. 10:00</li>
                <li>• Servicehuset finns ca 150 meter bort</li>
                <li>• Vid frågor, kontakta oss via e-post</li>
              </ul>
            </div>
            <a
              href="/"
              className="inline-block text-accent hover:underline text-sm font-medium"
            >
              Gå till startsidan →
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckIn;
