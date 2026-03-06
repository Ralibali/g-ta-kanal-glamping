import { ChevronDown } from "lucide-react";
import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import { useLang } from "@/i18n/LanguageContext";

const FAQSection = () => {
  const lang = useLang();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs = lang === "en" ? [
    { q: "How do I book glamping at Bergs Slussar?", a: "It's easy! Scroll up to the booking section, select dates and number of guests, and follow the instructions. We offer glamping in Sweden by Göta Canal, just outside Linköping." },
    { q: "What does glamping cost and what's included?", a: "The price includes cleaning, made beds, bed linen, towels, electricity, fan, mini fridge, gas heater, coffee, tea and a bottle of water. See current prices in the booking widget above." },
    { q: "Is there parking at Bergs Slussar?", a: "Yes, parking is available on-site for a small fee, just a short walk from the glamping tents." },
    { q: "Are there toilets and showers?", a: "Yes, a fresh service house is located about 150 metres from the tents with toilets, showers and baby changing facilities." },
    { q: "Is there food and a café at Bergs Slussar?", a: "Yes! There are restaurants and cafés in the area around Bergs Slussar. We also offer breakfast via Bostället as an add-on when booking." },
    { q: "Can children stay in the glamping tents?", a: "Of course! Children up to 12 years have discounted prices and can sleep together with adults in the double bed. Perfect accommodation for families by Göta Canal." },
    { q: "Can we bring pets?", a: "Yes, pets are welcome in the tent Lugnets Yta for a pet fee." },
    { q: "How far is it from Linköping to Bergs Slussar?", a: "Bergs Slussar is located in Vreta Kloster, about 15 minutes by car from central Linköping." },
    { q: "What are the booking terms?", a: "Check-in from 3:00 PM, check-out by 10:00 AM. Free cancellation up to 5 days before arrival. Late check-out until 12:00 PM can be offered for 400 SEK." },
  ] : [
    { q: "Hur bokar vi glamping vid Bergs Slussar?", a: "Det är enkelt! Scrolla upp till bokningssektionen på sidan, välj datum och antal gäster, och följ instruktionerna. Vi erbjuder glamping i Östergötland vid Göta kanal, strax utanför Linköping." },
    { q: "Vad kostar glamping och vad ingår i priset?", a: "I priset ingår städning, bäddade sängar, sänglinne, handdukar, el, fläkt, minikylskåp, gasolvärmare, kaffe, te och en flaska vatten. Se aktuella glamping priser i bokningswidgeten ovan." },
    { q: "Finns det parkering vid Bergs Slussar?", a: "Ja, parkering finns på plats mot en liten avgift, bara en kort promenad från glampingtälten. Perfekt för dig som reser med bil till Bergs Slussar." },
    { q: "Finns det toaletter och dusch?", a: "Ja, ett fräscht servicehus ligger cirka 150 meter från tälten med toaletter, duschar och skötrum." },
    { q: "Finns det mat och café vid Bergs Slussar?", a: "Ja! Det finns restauranger och caféer i närområdet kring Bergs Slussar. Vi erbjuder även frukost via Bostället som tillval vid bokning." },
    { q: "Kan barn bo i glampingtälten?", a: "Självklart! Barn upp till 12 år har rabatterade priser och kan sova tillsammans med vuxna i dubbelsängen. Perfekt boende för familjer vid Göta kanal." },
    { q: "Får vi ta med husdjur?", a: "Ja, i tältet Lugnets Yta är husdjur välkomna mot en husdjursavgift." },
    { q: "Hur långt är det från Linköping till Bergs Slussar?", a: "Bergs Slussar ligger i Vreta Kloster, cirka 15 minuter med bil från centrala Linköping. Enkelt att nå som boende utmed Göta kanal." },
    { q: "Vilka bokningsvillkor gäller?", a: "Incheckning från kl. 15:00, utcheckning senast kl. 10:00. Kostnadsfri avbokning upp till 5 dagar före ankomst. Sen utcheckning till kl. 11:30 kan erbjudas mot 400 kr." },
  ];

  return (
    <section id="faq" className="py-24 md:py-32" style={{ background: "var(--section-gradient)" }}>
      <div className="container max-w-3xl">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-accent font-sans text-sm tracking-[0.2em] uppercase mb-3 font-semibold">FAQ</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              {lang === "en" ? "Questions & answers about glamping at Bergs Slussar" : "Frågor & svar om glamping vid Bergs Slussar"}
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <ScrollReveal key={i} delay={i * 60}>
              <div className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-md transition-shadow">
                <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left">
                  <span className="font-serif text-lg font-semibold text-foreground pr-4">{faq.q}</span>
                  <ChevronDown className={`text-accent shrink-0 transition-transform duration-300 ${openIdx === i ? "rotate-180" : ""}`} size={20} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openIdx === i ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="px-6 pb-6">
                    <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
