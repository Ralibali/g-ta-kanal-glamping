import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LanguageContext";
import { MessageCircle } from "lucide-react";

const openChat = () => {
  window.dispatchEvent(new CustomEvent("open-chat"));
};

const DOT_COUNT = 8;

const FloatingBookButton = () => {
  const lang = useLang();

  return (
    <div className="fixed bottom-5 right-5 md:bottom-6 md:right-6 z-[60] flex flex-col items-center gap-2">
      {/* Boka nu — ring med prickar som cirklar runt */}
      <Link
        to="/boka"
        aria-label={lang === "en" ? "Book now" : "Boka nu"}
        className="relative h-24 w-24 md:h-28 md:w-28 flex items-center justify-center group"
      >
        {/* Pulserande yttre glow */}
        <motion.span
          aria-hidden
          className="absolute inset-3 rounded-full bg-primary/30 blur-md z-10"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Grön bakgrund */}
        <span className="absolute h-16 w-16 md:h-20 md:w-20 rounded-full bg-primary border-2 border-accent shadow-xl group-hover:scale-105 transition-transform z-10" />

        {/* Roterande prickar ovanpå det gröna */}
        <motion.div
          aria-hidden
          className="absolute h-16 w-16 md:h-20 md:w-20 z-20"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: DOT_COUNT }).map((_, i) => {
            const angle = (i / DOT_COUNT) * 360;
            return (
              <span
                key={i}
                className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-accent shadow-[0_0_8px_rgba(201,168,76,0.9)]"
                style={{
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-26px)`,
                }}
              />
            );
          })}
        </motion.div>

        {/* Text ovanpå allt */}
        <span className="relative z-30 text-primary-foreground text-[11px] md:text-xs font-serif font-bold uppercase tracking-wider leading-tight text-center">
          {lang === "en" ? "Book now" : "Boka nu"}
        </span>
      </Link>

      {/* Kontakta oss – öppnar chatten */}
      <button
        onClick={openChat}
        className="inline-flex items-center gap-1.5 bg-card/95 backdrop-blur border border-border text-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-md hover:bg-card transition-colors"
      >
        <MessageCircle size={13} className="text-primary" />
        {lang === "en" ? "Contact us" : "Kontakta oss"}
      </button>
    </div>
  );
};

export default FloatingBookButton;
