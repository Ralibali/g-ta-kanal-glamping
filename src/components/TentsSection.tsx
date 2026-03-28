import { motion } from "framer-motion";
import { Check } from "lucide-react";
import tentImg1 from "@/assets/glamping-interior-cozy.jpg";
import tentImg2 from "@/assets/glamping-interior-wide.jpg";
import tentImg3 from "@/assets/glamping-night-lights.jpg";
import { useLang } from "@/i18n/LanguageContext";

const TentsSection = () => {
  const lang = useLang();

  const tents = lang === "en"
    ? [
        { name: "Sjöbrisretreatet", image: tentImg1, features: ["Double bed", "Sofa bed", "Max 4 guests", "Heating", "Fridge"], price: "From 700 kr/person" },
        { name: "Naturkärnan", image: tentImg2, features: ["Double bed", "Sofa bed", "Max 4 guests", "Heating", "Fridge"], price: "From 700 kr/person" },
        { name: "Lugnets Yta", image: tentImg3, features: ["Double bed", "Max 2 guests", "Heating", "Fridge", "Pet-friendly"], price: "From 700 kr/person" },
      ]
    : [
        { name: "Sjöbrisretreatet", image: tentImg1, features: ["Dubbelsäng", "Bäddsoffa", "Max 4 pers", "Värme", "Kylskåp"], price: "Från 700 kr/person" },
        { name: "Naturkärnan", image: tentImg2, features: ["Dubbelsäng", "Bäddsoffa", "Max 4 pers", "Värme", "Kylskåp"], price: "Från 700 kr/person" },
        { name: "Lugnets Yta", image: tentImg3, features: ["Dubbelsäng", "Max 2 pers", "Värme", "Kylskåp", "Husdjursvänligt"], price: "Från 700 kr/person" },
      ];

  return (
    <section id="talten" className="py-24 md:py-32 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {lang === "en" ? "Choose your tent" : "Välj ditt tält"}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {tents.map((tent, i) => (
            <motion.div
              key={tent.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group bg-card rounded-3xl overflow-hidden border border-border/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col"
            >
              <div className="overflow-hidden aspect-[4/3] relative">
                <img
                  src={tent.image}
                  alt={`Glamping tent ${tent.name} at Bergs Slussar`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  loading="lazy"
                />
                <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                  {tent.price}
                </div>
              </div>
              <div className="p-7 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-foreground font-serif mb-4">{tent.name}</h3>
                <div className="space-y-2 mb-6 flex-1">
                  {tent.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="text-primary shrink-0" size={16} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <motion.a
                  href="#boka"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-full text-sm font-bold w-full text-center shadow-lg shadow-primary/20"
                >
                  {lang === "en" ? "Book this tent" : "Boka detta tält"}
                </motion.a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TentsSection;
