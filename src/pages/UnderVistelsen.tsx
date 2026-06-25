import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin, Phone, Clock, Key, UtensilsCrossed, Trees,
  Wifi, Flame, Cigarette, Dog, Info, Footprints, CheckCircle2, AlertCircle,
  Coffee, MessageCircle, ShoppingBag, Car
} from "lucide-react";
import heroImg from "@/assets/glamping-sunset.jpg";

export default function UnderVistelsen() {
  const [isSv, setIsSv] = useState(true);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    document.title = isSv
      ? "Under din vistelse · Go Glamping Sweden"
      : "During your stay · Go Glamping Sweden";
    return () => { document.head.removeChild(meta); };
  }, [isSv]);

  const t = isSv ? {
    sub: "Under er vistelse",
    h1: "Hoppas ni har det fint!",
    stayTitle: "Ert boende",
    checkout: "Utcheckning senast",
    lockCode: "Kod till hänglåset",
    lateTitle: "Vill ni stanna lite längre?",
    lateBody: "Sen utcheckning till kl 12:00 går bra att boka i mån av plats. En lugn förmiddag vid kanalen utan stress.",
    lateItem: "Sen utcheckning till 12:00",
    lateHow: "Swisha 400 kr till 072-225 49 93 (Christoffer) och skriv tältets namn + bokningsnummer som meddelande. Sms:a oss gärna också så bekräftar vi direkt.",
    sms: "Sms:a oss",
    call: "Ring Christoffer",
    knowTitle: "Bra att veta i tältet",
    serviceCard: "Servicekortet i tältet",
    serviceCardBody: "Servicekortet som ligger framme i tältet är nyckeln till servicehuset (toalett, dusch, skötrum). Ta gärna med det i fickan – det är ca 150 m gångväg.",
    slippers: "Tofflor är guld värda",
    slippersBody: "Stigen till servicehuset går över gräs och grus. Ett par tofflor eller slip-in-skor gör nattliga toabesök mycket trevligare.",
    food: "Mat & matlagning",
    foodBody: "Matlagning är inte tillåten i eller vid tälten (brandsäkerhet). Kylskåp, kaffe och te finns inne i tältet. Restaurang vid slussarna ligger ca 200 m bort.",
    wifi: "Wifi & täckning",
    wifiBody: "Inget wifi — platsen är till för att koppla av. 4G/5G fungerar utmärkt.",
    fire: "Eldning, ljus & rökning",
    fireBody: "Öppen eld, marschaller och engångsgrillar är inte tillåtna. Tälten är rökfria – rök gärna utomhus, väl bort från tältduken.",
    pets: "Husdjur",
    petsBody: "Husdjur är tyvärr inte tillåtna i tälten.",
    beforeLeave: "Innan ni åker hem",
    beforeIntro: "En liten vänlig påminnelse så att vi kan ta emot nästa gäst i samma fina skick:",
    washUp: "Diska det ni använt (koppar, glas, bestick) och ställ tillbaka i tältet.",
    trash: "Kasta sopor i kärlen vid parkeringen — låt inte mat eller skräp ligga kvar.",
    dontForget: "Glöm inte saker! Kolla under sängen, i kylen och i tältets ytterfack.",
    leaveCard: "Lämna servicekortet kvar i tältet.",
    zip: "Stäng dragkedjorna på tältet ordentligt när ni går.",
    lostItems: "Kvarglömda saker postar vi tyvärr inte – men hör av er så förvarar vi dem tills ni kan hämta.",
    nearbyTitle: "Att göra i närheten",
    locks: "Se båtar slussa på Göta kanal",
    locksBody: "Slussarna trafikeras hela dagen i sommarsäsongen. Det är 15 trappstegsslussar — en av Sveriges finaste vyer.",
    rent: "Hyr cykel eller kanot",
    rentBody: "Bergs Slussar Café & Uthyrning ligger 200 m bort. Cykla längs kanalen eller paddla till Roxen.",
    fika: "Fika, lunch & glass",
    fikaBody: "Kanalkrogen, Slussarnas Café och glasskiosken finns alla inom 5 min promenad.",
    roxen: "Vandra till Roxen",
    roxenBody: "Följ kanalen norrut ca 1,5 km så öppnar Roxen upp sig — perfekt för solnedgång.",
    vreta: "Vreta klosterkyrka",
    vretaBody: "Sveriges äldsta kloster, 1,5 km från tälten. Vackert att besöka, även för en kort tur.",
    linkoping: "Linköping (20 min med bil)",
    linkopingBody: "Domkyrkan, Gamla Linköping, restauranger och shopping. Bra utflyktsmål för en regnig dag.",
    maps: "Öppna området i Google Maps →",
    contactTitle: "Hör av er om något behövs",
    contactBody: "Christoffer svarar i mobilen: ",
    emailPrefix: ". Mejl: ",
    footer: "Tack för att ni valde Go Glamping Sweden",
  } : {
    sub: "During your stay",
    h1: "Hope you're enjoying it!",
    stayTitle: "Your stay",
    checkout: "Check-out by",
    lockCode: "Lock code",
    lateTitle: "Want to stay a little longer?",
    lateBody: "Late check-out until 12:00 noon is available subject to availability — enjoy a calm morning by the canal.",
    lateItem: "Late check-out until 12:00",
    lateHow: "Swish 400 SEK to +46 72-225 49 93 (Christoffer) with your tent name + booking number as message. Or text us and we'll confirm right away.",
    sms: "Text us",
    call: "Call Christoffer",
    knowTitle: "Good to know in the tent",
    serviceCard: "The service card in the tent",
    serviceCardBody: "The service card in your tent is the key to the service house (toilet, shower, changing room). Keep it in your pocket — it's about a 150 m walk.",
    slippers: "Slippers are gold",
    slippersBody: "The path to the service house crosses grass and gravel. A pair of slippers or slip-on shoes makes night-time trips much nicer.",
    food: "Food & cooking",
    foodBody: "Cooking is not allowed in or next to the tents (fire safety). Fridge, coffee and tea are inside the tent. The restaurant by the locks is ~200 m away.",
    wifi: "Wifi & coverage",
    wifiBody: "No wifi — the spot is for unplugging. 4G/5G works great.",
    fire: "Fire, candles & smoking",
    fireBody: "Open fires, torches and disposable BBQs are not permitted. Tents are non-smoking — smoke outside, well away from the canvas.",
    pets: "Pets",
    petsBody: "Sorry, pets are not allowed in the tents.",
    beforeLeave: "Before you leave",
    beforeIntro: "A friendly reminder so we can welcome the next guest just as nicely:",
    washUp: "Wash up what you've used (cups, glasses, cutlery) and put it back in the tent.",
    trash: "Toss rubbish in the bins by the parking lot — don't leave food or trash behind.",
    dontForget: "Don't forget anything! Check under the bed, in the fridge and the outer pocket.",
    leaveCard: "Leave the service card in the tent.",
    zip: "Zip the tent properly when you leave.",
    lostItems: "We can't post forgotten items — but let us know and we'll keep them safe until you can pick them up.",
    nearbyTitle: "Things to do nearby",
    locks: "Watch boats lock through Göta Canal",
    locksBody: "The locks are busy throughout summer days. 15 staircase locks — one of Sweden's loveliest views.",
    rent: "Rent a bike or canoe",
    rentBody: "Bergs Slussar Café & Rentals is 200 m away. Cycle along the canal or paddle out to Lake Roxen.",
    fika: "Coffee, lunch & ice-cream",
    fikaBody: "Kanalkrogen, Slussarnas Café and the ice-cream kiosk are all within a 5 min walk.",
    roxen: "Walk to Lake Roxen",
    roxenBody: "Follow the canal north for ~1.5 km and Lake Roxen opens up — perfect for sunset.",
    vreta: "Vreta Abbey Church",
    vretaBody: "Sweden's oldest abbey, 1.5 km from the tents. Lovely to visit, even briefly.",
    linkoping: "Linköping (20 min by car)",
    linkopingBody: "Cathedral, Old Linköping museum, restaurants and shopping. A good rainy-day option.",
    maps: "Open the area in Google Maps →",
    contactTitle: "Reach out if you need anything",
    contactBody: "Christoffer is on the phone: ",
    emailPrefix: ". Email: ",
    footer: "Thank you for choosing Go Glamping Sweden",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative h-[220px] sm:h-[280px] w-full overflow-hidden">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-background" />
        <div className="relative h-full max-w-2xl mx-auto px-4 flex flex-col justify-end pb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/80 text-xs uppercase tracking-[0.2em]">{t.sub}</p>
            <div className="flex gap-1">
              <button
                onClick={() => setIsSv(true)}
                className={`text-xs px-2 py-0.5 rounded-full border ${isSv ? "bg-white/20 text-white border-white/40" : "text-white/70 border-white/20 hover:bg-white/10"}`}
              >SV</button>
              <button
                onClick={() => setIsSv(false)}
                className={`text-xs px-2 py-0.5 rounded-full border ${!isSv ? "bg-white/20 text-white border-white/40" : "text-white/70 border-white/20 hover:bg-white/10"}`}
              >EN</button>
            </div>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-white drop-shadow-md">{t.h1}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-5 -mt-4 relative">
        {/* Ert boende + utcheckning */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              {t.stayTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="text-muted-foreground">
              {t.checkout} <strong className="text-foreground">10:00</strong>
            </div>
            <div className="mt-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              <div className="font-medium">
                {t.lockCode}: <span className="font-mono text-lg tracking-widest">2018</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sen utcheckning — upsell */}
        <Card className="border-accent/40 bg-gradient-to-br from-accent/10 via-card to-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              {t.lateTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="leading-relaxed text-foreground/85">{t.lateBody}</p>
            <div className="rounded-lg border bg-card p-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{t.lateItem}</span>
                <span className="font-serif text-xl text-primary">400 kr</span>
              </div>
              <div className="text-xs text-muted-foreground">{t.lateHow}</div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="sms:+46722254993"
                  className="flex items-center justify-center gap-2 rounded-md border bg-card hover:bg-muted/40 transition-colors py-2 text-sm font-medium"
                >
                  <MessageCircle className="h-4 w-4 text-primary" />
                  {t.sms}
                </a>
                <a
                  href="tel:+46722254993"
                  className="flex items-center justify-center gap-2 rounded-md border bg-card hover:bg-muted/40 transition-colors py-2 text-sm font-medium"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  {t.call}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bra att veta i tältet */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              {t.knowTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={<Key className="h-4 w-4" />} title={t.serviceCard}>{t.serviceCardBody}</Row>
            <Row icon={<Footprints className="h-4 w-4" />} title={t.slippers}>{t.slippersBody}</Row>
            <Row icon={<UtensilsCrossed className="h-4 w-4" />} title={t.food}>{t.foodBody}</Row>
            <Row icon={<Wifi className="h-4 w-4" />} title={t.wifi}>{t.wifiBody}</Row>
            <Row icon={<Flame className="h-4 w-4" />} title={t.fire}>{t.fireBody}</Row>
            <Row icon={<Dog className="h-4 w-4" />} title={t.pets}>{t.petsBody}</Row>
          </CardContent>
        </Card>

        {/* Innan ni åker — checklista */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {t.beforeLeave}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-foreground/85 leading-relaxed">{t.beforeIntro}</p>
            <ul className="space-y-2 pt-1">
              <CheckItem>{t.washUp}</CheckItem>
              <CheckItem>{t.trash}</CheckItem>
              <CheckItem>{t.dontForget}</CheckItem>
              <CheckItem>{t.leaveCard}</CheckItem>
              <CheckItem>{t.zip}</CheckItem>
            </ul>
            <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 flex items-start gap-2 text-xs">
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <span className="text-amber-900">{t.lostItems}</span>
            </div>
          </CardContent>
        </Card>

        {/* Att göra i närheten */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Trees className="h-5 w-5 text-primary" />
              {t.nearbyTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <NearbyItem icon={<MapPin className="h-4 w-4" />} title={t.locks} body={t.locksBody} />
            <NearbyItem icon={<Car className="h-4 w-4" />} title={t.rent} body={t.rentBody} />
            <NearbyItem icon={<Coffee className="h-4 w-4" />} title={t.fika} body={t.fikaBody} />
            <NearbyItem icon={<Trees className="h-4 w-4" />} title={t.roxen} body={t.roxenBody} />
            <NearbyItem icon={<MapPin className="h-4 w-4" />} title={t.vreta} body={t.vretaBody} />
            <NearbyItem icon={<ShoppingBag className="h-4 w-4" />} title={t.linkoping} body={t.linkopingBody} />
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Bergs+Slussar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline font-medium pt-1"
            >
              {t.maps}
            </a>
          </CardContent>
        </Card>

        {/* Kontakt */}
        <Card className="bg-card border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <div className="font-medium text-foreground mb-1">{t.contactTitle}</div>
                <p className="text-muted-foreground leading-relaxed">
                  {t.contactBody}
                  <a href="tel:+46722254993" className="text-primary underline font-medium">072-225 49 93</a>
                  {t.emailPrefix}
                  <a href="mailto:hej@goglampingsweden.se" className="text-primary underline">hej@goglampingsweden.se</a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground pt-2 pb-4">
          {t.footer}
        </p>
      </main>
    </div>
  );
}

function Row({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-full bg-primary/10 p-1.5 text-primary shrink-0">{icon}</div>
      <div>
        <div className="font-medium text-foreground">{title}</div>
        <p className="text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function NearbyItem({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-full bg-primary/10 p-1.5 text-primary shrink-0">{icon}</div>
      <div>
        <div className="font-medium text-foreground">{title}</div>
        <p className="text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
