import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    q: "Hur bokar vi en vistelse hos er?",
    a: "Det är enkelt! Scrolla upp till bokningssektionen på sidan, välj datum och antal gäster, och följ instruktionerna.",
  },
  {
    q: "Vad ingår i priset?",
    a: "I priset ingår städning, bäddade sängar, sänglinne, handdukar, el, fläkt, minikylskåp, gasolvärmare, kaffe, te och en flaska vatten. Det finns även möjlighet att laga mat.",
  },
  {
    q: "Finns det toaletter och dusch?",
    a: "Ja, ett fräscht servicehus ligger cirka 150 meter från tälten med toaletter, duschar och skötrum.",
  },
  {
    q: "Finns det matmöjligheter i närheten?",
    a: "Ja! Ni kan laga mat vid ert tält eller besöka restauranger och caféer i närheten. Vi erbjuder även frukost via Bostället som tillval vid bokning.",
  },
  {
    q: "Kan barn bo hos er?",
    a: "Självklart! Barn upp till 12 år har rabatterade priser och kan sova tillsammans med vuxna i dubbelsängen.",
  },
  {
    q: "Får vi ta med husdjur?",
    a: "Ja, i tält nummer tre är husdjur välkomna mot en husdjursavgift.",
  },
  {
    q: "Vilka bokningsvillkor gäller?",
    a: "Incheckning från kl. 15:00, utcheckning senast kl. 10:00. Kostnadsfri avbokning upp till 5 dagar före ankomst. Sen utcheckning till kl. 11:30 kan erbjudas mot 400 kr.",
  },
];

const FAQSection = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 md:py-28" style={{ background: "var(--section-gradient)" }}>
      <div className="container max-w-3xl">
        <div className="text-center mb-16">
          <p className="text-accent font-sans text-sm tracking-[0.2em] uppercase mb-3 font-semibold">
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Frågor & svar
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border/50 overflow-hidden"
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-serif text-lg font-semibold text-foreground pr-4">{faq.q}</span>
                <ChevronDown
                  className={`text-muted-foreground shrink-0 transition-transform duration-300 ${
                    openIdx === i ? "rotate-180" : ""
                  }`}
                  size={20}
                />
              </button>
              {openIdx === i && (
                <div className="px-5 pb-5">
                  <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
