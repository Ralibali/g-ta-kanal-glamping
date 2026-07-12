import { Mail, MessageCircle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const Footer = () => {
  const lang = useLang();
  const homePath = lang === "en" ? "/en" : "/";
  const bookingPath = lang === "en" ? "/en/boka" : "/boka";
  const sectionHref = (section: string) => `${homePath}#${section}`;

  return (
    <footer className="bg-forest-dark text-white py-16">
      <div className="container">
        <div className="grid md:grid-cols-3 gap-10 mb-12">
          <div>
            <p className="font-serif text-2xl font-bold mb-3">Bergs Slussar Glamping</p>
            <p className="text-white/60 text-sm leading-relaxed">
              {lang === "en"
                ? "Cosy glamping by Göta Canal in Östergötland. Nature, comfort and relaxation – 15 minutes from Linköping."
                : "Mysig glamping vid Göta kanal i Östergötland. Natur, komfort och avkoppling – 15 minuter från Linköping."}
            </p>
            <p className="text-white/40 text-sm mt-4">© {new Date().getFullYear()} Bergs Slussar Glamping</p>
          </div>

          <div>
            <p className="font-semibold mb-4 text-white/90">{lang === "en" ? "Quick links" : "Snabblänkar"}</p>
            <nav aria-label={lang === "en" ? "Footer navigation" : "Sidfotsmeny"} className="flex flex-col gap-2 text-sm text-white/60">
              <a href={bookingPath} className="hover:text-white transition-colors">{lang === "en" ? "Book" : "Boka"}</a>
              <a href={sectionHref("talten")} className="hover:text-white transition-colors">{lang === "en" ? "The tents" : "Om tälten"}</a>
              <a href={sectionHref("aktiviteter")} className="hover:text-white transition-colors">{lang === "en" ? "Activities" : "Aktiviteter"}</a>
              <a href={sectionHref("kontakt")} className="hover:text-white transition-colors">{lang === "en" ? "Find us" : "Hitta hit"}</a>
              <a href={sectionHref("faq")} className="hover:text-white transition-colors">FAQ</a>
              <a href="/blogg" className="hover:text-white transition-colors">{lang === "en" ? "Guides and inspiration" : "Guider och inspiration"}</a>
              <a href="/bokningsvillkor" className="hover:text-white transition-colors">{lang === "en" ? "Booking terms" : "Bokningsvillkor"}</a>
              <a href="/glamping-linkoping" className="hover:text-white transition-colors">Glamping nära Linköping</a>
              <a href="/glamping-gota-kanal" className="hover:text-white transition-colors">Glamping vid Göta kanal</a>
              <a href="/glamping-ostergotland" className="hover:text-white transition-colors">Glamping i Östergötland</a>
            </nav>
          </div>

          <div>
            <p className="font-semibold mb-4 text-white/90">{lang === "en" ? "Contact" : "Kontakt"}</p>
            <div className="flex flex-col gap-3 text-sm text-white/60">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-chat"))}
                className="hover:text-white flex items-center gap-2 transition-colors text-left"
              >
                <MessageCircle size={14} aria-hidden="true" /> {lang === "en" ? "Contact us (chat)" : "Kontakta oss (chatt)"}
              </button>
              <a href="mailto:hej@goglampingsweden.se" className="hover:text-white flex items-center gap-2 transition-colors">
                <Mail size={14} aria-hidden="true" /> hej@goglampingsweden.se
              </a>
              <a
                href="https://maps.google.com/?q=58.5357,15.5012"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                {lang === "en" ? "Open in Google Maps" : "Öppna i Google Maps"}
              </a>
              <div className="flex gap-4 mt-2">
                <a
                  href="https://www.instagram.com/bergsslussar.glamping/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Instagram
                </a>
                <a
                  href="https://www.facebook.com/goglampingsweden"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
