import { motion } from "framer-motion";
import { Waves, Footprints, Bike } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Custom SUP icon using Waves with different styling
const ActivitiesSection = () => {
  const lang = useLang();

  const activities = lang === "en"
    ? [
        { icon: Waves, title: "Paddleboard on Göta Canal", text: "We offer SUP boards for rent right on-site.", color: "from-primary to-primary/70" },
        { icon: Footprints, title: "Hiking & nature", text: "Picturesque trails, Stjärnorp ravine and Lake Roxen.", color: "from-primary/90 to-primary/60" },
        { icon: Bike, title: "Cycling along the canal", text: "Cycle along Göta Canal – bike rental available nearby.", color: "from-primary/80 to-primary/50" },
        { icon: Waves, title: "Swimming in Lake Roxen", text: "Refreshing dip in clear water during summer.", color: "from-blue-700 to-blue-500" },
      ]
    : [
        { icon: Waves, title: "Paddleboard på Göta kanal", text: "Vi erbjuder SUP-bräda för uthyrning direkt på plats.", color: "from-primary to-primary/70" },
        { icon: Footprints, title: "Vandring & natur", text: "Pittoreska vandringsleder, Stjärnorpsravinen och Roxen.", color: "from-primary/90 to-primary/60" },
        { icon: Bike, title: "Cykling längs kanalen", text: "Cykla längs Göta kanal – cykeluthyrning finns nära.", color: "from-primary/80 to-primary/50" },
        { icon: Waves, title: "Badplats vid sjön Roxen", text: "Uppfriskande dopp i det klara vattnet sommartid.", color: "from-blue-700 to-blue-500" },
      ];

  return (
    <section id="aktiviteter" className="py-24 md:py-32 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {lang === "en" ? "What to do at Bergs Slussar?" : "Vad gör du i Bergs Slussar?"}
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activities.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`bg-gradient-to-br ${a.color} rounded-3xl p-6 text-white group hover:shadow-xl transition-shadow`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <a.icon className="text-white" size={24} />
              </div>
              <h3 className="font-serif text-lg font-bold mb-2">{a.title}</h3>
              <p className="text-white/80 text-sm leading-relaxed">{a.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ActivitiesSection;
