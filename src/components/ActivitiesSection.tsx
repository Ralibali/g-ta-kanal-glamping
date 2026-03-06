import { Trees, Waves, Footprints, Ship } from "lucide-react";
import activityImg from "@/assets/glamping-nature-kids.jpg";
import ScrollReveal from "./ScrollReveal";
import { useLang } from "@/i18n/LanguageContext";

const ActivitiesSection = () => {
  const lang = useLang();

  const activities = lang === "en" ? [
    { icon: Trees, title: "Nature", text: "Explore hiking trails and the lush greenery around Bergs Slussar, Ljungsbro and Stjärnorp." },
    { icon: Ship, title: "Göta Canal", text: "Explore the canal with paddleboards! Glide across the calm water and discover the beauty." },
    { icon: Waves, title: "Swimming in Roxen", text: "Clear and refreshing water. A wonderful spot for relaxation and a refreshing dip." },
    { icon: Footprints, title: "Stjärnorp Ravine", text: "Winding paths and Stjärnorp castle ruins – like stepping into a fairytale." },
  ] : [
    { icon: Trees, title: "Naturen", text: "Utforska vandringsleder och den frodiga grönskan runt Bergs Slussar, Ljungsbro och Stjärnorp." },
    { icon: Ship, title: "Göta Kanal", text: "Utforska kanalen med paddleboards! Glid fram över det lugna vattnet och upptäck skönheten." },
    { icon: Waves, title: "Bad i Roxen", text: "Klart och uppfriskande vatten. En underbar plats för avkoppling och ett uppfriskande dopp." },
    { icon: Footprints, title: "Stjärnorpsravinen", text: "Slingrande stigar och Stjärnorps slottsruin – som att kliva in i en sagobok." },
  ];

  return (
    <section id="aktiviteter" className="py-24 md:py-32 bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <ScrollReveal>
            <div className="relative">
              <img src={activityImg} alt="Children playing in nature by Göta Canal" className="rounded-3xl shadow-2xl w-full object-cover aspect-[3/2]" loading="lazy" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 border-2 border-accent/20 rounded-3xl -z-10" />
            </div>
          </ScrollReveal>

          <div>
            <ScrollReveal>
              <p className="text-accent font-sans text-sm tracking-[0.2em] uppercase mb-3 font-semibold">
                {lang === "en" ? "Activities" : "Aktiviteter"}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {lang === "en" ? "Activities near Bergs Slussar" : "Aktiviteter nära Bergs Slussar"}
                <span className="block italic font-normal text-accent">
                  {lang === "en" ? "& Göta Canal" : "& Göta kanal"}
                </span>
              </h2>
              <p className="text-muted-foreground mb-10">
                {lang === "en"
                  ? "Experience the nature of Östergötland. Hiking, swimming and more – all within reach from your glamping tent."
                  : "Upplev Östergötlands natur. Camping, vandring och bad – allt inom räckhåll från ditt glamping-boende."}
              </p>
            </ScrollReveal>

            <div className="grid gap-6">
              {activities.map((a, i) => (
                <ScrollReveal key={a.title} delay={i * 100}>
                  <div className="flex gap-5 group">
                    <div className="shrink-0 w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-accent group-hover:scale-105 transition-all duration-300">
                      <a.icon className="text-primary group-hover:text-accent-foreground transition-colors" size={22} />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-foreground mb-1">{a.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{a.text}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ActivitiesSection;
