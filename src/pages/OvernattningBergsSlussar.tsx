import { Link } from "react-router-dom";
import SeoLanding from "@/components/SeoLanding";

const OvernattningBergsSlussar = () => {
  return (
    <SeoLanding
      title="Övernattning vid Bergs Slussar – unik glamping i Östergötland"
      description="Unik övernattning vid Bergs Slussar och Göta kanal. Glampingtält med bäddade sängar, värme och el – perfekt weekend nära Linköping."
      canonical="https://goglampingsweden.se/overnattning-bergs-slussar"
      breadcrumbLabel="Övernattning vid Bergs Slussar"
      h1="Övernattning vid Bergs Slussar – sov nära slussarna och kanalen"
      intro={
        <>
          <p>
            En övernattning vid Bergs Slussar är något annat än ett vanligt
            hotellbesök. Du somnar till ljudet av vatten i slusstrappan,
            vaknar till morgondimma över kanalen och har kaffet i handen
            innan resten av området vaknat. Hos oss bor du i ombonade
            glampingtält i Vreta Kloster, cirka femton minuter med bil från
            Linköping.
          </p>
          <p>
            Vi tar emot dig som vill ha en unik övernattning i Östergötland
            utan att ge avkall på komforten. Tälten har bäddade sängar,
            värme, el och minikylskåp, och servicehuset med dusch och toalett
            ligger ett stenkast bort. Det är ett tryggt och naturnära
            alternativ för par, familjer och vänner som vill göra en weekend
            nära Linköping till något att minnas.
          </p>
        </>
      }
      sections={[
        {
          h2: "Varför välja övernattning hos oss",
          body: (
            <>
              <p>
                Många frågar varför de ska välja en övernattning vid Bergs
                Slussar framför ett hotell i Linköping. Svaret är platsen
                själv. Slusstrappan, kanalen och utsikten över Roxen ger en
                ramberättelse som ingen hotellobby kan matcha. Samtidigt
                slipper du de praktiska bekymren med camping – allt är
                förberett när du kommer.
              </p>
              <p>
                Du går in i ett tält där sängen är bäddad, lampan tänd och
                kaffet framställt. Det är en låg tröskel till en
                naturupplevelse som annars kan kännas omständlig att ordna.
              </p>
            </>
          ),
        },
        {
          h2: "En weekend nära Linköping med riktig återhämtning",
          body: (
            <>
              <p>
                För dig som bor i Linköping eller någon annanstans i
                Östergötland fungerar en övernattning hos oss som en kort
                paus från vardagen. Sätt dig i bilen efter jobbet, kör hit på
                en kvart och kliv ur i en helt annan miljö. Många gäster
                berättar att en enda natt räcker för att känna sig utvilade.
              </p>
              <p>
                Vill du planera resan in i minsta detalj kan du läsa mer om{" "}
                <Link
                  to="/glamping-linkoping"
                  className="text-primary hover:underline font-medium"
                >
                  glamping nära Linköping
                </Link>{" "}
                och våra närmaste utflyktsmål.
              </p>
            </>
          ),
        },
        {
          h2: "Glamping vid Göta kanal som passar både par och familjer",
          body: (
            <>
              <p>
                Våra tre tält är olika stora och täcker både par som vill ha
                en romantisk natt och familjer som behöver lite mer plats.
                Sjöbrisretreatet har dubbelsäng och bäddsoffa, Naturkärnan
                och Lugnets Yta är något mindre och passar par eller en
                vuxen med ett barn. Alla har samma standard på utrustning.
              </p>
              <p>
                Lär känna de olika tälten och området närmare på vår sida om{" "}
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
          h2: "Vad du gör under och efter övernattningen",
          body: (
            <>
              <p>
                En övernattning räcker långt om du planerar lite. Promenera
                längs slusstrappan, ta en cykeltur längs kanalen, prova
                paddleboard på Roxen eller vandra upp till Stjärnorps
                slottsruin. På kvällen kan du grilla på området, äta på
                någon av närliggande restaurangerna eller bara sätta dig
                ute med en kopp te.
              </p>
              <p>
                Du hittar mer info om sevärdheter och avstånd på vår sida om{" "}
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
          q: "Hur lång är minsta vistelse?",
          a: "Du kan boka en enda övernattning, men många gäster väljer två nätter för att hinna varva ner och utforska området ordentligt.",
        },
        {
          q: "När sker incheckning och utcheckning?",
          a: "Incheckning sker tidigast klockan 15:00 och utcheckning senast klockan 10:00 på avresedagen. Sen utcheckning kan bokas som tillval i mån av plats.",
        },
        {
          q: "Får jag ta med hund?",
          a: "Vi tar emot bokningar med hund i utvalda tält. Kontakta oss innan bokning så hittar vi en lösning som fungerar för både dig och kommande gäster.",
        },
        {
          q: "Hur tar jag mig hit utan bil?",
          a: "Östgötatrafiken trafikerar Berg och Vreta Kloster med buss från Linköping. Hållplatsen ligger nära glampingområdet och det är en kort promenad till tälten.",
        },
        {
          q: "Vad händer om det regnar?",
          a: "Tälten är byggda för svenskt väder och har värme. Regnet hör för många till charmen, och området är fint även mulna dagar.",
        },
      ]}
      cta={{
        heading: "Boka din övernattning vid Bergs Slussar",
        text: "Sov en natt eller stanna en hel weekend. Tre tält, kanalens lugn och allt förberett när du kommer.",
        button: "Boka övernattning",
      }}
    />
  );
};

export default OvernattningBergsSlussar;
