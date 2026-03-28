import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X, Leaf } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLang, type Lang } from "@/i18n/LanguageContext";

const Navbar = () => {
  const lang = useLang();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = lang === "en"
    ? [
        { label: "About", href: "#om-oss" },
        { label: "Tents", href: "#talten" },
        { label: "Activities", href: "#aktiviteter" },
        { label: "Find us", href: "#kontakt" },
      ]
    : [
        { label: "Om oss", href: "#om-oss" },
        { label: "Tälten", href: "#talten" },
        { label: "Aktiviteter", href: "#aktiviteter" },
        { label: "Hitta hit", href: "#kontakt" },
      ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const switchLang = () => {
    const target = lang === "sv" ? "en" : "sv";
    localStorage.setItem("lang-choice", target);
    navigate(target === "en" ? "/en" : "/");
  };

  const otherLang: Lang = lang === "sv" ? "en" : "sv";
  const flagEmoji = lang === "sv" ? "🇬🇧" : "🇸🇪";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-border/50 shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container flex items-center justify-between">
        <a href={lang === "en" ? "/en" : "/"} className="flex items-center gap-2">
          <Leaf className={`${scrolled ? "text-primary" : "text-white"} transition-colors`} size={20} />
          <div>
            <span className={`font-serif text-xl font-bold tracking-tight ${scrolled ? "text-foreground" : "text-white"} transition-colors`}>
              Bergs Slussar Glamping
            </span>
          </div>
        </a>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-all hover:opacity-80 ${
                scrolled ? "text-foreground" : "text-white/90"
              }`}
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={switchLang}
            className={`text-sm font-medium transition-all hover:opacity-80 flex items-center gap-1.5 ${
              scrolled ? "text-foreground" : "text-white/90"
            }`}
            title={otherLang === "en" ? "Switch to English" : "Byt till svenska"}
          >
            <span className="text-base">{flagEmoji}</span>
            <span className="uppercase text-xs">{otherLang.toUpperCase()}</span>
          </button>
          <motion.a
            href="#boka"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-accent text-accent-foreground px-6 py-2.5 rounded-full text-sm font-semibold shadow-sm"
          >
            {lang === "en" ? "Book now" : "Boka nu"}
          </motion.a>
        </div>

        {/* Mobile toggle */}
        <div className="flex lg:hidden items-center gap-3">
          <button
            onClick={switchLang}
            className={`p-2 text-base ${scrolled ? "text-foreground" : "text-white"}`}
            title={otherLang === "en" ? "Switch to English" : "Byt till svenska"}
          >
            {flagEmoji}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`p-2 ${scrolled ? "text-foreground" : "text-white"}`}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="lg:hidden bg-white/98 backdrop-blur-md border-t border-border"
        >
          <div className="container py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-foreground text-lg font-medium py-2 border-b border-border/50"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#boka"
              onClick={() => setMenuOpen(false)}
              className="bg-accent text-accent-foreground px-5 py-3.5 rounded-full text-center font-semibold mt-2"
            >
              {lang === "en" ? "Book now" : "Boka nu"}
            </a>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
