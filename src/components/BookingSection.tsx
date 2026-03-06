import { useEffect, useRef } from "react";
import { useLang } from "@/i18n/LanguageContext";

const BookingSection = () => {
  const lang = useLang();
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (widgetRef.current && !widgetRef.current.querySelector("script")) {
      const script = document.createElement("script");
      script.async = true;
      script.setAttribute("data-form-id", "9482eece181add59");
      script.src = "https://secured.sirvoy.com/widget/sirvoy.js";
      widgetRef.current.appendChild(script);
    }
  }, []);

  return (
    <section id="boka" className="py-20 md:py-28 bg-primary">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <p className="text-primary-foreground/60 font-sans text-sm tracking-[0.2em] uppercase mb-3 font-semibold">
            {lang === "en" ? "Booking" : "Bokning"}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
            {lang === "en" ? "Book your tent" : "Boka ditt tält"}
          </h2>
          <p className="text-primary-foreground/70 text-lg max-w-lg mx-auto">
            {lang === "en"
              ? "Select dates and number of guests below to reserve your glamping experience by Göta Canal."
              : "Välj datum och antal gäster nedan för att reservera din glamping-upplevelse vid Göta kanal."}
          </p>
        </div>

        <div ref={widgetRef} className="bg-card rounded-2xl p-6 md:p-8 shadow-2xl min-h-[300px]" />

        <div className="text-center mt-8">
          <a href="#hantera-bokning" className="inline-block border-2 border-primary-foreground/40 text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary-foreground/10 transition-colors">
            {lang === "en" ? "Manage your booking" : "Hantera din bokning"}
          </a>
          <p className="text-primary-foreground/40 text-sm mt-3">
            {lang === "en" ? "Change, cancel or view details of an existing booking" : "Ändra, avboka eller se detaljer för en befintlig bokning"}
          </p>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
