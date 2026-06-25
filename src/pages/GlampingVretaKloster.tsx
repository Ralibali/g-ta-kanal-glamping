import { Link } from "react-router-dom";
import SeoLanding from "@/components/SeoLanding";

const GlampingVretaKloster = () => {
  return (
    <SeoLanding
      title="Glamping i Vreta Kloster – Bergs Slussar vid Göta kanal"
      description="Glamping i Vreta Kloster vid Bergs Slussar. Bo nära Göta kanal, Roxen och Linköping i ombonade tält med riktiga sängar, värme och el."
      canonical="https://goglampingsweden.se/glamping-vreta-kloster"
      breadcrumbLabel="Glamping i Vreta Kloster"
      h1="Glamping i Vreta Kloster – bo vid Bergs Slussar och Göta kanal"
      intro={
        <>
          <p>
            Vreta Kloster är en av Östergötlands mest charmiga orter, känd
            för sin medeltida klosterhistoria, närheten till Göta kanal och
            de breda vyerna över Roxen. Mitt i den här miljön ligger vår
            glamping vid Bergs Slussar – en plats där du sover gott,
            promenerar mellan slussarna och har Linköping inom räckhåll.
          </p>
          <p>
            Vi tar emot par, familjer och små sällskap som vill ha boende i
            Vreta Kloster med riktig komfort. Glampingtälten är utrustade
            med bäddade sängar, värme, el, minikylskåp och handdukar.
            Servicehuset med dusch och toalett ligger nära och städning
            ingår alltid.
          </p>
        </>
      }
      sections={[
        {
          h2: "Vreta Kloster som plats att övernatta på",
          body: (
            <>
              <p>
                Vreta Klosters klosterruin från elvahundratalet är en av
                Sveriges äldsta och bara några minuter med bil från oss.
                Området har en stillsam, levande bygd-känsla med smala vägar,
                gårdsbutiker och utsikt över sjön Roxen. Att lägga sin
                övernattning här gör att du verkligen hinner uppleva
                miljön, inte bara köra förbi.
              </p>
              <p>
                För dig som söker boende i Vreta Kloster är vår glamping ett
                naturligt val. Du bor i naturen men når både kyrkan,
                kanalen och de lokala caféerna utan bil.
              </p>
            </>
          ),
        },
        {
          h2: "Bergs Slussar – glampingens närmaste granne",
          body: (
            <>
              <p>
                Bergs Slussar är hjärtat i området. Slusstrappan med sju
                slussar är en av Göta kanals mest fotograferade platser, och
                under sommarmånaderna är det ett naturligt nav för båtfolk,
                cyklister och dagsbesökare. När du bor hos oss har du allt
                detta på gångavstånd.
              </p>
              <p>
                Läs mer om kanalen på vår sida om{" "}
                <Link
                  to="/glamping-gota-kanal"
                  className="text-primary hover:underline font-medium"
                >
                  glamping vid Göta kanal
                </Link>{" "}
                eller om hela{" "}
                <Link
                  to="/boende-bergs-slussar"
                  className="text-primary hover:underline font-medium"
                >
                  boendet vid Bergs Slussar
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          h2: "Glamping nära Linköping utan stadens stress",
          body: (
            <>
              <p>
                Vreta Kloster ligger ungefär femton minuter med bil från
                Linköping centrum. Det betyder att du kan kombinera lugnet
                hos oss med en middag i staden, ett besök på Flygvapenmuseum
                eller en dag i Gamla Linköping. Du hittar fler tips på vår
                sida om{" "}
                <Link
                  to="/glamping-linkoping"
                  className="text-primary hover:underline font-medium"
                >
                  glamping nära Linköping
                </Link>
                .
              </p>
              <p>
                Många gäster väljer Vreta Kloster just av denna anledning –
                här får du både naturen och staden inom samma resa.
              </p>
            </>
          ),
        },
        {
          h2: "Boende nära Roxen och naturen runt om",
          body: (
            <>
              <p>
                Roxen ligger en kort promenad eller bilresa från oss och
                erbjuder badmöjligheter, paddleboard och fågelskådning. För
                dig som vill röra på dig finns Stjärnorpsravinen, kanalens
                cykelvägar och vandringsstigar i alla riktningar.
              </p>
              <p>
                Vill du läsa om regionen som helhet finns en översikt på vår
                sida om{" "}
                <Link
                  to="/glamping-ostergotland"
                  className="text-primary hover:underline font-medium"
                >
                  glamping i Östergötland
                </Link>
                .
              </p>
            </>
          ),
        },
      ]}
      faqs={[
        {
          q: "Var ligger glampingen i förhållande till Vreta Klosters kyrka?",
          a: "Vi ligger några minuter med bil från Vreta Klosters kyrka och klosterruin. Det går också att cykla på lugna vägar mellan platserna.",
        },
        {
          q: "Är det barnvänligt?",
          a: "Ja, området är lugnt och naturnära. Många familjer väljer oss för en första naturnära övernattning eftersom standarden i tälten är hög.",
        },
        {
          q: "Hur långt är det till Roxen?",
          a: "Roxen ligger inom några minuters promenad eller bilresa. Sjön är populär för bad, paddleboard och fågelskådning.",
        },
        {
          q: "Kan jag ta hit egen mat?",
          a: "Ja. Det finns minikylskåp i tältet och du kan grilla på området. Egen matlagning inne i tälten är inte tillåten av brandsäkerhetsskäl.",
        },
        {
          q: "Vilka veckor passar bäst att boka?",
          a: "Hela säsongen från maj till september fungerar bra. Juli och första halvan av augusti är intensivast, så för lugnare upplevelser kan juni och slutet av augusti vara fina alternativ.",
        },
      ]}
      cta={{
        heading: "Boka glamping i Vreta Kloster",
        text: "Sov vid Bergs Slussar mitt i en av Östergötlands vackraste bygder. Säsongen är kort och tre tält fylls snabbt.",
        button: "Boka nu",
      }}
    />
  );
};

export default GlampingVretaKloster;
