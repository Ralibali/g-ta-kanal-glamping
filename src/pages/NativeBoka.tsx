import { Link } from "react-router-dom";
import { ArrowLeft, Leaf } from "lucide-react";
import NativeBookingWidget, { type NativeBookingLang } from "@/components/NativeBookingWidget";

export default function NativeBoka({ lang = "sv" }: { lang?: NativeBookingLang }) {
  const copy = lang === "en"
    ? { back: "Back to the glamping", eyebrow: "Direct booking", title: "Book directly with Bergs Slussar Glamping", lead: "Choose tent, dates and extras. Payment goes securely through Stripe directly to the property." }
    : lang === "de"
      ? { back: "Zurück zum Glamping", eyebrow: "Direktbuchung", title: "Direkt bei Bergs Slussar Glamping buchen", lead: "Wählen Sie Zelt, Daten und Extras. Die Zahlung erfolgt sicher über Stripe direkt an die Unterkunft." }
      : { back: "Tillbaka till glampingen", eyebrow: "Direktbokning", title: "Boka direkt hos Bergs Slussar Glamping", lead: "Välj tält, datum och tillval. Betalningen går säkert via Stripe direkt till oss." };

  const home = lang === "en" ? "/en" : lang === "de" ? "/de" : "/";

  return (
    <main className="min-h-screen bg-[#F6F2E9] text-[#243027]">
      <header className="border-b border-black/5 bg-[#FFFDF8]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to={home} className="inline-flex items-center gap-2 text-sm font-semibold text-[#617457]"><ArrowLeft size={16} />{copy.back}</Link>
          <div className="inline-flex items-center gap-2 font-serif text-lg"><Leaf size={18} className="text-[#617457]" />Bergs Slussar Glamping</div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B59465]">{copy.eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight sm:text-5xl">{copy.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#5e6b5a]">{copy.lead}</p>
        </div>

        <div className="mx-auto max-w-4xl rounded-[28px] border border-[#D7C7AC]/60 bg-[#FFFDF8] p-5 shadow-[0_24px_80px_rgba(36,48,39,0.08)] sm:p-8">
          <NativeBookingWidget lang={lang} />
        </div>
      </section>
    </main>
  );
}
