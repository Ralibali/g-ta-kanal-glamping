import { Star, Clock, ShieldCheck, Heart } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const usps = [
  { icon: Star, title: "Allt ingår", text: "Sänglinne, handdukar, kaffe, te och städning – inga dolda kostnader." },
  { icon: Clock, title: "Enkel avbokning", text: "Kostnadsfri avbokning upp till fem dagar före ankomst." },
  { icon: ShieldCheck, title: "Tryggt & bekvämt", text: "El, värme, kylskåp och fräscht servicehus alldeles intill." },
  { icon: Heart, title: "Unikt läge", text: "Direkt vid Göta kanal – njut av solnedgångar, fågelsång och lugn." },
];

const SocialProofSection = () => {
  return (
    <section className="py-20 bg-foreground">
      <div className="container">
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
