import ctaImg from "@/assets/glamping-person-deck.jpg";

const CTASection = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${ctaImg})` }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to right, hsla(30,10%,10%,0.75), hsla(30,10%,10%,0.4))" }} />
      <div className="relative z-10 container max-w-2xl">
        <h2 className="font-serif text-3xl md:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
          Redo för en oförglömlig upplevelse?
        </h2>
        <p className="text-primary-foreground/80 text-lg mb-8">
          Boka din glamping-vistelse vid Göta kanal idag. Begränsat antal platser – säkra din plats nu.
        </p>
        <a
          href="#boka"
          className="inline-block bg-accent text-accent-foreground px-10 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Boka nu →
        </a>
      </div>
    </section>
  );
};

export default CTASection;
