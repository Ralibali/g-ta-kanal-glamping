import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Mountain, Waves, TreePine } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/i18n/LanguageContext";

const GlampingOstergotland = () => {
  useEffect(() => {
    document.title = "Glamping i Östergötland – Bergs Slussar vid Göta kanal";
    document.querySelector('meta[name="description"]')?.setAttribute("content", "Boka glamping i Östergötland vid Bergs Slussar. Naturskön utsikt, ombonade tält och enkel transport från hela regionen.");
  }, []);

  return (
    <LanguageProvider value="sv">
      <Navbar />
      <main className="pt-24">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Glamping i Östergötland – Bergs Slussar vid Göta kanal",
          "url": "https://goglampingsweden.se/glamping-ostergotland",
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://goglampingsweden.se/" },
              { "@type": "ListItem", "position": 2, "name": "Glamping i Östergötland", "item": "https://goglampingsweden.se/glamping-ostergotland" }
            ]
          }
        })}} />

        <article className="container max-w-3xl py-12 md:py-20">
          <nav className="text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Hem</Link>
            <span className="mx-2">›</span>
            <span className="text-foreground">Glamping i Östergötland</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Glamping i Östergötland – Bergs Slussar Glamping
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Östergötland är en av Sveriges mest mångsidiga regioner för naturturism. Från Göta kanal och sjön Roxen till Ombergs ekopark och historiska slottsruiner – landskapet bjuder på upplevelser för alla smaker. Och mitt i allt detta ligger Bergs Slussar Glamping, ditt perfekta basläger för att utforska regionen.
            </p>

            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Östergötland som resmål</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Östergötland har en rik blandning av natur, kultur och historia. Göta kanal slingrar sig genom landskapet och erbjuder allt från båtresor till cykelturer längs dragvägarna. Sjön Roxen, en av Östergötlands största sjöar, lockar med badplatser, fiske och fågelskådning. Ombergs ekopark vid Vättern är ett av Sveriges mest spektakulära naturområden med utsiktspunkter, grottor och urskogsliknande miljöer.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Regionen är också känd för sina historiska platser – från Vadstena slott och kloster till Stjärnorps slottsruin, som ligger bara en kort promenad från Bergs Slussar. Linköpings domkyrka, Gamla Linköping och Flygvapenmuseum är andra populära utflyktsmål som alla ligger inom bekvämt avstånd.
            </p>

            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Varför glamping är det perfekta sättet att uppleva regionen</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Glamping ger dig närheten till naturen som camping erbjuder, men med den komfort du förväntar dig av ett hotell. Våra tält vid Bergs Slussar är utrustade med dubbelsängar, värme, minikylskåp och el. Sänglinne, handdukar och städning ingår alltid, och frukost kan bokas som tillval. Det betyder att du kan fokusera helt på upplevelsen – vare sig det är en solnedgång över kanalen, en morgonpromenad i skogen eller ett dopp i Roxen.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Mountain, title: "Ombergs ekopark", text: "Urskogar, grottor och utsikt – 45 min västerut" },
                { icon: Waves, title: "Sjön Roxen", text: "Bad, fiske och fågelskådning alldeles intill" },
                { icon: TreePine, title: "Stjärnorpsravinen", text: "Vandring och slottsruin på gångavstånd" },
              ].map((a) => (
                <div key={a.title} className="bg-sand rounded-xl p-5 text-center">
                  <a.icon className="text-primary mx-auto mb-3" size={28} />
                  <h3 className="font-serif font-bold text-foreground mb-1 text-sm">{a.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{a.text}</p>
                </div>
              ))}
            </div>

            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Avstånd från städer i regionen</h2>
            <div className="bg-sand rounded-2xl p-6 mb-8">
              <div className="space-y-3">
                {[
                  { city: "Linköping", time: "~15 min med bil" },
                  { city: "Norrköping", time: "~45 min med bil" },
                  { city: "Mjölby", time: "~30 min med bil" },
                  { city: "Motala", time: "~30 min med bil" },
                ].map((d) => (
                  <div key={d.city} className="flex items-center gap-3">
                    <MapPin className="text-primary shrink-0" size={16} />
                    <span className="text-foreground font-medium">{d.city}</span>
                    <span className="text-muted-foreground text-sm ml-auto">{d.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-8">
              Oavsett var i Östergötland du befinner dig är Bergs Slussar lätt att nå. Vill du veta mer om hur du tar dig hit från Linköping? Läs om{" "}
              <Link to="/glamping-linkoping" className="text-primary hover:underline font-medium">glamping nära Linköping</Link>.
            </p>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
              <Link to="/#boka" className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-8 py-4 rounded-full text-lg font-semibold shadow-lg">
                Boka glamping vid Bergs Slussar
                <ArrowRight size={20} />
              </Link>
            </motion.div>
          </motion.div>
        </article>
      </main>
      <Footer />
    </LanguageProvider>
  );
};

export default GlampingOstergotland;
