import { useEffect, useRef } from "react";

const BookingSection = () => {
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
            Bokning
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
            Boka ditt tält
          </h2>
          <p className="text-primary-foreground/70 text-lg max-w-lg mx-auto">
            Välj datum och antal gäster nedan för att reservera din glamping-upplevelse vid Göta kanal.
          </p>
        </div>

        <div
          ref={widgetRef}
          className="bg-card rounded-2xl p-6 md:p-8 shadow-2xl min-h-[300px]"
        />

        <p className="text-center mt-6 text-primary-foreground/50 text-sm">
          Har du redan en bokning?{" "}
          <a
            href="https://goglampingsweden.se/hantera-din-bokning-nedan/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary-foreground/80"
          >
            Hantera din bokning här
          </a>
        </p>
      </div>
    </section>
  );
};

export default BookingSection;
