import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Waves, Footprints, Ship, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/i18n/LanguageContext";

const GlampingGotaKanal = () => {
  return (
    <LanguageProvider value="sv">
      <Navbar />
      <main className="pt-24">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Glamping vid Göta kanal – Bergs Slussar, Östergötland",
          "url": "https://goglampingsweden.se/glamping-gota-kanal",
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://goglampingsweden.se/" },
              { "@type": "ListItem", "position": 2, "name": "Glamping vid Göta kanal", "item": "https://goglampingsweden.se/glamping-gota-kanal" }
            ]
          }
        })}} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TouristAttraction",
          "name": "Bergs Slussar",
          "description": "Bergs slussar är en slusstrappa med sju slussar längs Göta kanal i Östergötland. En av kanalens mest besökta platser.",
          "url": "https://goglampingsweden.se/glamping-gota-kanal",
          "geo": { "@type": "GeoCoordinates", "latitude": 58.5357, "longitude": 15.5012 },
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Vreta Kloster",
            "addressRegion": "Östergötland",
            "addressCountry": "SE"
          },
          "touristType": ["Glamping", "Kanalturism", "Naturturism"]
        })}} />

        <article className="container max-w-3xl py-12 md:py-20">
          <nav className="text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Hem</Link>
            <span className="mx-2">›</span>
            <span className="text-foreground">Glamping vid Göta kanal</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Glamping vid Göta kanal – Sov direkt intill slussarna
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Tänk dig att vakna till ljudet av vatten som forslar genom historiska slussar, omgiven av Östergötlands gröna landskap. Bergs Slussar Glamping ger dig precis den upplevelsen – komfortabla tält med alla bekvämligheter, placerade alldeles intill en av Göta kanals mest ikoniska platser.
            </p>

            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Göta kanals historia och Bergs Slussar</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Göta kanal, ofta kallad "Sveriges blå band", invigdes 1832 efter över 20 års byggtid. Kanalen sträcker sig 190 km genom Sverige och förbinder Göteborg med Östersjön. Bergs Slussar är en av kanalens mest spektakulära platser – här finns en slusstrappa med hela sju slussar som lyfter båtarna 18,8 meter. Det är den längsta sammanhängande slusstappan i hela kanalsystemet, och varje sommar lockar den tusentals besökare som vill se båtarna passera genom de handmanövrerade slussarna.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Att bo här innebär att du lever mitt i kanalens puls. Under dagen kan du sitta på din tältveranda och se segelbåtar, turistbåtar och kanoter passera. På kvällen njuter du av solnedgången över det stilla kanalvattnet. Läs mer om Göta kanal och dess aktiviteter på{" "}
              <a href="https://www.gotakanal.se" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">gotakanal.se</a>.
            </p>

            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Aktiviteter vid kanalen</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: Waves, title: "SUP & paddling", text: "Hyr en SUP-bräda direkt på plats och glid fram på det lugna kanalvattnet. En unik upplevelse!" },
                { icon: Footprints, title: "Vandring", text: "Stjärnorpsravinen och kanalpromenaden bjuder på varierande terräng och vacker natur." },
                { icon: Ship, title: "Båttrafik", text: "Följ båtarna genom de sju slussarna – ett fascinerande skådespel varje dag under sommaren." },
                { icon: Waves, title: "Bad i Roxen", text: "Sjön Roxen ligger alldeles intill med badplatser och klart vatten för ett uppfriskande dopp." },
              ].map((a) => (
                <div key={a.title} className="bg-sand rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <a.icon className="text-primary" size={20} />
                    <h3 className="font-serif font-bold text-foreground">{a.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{a.text}</p>
                </div>
              ))}
            </div>

            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Varför glamping vid kanalen?</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Glamping kombinerar det bästa av camping och hotellkomfort. Du sover nära naturen men med riktiga sängar, värme och el. Vid Bergs Slussar får du dessutom en unik plats som inte går att replikera – kanalen, slussarna och den historiska miljön skapar en atmosfär som inget hotell kan matcha. Tälten är ombonade med dubbelsängar, minikylskåp och allt sänglinne inkluderat. Frukost kan bokas som tillval via Bostället, och servicehuset med dusch och toalett ligger bara 150 meter bort.
            </p>

            <p className="text-muted-foreground leading-relaxed mb-8">
              Bergs Slussar ligger centralt i Östergötland, bara 15 minuter från Linköping. Vill du veta mer om vad regionen erbjuder? Läs om{" "}
              <Link to="/glamping-ostergotland" className="text-primary hover:underline font-medium">glamping i Östergötland</Link>.
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

export default GlampingGotaKanal;
