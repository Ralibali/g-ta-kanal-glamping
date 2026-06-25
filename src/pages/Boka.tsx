import { useEffect, useRef, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Menu, X, Leaf, BedDouble, Flame, Sparkles, TreePine, Coffee, Waves, ShieldCheck, CalendarCheck, MailCheck, ChevronDown, Star, Phone, ArrowRight } from "lucide-react";
import SirvoyBookingWidget from "@/components/SirvoyBookingWidget";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/i18n/LanguageContext";
import heroImg from "@/assets/glamping-sunset.jpg";
import editorialA from "@/assets/glamping-exterior-deck.jpg";
import editorialB from "@/assets/glamping-interior-beds.jpg";
import editorialC from "@/assets/glamping-night-lights.jpg";

const PALETTE = {
  primary: "#617457",
  text: "#243027",
  cream: "#F6F2E9",
  white: "#FFFDF8",
  sand: "#D7C7AC",
  gold: "#B59465",
};

const FONT_STYLES = `
  .boka-page { font-family: 'Manrope', system-ui, sans-serif; color: ${PALETTE.text}; background: ${PALETTE.white}; }
  .boka-page h1, .boka-page h2, .boka-page h3 { font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; font-weight: 500; letter-spacing: -0.01em; }
  .boka-eyebrow { font-family: 'Manrope', sans-serif; font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 600; }
  @media (prefers-reduced-motion: reduce) {
    .boka-page * { animation: none !important; transition: none !important; }
  }
`;

const navLinks = [
  { label: "Om glampingen", href: "#om" },
  { label: "Våra tält", href: "#talten" },
  { label: "Vanliga frågor", href: "#faq" },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const textColor = scrolled ? PALETTE.text : PALETTE.white;

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? PALETTE.white : "transparent",
        borderBottom: scrolled ? `1px solid ${PALETTE.sand}66` : "1px solid transparent",
        boxShadow: scrolled ? "0 6px 30px rgba(36,48,39,0.06)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-8 flex items-center justify-between" style={{ paddingTop: scrolled ? 14 : 22, paddingBottom: scrolled ? 14 : 22, transition: "padding 300ms" }}>
        <Link to="/" className="flex items-center gap-2.5" style={{ color: textColor }}>
          <Leaf size={20} strokeWidth={1.6} />
          <span className="font-serif text-lg md:text-xl tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>
            Bergs Slussar Glamping
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-9">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm hover:opacity-70 transition-opacity" style={{ color: textColor }}>
              {l.label}
            </a>
          ))}
          <a
            href="#boka"
            className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium transition-all hover:brightness-110"
            style={{ background: PALETTE.primary, color: PALETTE.white }}
          >
            Boka din vistelse
          </a>
        </nav>

        <div className="md:hidden flex items-center gap-2">
          <a href="#boka" className="rounded-full px-4 py-2 text-sm font-medium" style={{ background: PALETTE.primary, color: PALETTE.white }}>
            Boka
          </a>
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Stäng meny" : "Öppna meny"}
            className="p-2 rounded-md"
            style={{ color: textColor }}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden" style={{ background: PALETTE.white, borderTop: `1px solid ${PALETTE.sand}55` }}>
          <div className="px-6 py-5 flex flex-col gap-4">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-base py-2"
                style={{ color: PALETTE.text, minHeight: 48 }}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

const StickyMobileCTA = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("boka");
    if (!target) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting && window.scrollY > 400);
      },
      { threshold: 0.05 }
    );
    io.observe(target);
    const onScroll = () => {
      if (window.scrollY < 400) setVisible(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-40 px-4 py-3"
      style={{
        background: `${PALETTE.white}f0`,
        backdropFilter: "blur(12px)",
        borderTop: `1px solid ${PALETTE.sand}55`,
      }}
    >
      <a
        href="#boka"
        className="flex items-center justify-center w-full rounded-full text-base font-medium"
        style={{ background: PALETTE.primary, color: PALETTE.white, minHeight: 52 }}
      >
        Se lediga datum
      </a>
    </div>
  );
};

const Hero = () => (
  <section className="relative w-full" style={{ minHeight: "92vh" }}>
    <img
      src={heroImg}
      alt="Glampingtält vid Göta kanal, Bergs Slussar"
      width={1920}
      height={1280}
      fetchPriority="high"
      decoding="async"
      className="absolute inset-0 w-full h-full object-cover"
    />
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(180deg, rgba(36,48,39,0.45) 0%, rgba(36,48,39,0.35) 45%, rgba(36,48,39,0.65) 100%)`,
      }}
    />

    <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 pt-40 md:pt-48 pb-32 md:pb-56" style={{ color: PALETTE.white }}>
      <p className="boka-eyebrow mb-6" style={{ color: PALETTE.sand }}>
        Glamping vid Göta kanal
      </p>
      <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.02] max-w-3xl mb-7" style={{ color: PALETTE.white }}>
        Sov mjukt.
        <br />
        <em className="not-italic" style={{ fontStyle: "italic", color: PALETTE.white }}>Vakna vid vattnet.</em>
      </h1>
      <p className="text-base md:text-lg max-w-xl leading-relaxed" style={{ color: "#FFFDF8d9" }}>
        Ombonade glampingtält med bäddade sängar, värme och el – mitt vid Bergs slussar och bara 15 minuter från Linköping.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm" style={{ color: "#FFFDF8cc" }}>
        <span className="inline-flex items-center gap-2"><BedDouble size={16} strokeWidth={1.5} /> Bäddade sängar</span>
        <span className="inline-flex items-center gap-2"><TreePine size={16} strokeWidth={1.5} /> Privat uteplats</span>
        <span className="inline-flex items-center gap-2"><Flame size={16} strokeWidth={1.5} /> Värme och el</span>
      </div>
    </div>

    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:block" style={{ color: `${PALETTE.white}99` }}>
      <ChevronDown size={26} />
    </div>
  </section>
);

const BookingCard = () => (
  <section id="boka" className="relative z-20 -mt-24 md:-mt-40 mb-20 md:mb-28">
    <div className="max-w-[1180px] mx-auto px-4 md:px-8">
      <div
        className="rounded-[24px] p-6 md:p-12"
        style={{
          background: PALETTE.white,
          border: `1px solid ${PALETTE.sand}80`,
          boxShadow: "0 30px 80px -30px rgba(36,48,39,0.18), 0 4px 14px -6px rgba(36,48,39,0.06)",
        }}
      >
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
          <p className="boka-eyebrow mb-3" style={{ color: PALETTE.gold }}>Bokning</p>
          <h2 className="text-4xl md:text-5xl mb-3">Hitta din vistelse</h2>
          <p className="text-base md:text-lg" style={{ color: "#3a4a3d" }}>
            Välj datum och antal gäster för att se lediga tält och aktuellt pris.
          </p>
        </div>

        <SirvoyBookingWidget />

        <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-sm" style={{ borderColor: `${PALETTE.sand}66`, color: "#3a4a3d" }}>
          {[
            { icon: <CalendarCheck size={16} strokeWidth={1.5} />, text: "Direkt bekräftelse" },
            { icon: <ShieldCheck size={16} strokeWidth={1.5} />, text: "Säker betalning" },
            { icon: <Sparkles size={16} strokeWidth={1.5} />, text: "Bästa tillgängliga direktpris" },
            { icon: <MailCheck size={16} strokeWidth={1.5} />, text: "Personlig incheckning" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2.5" style={{ color: PALETTE.primary }}>
              {t.icon}
              <span style={{ color: PALETTE.text }}>{t.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const Benefits = () => {
  const items = [
    { icon: <BedDouble size={22} strokeWidth={1.3} />, title: "Riktiga bäddade sängar", text: "Mjuka madrasser, rena lakan och varma täcken – redo när ni kliver in." },
    { icon: <Flame size={22} strokeWidth={1.3} />, title: "Värme och el i tältet", text: "Behaglig temperatur året om och uttag för det ni behöver." },
    { icon: <Sparkles size={22} strokeWidth={1.3} />, title: "Handdukar och sänglinne ingår", text: "Inget att packa eller bära – allt finns på plats när ni anländer." },
    { icon: <TreePine size={22} strokeWidth={1.3} />, title: "Egen uteplats", text: "Sitt ute med en kopp kaffe och låt morgonen vakna i lugn och ro." },
    { icon: <Coffee size={22} strokeWidth={1.3} />, title: "Frukost kan läggas till", text: "Lägg till en god frukost vid bokningen och börja dagen ostressat." },
    { icon: <Waves size={22} strokeWidth={1.3} />, title: "Göta kanal runt hörnet", text: "Slussar, promenadstråk och båtliv ligger bara några steg bort." },
  ];

  return (
    <section id="om" className="py-24 md:py-32" style={{ background: PALETTE.cream }}>
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="max-w-2xl mb-14 md:mb-20">
          <p className="boka-eyebrow mb-4" style={{ color: PALETTE.gold }}>Det här ingår</p>
          <h2 className="text-4xl md:text-5xl leading-tight">Allt för ett lugnare dygn</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 md:gap-y-16">
          {items.map((it) => (
            <div key={it.title} className="border-t pt-6" style={{ borderColor: `${PALETTE.primary}33` }}>
              <div style={{ color: PALETTE.primary }} className="mb-4">{it.icon}</div>
              <h3 className="text-2xl mb-2">{it.title}</h3>
              <p className="text-[15px] leading-relaxed" style={{ color: "#3a4a3d" }}>{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Editorial = () => (
  <section id="talten" className="py-24 md:py-32" style={{ background: PALETTE.white }}>
    <div className="max-w-6xl mx-auto px-6 md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-end">
        <div className="md:col-span-5 md:pb-12">
          <p className="boka-eyebrow mb-4" style={{ color: PALETTE.gold }}>Tre tält</p>
          <h2 className="text-4xl md:text-5xl leading-tight mb-5">Tre tält. En alldeles särskild plats.</h2>
          <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: "#3a4a3d" }}>
            Här bor ni nära både naturen, kanalen och Bergs slussars restauranger och promenadstråk. Tälten är ombonade för en bekväm vistelse utan att känslan av natur försvinner.
          </p>
          <a
            href="#boka"
            className="inline-flex items-center rounded-full px-6 py-3 text-sm font-medium border transition-colors"
            style={{ borderColor: PALETTE.primary, color: PALETTE.primary, minHeight: 48 }}
          >
            Kontrollera tillgänglighet
          </a>
        </div>

        <div className="md:col-span-7 grid grid-cols-6 gap-4 md:gap-5">
          <div className="col-span-6">
            <img
              src={editorialA}
              alt="Glampingtält med uteplats vid Bergs slussar"
              loading="lazy"
              width={1200}
              height={800}
              className="w-full h-[280px] md:h-[420px] object-cover rounded-[20px]"
            />
          </div>
          <div className="col-span-3">
            <img
              src={editorialB}
              alt="Interiör med bäddade sängar i glampingtält"
              loading="lazy"
              width={800}
              height={800}
              className="w-full h-[180px] md:h-[260px] object-cover rounded-[20px]"
            />
          </div>
          <div className="col-span-3">
            <img
              src={editorialC}
              alt="Glampingtält upplyst på kvällen"
              loading="lazy"
              width={800}
              height={800}
              className="w-full h-[180px] md:h-[260px] object-cover rounded-[20px]"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Steps = () => {
  const steps = [
    { n: "01", title: "Välj datum och tält", text: "Använd bokningskalendern högst upp för att se lediga nätter." },
    { n: "02", title: "Slutför bokningen säkert", text: "Direkt bekräftelse på e-post med all information om din vistelse." },
    { n: "03", title: "Få information inför ankomsten", text: "Vi mejlar incheckningsdetaljer och praktiska tips ett par dagar innan." },
  ];

  return (
    <section className="py-24 md:py-32" style={{ background: PALETTE.primary, color: PALETTE.white }}>
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="max-w-2xl mb-14 md:mb-20">
          <p className="boka-eyebrow mb-4" style={{ color: PALETTE.sand }}>Så går det till</p>
          <h2 className="text-4xl md:text-5xl leading-tight" style={{ color: PALETTE.white }}>
            Enkel bokning från början till slut
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14 mb-14">
          {steps.map((s) => (
            <div key={s.n}>
              <div className="font-serif text-5xl mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: PALETTE.sand }}>{s.n}</div>
              <h3 className="text-2xl mb-3" style={{ color: PALETTE.white }}>{s.title}</h3>
              <p className="text-[15px] leading-relaxed" style={{ color: "#FFFDF8cc" }}>{s.text}</p>
            </div>
          ))}
        </div>

        <p className="text-base max-w-2xl" style={{ color: "#FFFDF8cc" }}>
          Efter bokningen får gästen en direkt bekräftelse. När ankomstdagen närmar sig får gästen information om incheckning, tält och praktiska detaljer.
        </p>
      </div>
    </section>
  );
};

const faqs = [
  { q: "När kan vi checka in?", a: "Incheckning sker från klockan 15:00. Du får en personlig incheckningslänk via e-post med kod och praktisk information innan ankomst." },
  { q: "När behöver vi checka ut?", a: "Utcheckning sker senast klockan 11:00. Vill ni stanna längre kan sen utcheckning ofta läggas till mot en tilläggsavgift." },
  { q: "Finns det toalett och dusch?", a: "Ja, det finns ett servicehus med moderna toaletter och duschar i närheten av tälten." },
  { q: "Kan vi lägga till frukost?", a: "Ja, frukost kan läggas till vid bokningen som ett tillval och serveras vid Bergs slussar." },
  { q: "Får barn bo i tälten?", a: "Ja, barn är varmt välkomna. Kontakta oss gärna om ni behöver en extra bädd så löser vi det." },
  { q: "Finns det värme och el?", a: "Ja, alla tält har värme och eluttag så att vistelsen blir behaglig oavsett väder." },
  { q: "Hur fungerar incheckningen?", a: "Incheckningen är digital. Ni får en kod via e-post i god tid innan ankomst och kan checka in själva när det passar er." },
  { q: "Finns parkering?", a: "Ja, det finns parkering i anslutning till Bergs slussar inom kort gångavstånd från glampingen." },
];

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 md:py-32" style={{ background: PALETTE.cream }}>
      <div className="max-w-3xl mx-auto px-6 md:px-8">
        <p className="boka-eyebrow mb-4" style={{ color: PALETTE.gold }}>Vanliga frågor</p>
        <h2 className="text-4xl md:text-5xl mb-12">Bra att veta</h2>

        <div className="divide-y" style={{ borderColor: `${PALETTE.primary}33` }}>
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={{ borderColor: `${PALETTE.primary}26`, borderTopWidth: i === 0 ? 1 : 0, borderBottomWidth: 1, borderStyle: "solid" }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between py-5 md:py-6 text-left"
                  style={{ minHeight: 48 }}
                  aria-expanded={isOpen}
                >
                  <span className="text-lg md:text-xl pr-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: PALETTE.text }}>
                    {f.q}
                  </span>
                  <ChevronDown
                    size={20}
                    strokeWidth={1.5}
                    style={{
                      color: PALETTE.primary,
                      transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                      transition: "transform 250ms",
                    }}
                  />
                </button>
                {isOpen && (
                  <p className="pb-6 text-[15px] leading-relaxed" style={{ color: "#3a4a3d" }}>
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-14 text-center">
          <a
            href="#boka"
            className="inline-flex items-center rounded-full px-7 py-4 text-base font-medium"
            style={{ background: PALETTE.primary, color: PALETTE.white, minHeight: 52 }}
          >
            Boka glamping vid Göta kanal
          </a>
        </div>
      </div>
    </section>
  );
};

const Boka = () => {
  // Ensure fonts are loaded
  useEffect(() => {
    const id = "boka-font-link";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Manrope:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <HelmetProvider>
      <LanguageProvider value="sv">
        <Helmet>
          <title>Boka glamping vid Göta kanal | Bergs Slussar Glamping</title>
          <meta name="description" content="Boka ett ombonat glampingtält vid Bergs slussar och Göta kanal. Bäddade sängar, värme, el och smidig direktbokning nära Linköping." />
          <link rel="canonical" href="https://goglampingsweden.se/boka" />
          <meta property="og:title" content="Boka glamping vid Göta kanal | Bergs Slussar Glamping" />
          <meta property="og:description" content="Ombonade glampingtält vid Bergs slussar och Göta kanal. Bäddade sängar, värme och el – 15 minuter från Linköping." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://goglampingsweden.se/boka" />
          <meta property="og:image" content="https://goglampingsweden.se/og-image.jpg" />
        </Helmet>
        <style>{FONT_STYLES}</style>

        <div className="boka-page">
          <Header />
          <main>
            <Hero />
            <BookingCard />
            <Benefits />
            <Editorial />
            <Steps />
            <FAQ />
          </main>
          <Footer />
          <StickyMobileCTA />
        </div>
      </LanguageProvider>
    </HelmetProvider>
  );
};

export default Boka;
