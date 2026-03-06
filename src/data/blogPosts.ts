import glampingSunset from "@/assets/glamping-sunset.jpg";
import glampingExterior from "@/assets/glamping-exterior-deck.jpg";
import glampingInterior from "@/assets/glamping-interior-cozy.jpg";
import glampingNature from "@/assets/glamping-nature-kids.jpg";
import glampingReading from "@/assets/glamping-reading.jpg";
import glampingView from "@/assets/glamping-view-field.jpg";
import glampingNight from "@/assets/glamping-night-lights.jpg";
import glampingInteriorWide from "@/assets/glamping-interior-wide.jpg";
import glampingPersonDeck from "@/assets/glamping-person-deck.jpg";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  heroImage: string;
  content: string;
  images: string[];
  metaDescription: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "glamping-vid-gota-kanal",
    title: "Glamping vid Göta kanal – så mycket mer än en vanlig övernattning",
    excerpt:
      "Tänk dig att vakna till fågelkvitter, sträcka på dig i en riktig dubbelsäng och kliva ut på en trädäck med utsikt över ängar och morgondimma. Det är glamping vid Göta kanal.",
    date: "2025-05-12",
    readTime: "4 min",
    heroImage: glampingSunset,
    metaDescription:
      "Glamping vid Göta kanal i Östergötland. Lyxiga tält med dubbelsängar, värme och naturskön utsikt vid Bergs Slussar. Boka din glampingupplevelse idag.",
    images: [glampingExterior, glampingInterior],
    content: `
## En ny sorts naturupplevelse

Glamping – glamorous camping – handlar om att komma nära naturen utan att ge avkall på komforten. Hos oss vid Bergs Slussar, längs Göta kanal i Östergötland, har vi skapat en plats där du kan andas ut på riktigt.

Våra tält ligger utspridda på en lugn äng med utsikt över det östgötska landskapet. Varje tält är omsorgsfullt inrett med riktiga dubbelsängar, mysig belysning, filtar och allt du behöver för en bekväm natt under stjärnorna.

## Vad som gör vår glamping unik

Det som skiljer oss från andra boenden är närheten till både natur och kultur. Göta kanal – med sina historiska slussar – ligger bara ett stenkast bort. Du kan vandra längs kanalen, se båtar passera genom slussarna eller helt enkelt sitta på ditt trädäck och njuta av tystnaden.

Till skillnad från ett hotellrum vaknar du här till naturens egna ljud. Fågelkvitter, vinden i gräset och ibland ljudet av en kanalbåt som glider förbi. Det är den sortens morgon som får vardagsstressen att kännas avlägsen.

## Perfekt för par, familjer och vänner

Oavsett om du planerar en romantisk weekend, ett äventyr med barnen eller en avkopplande helg med vänner – glamping vid Göta kanal passar alla. Barnen älskar friheten att springa runt i naturen, medan de vuxna uppskattar lugnet och den genomtänkta komforten.

Området kring Bergs Slussar erbjuder dessutom massor av aktiviteter: vandring, cykling, fiske och kulturhistoriska upplevelser. Linköping ligger bara en kort bilresa bort om du vill kombinera naturupplevelsen med ett stadsbesök.

## Boka din glampingupplevelse

Säsongen är begränsad och platserna fylls snabbt. Om du drömmer om en natt under stjärnorna – fast med en riktig madrass under ryggen – är det dags att boka. Vi ser fram emot att välkomna dig till Bergs Slussar.
    `,
  },
  {
    slug: "bergs-slussar-guide",
    title: "Bergs Slussar – din kompletta guide till Göta kanals pärla",
    excerpt:
      "Bergs Slussar är en av Göta kanals mest imponerande platser. Med sju sammanhängande slussar, fantastisk natur och ett rikt kulturarv är det ett besöksmål du inte vill missa.",
    date: "2025-05-20",
    readTime: "5 min",
    heroImage: glampingView,
    metaDescription:
      "Guide till Bergs Slussar vid Göta kanal. Sju slussar, historia, aktiviteter och glamping i Östergötland nära Linköping. Allt du behöver veta.",
    images: [glampingNight, glampingPersonDeck],
    content: `
## Sju slussar – ett ingenjörskonstverk

Bergs Slussar, beläget strax utanför Linköping i Vreta Kloster, är en av de mest spektakulära platserna längs hela Göta kanal. Här finns sju sammanhängande slussar som lyfter båtarna hela elva meter – ett imponerande ingenjörskonstverk från tidigt 1800-tal som fortfarande fungerar precis som det var tänkt.

Att stå vid slussarna och se en båt sakta lyftas uppåt, steg för steg, är en upplevelse i sig. Det är fascinerande teknik och samtidigt otroligt avkopplande att betrakta.

## Historia och kulturarv

Göta kanal började byggas 1810 under ledning av Baltzar von Platen, och Bergs Slussar stod klara 1823. Kanalen kallades för "Sveriges största byggnadsverk" och sysselsatte tiotusentals arbetare under byggtiden.

Idag är Bergs Slussar ett levande kulturminne. Här kan du vandra längs dragvägarna där hästar en gång drog båtar, besöka det charmiga kaféet vid slussarna eller bara sitta och njuta av atmosfären vid vattnet.

## Vad finns att göra vid Bergs Slussar?

Förutom att beundra själva slussarna finns det massor att göra i området:

- **Vandring och cykling** – Göta kanal-leden erbjuder vackra vandringsstigar och cykelleder längs kanalens sträckning
- **Fiske** – Sjön Roxen, som ligger alldeles intill, är känd för sitt fina fiske med gädda, abborre och gös
- **Kanalbåtar** – Under sommaren kan du åka med på en nostalgisk tur med kanalbåt
- **Vreta Klosters kyrka** – En av Sveriges äldsta klosterkyrkor ligger bara några minuter bort
- **Linköping** – Domkyrkan, Gamla Linköping och Flygvapenmuseum nås på under tjugo minuter med bil

## Bo vid Bergs Slussar

Om du vill uppleva Bergs Slussar på riktigt räcker det inte med ett dagsbesök. Att vakna upp här, med morgondimman över ängarna och tystnaden som bara bryts av fågelkvitter, är något alldeles speciellt.

Vår glamping ligger i direkt anslutning till slussområdet. Du sover i ombonade tält med riktiga sängar, har tillgång till servicehus och kan njuta av platsen när dagsbesökarna har åkt hem. Det är då magin verkligen infinner sig.
    `,
  },
  {
    slug: "naturupplevelser-ostergotland",
    title: "Fem naturupplevelser i Östergötland du inte får missa",
    excerpt:
      "Östergötland bjuder på allt från dramatiska slätter till djupa skogar och glittrande sjöar. Här är fem naturupplevelser som gör din glampingvistelse extra minnesvärd.",
    date: "2025-06-01",
    readTime: "4 min",
    heroImage: glampingNature,
    metaDescription:
      "Naturupplevelser i Östergötland nära Bergs Slussar. Vandring, fiske, kanalbåtar och mer. Perfekt att kombinera med glamping vid Göta kanal.",
    images: [glampingReading, glampingInteriorWide],
    content: `
## 1. Göta kanal-leden – vandra eller cykla längs kanalen

Göta kanal-leden sträcker sig genom hela Östergötland och erbjuder några av de vackraste vandringsstigarna i Sverige. Från Bergs Slussar kan du vandra åt båda hållen längs kanalen – genom lummiga alléer, förbi historiska slussar och med vattnet som ständig följeslagare.

Leden passar alla nivåer. En kortare morgonpromenad eller en heldagstur – du väljer själv. Ta med en fika och slå dig ner vid vattnet. Det finns gott om platser att bara sitta och vara.

## 2. Roxen – fiske och fågelliv

Sjön Roxen ligger alldeles intill Bergs Slussar och är en av Östergötlands mest omtyckta sjöar. Här kan du fiska gädda, abborre och gös, eller helt enkelt njuta av utsikten.

Roxen är också känt för sitt rika fågelliv. Ta med kikaren och håll utsik efter häger, fiskgjuse och med lite tur – havsörn. Under våren rastar tusentals tranor i området, ett spektakel som är värt en resa i sig.

## 3. Ombergs ekopark – urskog och panoramautsikt

Cirka fyrtio minuter från Bergs Slussar ligger Ombergs ekopark – ett av Sveriges mest dramatiska naturområden. Här möter den täta bokskogen branta klippor med utsikt över Vättern.

Vandringslederna varierar från lättgångna till mer utmanande, och utsikten från Hjässan – Ombergs högsta punkt – är hisnande. Perfekt för en dagsutflykt under din glampingsemester.

## 4. Tinnerö eklandskap – Europas största ekhagar

Strax utanför Linköping hittar du Tinnerö eklandskap, ett av Europas största sammanhängande ekområden. Här vandrar du bland hundratals år gamla ekar i ett landskap som andas historia.

Området är hem för en mängd sällsynta arter – från läderbaggar till olika typer av lavar och mossor. En lugn och vacker plats som passar perfekt för en eftermiddagspromenad.

## 5. Kvällsstunden vid glamping-tältet

Ibland behöver man inte åka någonstans alls. En av de finaste naturupplevelserna väntar utanför ditt eget tält. När solen går ner över ängarna vid Bergs Slussar, himlen skiftar i rosa och guld, och tystnaden lägger sig – då förstår du varför vi valde just den här platsen.

Ta med en varm filt, sitt på trädäcket och låt kvällen komma. Kanske tänds en stjärna, kanske hörs en uggla. Det är de stunderna man minns.

## Boka din naturupplevelse

Alla dessa upplevelser ligger inom räckhåll från vår glamping vid Bergs Slussar. Boka ditt tält och ge dig själv tid att upptäcka Östergötland – på riktigt.
    `,
  },
];
