import { Star, Clock, ShieldCheck, Heart } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { useLang } from "@/i18n/LanguageContext";

const SocialProofSection = () => {
  const lang = useLang();

  const usps = lang === "en" ? [
    { icon: Star, title: "All inclusive", text: "Bed linen, towels, coffee, tea and cleaning – no hidden costs." },
    { icon: Clock, title: "Easy cancellation", text: "Free cancellation up to five days before arrival." },
    { icon: ShieldCheck, title: "Safe & comfortable", text: "Electricity, heating, fridge and a fresh service house nearby." },
    { icon: Heart, title: "Unique location", text: "Right by Göta Canal – enjoy sunsets, birdsong and tranquility." },
  ] : [
    { icon: Star, title: "Allt ingår", text: "Sänglinne, handdukar, kaffe, te och städning – inga dolda kostnader." },
    { icon: Clock, title: "Enkel avbokning", text: "Kostnadsfri avbokning upp till fem dagar före ankomst." },
    { icon: ShieldCheck, title: "Tryggt & bekvämt", text: "El, värme, kylskåp och fräscht servicehus alldeles intill." },
    { icon: Heart, title: "Unikt läge", text: "Direkt vid Göta kanal – njut av solnedgångar, fågelsång och lugn." },
  ];

  return (
    <section className="py-20 bg-foreground">
      <div className="container">
        {/* Rating badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-14">
          <ScrollReveal>
            <a
              href="https://www.google.com/search?q=Bergs+Slussar+Glamping"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-primary-foreground/10 hover:bg-primary-foreground/15 transition-colors rounded-2xl px-6 py-4 backdrop-blur-sm border border-primary-foreground/10"
            >
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-primary-foreground font-serif">4.9</span>
                <div className="flex gap-0.5 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="text-left">
                <p className="text-primary-foreground font-semibold text-sm">Google</p>
                <p className="text-primary-foreground/50 text-xs">{lang === "en" ? "Reviews" : "Recensioner"}</p>
              </div>
            </a>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <a
              href="https://www.booking.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-primary-foreground/10 hover:bg-primary-foreground/15 transition-colors rounded-2xl px-6 py-4 backdrop-blur-sm border border-primary-foreground/10"
            >
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-primary-foreground font-serif">8.5</span>
                <p className="text-primary-foreground/50 text-[10px] uppercase tracking-wider mt-1">{lang === "en" ? "of 10" : "av 10"}</p>
              </div>
              <div className="text-left">
                <p className="text-primary-foreground font-semibold text-sm">Booking.com</p>
                <p className="text-primary-foreground/50 text-xs">{lang === "en" ? "Very good" : "Mycket bra"}</p>
              </div>
            </a>
          </ScrollReveal>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {usps.map((usp, i) => (
            <ScrollReveal key={usp.title} delay={i * 100}>
              <div className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                  <usp.icon className="text-primary-foreground/80" size={26} />
                </div>
                <h3 className="font-serif text-xl font-bold text-primary-foreground mb-2">{usp.title}</h3>
                <p className="text-primary-foreground/50 text-sm leading-relaxed">{usp.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
