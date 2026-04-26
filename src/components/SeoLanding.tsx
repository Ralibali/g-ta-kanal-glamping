import { useEffect, ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/i18n/LanguageContext";

export type SeoFaq = { q: string; a: string };

export interface SeoLandingProps {
  title: string;
  description: string;
  canonical: string;
  breadcrumbLabel: string;
  h1: string;
  intro: ReactNode;
  sections: { h2: string; body: ReactNode }[];
  faqs: SeoFaq[];
  cta: { heading: string; text: string; button: string; href?: string };
}

const SeoLanding = ({
  title,
  description,
  canonical,
  breadcrumbLabel,
  h1,
  intro,
  sections,
  faqs,
  cta,
}: SeoLandingProps) => {
  useEffect(() => {
    document.title = title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);

    let canon = document.querySelector('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement("link");
      canon.setAttribute("rel", "canonical");
      document.head.appendChild(canon);
    }
    canon.setAttribute("href", canonical);
  }, [title, description, canonical]);

  const ctaHref = cta.href ?? "/#boka";

  return (
    <LanguageProvider value="sv">
      <Navbar />
      <main className="pt-24">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: title,
              description,
              url: canonical,
              breadcrumb: {
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Hem",
                    item: "https://goglampingsweden.se/",
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: breadcrumbLabel,
                    item: canonical,
                  },
                ],
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: f.a,
                },
              })),
            }),
          }}
        />

        <article className="container max-w-3xl py-12 md:py-20">
          <nav className="text-sm text-muted-foreground mb-8 flex items-center flex-wrap gap-1">
            <Link to="/" className="hover:text-primary transition-colors">
              Hem
            </Link>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="text-foreground">{breadcrumbLabel}</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {h1}
            </h1>

            <div className="text-lg text-muted-foreground leading-relaxed mb-10 space-y-4">
              {intro}
            </div>

            {sections.map((s) => (
              <section key={s.h2} className="mb-10">
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">
                  {s.h2}
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-4">
                  {s.body}
                </div>
              </section>
            ))}

            <section className="mb-10">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">
                Vanliga frågor
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((f, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left font-serif text-lg text-foreground">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            <section className="bg-sand rounded-2xl p-8 md:p-10 text-center">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-3">
                {cta.heading}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6 max-w-xl mx-auto">
                {cta.text}
              </p>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <Link
                  to={ctaHref}
                  className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-8 py-4 rounded-full text-lg font-semibold shadow-lg"
                >
                  {cta.button}
                  <ArrowRight size={20} />
                </Link>
              </motion.div>
            </section>
          </motion.div>
        </article>
      </main>
      <Footer />
    </LanguageProvider>
  );
};

export default SeoLanding;
