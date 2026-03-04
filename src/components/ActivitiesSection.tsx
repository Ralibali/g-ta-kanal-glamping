import { Trees, Waves, Footprints, Ship } from "lucide-react";
import activityImg from "@/assets/glamping-nature-kids.jpg";

const activities = [
  {
    icon: Trees,
    title: "Naturen",
    text: "Njut av naturskönhet runt Bergs Slussar, Ljungsbro och Stjärnorp. Utforska vandringsleder och den frodiga grönskan.",
  },
  {
    icon: Ship,
    title: "Göta Kanal",
    text: "Utforska Göta kanal med paddleboards! Glid fram över det lugna vattnet och upptäck kanalens skönhet.",
  },
  {
    icon: Waves,
    title: "Badmöjligheter",
    text: "Roxen erbjuder klart och uppfriskande vatten. En underbar plats för avkoppling och ett uppfriskande dopp.",
  },
  {
    icon: Footprints,
    title: "Vandring",
    text: "Stjärnorpsravinen med slingrande stigar och Stjärnorps slottsruin – perfekt för naturälskare.",
  },
];

const ActivitiesSection = () => {
  return (
    <section id="aktiviteter" className="py-20 md:py-28 bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <img
              src={activityImg}
              alt="Barn leker i naturen vid Göta kanal"
              className="rounded-2xl shadow-xl w-full object-cover aspect-[3/2]"
              loading="lazy"
            />
          </div>

          <div>
            <p className="text-accent font-sans text-sm tracking-[0.2em] uppercase mb-3 font-semibold">
              Aktiviteter
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Kom närmare naturen
            </h2>
            <p className="text-muted-foreground mb-10">
              Ändra ditt sätt att resa. Ta en stund att uppskatta vardagens skönhet.
            </p>

            <div className="grid gap-6">
              {activities.map((a) => (
                <div key={a.title} className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <a.icon className="text-primary" size={22} />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-foreground mb-1">{a.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{a.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ActivitiesSection;
