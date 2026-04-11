import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const BookingTerms = () => {
  useEffect(() => {
    document.title = "Bokningsvillkor – Bergs Slussar Glamping";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Läs våra bokningsvillkor för glamping vid Bergs Slussar. Information om avbokning, incheckning, utcheckning och ordningsregler.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container max-w-3xl">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground/90 text-sm mb-6 transition-colors">
            <ArrowLeft size={14} />
            Tillbaka till startsidan
          </Link>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Bokningsvillkor</h1>
          <p className="text-primary-foreground/70 mt-2">Bergs Slussar Glamping – GoGlamping Sweden</p>
        </div>
      </div>

      <div className="container max-w-3xl py-12 space-y-10">
        {/* Bokning */}
        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Bokning och betalning</h2>
          <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed list-disc list-inside">
            <li>Bokning sker via vår hemsida eller genom vårt bokningssystem (Sirvoy).</li>
            <li>Full betalning sker vid bokningstillfället om inte annat anges.</li>
            <li>En bokningsbekräftelse skickas via e-post efter genomförd bokning.</li>
            <li>Alla priser anges i svenska kronor (SEK) inklusive moms.</li>
          </ul>
        </section>

        {/* Avbokning */}
        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Avbokningspolicy</h2>
          <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed list-disc list-inside">
            <li><strong className="text-foreground">Mer än 5 dagar före ankomst:</strong> Kostnadsfri avbokning. Fullständig återbetalning.</li>
            <li><strong className="text-foreground">Mindre än 5 dagar före ankomst:</strong> Ingen återbetalning.</li>
            <li><strong className="text-foreground">Utebliven ankomst (no-show):</strong> Ingen återbetalning.</li>
            <li>Avbokning görs via e-post till <a href="mailto:hej@goglampingsweden.se" className="text-accent font-medium hover:underline">hej@goglampingsweden.se</a> eller via bokningssystemet.</li>
          </ul>
        </section>

        {/* Incheckning / Utcheckning */}
        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Incheckning och utcheckning</h2>
          <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed list-disc list-inside">
            <li><strong className="text-foreground">Incheckning:</strong> Från kl. 15:00 på ankomstdagen.</li>
            <li><strong className="text-foreground">Utcheckning:</strong> Senast kl. 10:00 på avresedagen.</li>
            <li><strong className="text-foreground">Sen utcheckning:</strong> Kan erbjudas till kl. 12:00 mot en avgift på 400 kr (Swish). Meddela oss i förväg.</li>
            <li>Incheckning sker digitalt via länk som skickas med bokningsbekräftelsen.</li>
          </ul>
        </section>

        {/* Ordningsregler */}
        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Ordningsregler</h2>
          <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed list-disc list-inside">
            <li>Rökning är inte tillåten i eller i närheten av tälten.</li>
            <li>Håll ljudnivån nere, särskilt kvällstid – visa hänsyn till medgäster och grannar.</li>
            <li>Husdjur är välkomna i tältet Lugnets Yta mot en husdjursavgift.</li>
            <li>Tältet ska lämnas i rimligt skick. Skräp och matrester tas med vid utcheckning.</li>
            <li>Disk sker i servicehuset (~150 m från tälten). Lämna köksytan ren efter användning.</li>
            <li>Städning ingår i priset, men vi ber er visa omsorg om tält och inventarier.</li>
          </ul>
        </section>

        {/* Vad som ingår */}
        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Vad som ingår i priset</h2>
          <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed list-disc list-inside">
            <li>Bäddade sängar med sänglinne och handdukar.</li>
            <li>El, värme och fläkt i tältet.</li>
            <li>Minikylskåp.</li>
            <li>Kaffe, te och en flaska vatten.</li>
            <li>Städning vid utcheckning.</li>
            <li>Tillgång till servicehus med toalett, dusch och skötrum.</li>
            <li>Frukost kan läggas till som tillval vid bokning (via Bostället).</li>
          </ul>
        </section>

        {/* Ansvar */}
        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Ansvar och skador</h2>
          <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed list-disc list-inside">
            <li>Gästen ansvarar för eventuella skador på tält och inventarier under vistelsen.</li>
            <li>Bergs Slussar Glamping ansvarar inte för förlust eller stöld av personliga tillhörigheter.</li>
            <li>Vid force majeure (naturkatastrofer, myndighetsförbud etc.) erbjuds ombokning eller full återbetalning.</li>
          </ul>
        </section>

        {/* Kontakt */}
        <section className="bg-muted rounded-2xl p-6">
          <h2 className="font-serif text-lg font-bold text-foreground mb-2">Frågor?</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Kontakta oss på{" "}
            <a href="mailto:hej@goglampingsweden.se" className="text-accent font-medium hover:underline">hej@goglampingsweden.se</a>
            {" "}så hjälper vi dig.
          </p>
        </section>

        <div className="pt-4">
          <Link
            to="/#boka"
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-xl font-semibold hover:scale-[1.02] transition-transform shadow-md text-sm"
          >
            Boka glamping vid Bergs Slussar
          </Link>
        </div>

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "Bokningsvillkor – Bergs Slussar Glamping",
              url: "https://goglampingsweden.se/bokningsvillkor",
              breadcrumb: {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Hem", item: "https://goglampingsweden.se/" },
                  { "@type": "ListItem", position: 2, name: "Bokningsvillkor", item: "https://goglampingsweden.se/bokningsvillkor" },
                ],
              },
            }),
          }}
        />
      </div>
    </div>
  );
};

export default BookingTerms;
