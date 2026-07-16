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

  const homePath = lang === "en" ? "/en" : lang === "de" ? "/de" : "/";
  const bookingPath = lang === "en" ? "/en/boka" : lang === "de" ? "/de/boka" : "/boka";
  const sectionHref = (section: string) => `${homePath}#${section}`;

  const navLinks = lang === "de"
    ? [
        { label: "Über uns", href: sectionHref("om-oss") },
        { label: "Zelte", href: sectionHref("talten") },
        { label: "Aktivitäten", href: sectionHref("aktiviteter") },
        { label: "Anfahrt", href: sectionHref("kontakt") },
      ]
    : lang === "en"
    ? [
        { label: "About", href: sectionHref("om-oss") },
        { label: "Tents", href: sectionHref("talten") },
        { label: "Activities", href: sectionHref("aktiviteter") },
        { label: "Find us", href: sectionHref("kontakt") },
      ]
    : [
        { label: "Om oss", href: sectionHref("om-oss") },
        { label: "Tälten", href: sectionHref("talten") },
        { label: "Aktiviteter", href: sectionHref("aktiviteter") },
        { label: "Hitta hit", href: sectionHref("kontakt") },
      ];

  const openChat = () => window.dispatchEvent(new CustomEvent("open-chat"));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pickLang = (target: Lang) => {
    localStorage.setItem("lang-choice", target);
    setMenuOpen(false);
    navigate(target === "en" ? "/en" : target === "de" ? "/de" : "/");
  };

  const LANGS: Lang[] = ["sv", "en", "de"];
  const contactLabel = lang === "en" ? "Contact us" : lang === "de" ? "Kontakt" : "Kontakta oss";
  const bookLabel = lang === "en" ? "Book now" : lang === "de" ? "Jetzt buchen" : "Boka nu";

  return (
    <nav
      aria-label={lang === "en" ? "Main navigation" : "Huvudmeny"}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-border/50 shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container flex items-center justify-between">
        <Link to={homePath} aria-label={lang === "en" ? "Go to the homepage" : "Gå till startsidan"} className="flex items-center gap-2">
          <Leaf className={`${scrolled ? "text-primary" : "text-white"} transition-colors`} size={20} aria-hidden="true" />
          <span className={`font-serif text-xl font-bold tracking-tight ${scrolled ? "text-foreground" : "text-white"} transition-colors`}>
            Bergs Slussar Glamping
          </span>
        </Link>

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
          <div
            role="group"
            aria-label="Language"
            className={`inline-flex items-center gap-0.5 rounded-full border px-1 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
              scrolled ? "border-border text-foreground" : "border-white/30 text-white/90"
            }`}
          >
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => pickLang(l)}
                aria-pressed={lang === l}
                className={`px-2 py-0.5 rounded-full transition-colors ${
                  lang === l
                    ? scrolled ? "bg-primary text-primary-foreground" : "bg-white text-primary"
                    : "opacity-70 hover:opacity-100"
                }`}
              >{l}</button>
            ))}
          </div>
          <button
            type="button"
            onClick={openChat}
            className={`text-sm font-medium transition-all hover:opacity-80 ${
              scrolled ? "text-foreground" : "text-white/90"
            }`}
          >
            {contactLabel}
          </button>
          <motion.a
            href={bookingPath}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-accent text-accent-foreground px-6 py-2.5 rounded-full text-sm font-semibold shadow-sm"
          >
            {bookLabel}
          </motion.a>
        </div>

        <div className="flex lg:hidden items-center gap-3">
          <div
            role="group"
            aria-label="Language"
            className={`inline-flex items-center gap-0.5 rounded-full border px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              scrolled ? "border-border text-foreground" : "border-white/30 text-white"
            }`}
          >
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => pickLang(l)}
                aria-pressed={lang === l}
                className={`px-1.5 py-0.5 rounded-full transition-colors ${
                  lang === l
                    ? scrolled ? "bg-primary text-primary-foreground" : "bg-white text-primary"
                    : "opacity-70"
                }`}
              >{l}</button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={`p-2 ${scrolled ? "text-foreground" : "text-white"}`}
            aria-label={menuOpen ? (lang === "en" ? "Close menu" : lang === "de" ? "Menü schließen" : "Stäng meny") : (lang === "en" ? "Open menu" : lang === "de" ? "Menü öffnen" : "Öppna meny")}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            {menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <motion.div
          id="mobile-navigation"
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
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                openChat();
              }}
              className="text-foreground text-lg font-medium py-2 border-b border-border/50 text-left"
            >
              {contactLabel}
            </button>
            <a
              href={bookingPath}
              onClick={() => setMenuOpen(false)}
              className="bg-accent text-accent-foreground px-5 py-3.5 rounded-full text-center font-semibold mt-2"
            >
              {bookLabel}
            </a>
            </button>
            <a
              href={bookingPath}
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
