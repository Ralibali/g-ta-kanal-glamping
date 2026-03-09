import tentImg1 from "@/assets/glamping-interior-cozy.jpg";
import tentImg2 from "@/assets/glamping-interior-wide.jpg";
import tentImg3 from "@/assets/glamping-night-lights.jpg";
import ScrollReveal from "./ScrollReveal";
import { useLang } from "@/i18n/LanguageContext";

const TentsSection = () => {
  const lang = useLang();

  const tents = lang === "en" ? [
    { name: "Sjöbrisretreatet", image: tentImg1, description: "An oasis of comfort. Spacious double bed with soft pillows and premium bed linen. Also offers a sofa bed.", extras: ["Double bed", "Sofa bed"], price: "From 700 kr/person", guests: "Up to 4 guests" },
    { name: "Naturkärnan", image: tentImg2, description: "Spacious double bed, high-quality linen and a sofa bed. Perfect for families seeking adventure.", extras: ["Double bed", "Sofa bed"], price: "From 700 kr/person", guests: "Up to 4 guests" },
    { name: "Lugnets Yta", image: tentImg3, description: "Our cosiest tent where peace and harmony meet. Perfect for relaxation. Pets welcome.", extras: ["Double bed", "Pet-friendly"], price: "From 700 kr/person", guests: "Up to 2 guests" },
  ] : [
    { name: "Sjöbrisretreatet", image: tentImg1, description: "En oas av komfort. Rymlig dubbelsäng med mjuka kuddar och sänglinne av högsta kvalitet. Erbjuder även en bäddsoffa.", extras: ["Dubbelsäng", "Bäddsoffa"], price: "Från 700 kr/person", guests: "Upp till 4 gäster" },
    { name: "Naturkärnan", image: tentImg2, description: "Rymlig dubbelsäng, högkvalitativt sänglinne och en bäddsoffa. Perfekt för familjer som söker äventyr.", extras: ["Dubbelsäng", "Bäddsoffa"], price: "Från 700 kr/person", guests: "Upp till 4 gäster" },
    { name: "Lugnets Yta", image: tentImg3, description: "Vårt mysigaste tält där lugn och harmoni möts. Perfekt för dig som söker avkoppling. Husdjur välkomna.", extras: ["Dubbelsäng", "Husdjursvänligt"], price: "Från 700 kr/person", guests: "Upp till 2 gäster" },
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
              <div className="group bg-card rounded-3xl overflow-hidden border border-border/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col">
                <div className="overflow-hidden aspect-[4/3] relative">
                  <img src={tent.image} alt={`Glamping tent ${tent.name} at Bergs Slussar`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Price badge */}
                  <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    {tent.price}
                  </div>
                </div>
                <div className="p-7 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-foreground font-serif">{tent.name}</h3>
                    <span className="text-xs text-muted-foreground">{tent.guests}</span>
                  </div>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {tent.extras.map((e) => (
                      <span key={e} className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full font-medium">{e}</span>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">{tent.description}</p>
                  <a href="#boka" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-transform w-full text-center shadow-lg shadow-primary/20">
                    <span>{lang === "en" ? "Book now" : "Boka nu"}</span>
                    <span aria-hidden="true">→</span>
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
