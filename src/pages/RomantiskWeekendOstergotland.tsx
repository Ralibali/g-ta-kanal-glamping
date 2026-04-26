import { Link } from "react-router-dom";
import SeoLanding from "@/components/SeoLanding";

const RomantiskWeekendOstergotland = () => {
  return (
    <SeoLanding
      title="Romantisk weekend i Östergötland – glamping för par"
      description="Romantisk weekend i Östergötland vid Göta kanal och Bergs Slussar. Glamping för par med bäddade sängar, värme och kanalutsikt."
      canonical="https://goglampingsweden.se/romantisk-weekend-ostergotland"
      breadcrumbLabel="Romantisk weekend i Östergötland"
      h1="Romantisk weekend i Östergötland – glamping för två vid Göta kanal"
      intro={
        <>
          <p>
            En romantisk weekend i Östergötland behöver inte betyda spa,
            champagne och mörka hotellrum. För många par är det istället en
            kväll vid kanalen, en bäddad säng under tältduken och en utsikt
            över Bergs Slussar i morgondiset som blir den minnesvärda
            upplevelsen. Hos oss bor ni i ombonade glampingtält bara
            femton minuter från Linköping.
          </p>
          <p>
            Det är en weekend nära Linköping som passar både er som vill
            fira något särskilt och er som bara vill komma ifrån. Tälten har
            riktiga sängar, värme, el och minikylskåp – och Göta kanal,
            Roxen och Stjärnorpsravinen ligger inom kort räckhåll. Det är
            naturnära men aldrig obekvämt.
          </p>
        </>
      }
      sections={[
        {
          h2: "Glamping för par med plats för stillhet",
          body: (
            <>
              <p>
                Det fina med glamping är just kombinationen – ni får
                naturens lugn utan att kompromissa på sömnen. Vi har tält i
                olika storlek, men de mindre, som Naturkärnan och Lugnets
                Yta, är särskilt fina för par. Bäddade sängar med riktigt
                sänglinne, en fläkt, en värmare för svala kvällar och kaffe
                framställt vid ankomst.
              </p>
              <p>
                Många väljer glamping för par eftersom det blir en
                gemensam upplevelse från början – ni packar upp tillsammans,
                tar en promenad till slussarna och lagar inget i hast.
              </p>
            </>
          ),
        },
        {
          h2: "Vad ni gör under weekenden",
          body: (
            <>
              <p>
                En weekend räcker längre än man tror om man väljer rätt
                miljö. Börja med en kvällspromenad längs kanalen, ät
                middag på någon av närliggande restaurangerna eller grilla
                vid tältet. Nästa dag kan ni cykla eller paddla på Roxen,
                besöka Vreta Klosters klosterruin eller köra ner till
                Linköping för en kaffe.
              </p>
              <p>
                Om ni vill ha mer tips på utflykter i regionen finns en
                översikt på vår sida om{" "}
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
        {
          h2: "Romantisk övernattning i Östergötland med kanalutsikt",
          body: (
            <>
              <p>
                Det är något särskilt med att vakna intill Göta kanal. När
                morgonsolen träffar vattnet och de första båtarna börjar
                slussas är det en stillhet som svårligen går att återskapa
                någon annanstans. För många par blir det själva
                höjdpunkten – inte ett bokat program, utan tiden ihop på
                platsen.
              </p>
              <p>
                Läs mer om hur det är att{" "}
                <Link
                  to="/boende-gota-kanal"
                  className="text-primary hover:underline font-medium"
                >
                  bo vid Göta kanal
                </Link>{" "}
                eller om{" "}
                <Link
                  to="/overnattning-bergs-slussar"
                  className="text-primary hover:underline font-medium"
                >
                  övernattning vid Bergs Slussar
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          h2: "Praktiskt inför er weekend nära Linköping",
          body: (
            <>
              <p>
                Vi finns i Vreta Kloster, cirka femton minuter med bil från
                Linköping centrum. Incheckning sker från klockan 15:00 och
                utcheckning klockan 10:00, men sen utcheckning kan bokas
                som tillval i mån av plats om ni vill njuta lite längre.
                Frukost kan bokas via Bostället på området.
              </p>
              <p>
                Behöver ni mer info om vägen hit kan ni läsa om{" "}
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
      ]}
      faqs={[
        {
          q: "Vilket tält passar bäst för par?",
          a: "Naturkärnan och Lugnets Yta är våra mindre tält och passar fint för par som vill ha en mysig och ombonad känsla. Sjöbrisretreatet är något större och rymmer även en bäddsoffa.",
        },
        {
          q: "Kan ni ordna något extra inför ankomsten?",
          a: "Hör av er före ankomst så gör vi vad vi kan – allt från en bokad frukost till tips på närmaste restaurang för middag.",
        },
        {
          q: "Är det tyst på området nattetid?",
          a: "Ja. Vi har lugn på området och kanalen själv är vår starkaste bakgrundsljud. Många upplever stillheten som det mest uppskattade med vistelsen.",
        },
        {
          q: "Hur långt är det till en restaurang?",
          a: "Det finns restauranger och caféer på och kring Bergs Slussar. För större utbud kan ni ta er till Linköping på cirka femton minuter.",
        },
        {
          q: "Kan vi boka två nätter?",
          a: "Absolut. Många par väljer två nätter för att verkligen hinna landa, ta en längre promenad och uppleva både morgonen och kvällen vid kanalen.",
        },
      ]}
      cta={{
        heading: "Boka er romantiska weekend",
        text: "Två nätter vid kanalen, bäddade sängar och en miljö ni inte glömmer. Tre tält och en kort säsong – välj era datum medan plats finns.",
        button: "Boka weekend",
      }}
    />
  );
};

export default RomantiskWeekendOstergotland;
