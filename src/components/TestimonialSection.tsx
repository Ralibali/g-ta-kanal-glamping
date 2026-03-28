import { motion } from "framer-motion";
import { useLang } from "@/i18n/LanguageContext";

const Star = () => (
  <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const TestimonialSection = () => {
  const lang = useLang();

  const reviews = lang === "en"
    ? [
        { text: "So cosy, helpful and friendly staff, beautiful view. Great location near Linköping.", source: "Google review" },
        { text: "A perfect weekend trip. The tent was warm and cosy, and the sunset over the canal was magical.", source: "Google review" },
        { text: "The best combination of nature and comfort. We're coming back next summer!", source: "Google review" },
      ]
    : [
        { text: "Så mysigt, hjälpsam och trevlig personal, vacker utsikt. Bra läge nära Linköping.", source: "Google-recension" },
        { text: "En perfekt helgtripp. Tältet var varmt och ombonat, och solnedgången över kanalen var magisk.", source: "Google-recension" },
        { text: "Bästa kombinationen av natur och komfort. Vi kommer tillbaka nästa sommar!", source: "Google-recension" },
      ];

  return (
    <section className="py-24 md:py-32 bg-forest-dark">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {lang === "en" ? "What guests say" : "Vad gästerna säger"}
          </h2>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-white/60 text-sm">
            {lang === "en" ? "Verified by Trustindex / Google" : "Verifierat av Trustindex / Google"}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="bg-white rounded-2xl p-6 md:p-8"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => <Star key={j} />)}
              </div>
              <p className="text-foreground font-medium leading-relaxed mb-4 italic">
                "{review.text}"
              </p>
              <p className="text-muted-foreground text-sm">— {review.source}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
