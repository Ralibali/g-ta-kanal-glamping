import { Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container">
        <div className="grid md:grid-cols-3 gap-10 mb-12">
          <div>
            <p className="font-serif text-2xl font-bold mb-2">Bergs Slussar</p>
            <p className="text-xs tracking-[0.25em] uppercase opacity-60 mb-4">Glamping</p>
            <p className="text-sm opacity-70 leading-relaxed">
              Glamping Sweden – unikt boende vid Göta kanal i Östergötland. Bergs Slussar, Vreta Kloster, nära Linköping. Natur, komfort och avkoppling.
            </p>
          </div>

          <div>
            <p className="font-semibold mb-4">Snabblänkar</p>
            <div className="flex flex-col gap-2 text-sm opacity-70">
              <a href="#om-oss" className="hover:opacity-100 transition-opacity">Om oss</a>
              <a href="#talten" className="hover:opacity-100 transition-opacity">Tälten</a>
              <a href="#boka" className="hover:opacity-100 transition-opacity">Boka</a>
              <a href="#hantera-bokning" className="hover:opacity-100 transition-opacity">Hantera bokning</a>
              <a href="#galleri" className="hover:opacity-100 transition-opacity">Galleri</a>
              <a href="#faq" className="hover:opacity-100 transition-opacity">FAQ</a>
              <a href="/checkin" className="hover:opacity-100 transition-opacity">Digital incheckning</a>
            </div>
          </div>

          <div>
            <p className="font-semibold mb-4">Kontakt</p>
            <div className="flex flex-col gap-3 text-sm opacity-70">
              <p>Bergs Slussar, Vreta Kloster</p>
              <p>Linköping, Sverige</p>
              <a href="mailto:info@auroramedia.se" className="hover:opacity-100 flex items-center gap-2">
                <Mail size={14} /> info@auroramedia.se
              </a>
              <div className="flex gap-4 mt-1">
                <a href="https://www.instagram.com/bergsslussar.glamping/" target="_blank" rel="noopener noreferrer" className="hover:opacity-100">
                  Instagram
                </a>
                <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100">
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm opacity-50">
          <p>© {new Date().getFullYear()} Bergs Slussar Glamping. Alla rättigheter reserverade.</p>
          <p>En del av GoGlampingSweden</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
