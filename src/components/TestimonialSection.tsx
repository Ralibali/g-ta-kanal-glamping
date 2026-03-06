import ScrollReveal from "./ScrollReveal";
import { useLang } from "@/i18n/LanguageContext";

const TestimonialSection = () => {
  const lang = useLang();

  return (
    <section className="py-24 md:py-32 bg-secondary/50 overflow-hidden">
      <div className="container max-w-4xl text-center">
        <ScrollReveal>
          <p className="text-accent font-sans text-sm tracking-[0.2em] uppercase mb-6 font-semibold">
            {lang === "en" ? "What guests say" : "Vad gäster säger"}
          </p>
          <blockquote className="font-serif text-2xl md:text-4xl lg:text-5xl text-foreground leading-snug italic mb-8">
            {lang === "en"
              ? '"A magical experience by the canal. We fell asleep to the sounds of nature and woke up to the most beautiful sunrise."'
              : '"En magisk upplevelse vid kanalen. Vi somnade till ljudet av naturen och vaknade till den vackraste soluppgången."'}
          </blockquote>
          <div className="flex items-center justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-muted-foreground text-sm mb-10">
            {lang === "en" ? "— Happy guest via Google Reviews" : "— Nöjd gäst via Google Reviews"}
          </p>

          {/* Rating badges inline */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-5 py-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="font-bold text-foreground font-serif">4.9</span>
              <span className="text-muted-foreground text-sm">Google</span>
            </div>

            <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-5 py-3">
              <span className="font-bold text-foreground font-serif">8.5</span>
              <span className="text-muted-foreground text-xs">/10</span>
              <span className="text-muted-foreground text-sm">Booking.com</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default TestimonialSection;
