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
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8 leading-tight">
              {lang === "en" ? "Glamping in Sweden" : "Glamping nära Linköping"}
              <span className="block italic font-normal text-accent">
                {lang === "en" ? "– nature meets comfort" : "– natur möter komfort vid Göta kanal"}
              </span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              {lang === "en"
                ? "Our cosy glamping tents offer unique accommodation at Bergs Slussar by Göta Canal, just outside Linköping. Glamping Sweden at its finest."
                : "Våra ombonade glampingtält erbjuder unikt boende vid Bergs Slussar och Göta kanal, strax utanför Linköping i Vreta Kloster. Glamping Sweden på sitt bästa."}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-10">
              {lang === "en"
                ? "With comfortable double beds, heating and a fridge, you'll enjoy a relaxing stay. Parking is available nearby. Unwind in front of the sunset and let the birdsong brighten your morning."
                : "Med bekväma dubbelsängar, värme och kylskåp får du en avkopplande vistelse. Parkering finns i närheten. Slappna av framför solnedgången och låt fåglarnas kvitter förgylla din morgon."}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
      </div>
    </section>
  );
};

export default AboutSection;
