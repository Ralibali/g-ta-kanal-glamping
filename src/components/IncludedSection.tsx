import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const IncludedSection = () => {
  const lang = useLang();

  const items = lang === "en"
    ? [
        "Made beds, bed linen & towels",
        "Electricity for charging and equipment",
        "Mini fridge",
        "Fan",
        "Coffee, tea & a bottle of water",
        "Cleaning at check-out",
        "Access to service house (toilet, shower, baby changing) ~150 m from the tents",
      ]
    : [
        "Bäddade sängar, sänglinne & handdukar",
        "El för mobilladdning och utrustning",
        "Minikylskåp",
        "Fläkt",
        "Kaffe, te & en flaska vatten",
        "Städning vid utcheckning",
        "Tillgång till servicehus (toalett, dusch, skötrum) ~150 m från tälten",
      ];

  return (
    <section className="py-20 md:py-28 bg-sand">
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {lang === "en" ? "Always included in the price" : "Det här ingår alltid i priset"}
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-4 mb-10">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex items-start gap-3"
            >
              <Check className="text-primary shrink-0 mt-0.5" size={20} />
              <span className="text-foreground font-medium">{item}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-accent/15 border border-accent/30 rounded-2xl p-5 flex items-center gap-3"
        >
          <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
            {lang === "en" ? "New" : "Nyhet"}
          </span>
          <p className="text-foreground font-medium text-sm">
            {lang === "en"
              ? "Breakfast via Bostället – choose as an add-on when booking"
              : "Frukost via Bostället – välj som tillval vid bokning"}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default IncludedSection;
