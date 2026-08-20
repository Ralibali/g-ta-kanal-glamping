import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, MapPin, KeyRound, Phone, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type TentId = "sjobris" | "naturkarnan" | "lugnetsyta";
type Lang = "sv" | "en" | "de";

const VALID_TENT_IDS: TentId[] = ["sjobris", "naturkarnan", "lugnetsyta"];

const TENT_NO: Record<TentId, number> = { sjobris: 1, naturkarnan: 2, lugnetsyta: 3 };

const LOCK_CODES: Record<TentId, string> = {
  sjobris: "2018",
  naturkarnan: "2018",
  lugnetsyta: "2026",
};

const TENT_INFO: Record<Lang, Record<TentId, { name: string; position: string; directions: string }>> = {
  sv: {
    sjobris: {
      name: "Sjöbrisretreatet",
      position: "Längst till höger",
      directions: "Gå rakt fram från QR-koden – tältet längst till höger.",
    },
    naturkarnan: {
      name: "Naturkärnan",
      position: "Längst till vänster",
      directions: "Gå till vänster och följ stigen – tältet längst till vänster.",
    },
    lugnetsyta: {
      name: "Lugnets yta",
      position: "I mitten",
      directions: "Följ stigen rakt fram – tältet i mitten.",
    },
  },
  en: {
    sjobris: {
      name: "Sjöbrisretreatet",
      position: "Furthest to the right",
      directions: "Walk straight ahead from the QR code – the tent furthest to the right.",
    },
    naturkarnan: {
      name: "Naturkärnan",
      position: "Furthest to the left",
      directions: "Go left and follow the path – the tent furthest to the left.",
    },
    lugnetsyta: {
      name: "Lugnets yta",
      position: "In the middle",
      directions: "Follow the path straight ahead – the middle tent.",
    },
  },
  de: {
    sjobris: {
      name: "Sjöbrisretreatet",
      position: "Ganz rechts",
      directions: "Vom QR-Code aus geradeaus – das Zelt ganz rechts.",
    },
    naturkarnan: {
      name: "Naturkärnan",
      position: "Ganz links",
      directions: "Nach links gehen und dem Pfad folgen – das Zelt ganz links.",
    },
    lugnetsyta: {
      name: "Lugnets yta",
      position: "In der Mitte",
      directions: "Dem Pfad geradeaus folgen – das mittlere Zelt.",
    },
  },
};

const T: Record<Lang, Record<string, string>> = {
  sv: {
    done: "Incheckning klar!",
    subtitle: "Här är ditt tält och din låskod.",
    tentWord: "Tält",
    tents: "Dina tält",
    position: "Placering",
    lockCode: "Låskod",
    sameCode: "Samma kod öppnar båda tälten.",
    ownCode: "Varje tält har sin egen kod.",
    signHint: "Kolla träskylten vid ingången – den visar tältets nummer och namn.",
    help: "Osäker på vilket tält? Ring Christoffer",
    stay: "Allt under vistelsen",
    home: "Gå till startsidan →",
  },
  en: {
    done: "Check-in complete!",
    subtitle: "Here is your tent and your lock code.",
    tentWord: "Tent",
    tents: "Your tents",
    position: "Location",
    lockCode: "Lock code",
    sameCode: "The same code opens both tents.",
    ownCode: "Each tent has its own code.",
    signHint: "Check the wooden sign by the entrance – it shows the tent number and name.",
    help: "Not sure which tent? Call Christoffer",
    stay: "Everything during your stay",
    home: "Go to the homepage →",
  },
  de: {
    done: "Check-in abgeschlossen!",
    subtitle: "Hier sind Ihr Zelt und Ihr Schlosscode.",
    tentWord: "Zelt",
    tents: "Ihre Zelte",
    position: "Lage",
    lockCode: "Schlosscode",
    sameCode: "Derselbe Code öffnet beide Zelte.",
    ownCode: "Jedes Zelt hat einen eigenen Code.",
    signHint: "Prüfen Sie das Holzschild am Eingang – es zeigt Nummer und Name des Zeltes.",
    help: "Unsicher, welches Zelt? Rufen Sie Christoffer an",
    stay: "Alles während Ihres Aufenthalts",
    home: "Zur Startseite →",
  },
};

const CheckedIn = ({ initialLang = "sv" }: { initialLang?: Lang } = {}) => {
  const [params] = useSearchParams();

  const langParam = (params.get("lang") ?? "") as Lang;
  const lang: Lang = ["sv", "en", "de"].includes(langParam) ? langParam : initialLang;
  const t = T[lang];

  const urlTents = (params.get("tents") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is TentId => VALID_TENT_IDS.includes(s as TentId));

  const bookingNumber = (params.get("b") ?? "").trim();
  const [liveTents, setLiveTents] = useState<TentId[] | null>(null);

  // Hämta alltid aktuella tält från bokningen så koden stämmer även om
  // gästen flyttats till ett annat tält efter incheckningen.
  useEffect(() => {
    if (!bookingNumber) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("list_tents_for_booking", {
        p_booking_number: bookingNumber.toUpperCase(),
      });
      if (cancelled || !Array.isArray(data)) return;
      const ids = data
        .map((r: { tent_id: string }) => r.tent_id as TentId)
        .filter((id): id is TentId => VALID_TENT_IDS.includes(id));
      if (ids.length > 0) setLiveTents(ids);
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingNumber]);

  const tents = liveTents ?? urlTents;

  const stayPath = lang === "en" ? "/during-your-stay" : lang === "de" ? "/de/under-vistelsen" : "/under-vistelsen";

  if (tents.length === 0) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-card rounded-3xl p-8 shadow-2xl text-center">
          <h1 className="font-serif text-2xl font-bold text-foreground mb-4">{t.done}</h1>
          <Link to="/checkin" className="text-accent font-semibold hover:underline">
            {lang === "en" ? "Open check-in" : lang === "de" ? "Check-in öffnen" : "Öppna incheckningen"}
          </Link>
        </div>
      </div>
    );
  }

  const codes = Array.from(new Set(tents.map((tid) => LOCK_CODES[tid])));
  const sameCode = codes.length === 1;

  return (
    <div className="min-h-screen bg-primary px-4 py-10">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-accent" size={32} />
          </div>
          <h1 className="font-serif text-3xl font-bold text-primary-foreground">{t.done}</h1>
          <p className="text-primary-foreground/70 text-sm mt-2">{t.subtitle}</p>
        </div>

        {tents.length > 1 && (
          <p className="text-primary-foreground/70 text-xs uppercase tracking-[0.2em] text-center mb-3">
            {t.tents}
          </p>
        )}

        <div className="space-y-5">
          {tents.map((tid) => (
            <div key={tid} className="bg-card rounded-3xl p-6 shadow-2xl">
              {/* Big tent number */}
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-24 h-24 rounded-2xl bg-primary text-primary-foreground flex flex-col items-center justify-center leading-none">
                  <span className="text-[10px] uppercase tracking-[0.2em] opacity-80">{t.tentWord}</span>
                  <span className="text-5xl font-bold mt-1">{TENT_NO[tid]}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-serif text-2xl font-bold text-foreground leading-tight">
                    {TENT_INFO[lang][tid].name}
                  </p>
                  <div className="inline-flex items-center gap-1.5 mt-2 rounded-full bg-accent/15 px-3 py-1">
                    <MapPin className="text-accent shrink-0" size={14} />
                    <span className="text-sm font-semibold text-foreground">
                      {TENT_INFO[lang][tid].position}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mt-4">
                {TENT_INFO[lang][tid].directions}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{t.signHint}</p>

              {/* Lock code */}
              <div className="mt-5 rounded-2xl bg-primary px-6 py-7 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <KeyRound className="text-accent" size={16} />
                  <p className="text-[11px] uppercase tracking-[0.25em] text-primary-foreground/80">
                    {t.lockCode}
                  </p>
                </div>
                <p className="font-mono text-6xl font-bold text-primary-foreground tracking-[0.25em]">
                  {LOCK_CODES[tid]}
                </p>
              </div>
            </div>
          ))}
        </div>

        {tents.length > 1 && (
          <p className="text-primary-foreground/70 text-xs text-center mt-4">
            {sameCode ? t.sameCode : t.ownCode}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <Link
            to={stayPath}
            className="flex items-center justify-center gap-2 w-full bg-accent text-accent-foreground rounded-xl py-3.5 font-semibold"
          >
            {t.stay}
            <ArrowRight size={16} />
          </Link>
          <a
            href="tel:0722254993"
            className="flex items-center justify-center gap-2 w-full border border-primary-foreground/25 text-primary-foreground rounded-xl py-3 text-sm"
          >
            <Phone size={15} />
            {t.help} 072-225 49 93
          </a>
          <div className="text-center">
            <Link to="/" className="text-primary-foreground/60 hover:text-primary-foreground text-sm">
              {t.home}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckedIn;
