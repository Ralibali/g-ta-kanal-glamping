import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, MapPin, Car, Clock, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/i18n/LanguageContext";

const GlampingLinkoping = () => {
  useEffect(() => {
    document.title = "Glamping nära Linköping – Bergs Slussar Glamping | Göta kanal";
    document.querySelector('meta[name="description"]')?.setAttribute("content", "Glamping bara 15 minuter från Linköping vid Bergs Slussar och Göta kanal. Ombonade tält med alla bekvämligheter. Boka online!");
  }, []);

  return (
    <LanguageProvider value="sv">
      <Navbar />
      <main className="pt-24">
        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Glamping nära Linköping – Bergs Slussar Glamping",
          "description": "Glamping bara 15 minuter från Linköping vid Bergs Slussar och Göta kanal.",
          "url": "https://goglampingsweden.se/glamping-linkoping",
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://goglampingsweden.se/" },
              { "@type": "ListItem", "position": 2, "name": "Glamping nära Linköping", "item": "https://goglampingsweden.se/glamping-linkoping" }
            ]
          }
        })}} />

        <article className="container max-w-3xl py-12 md:py-20">
          <nav className="text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Hem</Link>
            <span className="mx-2">›</span>
            <span className="text-foreground">Glamping nära Linköping</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Glamping nära Linköping – 15 minuter till Bergs Slussar
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Letar du efter en unik övernattning nära Linköping? Bergs Slussar Glamping erbjuder ombonade tält med allt du behöver för en avkopplande vistelse – bara 15 minuters bilresa från centrala Linköping. Här sover du vid Göta kanal i Östergötlands vackraste natur.
            </p>

            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Varför välja glamping vid Bergs Slussar?</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Bergs Slussar är en av de mest imponerande platserna längs Göta kanal. Med sina sju slussar i en trappa är det en av kanalens mest besökta platser – och det perfekta stället att kombinera historia, natur och komfortabelt boende. Till skillnad från vanlig camping erbjuder vi glamping med riktiga dubbelsängar, värme, minikylskåp och el i varje tält. Allt sänglinne, handdukar och städning ingår i priset.
            </p>

            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Så tar du dig hit från Linköping</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Från Linköpings centrum kör du norrut mot Ljungsbro och Vreta Kloster. Resan tar cirka 15 minuter med bil via E1/riksväg 36. Du kan också ta Östgötatrafikens bussar mot Berg eller Ljungsbro – hållplatsen ligger nära glampingområdet. Parkering finns på plats mot en liten avgift, och det är bara en kort promenad från parkeringen till tälten.
            </p>

            <div className="bg-sand rounded-2xl p-6 mb-8">
              <h3 className="font-serif text-xl font-bold text-foreground mb-4">Snabbfakta</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3"><MapPin className="text-primary shrink-0" size={18} /><span className="text-foreground">Adress: Bergs Slussar, Vreta Kloster (590 74)</span></div>
                <div className="flex items-center gap-3"><Car className="text-primary shrink-0" size={18} /><span className="text-foreground">15 min med bil från Linköping, parkering på plats</span></div>
                <div className="flex items-center gap-3"><Clock className="text-primary shrink-0" size={18} /><span className="text-foreground">Incheckning kl. 15:00, utcheckning kl. 11:00</span></div>
              </div>
            </div>

            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Vad som gör platsen unik</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Bergs Slussar är inte bara en historisk plats – det är en upplevelse. Under sommarmånaderna passerar båtar genom slussarna varje dag, och området bjuder på restauranger, caféer och natursköna promenader. Sjön Roxen ligger alldeles intill med badmöjligheter och paddleboard-uthyrning. Stjärnorpsravinen erbjuder spännande vandringar, och cykling längs kanalen är ett populärt alternativ.
            </p>

            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Det här ingår i priset</h2>
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {["Bäddade sängar med sänglinne & handdukar", "El för laddning och utrustning", "Minikylskåp och fläkt", "Kaffe, te & en flaska vatten", "Städning vid utcheckning", "Tillgång till servicehus med dusch & toalett"].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="text-primary shrink-0 mt-0.5" size={18} />
                  <span className="text-foreground text-sm">{item}</span>
                </div>
              ))}
            </div>

            <p className="text-muted-foreground leading-relaxed mb-8">
              Frukost kan bokas som tillval via Bostället – perfekt för dig som vill göra glampingupplevelsen extra komplett. Vill du utforska mer av regionen? Läs om{" "}
              <Link to="/glamping-gota-kanal" className="text-primary hover:underline font-medium">glamping vid Göta kanal</Link>.
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

export default GlampingLinkoping;
