import { Star, Clock, ShieldCheck, Heart } from "lucide-react";

const usps = [
  { icon: Star, title: "Allt ingår", text: "Sänglinne, handdukar, kaffe, te och städning – allt ingår i priset." },
  { icon: Clock, title: "Enkel avbokning", text: "Kostnadsfri avbokning upp till 5 dagar före ankomst." },
  { icon: ShieldCheck, title: "Tryggt & bekvämt", text: "El, värme, kylskåp och fräscha servicehus alldeles intill." },
  { icon: Heart, title: "Unikt läge", text: "Precis vid Göta kanal med solnedgångar, fågelsång och total avkoppling." },
];

const SocialProofSection = () => {
  return (
    <section className="py-16 bg-primary">
      <div className="container">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {usps.map((usp) => (
            <div key={usp.title} className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-4">
                <usp.icon className="text-primary-foreground" size={24} />
              </div>
              <h3 className="font-serif text-lg font-bold text-primary-foreground mb-2">{usp.title}</h3>
              <p className="text-primary-foreground/70 text-sm leading-relaxed">{usp.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
