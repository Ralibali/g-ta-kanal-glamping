import heroImg from "@/assets/glamping-sunset.jpg";

const HeroSection = () => {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImg})` }}
      />
      <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <p className="text-primary-foreground/70 font-sans text-sm tracking-[0.3em] uppercase mb-4 animate-fade-in">
          Göta Kanal · Berg · Linköping
        </p>
        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-in-up">
          Glamping vid <br className="hidden md:block" />Bergs Slussar
        </h1>
        <p className="text-primary-foreground/80 text-lg md:text-xl font-sans mb-10 max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          Upplev naturen på ett lyxigt sätt. Ombonade tält vid Göta kanal med allt du behöver för en minnesvärd vistelse.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <a
            href="#boka"
            className="bg-accent text-accent-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Boka ditt tält
          </a>
          <a
            href="#om-oss"
            className="border-2 border-primary-foreground/40 text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-foreground/10 transition-colors"
          >
            Läs mer
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary-foreground/40 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-primary-foreground/60 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
