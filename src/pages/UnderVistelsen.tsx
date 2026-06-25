import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin, Phone, Clock, Key, ShowerHead, UtensilsCrossed, Sparkles, Trees,
  Wifi, Flame, Cigarette, Dog, Info, Footprints, CheckCircle2, AlertCircle,
  Coffee, MessageCircle, ShoppingBag, Car
} from "lucide-react";
import heroImg from "@/assets/glamping-sunset.jpg";

interface StayData {
  booking: {
    public_token: string;
    booking_number?: string;
    guest_first_name: string | null;
    tent_id: string;
    tent_name: string;
    tent_ids?: string[] | null;
    checkin_date: string;
    checkout_date: string;
    nights: number;
    language: string;
  };
}

const TENT_NAMES: Record<string, string> = {
  sjobris: "Sjöbrisretreatet",
  naturkarnan: "Naturkärnan",
  lugnetsyta: "Lugnets Yta",
};

export default function UnderVistelsen() {
  const { token } = useParams();
  const [data, setData] = useState<StayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // SEO: noindex — privat länk per gäst
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    document.title = "Under din vistelse · Go Glamping Sweden";
    return () => { document.head.removeChild(meta); };
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data: rpc, error: e } = await supabase.rpc("get_stay_by_token", { p_token: token });
        if (e) throw e;
        if (!rpc) { setError("not_found"); return; }
        setData(rpc as unknown as StayData);
      } catch (err: any) {
        setError(err?.message ?? "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Laddar…</div>;
  }
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="font-serif text-2xl mb-2">Länken kunde inte hittas</h1>
          <p className="text-muted-foreground">Kontrollera länken eller hör av dig till oss på 072-225 49 93.</p>
        </div>
      </div>
    );
  }

  const isSv = (data.booking.language ?? "sv").toLowerCase().startsWith("sv");
  const firstName = data.booking.guest_first_name?.trim() || "";
  const tentIds = (data.booking.tent_ids?.length ? data.booking.tent_ids : [data.booking.tent_id]).filter(Boolean);
  const tentNames = tentIds.map((id) => TENT_NAMES[id] || id);
  const co = new Date(data.booking.checkout_date).toLocaleDateString(isSv ? "sv-SE" : "en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative h-[220px] sm:h-[280px] w-full overflow-hidden">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-background" />
        <div className="relative h-full max-w-2xl mx-auto px-4 flex flex-col justify-end pb-6">
          <p className="text-white/80 text-xs uppercase tracking-[0.2em] mb-2">
            {isSv ? "Under er vistelse" : "During your stay"}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-white drop-shadow-md">
            {firstName
              ? (isSv ? `Hoppas ni har det fint, ${firstName}!` : `Hope you're enjoying it, ${firstName}!`)
              : (isSv ? "Hoppas ni har det fint!" : "Hope you're enjoying it!")}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-5 -mt-4 relative">
        {/* Era tält + utcheckning */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              {isSv ? "Ert boende" : "Your stay"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {tentNames.length > 1 ? (
              <ul className="space-y-1">
                {tentNames.map((n) => (
                  <li key={n} className="flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="font-medium">{n}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="font-medium text-base">{tentNames[0]}</div>
            )}
            <div className="text-muted-foreground">
              {isSv ? "Utcheckning senast" : "Check-out by"} <strong className="text-foreground">10:00</strong> · {co}
            </div>
            <div className="mt-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              <div className="font-medium">
                🔒 {isSv ? "Kod till hänglåset" : "Lock code"}: <span className="font-mono text-lg tracking-widest">2018</span>
              </div>
              {tentNames.length > 1 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {isSv ? `Samma kod till alla ${tentNames.length} tälten.` : `Same code for all ${tentNames.length} tents.`}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sen utcheckning — upsell */}
        <Card className="border-accent/40 bg-gradient-to-br from-accent/10 via-card to-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              {isSv ? "Vill ni stanna lite längre?" : "Want to stay a little longer?"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="leading-relaxed text-foreground/85">
              {isSv
                ? "Sen utcheckning till kl 12:00 går bra att boka i mån av plats. En lugn förmiddag vid kanalen utan stress."
                : "Late check-out until 12:00 noon is available subject to availability — enjoy a calm morning by the canal."}
            </p>
            <div className="rounded-lg border bg-card p-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{isSv ? "Sen utcheckning till 12:00" : "Late check-out until 12:00"}</span>
                <span className="font-serif text-xl text-primary">400 kr</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {isSv
                  ? "Swisha 400 kr till 072-225 49 93 (Christoffer) och skriv tältets namn + bokningsnummer som meddelande. Sms:a oss gärna också så bekräftar vi direkt."
                  : "Swish 400 SEK to +46 72-225 49 93 (Christoffer) with your tent name + booking number as message. Or text us and we'll confirm right away."}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="sms:+46722254993"
                  className="flex items-center justify-center gap-2 rounded-md border bg-card hover:bg-muted/40 transition-colors py-2 text-sm font-medium"
                >
                  <MessageCircle className="h-4 w-4 text-primary" />
                  {isSv ? "Sms:a oss" : "Text us"}
                </a>
                <a
                  href="tel:+46722254993"
                  className="flex items-center justify-center gap-2 rounded-md border bg-card hover:bg-muted/40 transition-colors py-2 text-sm font-medium"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  {isSv ? "Ring Christoffer" : "Call Christoffer"}
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
              {isSv ? "Bra att veta i tältet" : "Good to know in the tent"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={<Key className="h-4 w-4" />} title={isSv ? "Servicekortet i tältet" : "The service card in the tent"}>
              {isSv
                ? "Servicekortet som ligger framme i tältet är nyckeln till servicehuset (toalett, dusch, skötrum). Ta gärna med det i fickan – det är ca 150 m gångväg."
                : "The service card in your tent is the key to the service house (toilet, shower, changing room). Keep it in your pocket — it's about a 150 m walk."}
            </Row>
            <Row icon={<Footprints className="h-4 w-4" />} title={isSv ? "Tofflor är guld värda" : "Slippers are gold"}>
              {isSv
                ? "Stigen till servicehuset går över gräs och grus. Ett par tofflor eller slip-in-skor gör nattliga toabesök mycket trevligare."
                : "The path to the service house crosses grass and gravel. A pair of slippers or slip-on shoes makes night-time trips much nicer."}
            </Row>
            <Row icon={<UtensilsCrossed className="h-4 w-4" />} title={isSv ? "Mat & matlagning" : "Food & cooking"}>
              {isSv
                ? "Matlagning är inte tillåten i eller vid tälten (brandsäkerhet). Kylskåp, kaffe och te finns inne i tältet. Restaurang vid slussarna ligger ca 200 m bort."
                : "Cooking is not allowed in or next to the tents (fire safety). Fridge, coffee and tea are inside the tent. The restaurant by the locks is ~200 m away."}
            </Row>
            <Row icon={<Wifi className="h-4 w-4" />} title={isSv ? "Wifi & täckning" : "Wifi & coverage"}>
              {isSv ? "Inget wifi — platsen är till för att koppla av. 4G/5G fungerar utmärkt." : "No wifi — the spot is for unplugging. 4G/5G works great."}
            </Row>
            <Row icon={<Flame className="h-4 w-4" />} title={isSv ? "Eldning, ljus & rökning" : "Fire, candles & smoking"}>
              {isSv
                ? "Öppen eld, marschaller och engångsgrillar är inte tillåtna. Tälten är rökfria – rök gärna utomhus, väl bort från tältduken."
                : "Open fires, torches and disposable BBQs are not permitted. Tents are non-smoking — smoke outside, well away from the canvas."}
            </Row>
            <Row icon={<Dog className="h-4 w-4" />} title={isSv ? "Husdjur" : "Pets"}>
              {isSv ? "Husdjur är tyvärr inte tillåtna i tälten." : "Sorry, pets are not allowed in the tents."}
            </Row>
          </CardContent>
        </Card>

        {/* Innan ni åker — checklista */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {isSv ? "Innan ni åker hem" : "Before you leave"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-foreground/85 leading-relaxed">
              {isSv
                ? "En liten vänlig påminnelse så att vi kan ta emot nästa gäst i samma fina skick:"
                : "A friendly reminder so we can welcome the next guest just as nicely:"}
            </p>
            <ul className="space-y-2 pt-1">
              <CheckItem>
                {isSv
                  ? "Diska det ni använt (koppar, glas, bestick) och ställ tillbaka i tältet."
                  : "Wash up what you've used (cups, glasses, cutlery) and put it back in the tent."}
              </CheckItem>
              <CheckItem>
                {isSv
                  ? "Kasta sopor i kärlen vid parkeringen — låt inte mat eller skräp ligga kvar."
                  : "Toss rubbish in the bins by the parking lot — don't leave food or trash behind."}
              </CheckItem>
              <CheckItem>
                {isSv
                  ? "Glöm inte saker! Kolla under sängen, i kylen och i tältets ytterfack."
                  : "Don't forget anything! Check under the bed, in the fridge and the outer pocket."}
              </CheckItem>
              <CheckItem>
                {isSv
                  ? "Lämna servicekortet kvar i tältet."
                  : "Leave the service card in the tent."}
              </CheckItem>
              <CheckItem>
                {isSv
                  ? "Stäng dragkedjorna på tältet ordentligt när ni går."
                  : "Zip the tent properly when you leave."}
              </CheckItem>
            </ul>
            <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 flex items-start gap-2 text-xs">
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <span className="text-amber-900">
                {isSv
                  ? "Kvarglömda saker postar vi tyvärr inte – men hör av er så förvarar vi dem tills ni kan hämta."
                  : "We can't post forgotten items — but let us know and we'll keep them safe until you can pick them up."}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Att göra i närheten */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Trees className="h-5 w-5 text-primary" />
              {isSv ? "Att göra i närheten" : "Things to do nearby"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <NearbyItem
              icon={<MapPin className="h-4 w-4" />}
              title={isSv ? "Se båtar slussa på Göta kanal" : "Watch boats lock through Göta Canal"}
              body={isSv
                ? "Slussarna trafikeras hela dagen i sommarsäsongen. Det är 15 trappstegsslussar — en av Sveriges finaste vyer."
                : "The locks are busy throughout summer days. 15 staircase locks — one of Sweden's loveliest views."}
            />
            <NearbyItem
              icon={<Car className="h-4 w-4" />}
              title={isSv ? "Hyr cykel eller kanot" : "Rent a bike or canoe"}
              body={isSv
                ? "Bergs Slussar Café & Uthyrning ligger 200 m bort. Cykla längs kanalen eller paddla till Roxen."
                : "Bergs Slussar Café & Rentals is 200 m away. Cycle along the canal or paddle out to Lake Roxen."}
            />
            <NearbyItem
              icon={<Coffee className="h-4 w-4" />}
              title={isSv ? "Fika, lunch & glass" : "Coffee, lunch & ice-cream"}
              body={isSv
                ? "Kanalkrogen, Slussarnas Café och glasskiosken finns alla inom 5 min promenad."
                : "Kanalkrogen, Slussarnas Café and the ice-cream kiosk are all within a 5 min walk."}
            />
            <NearbyItem
              icon={<Trees className="h-4 w-4" />}
              title={isSv ? "Vandra till Roxen" : "Walk to Lake Roxen"}
              body={isSv
                ? "Följ kanalen norrut ca 1,5 km så öppnar Roxen upp sig — perfekt för solnedgång."
                : "Follow the canal north for ~1.5 km and Lake Roxen opens up — perfect for sunset."}
            />
            <NearbyItem
              icon={<MapPin className="h-4 w-4" />}
              title={isSv ? "Vreta klosterkyrka" : "Vreta Abbey Church"}
              body={isSv
                ? "Sveriges äldsta kloster, 1,5 km från tälten. Vackert att besöka, även för en kort tur."
                : "Sweden's oldest abbey, 1.5 km from the tents. Lovely to visit, even briefly."}
            />
            <NearbyItem
              icon={<ShoppingBag className="h-4 w-4" />}
              title={isSv ? "Linköping (20 min med bil)" : "Linköping (20 min by car)"}
              body={isSv
                ? "Domkyrkan, Gamla Linköping, restauranger och shopping. Bra utflyktsmål för en regnig dag."
                : "Cathedral, Old Linköping museum, restaurants and shopping. A good rainy-day option."}
            />
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Bergs+Slussar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline font-medium pt-1"
            >
              {isSv ? "Öppna området i Google Maps →" : "Open the area in Google Maps →"}
            </a>
          </CardContent>
        </Card>

        {/* Kontakt */}
        <Card className="bg-card border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <div className="font-medium text-foreground mb-1">
                  {isSv ? "Hör av er om något behövs" : "Reach out if you need anything"}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {isSv ? "Christoffer svarar i mobilen: " : "Christoffer is on the phone: "}
                  <a href="tel:+46722254993" className="text-primary underline font-medium">072-225 49 93</a>
                  {isSv ? ". Mejl: " : ". Email: "}
                  <a href="mailto:hej@goglampingsweden.se" className="text-primary underline">hej@goglampingsweden.se</a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground pt-2 pb-4">
          {isSv ? "Tack för att ni valde Go Glamping Sweden 🌿" : "Thank you for choosing Go Glamping Sweden 🌿"}
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
