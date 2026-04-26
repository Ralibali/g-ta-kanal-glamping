import { Link } from "react-router-dom";
import SeoLanding from "@/components/SeoLanding";

const BoendeBergsSlussar = () => {
  return (
    <SeoLanding
      title="Boende vid Bergs Slussar – glamping vid Göta kanal"
      description="Boende vid Bergs Slussar i Östergötland. Ombonade glampingtält med riktiga sängar, värme och el – femton minuter från Linköping."
      canonical="https://goglampingsweden.se/boende-bergs-slussar"
      breadcrumbLabel="Boende vid Bergs Slussar"
      h1="Boende vid Bergs Slussar – sov nära slussarna och Göta kanal"
      intro={
        <>
          <p>
            Letar du efter boende vid Bergs Slussar? Hos oss bor du i ombonade
            glampingtält bara några minuters promenad från slusstrappan, med
            Göta kanal och Roxen alldeles intill. Vi ligger i Vreta Kloster,
            cirka femton minuter med bil från Linköping, och tar emot par,
            familjer och vänner som vill kombinera natur med riktig komfort.
          </p>
          <p>
            Här slipper du både hotellets fyra väggar och campingens enkla
            standard. I tälten finns bäddade sängar, värme, el, minikylskåp och
            handdukar, och servicehuset med dusch och toalett ligger nära. Det
            är ett lugnt och naturnära alternativ för dig som vill uppleva en
            av Östergötlands vackraste platser utan att kompromissa på
            bekvämligheten.
          </p>
        </>
      }
      sections={[
        {
          h2: "Bo mitt i Bergs Slussar-området",
          body: (
            <>
              <p>
                Bergs Slussar är en av de mest besökta platserna längs Göta
                kanal. Den välkända slusstrappan med sju slussar i följd
                lockar båtar och vandrare hela sommaren, och på kvällarna
                lägger sig ett särskilt lugn över området. När du bor hos oss
                har du allt detta inom gångavstånd – du kan ta morgonkaffet
                vid kanalen och se den första båten slussas redan innan
                dagsbesökarna anlänt.
              </p>
              <p>
                Området är också utgångspunkt för promenader till
                Stjärnorpsravinen, slottsruinen och vidare ner mot Roxen. För
                dig som söker boende i Bergs Slussar med möjlighet att stanna
                kvar och utforska i lugn takt är det här en av regionens
                bästa baspunkter.
              </p>
            </>
          ),
        },
        {
          h2: "Vad ingår i ditt boende",
          body: (
            <>
              <p>
                Vi har tre tält med olika storlek, alla utrustade för att du
                ska kunna kliva direkt in i en ombonad miljö. Sängarna är
                bäddade vid ankomst, med riktigt sänglinne och rena
                handdukar. I tältet finns el för laddning, värme för svala
                kvällar, ett minikylskåp och en fläkt för varma dagar. Kaffe,
                te och en flaska vatten står framme.
              </p>
              <p>
                Servicehuset på området har dusch och toalett, och städning
                vid utcheckning ingår alltid. Frukost kan bokas som tillval
                via grannen Bostället. Du kan läsa mer om hela upplevelsen
                under vår sida om{" "}
                <Link
                  to="/glamping-gota-kanal"
                  className="text-primary hover:underline font-medium"
                >
                  glamping vid Göta kanal
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          h2: "Boende nära Linköping utan stadens brus",
          body: (
            <>
              <p>
                För dig som söker boende nära Linköping men vill komma bort
                från trafiken är vi ett naturligt val. Färden tar runt femton
                minuter med bil via Vreta Kloster, och Östgötatrafiken
                trafikerar området med buss. När du anländer möts du av
                kanalens lugn, fågelsång och en utsikt som är svår att slå.
              </p>
              <p>
                Vill du veta mer om vägen hit och vad du kan göra på plats
                hittar du detaljer på vår sida om{" "}
                <Link
                  to="/glamping-linkoping"
                  className="text-primary hover:underline font-medium"
                >
                  glamping nära Linköping
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          h2: "Aktiviteter och utflykter på gångavstånd",
          body: (
            <>
              <p>
                Boendet vid Bergs Slussar är perfekt för dig som gillar att
                röra på dig. Längs kanalens dragvägar går det bra att cykla
                eller promenera mil efter mil, och i Roxen finns badplatser,
                paddleboard och fiske. Stjärnorps slottsruin nås genom en
                vacker skogsstig, och de lokala caféerna och restaurangerna
                ligger inom några minuters promenad.
              </p>
              <p>
                Vill du upptäcka mer av regionen kan du läsa om hela{" "}
                <Link
                  to="/glamping-ostergotland"
                  className="text-primary hover:underline font-medium"
                >
                  Östergötland som glampingdestination
                </Link>
                .
              </p>
            </>
          ),
        },
      ]}
      faqs={[
        {
          q: "Var ligger ert boende vid Bergs Slussar?",
          a: "Vi finns på Oscars Slussar 2 i Vreta Kloster, alldeles intill slusstrappan vid Bergs Slussar. Det är cirka femton minuter med bil från Linköping centrum.",
        },
        {
          q: "Vad är skillnaden mot vanlig camping?",
          a: "I våra glampingtält sover du i bäddade sängar med riktigt sänglinne och har el, värme och minikylskåp i tältet. Du behöver inte ta med sovsäck, madrass eller köksutrustning.",
        },
        {
          q: "Finns dusch och toalett på området?",
          a: "Ja, det finns ett servicehus med dusch och toalett som du når på en kort promenad från tälten. Städning ingår vid utcheckning.",
        },
        {
          q: "Kan jag boka frukost?",
          a: "Frukost kan bokas som tillval via Bostället, vår granne på området. Det är ett uppskattat sätt att starta dagen utan att behöva fixa något själv.",
        },
        {
          q: "När är ni öppna?",
          a: "Säsongen löper från maj till september då vädret tillåter en bekväm vistelse i tälten och kanalen är som vackrast.",
        },
      ]}
      cta={{
        heading: "Boka ditt boende vid Bergs Slussar",
        text: "Tre tält, en av Östergötlands vackraste platser och allt du behöver för en avkopplande vistelse. Säsongen är kort – välj dina datum medan plats finns.",
        button: "Boka nu",
      }}
    />
  );
};

export default BoendeBergsSlussar;
