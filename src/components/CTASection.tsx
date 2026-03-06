import ctaImg from "@/assets/glamping-person-deck.jpg";
import ScrollReveal from "./ScrollReveal";
import { useLang } from "@/i18n/LanguageContext";

const CTASection = () => {
  const lang = useLang();

  return (
    <section className="relative py-28 md:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(${ctaImg})` }} />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/30" />
      <div className="relative z-10 container max-w-2xl">
        <ScrollReveal>
          <p className="text-accent font-sans text-sm tracking-[0.2em] uppercase mb-4 font-semibold">
            {lang === "en" ? "Limited availability" : "Begränsat antal platser"}
          </p>
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
            {lang === "en" ? "Ready for an" : "Redo för en"}
            <span className="block italic font-normal">
              {lang === "en" ? "unforgettable night?" : "oförglömlig natt?"}
            </span>
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-10 leading-relaxed">
            {lang === "en"
              ? "Book your glamping stay by Göta Canal today. Our tents fill up quickly during the season."
              : "Boka din glamping-vistelse vid Göta kanal idag. Våra tält fylls snabbt under säsongen."}
          </p>
          <a href="#boka" className="inline-block bg-accent text-accent-foreground px-12 py-4 rounded-full text-lg font-semibold hover:scale-105 transition-transform shadow-xl">
            {lang === "en" ? "Book now →" : "Boka nu →"}
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default CTASection;
