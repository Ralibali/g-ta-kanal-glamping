import { useLang } from "@/i18n/LanguageContext";
import { MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const openChat = (lang: string) => {
  trackEvent("Contact Click", {
    product_category: "contact",
    source: "floating_button",
    language: lang,
  });
  window.dispatchEvent(new CustomEvent("open-chat"));
};

const FloatingBookButton = () => {
  const lang = useLang();

  return (
    <button
      onClick={openChat}
      aria-label={lang === "en" ? "Contact us" : "Kontakta oss"}
      className="fixed bottom-5 right-5 md:bottom-6 md:right-6 z-[60] inline-flex items-center gap-2 bg-card/95 backdrop-blur border border-border text-foreground text-sm font-medium px-4 py-2.5 rounded-full shadow-lg hover:bg-card transition-colors"
    >
      <MessageCircle size={16} className="text-primary" />
      {lang === "en" ? "Contact us" : "Kontakta oss"}
    </button>
  );
};

export default FloatingBookButton;
