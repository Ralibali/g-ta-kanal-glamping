import { useEffect, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Menu, X, Leaf, BedDouble, Flame, Sparkles, TreePine, Coffee, Waves, ShieldCheck, CalendarCheck, MailCheck, ChevronDown, Phone, ArrowRight } from "lucide-react";
import SirvoyBookingWidget from "@/components/SirvoyBookingWidget";
import Footer from "@/components/Footer";
import { LanguageProvider, type Lang } from "@/i18n/LanguageContext";
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

type BokaLang = "sv" | "en";

const COPY = {
  sv: {
    nav: [
      { label: "Om glampingen", href: "#om" },
      { label: "Våra tält", href: "#talten" },
      { label: "Vanliga frågor", href: "#faq" },
    ],
    navBook: "Boka din vistelse",
    navBookShort: "Boka",
    menuOpen: "Öppna meny",
    menuClose: "Stäng meny",
    stickyCta: "Se lediga datum",
    stickyCall: "Ring oss",
    stickyStrap: "Direktbokning · Bästa pris · Bekräftelse direkt",
    heroEyebrow: "Glamping vid Göta kanal",
    heroTitle1: "Sov mjukt.",
    heroTitle2: "Vakna vid vattnet.",
    heroLead: "Ombonade glampingtält med bäddade sängar, värme och el – mitt vid Bergs slussar, 15 minuter från Linköping.",
    heroPrice: "Från 1\u00a0595 kr/natt – allt ingår",
    heroCta: "Se lediga datum",
    heroChip1: "Bäddade sängar",
    heroChip2: "Privat uteplats",
    heroChip3: "Värme och el",
    bookEyebrow: "Bokning",
    bookTitle: "Hitta din vistelse",
    bookLead: "Välj datum och antal gäster för att se lediga tält och aktuellt pris. Alla tre tält passar upp till fyra personer – en dubbelsäng och en mindre bäddsoffa för två.",
    bookAssurances: [
      "Direkt bekräftelse",
      "Säker betalning",
      "Bästa tillgängliga direktpris",
      "Personlig incheckning",
    ],
    benefitsEyebrow: "Det här ingår",
    benefitsTitle: "Allt för ett lugnare dygn",
    benefits: [
      { title: "Riktiga bäddade sängar", text: "Mjuka madrasser, rena lakan och varma täcken – redo när ni kliver in." },
      { title: "Värme och el i tältet", text: "Behaglig temperatur året om och uttag för det ni behöver." },
      { title: "Handdukar och sänglinne ingår", text: "Inget att packa eller bära – allt finns på plats när ni anländer." },
      { title: "Egen uteplats", text: "Sitt ute med en kopp kaffe och låt morgonen vakna i lugn och ro." },
      { title: "Frukost kan läggas till", text: "Lägg till en god frukost vid bokningen och börja dagen ostressat." },
      { title: "Göta kanal runt hörnet", text: "Slussar, promenadstråk och båtliv ligger bara några steg bort." },
    ],
    editorialEyebrow: "Tre tält",
    editorialTitle: "Tre tält. En alldeles särskild plats.",
    editorialLead: "Här bor ni nära både naturen, kanalen och Bergs slussars restauranger och promenadstråk. Tälten är ombonade för en bekväm vistelse utan att känslan av natur försvinner.",
    editorialCta: "Kontrollera tillgänglighet",
    stepsEyebrow: "Så går det till",
    stepsTitle: "Enkel bokning från början till slut",
    steps: [
      { n: "01", title: "Välj datum och tält", text: "Använd bokningskalendern högst upp för att se lediga nätter." },
      { n: "02", title: "Slutför bokningen säkert", text: "Direkt bekräftelse på e-post med all information om din vistelse." },
      { n: "03", title: "Få information inför ankomsten", text: "Vi mejlar incheckningsdetaljer och praktiska tips ett par dagar innan." },
    ],
    stepsOutro: "Efter bokningen får gästen en direkt bekräftelse. När ankomstdagen närmar sig får gästen information om incheckning, tält och praktiska detaljer.",
    faqEyebrow: "Vanliga frågor",
    faqTitle: "Bra att veta",
    faqs: [
      { q: "När kan vi checka in?", a: "Incheckning sker från klockan 15:00. Du får en personlig incheckningslänk via e-post med kod och praktisk information innan ankomst." },
      { q: "När behöver vi checka ut?", a: "Utcheckning sker senast klockan 10:00. Vill ni stanna längre kan sen utcheckning ofta läggas till mot en tilläggsavgift." },
      { q: "Finns det toalett och dusch?", a: "Ja, det finns ett servicehus med moderna toaletter och duschar i närheten av tälten." },
      { q: "Kan vi lägga till frukost?", a: "Ja, frukost kan läggas till vid bokningen och levereras runt 08:30 av Bostället Vedungsbageri – ni får ett SMS så fort den är på plats." },
      { q: "Får barn bo i tälten?", a: "Ja, barn är varmt välkomna. Alla tält har en dubbelsäng och en mindre bäddsoffa för två, så det finns plats för upp till fyra gäster." },
      { q: "Finns det värme och el?", a: "Ja, alla tält har värme och eluttag så att vistelsen blir behaglig oavsett väder." },
      { q: "Hur fungerar incheckningen?", a: "Incheckningen är digital. Ni får en kod via e-post i god tid innan ankomst och kan checka in själva när det passar er." },
      { q: "Finns parkering?", a: "Ni parkerar enklast på den allmänna parkeringen vid Berg (liten avgift). Vill ni parkera gratis finns en pendlarparkering precis vid infarten till Berg." },
    ],
    faqCta: "Boka glamping vid Göta kanal",
    metaTitle: "Boka glamping vid Göta kanal | Bergs Slussar Glamping",
    metaDesc: "Boka ett ombonat glampingtält vid Bergs slussar och Göta kanal. Bäddade sängar, värme, el och smidig direktbokning nära Linköping.",
  },
  en: {
    nav: [
      { label: "About the glamping", href: "#om" },
      { label: "Our tents", href: "#talten" },
      { label: "FAQ", href: "#faq" },
    ],
    navBook: "Book your stay",
    navBookShort: "Book",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    stickyCta: "See available dates",
    stickyCall: "Call us",
    stickyStrap: "Direct booking · Best price · Instant confirmation",
    heroEyebrow: "Glamping by the Göta Canal",
    heroTitle1: "Sleep softly.",
    heroTitle2: "Wake up by the water.",
    heroLead: "Cosy glamping tents with made-up beds, heating and electricity – right by Bergs Locks, 15 minutes from Linköping.",
    heroPrice: "From 1\u00a0595 SEK/night – everything included",
    heroCta: "See available dates",
    heroChip1: "Made-up beds",
    heroChip2: "Private terrace",
    heroChip3: "Heating & electricity",
    bookEyebrow: "Booking",
    bookTitle: "Find your stay",
    bookLead: "Pick dates and number of guests to see available tents and current prices. All three tents sleep up to four – a double bed and a small sofa bed for two.",
    bookAssurances: [
      "Instant confirmation",
      "Secure payment",
      "Best available direct price",
      "Personal check-in",
    ],
    benefitsEyebrow: "What's included",
    benefitsTitle: "Everything for a calmer stay",
    benefits: [
      { title: "Real made-up beds", text: "Soft mattresses, clean linens and warm duvets – ready the moment you step in." },
      { title: "Heating & electricity", text: "Comfortable temperature year-round and outlets for what you need." },
      { title: "Towels and linens included", text: "Nothing to pack or carry – it's all waiting for you on arrival." },
      { title: "Private terrace", text: "Sit outside with a cup of coffee and let the morning wake up in peace." },
      { title: "Breakfast can be added", text: "Add a lovely breakfast at booking and start the day without a rush." },
      { title: "The Göta Canal next door", text: "Locks, walking paths and boat life are just a few steps away." },
    ],
    editorialEyebrow: "Three tents",
    editorialTitle: "Three tents. One very special place.",
    editorialLead: "You stay close to nature, the canal and the restaurants and walking paths of Bergs Locks. The tents are cosy for a comfortable stay without losing the feeling of being outdoors.",
    editorialCta: "Check availability",
    stepsEyebrow: "How it works",
    stepsTitle: "Simple booking from start to finish",
    steps: [
      { n: "01", title: "Pick dates and tent", text: "Use the booking calendar at the top to see available nights." },
      { n: "02", title: "Complete your booking securely", text: "Instant email confirmation with all the details about your stay." },
      { n: "03", title: "Get info before arrival", text: "We email check-in details and practical tips a few days ahead." },
    ],
    stepsOutro: "After booking, you get an instant confirmation. As arrival approaches, we send information about check-in, your tent and practical details.",
    faqEyebrow: "FAQ",
    faqTitle: "Good to know",
    faqs: [
      { q: "When can we check in?", a: "Check-in is from 3:00 pm. You'll get a personal check-in link by email with your code and practical info before arrival." },
      { q: "When do we need to check out?", a: "Check-out is by 10:00 am. If you'd like to stay longer, late check-out can often be added for a small fee." },
      { q: "Are there toilets and showers?", a: "Yes, there's a service house with modern toilets and showers close to the tents." },
      { q: "Can we add breakfast?", a: "Yes, breakfast can be added at booking. It's delivered around 8:30 by Bostället Vedungsbageri – you'll get a text as soon as it's ready." },
      { q: "Are children welcome?", a: "Yes, children are warmly welcome. Every tent has a double bed and a small sofa bed for two, so there's room for up to four guests." },
      { q: "Is there heating and electricity?", a: "Yes, every tent has heating and power outlets so your stay stays comfortable in any weather." },
      { q: "How does check-in work?", a: "Check-in is digital. You'll get a code by email in good time before arrival and can check in yourself whenever suits you." },
      { q: "Is there parking?", a: "The easiest option is the public parking at Berg (small fee). If you'd rather park for free, there's a commuter lot right at the entrance to Berg." },
    ],
    faqCta: "Book glamping by the Göta Canal",
    metaTitle: "Book glamping by the Göta Canal | Bergs Slussar Glamping",
    metaDesc: "Book a cosy glamping tent at Bergs Locks by the Göta Canal. Made-up beds, heating, electricity and easy direct booking near Linköping.",
  },
};

type Copy = typeof COPY.sv;

const Header = ({ t, lang, onLang }: { t: typeof COPY.sv; lang: BokaLang; onLang: (l: BokaLang) => void }) => {
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
        <Link to={lang === "en" ? "/en" : "/"} className="flex items-center gap-2.5" style={{ color: textColor }}>
          <Leaf size={20} strokeWidth={1.6} />
          <span className="font-serif text-lg md:text-xl tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>
            Bergs Slussar Glamping
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-9">
          {t.nav.map((l) => (
            <a key={l.href} href={l.href} className="text-sm hover:opacity-70 transition-opacity" style={{ color: textColor }}>
              {l.label}
            </a>
          ))}
          <div className="flex items-center gap-1 text-xs" style={{ color: textColor }}>
            <button
              onClick={() => onLang("sv")}
              className={`px-2 py-0.5 rounded-full border ${lang === "sv" ? "font-semibold" : "opacity-70"}`}
              style={{ borderColor: `${textColor}55` }}
              aria-pressed={lang === "sv"}
            >SV</button>
            <button
              onClick={() => onLang("en")}
              className={`px-2 py-0.5 rounded-full border ${lang === "en" ? "font-semibold" : "opacity-70"}`}
              style={{ borderColor: `${textColor}55` }}
              aria-pressed={lang === "en"}
            >EN</button>
          </div>
          <a
            href="#boka"
            className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium transition-all hover:brightness-110"
            style={{ background: PALETTE.primary, color: PALETTE.white }}
          >
            {t.navBook}
          </a>
        </nav>

        <div className="md:hidden flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px]" style={{ color: textColor }}>
            <button onClick={() => onLang("sv")} className={`px-1.5 py-0.5 rounded-full border ${lang === "sv" ? "font-semibold" : "opacity-70"}`} style={{ borderColor: `${textColor}55` }} aria-pressed={lang === "sv"}>SV</button>
            <button onClick={() => onLang("en")} className={`px-1.5 py-0.5 rounded-full border ${lang === "en" ? "font-semibold" : "opacity-70"}`} style={{ borderColor: `${textColor}55` }} aria-pressed={lang === "en"}>EN</button>
          </div>
          <a href="#boka" className="rounded-full px-4 py-2 text-sm font-medium" style={{ background: PALETTE.primary, color: PALETTE.white }}>
            {t.navBookShort}
          </a>
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? t.menuClose : t.menuOpen}
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
            {t.nav.map((l) => (
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

const StickyMobileCTA = ({ t }: { t: typeof COPY.sv }) => {
  const [visible, setVisible] = useState(false);
  const [overBooking, setOverBooking] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 320);
      const target = document.getElementById("boka");
      if (target) {
        const rect = target.getBoundingClientRect();
        setOverBooking(rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.2);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible || overBooking) return null;

  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      style={{
        background: `${PALETTE.white}f5`,
        backdropFilter: "blur(14px)",
        borderTop: `1px solid ${PALETTE.sand}66`,
        boxShadow: "0 -10px 30px -10px rgba(36,48,39,0.18)",
      }}
    >
      <div className="flex items-center gap-2">
        <a
          href="#boka"
          className="flex-1 flex items-center justify-center gap-2 rounded-full text-[15px] font-medium"
          style={{ background: PALETTE.primary, color: PALETTE.white, minHeight: 52 }}
        >
          {t.stickyCta}
          <ArrowRight size={17} strokeWidth={1.8} />
        </a>
        <a
          href="tel:+46722254993"
          aria-label={t.stickyCall}
          className="flex items-center justify-center rounded-full"
          style={{ width: 52, height: 52, border: `1px solid ${PALETTE.primary}55`, color: PALETTE.primary, background: PALETTE.white }}
        >
          <Phone size={18} strokeWidth={1.7} />
        </a>
      </div>
      <p className="text-center text-[11px] mt-1.5" style={{ color: "#3a4a3d99" }}>
        {t.stickyStrap}
      </p>
    </div>
  );
};

const Hero = ({ t }: { t: typeof COPY.sv }) => (
  <section className="relative w-full min-h-[88vh] md:min-h-[92vh]">
    <img
      src={heroImg}
      alt={t.heroEyebrow}
      width={1920}
      height={1280}
      fetchPriority="high"
      decoding="async"
      className="absolute inset-0 w-full h-full object-cover"
    />
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(180deg, rgba(36,48,39,0.55) 0%, rgba(36,48,39,0.35) 45%, rgba(36,48,39,0.7) 100%)`,
      }}
    />

    <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 pt-32 md:pt-44 pb-28 md:pb-56" style={{ color: PALETTE.white }}>
      <p className="boka-eyebrow mb-5" style={{ color: PALETTE.sand }}>
        {t.heroEyebrow}
      </p>
      <h1 className="text-[2.75rem] sm:text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.02] max-w-3xl mb-6" style={{ color: PALETTE.white }}>
        {t.heroTitle1}
        <br />
        <em className="not-italic" style={{ fontStyle: "italic", color: PALETTE.white }}>{t.heroTitle2}</em>
      </h1>
      <p className="text-base md:text-lg max-w-xl leading-relaxed mb-7" style={{ color: "#FFFDF8e0" }}>
        {t.heroLead}
      </p>

      <div className="flex flex-wrap items-center gap-2.5 mb-7">
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
          style={{ background: `${PALETTE.white}`, color: PALETTE.text }}
        >
          <Sparkles size={15} strokeWidth={1.6} style={{ color: PALETTE.gold }} />
          {t.heroPrice}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <a
          href="#boka"
          className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-medium transition-transform hover:scale-[1.02]"
          style={{ background: PALETTE.primary, color: PALETTE.white, minHeight: 56, boxShadow: "0 14px 30px -10px rgba(36,48,39,0.55)" }}
        >
          {t.heroCta}
          <ArrowRight size={18} strokeWidth={1.8} />
        </a>
        <a
          href="tel:+46722254993"
          className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-medium border transition-colors"
          style={{ borderColor: `${PALETTE.white}66`, color: PALETTE.white, minHeight: 56, background: "rgba(255,253,248,0.08)", backdropFilter: "blur(6px)" }}
        >
          <Phone size={17} strokeWidth={1.6} />
          072-225 49 93
        </a>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm" style={{ color: "#FFFDF8cc" }}>
        <span className="inline-flex items-center gap-2"><BedDouble size={16} strokeWidth={1.5} /> {t.heroChip1}</span>
        <span className="inline-flex items-center gap-2"><TreePine size={16} strokeWidth={1.5} /> {t.heroChip2}</span>
        <span className="inline-flex items-center gap-2"><Flame size={16} strokeWidth={1.5} /> {t.heroChip3}</span>
      </div>
    </div>

    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:block" style={{ color: `${PALETTE.white}99` }}>
      <ChevronDown size={26} />
    </div>
  </section>
);

const BookingCard = ({ t }: { t: typeof COPY.sv }) => (
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
          <p className="boka-eyebrow mb-3" style={{ color: PALETTE.gold }}>{t.bookEyebrow}</p>
          <h2 className="text-4xl md:text-5xl mb-3">{t.bookTitle}</h2>
          <p className="text-base md:text-lg" style={{ color: "#3a4a3d" }}>
            {t.bookLead}
          </p>
        </div>

        <SirvoyBookingWidget />

        <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-sm" style={{ borderColor: `${PALETTE.sand}66`, color: "#3a4a3d" }}>
          {[
            { icon: <CalendarCheck size={16} strokeWidth={1.5} />, text: t.bookAssurances[0] },
            { icon: <ShieldCheck size={16} strokeWidth={1.5} />, text: t.bookAssurances[1] },
            { icon: <Sparkles size={16} strokeWidth={1.5} />, text: t.bookAssurances[2] },
            { icon: <MailCheck size={16} strokeWidth={1.5} />, text: t.bookAssurances[3] },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-2.5" style={{ color: PALETTE.primary }}>
              {row.icon}
              <span style={{ color: PALETTE.text }}>{row.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const Benefits = ({ t }: { t: typeof COPY.sv }) => {
  const icons = [
    <BedDouble size={22} strokeWidth={1.3} />,
    <Flame size={22} strokeWidth={1.3} />,
    <Sparkles size={22} strokeWidth={1.3} />,
    <TreePine size={22} strokeWidth={1.3} />,
    <Coffee size={22} strokeWidth={1.3} />,
    <Waves size={22} strokeWidth={1.3} />,
  ];

  return (
    <section id="om" className="py-24 md:py-32" style={{ background: PALETTE.cream }}>
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="max-w-2xl mb-14 md:mb-20">
          <p className="boka-eyebrow mb-4" style={{ color: PALETTE.gold }}>{t.benefitsEyebrow}</p>
          <h2 className="text-4xl md:text-5xl leading-tight">{t.benefitsTitle}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 md:gap-y-16">
          {t.benefits.map((it, i) => (
            <div key={it.title} className="border-t pt-6" style={{ borderColor: `${PALETTE.primary}33` }}>
              <div style={{ color: PALETTE.primary }} className="mb-4">{icons[i]}</div>
              <h3 className="text-2xl mb-2">{it.title}</h3>
              <p className="text-[15px] leading-relaxed" style={{ color: "#3a4a3d" }}>{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Editorial = ({ t }: { t: typeof COPY.sv }) => (
  <section id="talten" className="py-24 md:py-32" style={{ background: PALETTE.white }}>
    <div className="max-w-6xl mx-auto px-6 md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-end">
        <div className="md:col-span-5 md:pb-12">
          <p className="boka-eyebrow mb-4" style={{ color: PALETTE.gold }}>{t.editorialEyebrow}</p>
          <h2 className="text-4xl md:text-5xl leading-tight mb-5">{t.editorialTitle}</h2>
          <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: "#3a4a3d" }}>
            {t.editorialLead}
          </p>
          <a
            href="#boka"
            className="inline-flex items-center rounded-full px-6 py-3 text-sm font-medium border transition-colors"
            style={{ borderColor: PALETTE.primary, color: PALETTE.primary, minHeight: 48 }}
          >
            {t.editorialCta}
          </a>
        </div>

        <div className="md:col-span-7 grid grid-cols-6 gap-4 md:gap-5">
          <div className="col-span-6">
            <img src={editorialA} alt={t.editorialTitle} loading="lazy" width={1200} height={800} className="w-full h-[280px] md:h-[420px] object-cover rounded-[20px]" />
          </div>
          <div className="col-span-3">
            <img src={editorialB} alt={t.heroChip1} loading="lazy" width={800} height={800} className="w-full h-[180px] md:h-[260px] object-cover rounded-[20px]" />
          </div>
          <div className="col-span-3">
            <img src={editorialC} alt={t.editorialTitle} loading="lazy" width={800} height={800} className="w-full h-[180px] md:h-[260px] object-cover rounded-[20px]" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Steps = ({ t }: { t: typeof COPY.sv }) => (
  <section className="py-24 md:py-32" style={{ background: PALETTE.primary, color: PALETTE.white }}>
    <div className="max-w-6xl mx-auto px-6 md:px-8">
      <div className="max-w-2xl mb-14 md:mb-20">
        <p className="boka-eyebrow mb-4" style={{ color: PALETTE.sand }}>{t.stepsEyebrow}</p>
        <h2 className="text-4xl md:text-5xl leading-tight" style={{ color: PALETTE.white }}>
          {t.stepsTitle}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14 mb-14">
        {t.steps.map((s) => (
          <div key={s.n}>
            <div className="font-serif text-5xl mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: PALETTE.sand }}>{s.n}</div>
            <h3 className="text-2xl mb-3" style={{ color: PALETTE.white }}>{s.title}</h3>
            <p className="text-[15px] leading-relaxed" style={{ color: "#FFFDF8cc" }}>{s.text}</p>
          </div>
        ))}
      </div>

      <p className="text-base max-w-2xl" style={{ color: "#FFFDF8cc" }}>
        {t.stepsOutro}
      </p>
    </div>
  </section>
);

const FAQ = ({ t }: { t: typeof COPY.sv }) => {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 md:py-32" style={{ background: PALETTE.cream }}>
      <div className="max-w-3xl mx-auto px-6 md:px-8">
        <p className="boka-eyebrow mb-4" style={{ color: PALETTE.gold }}>{t.faqEyebrow}</p>
        <h2 className="text-4xl md:text-5xl mb-12">{t.faqTitle}</h2>

        <div className="divide-y" style={{ borderColor: `${PALETTE.primary}33` }}>
          {t.faqs.map((f, i) => {
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
            {t.faqCta}
          </a>
        </div>
      </div>
    </section>
  );
};

interface BokaProps {
  lang?: Lang;
}

const Boka = ({ lang: initialLang }: BokaProps = {}) => {
  const [lang, setLang] = useState<BokaLang>(initialLang === "en" ? "en" : "sv");
  const t = COPY[lang];

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

  const canonical = lang === "en" ? "https://goglampingsweden.se/en/boka" : "https://goglampingsweden.se/boka";

  return (
    <HelmetProvider>
      <LanguageProvider value={lang}>
        <Helmet>
          <html lang={lang} />
          <title>{t.metaTitle}</title>
          <meta name="description" content={t.metaDesc} />
          <link rel="canonical" href={canonical} />
          <link rel="alternate" hrefLang="sv" href="https://goglampingsweden.se/boka" />
          <link rel="alternate" hrefLang="en" href="https://goglampingsweden.se/en/boka" />
          <link rel="alternate" hrefLang="x-default" href="https://goglampingsweden.se/boka" />
          <meta property="og:title" content={t.metaTitle} />
          <meta property="og:description" content={t.metaDesc} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={canonical} />
          <meta property="og:image" content="https://goglampingsweden.se/og-image.jpg" />
          <meta property="og:locale" content={lang === "en" ? "en_US" : "sv_SE"} />
        </Helmet>
        <style>{FONT_STYLES}</style>

        <div className="boka-page">
          <Header t={t} lang={lang} onLang={setLang} />
          <main>
            <Hero t={t} />
            <BookingCard t={t} />
            <Benefits t={t} />
            <Editorial t={t} />
            <Steps t={t} />
            <FAQ t={t} />
          </main>
          <Footer />
          <StickyMobileCTA t={t} />
        </div>
      </LanguageProvider>
    </HelmetProvider>
  );
};

export default Boka;
