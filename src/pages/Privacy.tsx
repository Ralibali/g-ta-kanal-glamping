import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

export default function Privacy() {
  return <main className="min-h-screen bg-background text-foreground">
    <article className="container max-w-3xl space-y-5 py-16">
      <Link to="/" className="underline">Till startsidan</Link>
      <h1 className="text-3xl font-serif">Integritet och cookies</h1>
      <p>Information för Bergs Slussar Glamping / Go Glamping Sweden. Uppdaterad 1 oktober 2026.</p>
      <h2 className="text-xl font-semibold">Ansvarig och kontakt</h2>
      <p>Aurora Media AB, organisationsnummer 559272-0220, driver verksamheten. Kontakta oss om personuppgifter och dina rättigheter på <a className="underline" href="mailto:hej@goglampingsweden.se">hej@goglampingsweden.se</a>.</p>
      <h2 className="text-xl font-semibold">Bokning, vistelse och kontakt</h2>
      <p>Vi behandlar de uppgifter du lämnar vid bokning och kontakt: namn, e-post, telefon, bokningsnummer, vistelsedatum, valt tält, beställningar, betalningsstatus och meddelanden. De används för att besvara förfrågningar och fullgöra bokningsavtalet. Du kan också lämna önskemål om mat. Lämna bara den information som behövs för beställningen.</p>
      <p>Sirvoy tillhandahåller bokningsformuläret. Det laddas när du väljer att öppna det. Betalningar och tillägg kan hanteras av Stripe; meddelanden levereras genom våra e-post- och SMS-tjänster (Resend och 46elks). Webbplatsens databas och inloggning drivs med Lovable Cloud/Supabase.</p>
      <h2 className="text-xl font-semibold">Personalens uppgifter</h2>
      <p>Personalportaler används för arbetsuppgifter, tidrapportering och löneunderlag. Sådana uppgifter behandlas för anställningen och de skyldigheter som följer av bland annat bokförings- och skatteregler. Åtkomst kräver inloggning och en tilldelad personalroll.</p>
      <h2 className="text-xl font-semibold">Valfri statistik och externa kartor</h2>
      <p>Google Analytics 4 och vår besöksstatistik aktiveras efter ditt samtycke till statistik. Statistik kan omfatta sidvisningar, typ av enhet och standardiserade klickhändelser. Vi skickar inte med formulärtext, e-post, telefon, bokningsnummer eller privata vistelselänkar i dessa händelser. Google kan behandla data utanför EU/EES; se <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">Googles information</a>.</p>
      <p>Du kan neka statistik och senare återkalla eller lämna samtycke via knappen Cookieinställningar. Valet sparas lokalt under <code>glamping_ga4_consent_v2</code>. Nödvändig lagring används för inloggning, språk och för att komma ihåg dina val. Valet gäller högst 365 dagar. Google kan efter godkännande skapa _ga och _ga_* med pseudonyma besöksidentifierare, normalt i upp till två år efter senaste användning. Vid återkallande stoppas nya statistikhändelser och tillgängliga statistikcookies tas bort.</p>
      <p>Google Maps laddas först om du väljer att visa kartan. Din webbläsare ansluter då till Google och delar IP-adress och webbläsarinformation. Teckensnitt serveras från vår egen webbplats.</p>
      <h2 className="text-xl font-semibold">Lagring och rättigheter</h2>
      <p>Uppgifter behöver finnas så länge förfrågan, bokningen eller anställningen hanteras och därefter i den omfattning det krävs för rättsliga krav, redovisning eller tvister. Kontakta oss för besked om lagringstiden för en viss uppgift, mottagare och eventuella överföringar utanför EU/EES.</p>
      <p>Du kan begära tillgång, rättelse, radering, begränsning och dataportabilitet när reglerna gäller samt invända mot behandling och återkalla samtycke. Radering kan begränsas av lagkrav. Kontakta adressen ovan; vi kontrollerar identiteten innan privata uppgifter lämnas ut. Du kan klaga hos <a className="underline" href="https://www.imy.se/privatperson/dataskydd/dina-rattigheter/" target="_blank" rel="noopener noreferrer">Integritetsskyddsmyndigheten (IMY)</a>.</p>
    </article>
    <Footer />
  </main>;
}
