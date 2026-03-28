import { motion } from "framer-motion";
import { MapPin, Car, Bus, ExternalLink } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const MapSection = () => {
  const lang = useLang();

  return (
    <section id="kontakt" className="py-20 md:py-28 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            {lang === "en" ? "How to find us" : "Hur du hittar hit"}
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="text-primary" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{lang === "en" ? "Address" : "Adress"}</p>
                  <p className="text-muted-foreground">Oscars Slussar 2, Vreta Kloster</p>
                  <p className="text-muted-foreground text-sm">
                    {lang === "en" ? "(approx. 15 min from Linköping)" : "(ca 15 min från Linköping)"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Car className="text-primary" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{lang === "en" ? "Parking" : "Parkering"}</p>
                  <p className="text-muted-foreground">
                    {lang === "en" ? "Available on-site, short walk to the tents." : "Finns på plats, kort promenad till tälten."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bus className="text-primary" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{lang === "en" ? "Public transport" : "Kollektivtrafik"}</p>
                  <p className="text-muted-foreground">
                    {lang === "en" ? "Östgötatrafiken towards Berg/Ljungsbro" : "Östgötatrafiken mot Berg/Ljungsbro"}
                  </p>
                </div>
              </div>
            </div>

            <motion.a
              href="https://maps.google.com/?q=58.5357,15.5012"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold shadow-lg"
            >
              {lang === "en" ? "Open in Google Maps" : "Öppna i Google Maps"}
              <ExternalLink size={16} />
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-2xl overflow-hidden shadow-xl"
          >
            <iframe
              src="https://maps.google.com/maps?q=58.5357,15.5012&z=14&output=embed"
              width="100%"
              height="350"
              style={{ border: 0, borderRadius: "1rem" }}
              allowFullScreen
              loading="lazy"
              title={lang === "en" ? "Map to Bergs Slussar Glamping" : "Karta till Bergs Slussar Glamping"}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MapSection;
