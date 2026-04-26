import { Bed, Thermometer, ShowerHead, Plug, Snowflake, ParkingCircle } from "lucide-react";
import aboutImg from "@/assets/glamping-exterior-deck.jpg";
import aboutImg2 from "@/assets/glamping-interior-cozy.jpg";
import ScrollReveal from "./ScrollReveal";
import { useLang } from "@/i18n/LanguageContext";

const AboutSection = () => {
  const lang = useLang();

  const features = lang === "en" ? [
    { icon: Bed, label: "Comfortable double beds" },
    { icon: Thermometer, label: "Heated tents" },
    { icon: Snowflake, label: "Mini fridge" },
    { icon: ShowerHead, label: "Shower & toilet" },
    { icon: Plug, label: "Electricity & charging" },
    { icon: ParkingCircle, label: "Parking nearby" },
  ] : [
    { icon: Bed, label: "Bekväma dubbelsängar" },
    { icon: Thermometer, label: "Värme i tältet" },
    { icon: Snowflake, label: "Minikylskåp" },
    { icon: ShowerHead, label: "Dusch & toalett" },
    { icon: Plug, label: "El & laddning" },
    { icon: ParkingCircle, label: "Parkering nära" },
  ];

  return (
    <section id="om-oss" className="py-24 md:py-32 overflow-hidden" style={{ background: "var(--section-gradient)" }}>
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <ScrollReveal className="order-2 lg:order-1">
            <p className="text-accent font-sans text-sm tracking-[0.2em] uppercase mb-4 font-semibold">
              {lang === "en" ? "About the experience" : "Om upplevelsen"}
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8 leading-tight">
              {lang === "en" ? "Glamping at Bergs Slussar" : "Glamping vid Bergs Slussar"}
              <span className="block italic font-normal text-accent">
                {lang === "en" ? "– by Göta Canal in Östergötland" : "– vid Göta kanal i Östergötland"}
              </span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              {lang === "en"
                ? "Welcome to Bergs Slussar Glamping – cosy tents by Göta Canal in Vreta Kloster, just outside Linköping."
                : "Välkommen till Bergs Slussar Glamping – ombonade tält vid Göta kanal i Vreta Kloster, en kort bilresa från Linköping. Vi erbjuder en bekväm övernattning vid Göta kanal i hjärtat av Östergötland, där du sover gott i en bäddad säng under tältduken med slusstrappan, Roxen och en av Sveriges vackraste kanalmiljöer alldeles utanför."}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {lang === "en"
                ? "You sleep in a real bed with linen and towels, and the tents are equipped with heating, electricity, mini fridge and a fan. The service house with shower and toilet is on-site. It's a calm, naturnära alternative for couples, families and weekend guests who want comfort without losing the connection to nature."
                : "Du sover i en riktig säng med sänglinne och handdukar, och tälten har värme, el, minikylskåp och fläkt. Servicehuset med dusch och toalett ligger på området. Det är ett lugnt och naturnära alternativ för par, familjer och weekendgäster som vill ha komfort utan att tappa kontakten med naturen."}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-10">
              {lang === "en"
                ? "Whether you're looking for accommodation at Bergs Slussar, an overnight stay by Göta Canal or a quiet weekend close to Linköping – this is a place to slow down."
                : "Vare sig du letar efter boende vid Bergs Slussar, en övernattning vid Göta kanal eller en lugn weekend nära Linköping är det här en plats att varva ner på."}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-12">
              {features.map((f, i) => (
                <ScrollReveal key={f.label} delay={i * 60}>
                  <div className="flex items-center gap-3 bg-card rounded-xl p-3.5 border border-border/50 hover:shadow-md transition-shadow">
                    <f.icon className="text-primary shrink-0" size={18} />
                    <span className="text-sm font-medium text-foreground">{f.label}</span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal className="order-1 lg:order-2" delay={200}>
            <div className="relative">
              <img src={aboutImg} alt="Utsikt över Göta kanal från Bergs Slussar Glamping i Östergötland" className="rounded-3xl shadow-2xl w-full object-cover aspect-[4/5]" loading="lazy" />
              <div className="absolute -bottom-8 -left-8 w-2/5 hidden md:block">
                <img src={aboutImg2} alt="Inredning i glamping-tält vid Bergs Slussar – dubbelsäng och ombonad miljö" className="rounded-2xl shadow-xl border-4 border-background object-cover aspect-square" loading="lazy" />
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 border-2 border-accent/30 rounded-3xl -z-10" />
            </div>
          </ScrollReveal>
        </div>

        {/* SEO copy blocks */}
        {lang !== "en" && (
          <div className="max-w-3xl mx-auto mt-20 space-y-12">
            <ScrollReveal>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Boende vid Bergs Slussar – nära natur, kanal och Linköping
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Bergs Slussar är en av Göta kanals mest älskade platser. Slusstrappan med sju slussar i följd, kanalvattnet, Roxen och de gröna kullarna runt omkring skapar en miljö som är svår att hitta någon annanstans. Hos oss bor du mitt i den miljön – inte på avstånd, utan med slussarna inom gångavstånd.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Samtidigt har du Linköping inom femton minuters bilresa. Det gör vårt boende vid Bergs Slussar till ett naturligt val för dig som vill kombinera naturen med stadens utbud, eller bara ha en lugn bas att återvända till efter en dag på utflykt.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Glamping vid Göta kanal med bekvämligheter
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Vår glamping vid Göta kanal är gjord för dig som vill vara nära naturen utan att kompromissa på sömnen. Tälten har bäddade sängar, värme, el, minikylskåp och fläkt. Sänglinne och handdukar är framlagda, kaffe och te står framme och en flaska vatten väntar på bordet. Servicehuset med dusch och toalett ligger cirka hundrafemtio meter från tälten.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Frukost kan bokas som tillval via Bostället på området. Det är en enkel övernattning vid Göta kanal där det praktiska är förberett, så att du kan fokusera på utsikten, promenaderna och stillheten.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  För par, familjer och weekendgäster
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Vi har tre tält i olika storlek. Sjöbrisretreatet har dubbelsäng och bäddsoffa och passar familjer eller mindre sällskap. Naturkärnan och Lugnets Yta är något mindre och blir gärna ett romantiskt val för par. Barn upp till tolv år har rabatterade priser och kan sova tillsammans med vuxna i dubbelsängen.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  För dig som söker en weekend nära Linköping fungerar två nätter ofta bäst – då hinner du både med en kvällspromenad längs kanalen, en cykeltur eller paddleboard på Roxen och en lugn morgon med kaffet i handen.
                </p>
              </div>
            </ScrollReveal>
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutSection;
