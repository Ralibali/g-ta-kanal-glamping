import tentImg1 from "@/assets/glamping-interior-cozy.jpg";
import tentImg2 from "@/assets/glamping-interior-wide.jpg";
import tentImg3 from "@/assets/glamping-night-lights.jpg";
import ScrollReveal from "./ScrollReveal";
import { useLang } from "@/i18n/LanguageContext";

const TentsSection = () => {
  const lang = useLang();

  const tents = lang === "en" ? [
    { name: "Sjöbrisretreatet", image: tentImg1, description: "An oasis of comfort. Spacious double bed with soft pillows and premium bed linen. Also offers a sofa bed.", extras: ["Double bed", "Sofa bed"] },
    { name: "Naturkärnan", image: tentImg2, description: "Spacious double bed, high-quality linen and a sofa bed. Perfect for families seeking adventure.", extras: ["Double bed", "Sofa bed"] },
    { name: "Lugnets Yta", image: tentImg3, description: "Our cosiest tent where peace and harmony meet. Perfect for relaxation. Pets welcome.", extras: ["Double bed", "Pet-friendly"] },
  ] : [
    { name: "Sjöbrisretreatet", image: tentImg1, description: "En oas av komfort. Rymlig dubbelsäng med mjuka kuddar och sänglinne av högsta kvalitet. Erbjuder även en extrabädd.", extras: ["Dubbelsäng", "Extrabädd"] },
    { name: "Naturkärnan", image: tentImg2, description: "Rymlig dubbelsäng, högkvalitativt sänglinne och en bäddsoffa. Perfekt för familjer som söker äventyr.", extras: ["Dubbelsäng", "Bäddsoffa"] },
    { name: "Lugnets Yta", image: tentImg3, description: "Vårt mysigaste tält där lugn och harmoni möts. Perfekt för dig som söker avkoppling. Husdjur välkomna.", extras: ["Dubbelsäng", "Husdjursvänligt"] },
  ];

  return (
    <section id="talten" className="py-24 md:py-32 bg-background">
      <div className="container">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-accent font-sans text-sm tracking-[0.2em] uppercase mb-3 font-semibold">
              {lang === "en" ? "Our tents" : "Våra tält"}
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {lang === "en" ? "Three unique glamping tents at Bergs Slussar" : "Tre unika glampingtält vid Bergs Slussar"}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {lang === "en"
                ? "Accommodation by Göta Canal – all tents with comfortable beds, heating, fridge and electricity. Bed linen, towels and cleaning included."
                : "Vårt boende vid Göta kanal – alla tält med bekväma sängar, värme, kylskåp och el. Sänglinne, handdukar och städning ingår i priset."}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {tents.map((tent, i) => (
            <ScrollReveal key={tent.name} delay={i * 150}>
              <div className="group bg-card rounded-3xl overflow-hidden border border-border/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <div className="overflow-hidden aspect-[4/3] relative">
                  <img src={tent.image} alt={`Glamping tent ${tent.name} at Bergs Slussar`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="p-7">
                  <h3 className="text-xl font-bold text-foreground mb-2 font-serif">{tent.name}</h3>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {tent.extras.map((e) => (
                      <span key={e} className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full font-medium">{e}</span>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">{tent.description}</p>
                  <a href="#boka" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold hover:scale-105 transition-transform w-full text-center">
                    {lang === "en" ? "See price & book →" : "Se pris & boka →"}
                  </a>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TentsSection;
