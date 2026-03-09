import { useLang } from "@/i18n/LanguageContext";
import { useEffect, useState } from "react";

const MobileBookingBar = () => {
  const lang = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero (approx 500px)
      const show = window.scrollY > 500;
      // Hide when booking section is in view
      const bookingEl = document.getElementById("boka");
      if (bookingEl) {
        const rect = bookingEl.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        setVisible(show && !inView);
      } else {
        setVisible(show);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-lg border-t border-border/50 px-4 py-3 safe-area-bottom animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground font-medium">
            {lang === "en" ? "From 1 290 kr/night" : "Från 1 290 kr/natt"}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {lang === "en" ? "Glamping by Göta Canal" : "Glamping vid Göta kanal"}
          </p>
        </div>
        <a
          href="#boka"
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-transform whitespace-nowrap"
        >
          {lang === "en" ? "Book now" : "Boka nu"}
        </a>
      </div>
    </div>
  );
};

export default MobileBookingBar;
