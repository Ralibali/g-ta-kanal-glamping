import { useEffect, useState } from "react";
import heroImg from "@/assets/glamping-sunset.jpg";
import heroImg2 from "@/assets/glamping-night-lights.jpg";
import heroImg3 from "@/assets/glamping-exterior-deck.jpg";

const slides = [heroImg, heroImg2, heroImg3];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative h-screen min-h-[650px] flex items-center justify-center overflow-hidden">
      {/* Parallax slideshow */}
      {slides.map((img, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms]"
          style={{
            backgroundImage: `url(${img})`,
            opacity: i === current ? 1 : 0,
            transform: `translateY(${scrollY * 0.3}px) scale(1.1)`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/40 to-foreground/70" />

      {/* Decorative frame */}
      <div className="absolute inset-6 md:inset-12 border border-primary-foreground/15 rounded-3xl pointer-events-none" />

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <div className="inline-block mb-6 px-4 py-1.5 border border-primary-foreground/30 rounded-full animate-fade-in">
          <p className="text-primary-foreground/80 font-sans text-xs md:text-sm tracking-[0.3em] uppercase">
            Göta Kanal · Berg · Linköping
          </p>
        </div>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground leading-[0.95] mb-8 animate-fade-in-up">
          Glamping vid
          <span className="block italic font-normal text-primary-foreground/90">Bergs Slussar</span>
        </h1>
        <p className="text-primary-foreground/75 text-lg md:text-xl font-sans mb-12 max-w-xl mx-auto animate-fade-in-up leading-relaxed" style={{ animationDelay: "0.2s" }}>
          Lyxigt boende i Östergötland vid Göta kanal, nära Linköping. Ombonade glampingtält med allt du behöver.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <a
            href="#boka"
            className="bg-accent text-accent-foreground px-10 py-4 rounded-full text-lg font-semibold hover:scale-105 transition-transform shadow-lg"
          >
            Boka ditt tält
          </a>
          <a
            href="#om-oss"
            className="border-2 border-primary-foreground/30 text-primary-foreground px-10 py-4 rounded-full text-lg font-semibold hover:bg-primary-foreground/10 transition-all backdrop-blur-sm"
          >
            Utforska
          </a>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === current ? "w-8 bg-primary-foreground/80" : "w-3 bg-primary-foreground/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
