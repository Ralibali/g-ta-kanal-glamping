import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Om oss", href: "#om-oss" },
  { label: "Tälten", href: "#talten" },
  { label: "Boka", href: "#boka" },
  { label: "Galleri", href: "#galleri" },
  { label: "Aktiviteter", href: "#aktiviteter" },
  { label: "FAQ", href: "#faq" },
  { label: "Kontakt", href: "#kontakt" },
  
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-6"
      }`}
    >
      <div className="container flex items-center justify-between">
        <a href="#" className="font-serif text-xl md:text-2xl font-bold tracking-tight">
          <span className={scrolled ? "text-foreground" : "text-primary-foreground"}>
            Bergs Slussar
          </span>
          <span className={`block text-[10px] font-sans font-medium tracking-[0.35em] uppercase ${scrolled ? "text-accent" : "text-primary-foreground/60"}`}>
            Glamping vid Göta Kanal
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-all hover:opacity-80 ${
                  scrolled ? "text-foreground" : "text-primary-foreground/90"
                }`}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-all hover:opacity-80 ${
                  scrolled ? "text-foreground" : "text-primary-foreground/90"
                }`}
              >
                {link.label}
              </a>
            )
          )}
          <a
            href="#boka"
            className="bg-accent text-accent-foreground px-6 py-2.5 rounded-full text-sm font-semibold hover:scale-105 transition-transform shadow-sm"
          >
            Boka nu
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`lg:hidden p-2 ${scrolled ? "text-foreground" : "text-primary-foreground"}`}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-background/98 backdrop-blur-md border-t border-border animate-fade-in">
          <div className="container py-6 flex flex-col gap-4">
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-foreground text-lg font-medium py-2 border-b border-border/50"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-foreground text-lg font-medium py-2 border-b border-border/50"
                >
                  {link.label}
                </a>
              )
            )}
            <a
              href="#boka"
              onClick={() => setMenuOpen(false)}
              className="bg-accent text-accent-foreground px-5 py-3.5 rounded-full text-center font-semibold mt-2"
            >
              Boka nu
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
