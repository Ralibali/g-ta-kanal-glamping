import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  MapPin, Phone, Clock, Key, UtensilsCrossed, Trees, Waves,
  Wifi, Flame, Dog, Info, Footprints, CheckCircle2, AlertCircle,
  Coffee, MessageCircle, ShoppingBag, Car, Heart, Copy, Star, Instagram, Beer, ArrowRight
} from "lucide-react";
import { LanguageProvider } from "@/i18n/LanguageContext";
import ChatWidget from "@/components/ChatWidget";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/glamping-sunset.jpg";

const SWISH = "0722254993";
const SWISH_INTL = "+46722254993";

const TENT_NAMES: Record<string, string> = {
  sjobris: "Sjöbrisretreatet (Tält 1)",
  naturkarnan: "Naturkärnan (Tält 2)",
  lugnetsyta: "Lugnets Yta (Tält 3)",
};

interface PersonalData {
  firstName?: string | null;
  tentIds: string[];
  checkoutDate?: string | null;
}

export default function UnderVistelsen() {
  const [isSv, setIsSv] = useState(true);
  const [personal, setPersonal] = useState<PersonalData | null>(null);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    document.title = isSv
      ? "Under er vistelse · Go Glamping Sweden"
      : "During your stay · Go Glamping Sweden";
    return () => { document.head.removeChild(meta); };
  }, [isSv]);

  // Personalize via ?t=<public_token>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("t") || params.get("token");
    if (!token) return;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_stay_by_token", { p_token: token });
        if (error || !data) return;
        const booking = (data as any).booking;
        if (!booking) return;
        const tentIds: string[] = Array.isArray(booking.tent_ids) && booking.tent_ids.length > 0
          ? booking.tent_ids
          : (booking.tent_id ? [booking.tent_id] : []);
        setPersonal({
          firstName: booking.guest_first_name,
          tentIds,
          checkoutDate: booking.checkout_date,
        });
        const lang = String(booking.language || "sv").toLowerCase();
        setIsSv(lang.startsWith("sv"));
      } catch (e) {
        console.error("personalize failed", e);
      }
    })();
  }, []);

  const copySwish = async () => {
    try {
      await navigator.clipboard.writeText(SWISH);
      toast.success(isSv ? "Swish-nummer kopierat!" : "Swish number copied!");
    } catch {
      toast.error(isSv ? "Kunde inte kopiera" : "Could not copy");
    }
  };

  const t = isSv ? {
    sub: "Under er vistelse",
    h1: "Hoppas ni har det fint!",
    stayTitle: "Ert boende",
    checkout: "Utcheckning: senast",
    lockCode: "Kod till hänglåset",
    lateTitle: "Sen utcheckning",
    lateLead: "Vill ni stanna lite längre?",
    lateBody: "Sen utcheckning till kl 12:00 går bra att boka i mån av plats. En lugn förmiddag vid kanalen utan stress.",
    lateItem: "Sen utcheckning till 12:00 – 400 kr",
    lateHow: "Swisha 400 kr till 072-225 49 93 (Christoffer) och skriv tältets namn + bokningsnummer som meddelande. Sms:a oss gärna också så bekräftar vi direkt.",
    copySwish: "Kopiera Swish-nummer",
    sms: "Sms:a oss",
    call: "Ring Christoffer",
    truckBadge: "Vårt tips",
    truckTitle: "Bartrucken vid slussarna",
    truckLead: "Vårt hetaste tips",
    truckIntro: "Hinner ni bara med en enda sak under vistelsen, gör det här. Vreta Klosters Bryggeris Bartruck är vår absoluta guldpärla – knappt fem minuters promenad från tältet.",
    truckWaits: "Här väntar:",
    truckP1: "Belgiska våfflor med Skagenröra, chevreröra eller glass",
    truckP2: "Lokal hantverksöl, bland annat ortens egen Bergs Kanalpilsner",
    truckP3: "Handplockade viner, utvalda av sommelier Pierre från vinbaren Glou Glou",
    truckOutro: "Lokala smaker, skön stämning och kanalen alldeles intill. Det här är Berg när det är som allra bäst.",
    truckMap: "Hitta hit",
    truckIg: "Följ på Instagram",
    knowTitle: "Bra att veta i tältet",
    serviceCard: "Servicekortet i tältet",
    serviceCardBody: "Servicekortet som ligger framme i tältet är nyckeln till servicehuset (toalett, dusch, skötrum). Ta gärna med det i fickan – det är ca 150 m gångväg.",
    slippers: "Tofflor är guld värda",
    slippersBody: "Stigen till servicehuset går över gräs och grus. Dessutom är duschen allmän för alla gäster vid kanalen – ett par tofflor eller slip-in-skor gör både nattliga toabesök och duschen mycket trevligare.",
    food: "Mat & matlagning",
    foodBody: "Matlagning är inte tillåten i eller vid tälten (brandsäkerhet). Kylskåp, kaffe och te finns inne i tältet. Prova gärna de nya matvagnarna uppe vid bron (Stjärnorpsvägen). Grillning går bra — i det gråa skåpet finns grillkol, gratis. Vi förespråkar ändå en god hämtmat.",
    consideration: "Visa hänsyn till varandra",
    considerationBody: "Vi delar platsen med flera gäster — håll ljudnivån nere efter kl 22 och respektera varandras lugn. Lämna tältet i fint skick så att nästa gäst får samma fina mottagande som ni fick.",
    wifi: "Wifi & täckning",
    wifiBody: "Inget wifi — platsen är till för att koppla av. 4G/5G fungerar utmärkt.",
    fire: "Eldning, ljus & rökning",
    fireBody: "Öppen eld, marschaller och engångsgrillar är inte tillåtna. Tälten är rökfria – rök gärna utomhus, väl bort från tältduken.",
    pets: "Husdjur",
    petsBody: "Husdjur är tillåtna mot en avgift som anges vid bokningen.",
    beforeLeave: "Innan ni åker hem",
    beforeIntro: "En påminnelse så att vi kan ta emot nästa gäst i samma fina skick:",
    washUp: "Diska det ni använt (koppar, glas, bestick) och ställ tillbaka i tältet.",
    trash: "Kasta sopor i kärlen vid parkeringen — låt inte mat eller skräp ligga kvar.",
    dontForget: "Glöm inte saker! Kolla under sängen, i kylen och i tältets ytterfack.",
    leaveCard: "Lämna servicekortet kvar i tältet.",
    zip: "Stäng dragkedjorna på tältet ordentligt när ni går.",
    lostItems: "Kvarglömda saker postar vi tyvärr inte – men hör av er så förvarar vi dem tills ni kan hämta.",
    nearbyTitle: "Att göra i närheten",
    locks: "Se båtar slussa på Göta kanal",
    locksBody: "Slussarna trafikeras hela dagen i sommarsäsongen. Det är 15 trappstegsslussar — en av Sveriges finaste vyer.",
    sup: "Hyra uppblåsbar SUP",
    supBody: "Upplev kanalen från vattnet på en uppblåsbar SUP. 100 kr betalas via Swish.",
    rent: "Hyr cykel eller kanot",
    rentBody: "Bergs Slussar Café & Uthyrning ligger 200 m bort. Cykla längs kanalen eller paddla till Roxen.",
    roxen: "Vandra till Roxen",
    roxenBody: "Följ kanalen norrut ca 1,5 km så öppnar Roxen upp sig — perfekt för solnedgång.",
    vreta: "Vreta klosterkyrka",
    vretaBody: "Sveriges äldsta kloster, 1,5 km från tälten. Vackert att besöka, även för en kort tur – och de har ett otroligt mysigt café.",
    linkoping: "Linköping (20 min med bil)",
    linkopingBody: "Domkyrkan, Gamla Linköping, restauranger och shopping. Bra utflyktsmål för en regnig dag.",
    maps: "Öppna området i Google Maps →",
    contactTitle: "Hör av er om något behövs",
    footer: "Tack för att ni valde Go Glamping Sweden",
  } : {
    sub: "During your stay",
    h1: "Hope you're enjoying it!",
    stayTitle: "Your stay",
    checkout: "Check-out: by",
    lockCode: "Lock code",
    lateTitle: "Late check-out",
    lateLead: "Want to stay a little longer?",
    lateBody: "Late check-out until 12:00 noon is available subject to availability — enjoy a calm morning by the canal.",
    lateItem: "Late check-out until 12:00 – 400 SEK",
    lateHow: "Swish 400 SEK to +46 72-225 49 93 (Christoffer) with your tent name + booking number as message. Or text us and we'll confirm right away.",
    copySwish: "Copy Swish number",
    sms: "Text us",
    call: "Call Christoffer",
    truckBadge: "Our tip",
    truckTitle: "The Bar Truck by the locks",
    truckLead: "Our hottest tip",
    truckIntro: "If you only do one thing during your stay, do this. Vreta Kloster Brewery's Bar Truck is our absolute gem – less than five minutes' walk from the tent.",
    truckWaits: "What's on offer:",
    truckP1: "Belgian waffles with Skagen prawn mix, chèvre cream or ice cream",
    truckP2: "Local craft beer, including the village's own Bergs Kanalpilsner",
    truckP3: "Hand-picked wines, selected by sommelier Pierre from wine bar Glou Glou",
    truckOutro: "Local flavours, lovely atmosphere and the canal right next to you. This is Berg at its very best.",
    truckMap: "Find it on the map",
    truckIg: "Follow on Instagram",
    knowTitle: "Good to know in the tent",
    serviceCard: "The service card in the tent",
    serviceCardBody: "The service card in your tent is the key to the service house (toilet, shower, changing room). Keep it in your pocket — it's about a 150 m walk.",
    slippers: "Slippers are gold",
    slippersBody: "The path to the service house crosses grass and gravel. The shower is also shared with all canal guests — a pair of slippers or slip-on shoes makes night-time trips and the shower much nicer.",
    food: "Food & cooking",
    foodBody: "Cooking is not allowed in or next to the tents (fire safety). Fridge, coffee and tea are inside the tent. Try the new food trucks up by the bridge (Stjärnorpsvägen). Grilling is fine — the grey cabinet has free charcoal. We still recommend good takeout.",
    consideration: "Be considerate of each other",
    considerationBody: "We share the space with several guests — keep noise down after 22:00 and respect each other's peace. Leave the tent in great shape so the next guest gets the same lovely welcome you did.",
    wifi: "Wifi & coverage",
    wifiBody: "No wifi — the spot is for unplugging. 4G/5G works great.",
    fire: "Fire, candles & smoking",
    fireBody: "Open fires, torches and disposable BBQs are not permitted. Tents are non-smoking — smoke outside, well away from the canvas.",
    pets: "Pets",
    petsBody: "Pets are allowed for a fee stated at booking.",
    beforeLeave: "Before you leave",
    beforeIntro: "A reminder so we can welcome the next guest in the same great condition:",
    washUp: "Wash up what you've used (cups, glasses, cutlery) and put it back in the tent.",
    trash: "Toss rubbish in the bins by the parking lot — don't leave food or trash behind.",
    dontForget: "Don't forget anything! Check under the bed, in the fridge and the outer pocket.",
    leaveCard: "Leave the service card in the tent.",
    zip: "Zip the tent properly when you leave.",
    lostItems: "We can't post forgotten items — but let us know and we'll keep them safe until you can pick them up.",
    nearbyTitle: "Things to do nearby",
    locks: "Watch boats lock through Göta Canal",
    locksBody: "The locks are busy throughout summer days. 15 staircase locks — one of Sweden's loveliest views.",
    sup: "Rent an inflatable SUP",
    supBody: "Experience the canal from the water on an inflatable SUP. 100 SEK paid via Swish.",
    rent: "Rent a bike or canoe",
    rentBody: "Bergs Slussar Café & Rentals is 200 m away. Cycle along the canal or paddle out to Lake Roxen.",
    roxen: "Walk to Lake Roxen",
    roxenBody: "Follow the canal north for ~1.5 km and Lake Roxen opens up — perfect for sunset.",
    vreta: "Vreta Abbey Church",
    vretaBody: "Sweden's oldest abbey, 1.5 km from the tents. Lovely to visit, even briefly – and they have a wonderfully cosy café.",
    linkoping: "Linköping (20 min by car)",
    linkopingBody: "Cathedral, Old Linköping museum, restaurants and shopping. A good rainy-day option.",
    maps: "Open the area in Google Maps →",
    contactTitle: "Reach out if you need anything",
    footer: "Thank you for choosing Go Glamping Sweden",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative h-[240px] sm:h-[300px] w-full overflow-hidden">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-background" />
        <div className="relative h-full max-w-[520px] mx-auto px-4 flex flex-col justify-end pb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/85 text-xs uppercase tracking-[0.2em]">{t.sub}</p>
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
          <h1 className="font-serif text-3xl sm:text-4xl text-white drop-shadow-md leading-tight">
            {personal?.firstName
              ? (isSv ? `Hej ${personal.firstName}!` : `Hi ${personal.firstName}!`)
              : t.h1}
          </h1>
        </div>
      </header>

      <main className="max-w-[520px] mx-auto p-4 space-y-6 -mt-4 relative">
        {/* Ert boende */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              {t.stayTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {personal?.tentIds && personal.tentIds.length > 0 && (
              <div className="rounded-xl bg-muted/40 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {isSv ? (personal.tentIds.length > 1 ? "Era tält" : "Ert tält") : (personal.tentIds.length > 1 ? "Your tents" : "Your tent")}
                </div>
                <ul className="mt-1 space-y-0.5">
                  {personal.tentIds.map((id) => (
                    <li key={id} className="font-medium text-foreground">{TENT_NAMES[id] || id}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="text-muted-foreground">
              {t.checkout} <strong className="text-foreground">10:00</strong>
              {personal?.checkoutDate ? <span className="text-foreground/70"> · {personal.checkoutDate}</span> : null}
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.lockCode}{personal?.tentIds && personal.tentIds.length > 1 ? (isSv ? " (samma kod till alla era tält)" : " (same code for all your tents)") : ""}
              </div>
              <div className="font-mono text-2xl tracking-widest text-foreground mt-0.5">2018</div>
            </div>
          </CardContent>
        </Card>

        {/* Sen utcheckning */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {t.lateTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-medium text-foreground">{t.lateLead}</p>
            <p className="leading-relaxed text-foreground/85">{t.lateBody}</p>
            <div className="rounded-xl border bg-card p-3 space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{t.lateItem}</span>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">{t.lateHow}</div>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={copySwish}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors py-2.5 text-sm font-medium"
                >
                  <Copy className="h-4 w-4" /> {t.copySwish}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`sms:${SWISH_INTL}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary text-primary hover:bg-primary/5 transition-colors py-2 text-sm font-medium"
                  >
                    <MessageCircle className="h-4 w-4" /> {t.sms}
                  </a>
                  <a
                    href={`tel:${SWISH_INTL}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary text-primary hover:bg-primary/5 transition-colors py-2 text-sm font-medium"
                  >
                    <Phone className="h-4 w-4" /> {t.call}
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bartruck — GULDPÄRLA */}
        <Card className="rounded-2xl shadow-md ring-2 ring-[#C9A227]/60 bg-gradient-to-br from-[#fdf6e1] via-card to-card relative overflow-hidden">
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-[#C9A227] text-white text-[11px] font-semibold px-2.5 py-1 shadow">
            <Star className="h-3 w-3 fill-white" /> {t.truckBadge}
          </div>
          <CardHeader className="pb-2">
            <p className="text-xs uppercase tracking-wide text-[#8a6a14] font-semibold">{t.truckLead}</p>
            <CardTitle className="font-serif text-xl flex items-center gap-2 text-foreground">
              <Beer className="h-5 w-5 text-[#C9A227]" />
              {t.truckTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="leading-relaxed text-foreground/90">{t.truckIntro}</p>
            <div>
              <div className="font-medium text-foreground mb-1">{t.truckWaits}</div>
              <ul className="space-y-1.5 text-foreground/85">
                <li className="flex gap-2"><span className="text-[#C9A227]">•</span>{t.truckP1}</li>
                <li className="flex gap-2"><span className="text-[#C9A227]">•</span>{t.truckP2}</li>
                <li className="flex gap-2"><span className="text-[#C9A227]">•</span>{t.truckP3}</li>
              </ul>
            </div>
            <p className="leading-relaxed text-foreground/85 italic">{t.truckOutro}</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href="https://maps.app.goo.gl/Lj2yw1otjMWpNt5e6"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C9A227] text-white hover:bg-[#b08e1d] transition-colors py-2 text-sm font-medium"
              >
                <MapPin className="h-4 w-4" /> {t.truckMap}
              </a>
              <a
                href="https://www.instagram.com/vretaklosterbryggeri/"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#C9A227] text-[#8a6a14] hover:bg-[#C9A227]/10 transition-colors py-2 text-sm font-medium"
              >
                <Instagram className="h-4 w-4" /> {t.truckIg}
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Bra att veta */}
        <Card className="rounded-2xl shadow-sm">
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
            <Row icon={<Heart className="h-4 w-4" />} title={t.consideration}>{t.considerationBody}</Row>
            <Row icon={<Wifi className="h-4 w-4" />} title={t.wifi}>{t.wifiBody}</Row>
            <Row icon={<Flame className="h-4 w-4" />} title={t.fire}>{t.fireBody}</Row>
            <Row icon={<Dog className="h-4 w-4" />} title={t.pets}>{t.petsBody}</Row>
          </CardContent>
        </Card>

        {/* Innan ni åker */}
        <Card className="rounded-2xl shadow-sm border-primary/30 bg-primary/5">
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
            <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 flex items-start gap-2 text-xs">
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <span className="text-amber-900">{t.lostItems}</span>
            </div>
          </CardContent>
        </Card>

        {/* Att göra i närheten */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Trees className="h-5 w-5 text-primary" />
              {t.nearbyTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <NearbyItem icon={<MapPin className="h-4 w-4" />} title={t.locks} body={t.locksBody} />
            <NearbyItem icon={<Waves className="h-4 w-4" />} title={t.sup} body={t.supBody} />
            <NearbyItem icon={<Car className="h-4 w-4" />} title={t.rent} body={t.rentBody} />
            <NearbyItem icon={<Trees className="h-4 w-4" />} title={t.roxen} body={t.roxenBody} />
            <NearbyItem icon={<Coffee className="h-4 w-4" />} title={t.vreta} body={t.vretaBody} />
            <NearbyItem icon={<ShoppingBag className="h-4 w-4" />} title={t.linkoping} body={t.linkopingBody} />
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Bergs+Slussar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 mt-2 rounded-full border-2 border-primary text-primary hover:bg-primary/5 transition-colors py-2 text-sm font-medium w-full"
            >
              <MapPin className="h-4 w-4" /> {t.maps}
            </a>
          </CardContent>
        </Card>

        {/* Kontakt */}
        <Card className="rounded-2xl shadow-sm bg-card border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Phone className="h-5 w-5 text-primary" /> {t.contactTitle}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`sms:${SWISH_INTL}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors py-2.5 text-sm font-medium"
              >
                <MessageCircle className="h-4 w-4" /> {t.sms}
              </a>
              <a
                href={`tel:${SWISH_INTL}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary text-primary hover:bg-primary/5 transition-colors py-2 text-sm font-medium"
              >
                <Phone className="h-4 w-4" /> {t.call}
              </a>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground pt-2 pb-6">
          {t.footer}
        </p>
      </main>
      <LanguageProvider value={isSv ? "sv" : "en"}>
        <ChatWidget />
      </LanguageProvider>
    </div>
  );
}

function Row({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-muted/30 p-3">
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
    <div className="flex items-start gap-3 rounded-xl bg-muted/30 p-3">
      <div className="rounded-full bg-primary/10 p-1.5 text-primary shrink-0">{icon}</div>
      <div>
        <div className="font-medium text-foreground">{title}</div>
        <p className="text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
