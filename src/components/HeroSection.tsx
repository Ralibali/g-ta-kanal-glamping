import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import heroImg from "@/assets/glamping-sunset.jpg";
import heroImg2 from "@/assets/glamping-night-lights.jpg";
import heroImg3 from "@/assets/glamping-exterior-deck.jpg";
import { useLang } from "@/i18n/LanguageContext";

const slides = [heroImg, heroImg2, heroImg3];

const Star = () => (
  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const HeroSection = () => {
  const lang = useLang();
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
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {slides.map((img, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms]"
          aria-label={i === 0 ? "Glamping tält vid Göta kanal, Bergs Slussar i Östergötland" : undefined}
          role={i === 0 ? "img" : undefined}
          style={{
            backgroundImage: `url(${img})`,
            opacity: i === current ? 1 : 0,
            transform: `translateY(${scrollY * 0.3}px) scale(1.1)`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-black/[0.35]" />

      <div className="relative z-10 text-center px-6 md:px-4 max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0 }}
          className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[0.95] mb-5 md:mb-6"
        >
          {lang === "en"
            ? "Glamping by Göta Canal"
            : "Glamping vid Göta kanal"}
          <span className="block italic font-normal text-white/90 mt-2">
            {lang === "en" ? "– Bergs Slussar, Östergötland" : "– Bergs Slussar, Östergötland"}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-white/75 text-base md:text-xl font-sans mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed"
        >
          {lang === "en"
            ? "Cosy tents with double bed, heating and fridge – 15 minutes from Linköping. Breakfast available as add-on."
            : "Ombonade tält med dubbelsäng, värme och kylskåp – 15 minuter från Linköping. Frukost ingår som tillval."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center justify-center gap-1 mb-6"
        >
          {[...Array(5)].map((_, i) => <Star key={i} />)}
          <span className="text-white/70 text-sm font-sans ml-2">
            {lang === "en" ? "Top rated on Google – verified by Trustindex" : "Toppbetyg på Google – verifierat av Trustindex"}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center"
        >
          <motion.a
            href="#boka"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-accent text-accent-foreground px-8 md:px-10 py-3.5 md:py-4 rounded-full text-base md:text-lg font-semibold shadow-lg"
          >
            {lang === "en" ? "Book now" : "Boka nu"}
          </motion.a>
          <motion.a
            href="#talten"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="border-2 border-white/30 text-white px-8 md:px-10 py-3.5 md:py-4 rounded-full text-base md:text-lg font-semibold backdrop-blur-sm hover:bg-white/10 transition-colors"
          >
            {lang === "en" ? "See the tents" : "Se tälten"}
          </motion.a>
        </motion.div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2.5">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`h-1 rounded-full transition-all duration-500 ${i === current ? "w-8 bg-white/80" : "w-3 bg-white/30"}`} />
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="text-white/50" size={28} />
      </motion.div>
    </section>
  );
};

export default HeroSection;
