import { motion } from "framer-motion";
import { BedDouble, Zap, MapPin } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const USPSection = () => {
  const lang = useLang();

  const usps = lang === "en"
    ? [
        { icon: BedDouble, title: "Double bed & extra beds", text: "Made beds, bed linen and towels included." },
        { icon: Zap, title: "Everything included", text: "Electricity, heating, fridge, coffee, tea & water." },
        { icon: MapPin, title: "15 min from Linköping", text: "Parking available. Cycling distance to the canal locks." },
      ]
    : [
        { icon: BedDouble, title: "Dubbelsäng & extra bäddar", text: "Bäddade sängar, sänglinne och handdukar ingår." },
        { icon: Zap, title: "Allt ingår i priset", text: "El, värme, kylskåp, kaffe, te & vatten." },
        { icon: MapPin, title: "15 min från Linköping", text: "Parkering finns. Cykelavstånd till kanalslussarna." },
      ];

  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="grid md:grid-cols-3 gap-8">
          {usps.map((usp, i) => (
            <motion.div
              key={usp.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex items-start gap-4 text-center md:text-left md:flex-row flex-col md:items-start items-center"
            >
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <usp.icon className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground mb-1">{usp.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{usp.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default USPSection;
