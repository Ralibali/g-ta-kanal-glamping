import { useEffect, useRef } from "react";
import { useLang } from "@/i18n/LanguageContext";

const ManageBookingSection = () => {
  const lang = useLang();
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (widgetRef.current && !widgetRef.current.querySelector("script")) {
      const script = document.createElement("script");
      script.async = true;
      script.setAttribute("data-form-id", "9482eece181add59");
      script.setAttribute("data-widget", "review");
      script.src = "https://secured.sirvoy.com/widget/sirvoy.js";
      widgetRef.current.appendChild(script);
    }
  }, []);

  return (
    <section id="hantera-bokning" className="py-20 md:py-28 bg-background">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <p className="text-accent font-sans text-sm tracking-[0.2em] uppercase mb-3 font-semibold">
            {lang === "en" ? "Existing booking" : "Befintlig bokning"}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {lang === "en" ? "Manage your booking" : "Hantera din bokning"}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {lang === "en"
              ? "Here you can view, change or cancel your existing booking. Enter your booking details below."
              : "Här kan du se, ändra eller avboka din befintliga bokning. Ange dina bokningsuppgifter nedan."}
          </p>
        </div>
        <div ref={widgetRef} className="bg-card rounded-2xl p-6 md:p-8 shadow-lg border border-border/50 min-h-[200px]" />
      </div>
    </section>
  );
};

export default ManageBookingSection;
