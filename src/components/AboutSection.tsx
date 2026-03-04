import { Bed, Thermometer, UtensilsCrossed, ShowerHead, Plug, Snowflake } from "lucide-react";
import aboutImg from "@/assets/glamping-exterior-deck.jpg";

const features = [
  { icon: Bed, label: "Bekväma dubbelsängar" },
  { icon: Thermometer, label: "Värme i tältet" },
  { icon: Snowflake, label: "Minikylskåp" },
  { icon: UtensilsCrossed, label: "Kök & matlagning" },
  { icon: ShowerHead, label: "Dusch & toalett" },
  { icon: Plug, label: "El & laddning" },
];

const AboutSection = () => {
  return (
    <section id="om-oss" className="py-20 md:py-28" style={{ background: "var(--section-gradient)" }}>
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-accent font-sans text-sm tracking-[0.2em] uppercase mb-3 font-semibold">
              Om oss
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              Välkommen till Bergs Slussar Glamping
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Välkommen till en unik och varm upplevelse! Våra ombonade glampingtält står uppställda i naturskön
              omgivning precis vid Göta kanal i Berg, strax utanför Linköping.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Med bekväma dubbelsängar, möjlighet till extra bäddar, värme och kylskåp får du en avkopplande vistelse.
              Njut av närheten till naturen på ett annorlunda och ombonat sätt. Slappna av framför solnedgången
              och låt fåglarnas kvitter på morgonen förgylla din dag.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {features.map((f) => (
                <div key={f.label} className="flex items-center gap-3 bg-card rounded-lg p-3 border border-border/50">
                  <f.icon className="text-primary shrink-0" size={20} />
                  <span className="text-sm font-medium text-foreground">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative">
              <img
                src={aboutImg}
                alt="Glamping tält med utemöbler vid Göta kanal"
                className="rounded-2xl shadow-xl w-full object-cover aspect-[4/5]"
                loading="lazy"
              />
              <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-5 rounded-xl shadow-lg hidden md:block">
                <p className="font-serif text-2xl font-bold">5+</p>
                <p className="text-sm opacity-80">års erfarenhet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
