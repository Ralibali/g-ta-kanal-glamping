import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, LogOut, Sparkles, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCleaner } from "@/hooks/useCleaner";
import { TENTS, todayInStockholm } from "@/cleaning/config";
import { CLEAN_LANGS, getStoredLang, setStoredLang, tr, type CleanLang } from "@/cleaning/i18n";
import { CleaningChecklist, type TentDayData } from "@/components/cleaning/CleaningChecklist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const CLEANER_EMAIL = "stadare@goglampingsweden.se";

type Stay = {
  booking_number: string;
  tent_id: string;
  checkin_date: string;
  checkout_date: string;
  guests: number | null;
  children: number | null;
  late_checkout: boolean;
  breakfast_csv_quantity: number;
  breakfast_addon_quantity: number;
  fikapase_csv_quantity: number;
  fikapase_addon_quantity: number;
};

type Session = {
  tent_id: string;
  cleaning_date: string;
  status: string;
};

type Upcoming = {
  date: string;
  tents: string[];
  arrivals: number;
  departures: number;
  guests: number;
};

function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function prettyDate(date: string, lang: CleanLang) {
  const locale = lang === "sv" ? "sv-SE" : lang === "si" ? "si-LK" : "en-GB";
  return new Date(`${date}T12:00:00`).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
}

function CleaningLogin({ lang }: { lang: CleanLang }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: CLEANER_EMAIL, password });
    setBusy(false);
    if (error) toast.error(tr(lang, "loginFailed"));
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center"><Sparkles className="mx-auto h-8 w-8 text-primary" /><CardTitle>{tr(lang, "loginTitle")}</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={login}>
            <div className="space-y-2"><Label>{tr(lang, "password")}</Label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus required /></div>
            <Button className="w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{tr(lang, "signIn")}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CleaningV2() {
  const { user, isCleaner, loading, signOut } = useCleaner();
  const [lang, setLang] = useState<CleanLang>(getStoredLang());
  const [view, setView] = useState<"day" | "overview">("day");
  const [date, setDate] = useState(todayInStockholm());
  const [stays, setStays] = useState<Stay[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [earlyTents, setEarlyTents] = useState<Set<string>>(new Set());
  const [upcoming, setUpcoming] = useState<Upcoming[]>([]);
  const [selected, setSelected] = useState<TentDayData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  const changeLanguage = (next: CleanLang) => {
    setLang(next);
    setStoredLang(next);
  };

  const loadDay = async () => {
    setDataLoading(true);
    const [stayResult, sessionResult, earlyResult] = await Promise.all([
      (supabase as any)
        .from("tent_stays")
        .select("booking_number, tent_id, checkin_date, checkout_date, guests, children, late_checkout, breakfast_csv_quantity, breakfast_addon_quantity, fikapase_csv_quantity, fikapase_addon_quantity")
        .or(`checkout_date.eq.${date},checkin_date.eq.${date}`),
      (supabase as any)
        .from("cleaning_sessions")
        .select("tent_id, cleaning_date, status")
        .eq("cleaning_date", date),
      (supabase as any)
        .from("early_checkin_flags")
        .select("tent_id")
        .eq("date", date)
        .eq("active", true),
    ]);

    if (stayResult.error) toast.error(stayResult.error.message);
    setStays((stayResult.data ?? []) as Stay[]);
    setSessions((sessionResult.data ?? []) as Session[]);
    setEarlyTents(new Set((earlyResult.data ?? []).map((row: { tent_id: string }) => row.tent_id)));
    setDataLoading(false);
  };

  const loadUpcoming = async () => {
    setDataLoading(true);
    const today = todayInStockholm();
    const end = addDays(today, 60);
    const { data, error } = await (supabase as any)
      .from("tent_stays")
      .select("booking_number, tent_id, checkin_date, checkout_date, guests")
      .or(`and(checkin_date.gte.${today},checkin_date.lte.${end}),and(checkout_date.gte.${today},checkout_date.lte.${end})`);

    if (error) {
      toast.error(error.message);
      setDataLoading(false);
      return;
    }

    const rows = (data ?? []) as Stay[];
    const arrivalByTentDate = new Map(rows.map((row) => [`${row.tent_id}|${row.checkin_date}`, row]));
    const map = new Map<string, Upcoming>();

    for (const departure of rows) {
      if (departure.checkout_date < today || departure.checkout_date > end) continue;
      const item = map.get(departure.checkout_date) ?? { date: departure.checkout_date, tents: [], arrivals: 0, departures: 0, guests: 0 };
      if (!item.tents.includes(departure.tent_id)) {
        item.tents.push(departure.tent_id);
        item.departures += 1;
      }
      const arrival = arrivalByTentDate.get(`${departure.tent_id}|${departure.checkout_date}`);
      if (arrival) {
        item.arrivals += 1;
        item.guests += Number(arrival.guests ?? 0);
      }
      map.set(item.date, item);
    }

    setUpcoming(Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)));
    setDataLoading(false);
  };

  useEffect(() => {
    if (!isCleaner) return;
    if (view === "day") void loadDay();
    else void loadUpcoming();
  }, [isCleaner, view, date]);

  const sessionByTent = useMemo(() => new Map(sessions.map((session) => [session.tent_id, session])), [sessions]);

  const cards = useMemo(() => {
    const byKey = new Map(stays.map((stay) => [`${stay.tent_id}|${stay.checkin_date}|${stay.checkout_date}|${stay.booking_number}`, stay]));
    const rows = Array.from(byKey.values());

    return TENTS.map((tent) => {
      const departure = rows.find((stay) => stay.tent_id === tent.id && stay.checkout_date === date);
      if (!departure) return null;
      const arrival = rows.find((stay) => stay.tent_id === tent.id && stay.checkin_date === date);
      const breakfast = Number(arrival?.breakfast_csv_quantity ?? 0) + Number(arrival?.breakfast_addon_quantity ?? 0) > 0;
      const fika = Number(arrival?.fikapase_csv_quantity ?? 0) + Number(arrival?.fikapase_addon_quantity ?? 0) > 0;

      return {
        tent_id: tent.id,
        tentNo: tent.no,
        tentName: tent.name,
        position: tent.position[lang],
        date,
        hasArrival: !!arrival,
        hasDeparture: true,
        arrivalBooking: arrival?.booking_number,
        guests: Number(arrival?.guests ?? 0),
        children: Number(arrival?.children ?? 0),
        breakfast,
        fikapase: fika,
        lateCheckout: !!departure.late_checkout,
        earlyCheckin: earlyTents.has(tent.id),
      } as TentDayData;
    })
      .filter((card): card is TentDayData => card != null)
      .sort((a, b) => Number(b.earlyCheckin) - Number(a.earlyCheckin) || a.tentNo - b.tentNo);
  }, [stays, date, lang, earlyTents]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user) return <CleaningLogin lang={lang} />;
  if (!isCleaner) return <div className="min-h-screen flex flex-col items-center justify-center gap-3"><p>{tr(lang, "noAccess")}</p><Button variant="outline" onClick={signOut}>{tr(lang, "signOut")}</Button></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 p-4">
          <h1 className="font-serif text-lg">{tr(lang, "appTitle")}</h1>
          <div className="flex items-center gap-2">
            <select value={lang} onChange={(event) => changeLanguage(event.target.value as CleanLang)} className="rounded border bg-transparent px-2 py-1 text-sm">
              {CLEAN_LANGS.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
            </select>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 p-4 pb-24">
        {selected ? (
          <CleaningChecklist data={selected} lang={lang} onBack={() => setSelected(null)} onCompleted={() => { setSelected(null); void loadDay(); }} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Button variant={view === "day" ? "default" : "outline"} onClick={() => setView("day")}>{tr(lang, "dayView")}</Button>
              <Button variant={view === "overview" ? "default" : "outline"} onClick={() => setView("overview")}>{tr(lang, "overview")}</Button>
            </div>

            {view === "day" ? (
              <>
                <Card><CardContent className="pt-4"><div className="flex items-center justify-between gap-2"><Button variant="outline" size="icon" onClick={() => setDate(addDays(date, -1))}><ChevronLeft className="h-4 w-4" /></Button><div className="text-center"><div className="font-medium capitalize">{prettyDate(date, lang)}</div><div className="text-xs text-muted-foreground">{date}</div></div><Button variant="outline" size="icon" onClick={() => setDate(addDays(date, 1))}><ChevronRight className="h-4 w-4" /></Button></div><div className="mt-3 flex justify-center gap-2"><Button size="sm" variant={date === todayInStockholm() ? "default" : "outline"} onClick={() => setDate(todayInStockholm())}>{tr(lang, "today")}</Button><Button size="sm" variant={date === addDays(todayInStockholm(), 1) ? "default" : "outline"} onClick={() => setDate(addDays(todayInStockholm(), 1))}>{tr(lang, "tomorrow")}</Button></div></CardContent></Card>

                {dataLoading ? <Card><CardContent className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></CardContent></Card> : cards.length === 0 ? <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{tr(lang, "noTentsToday")}</CardContent></Card> : cards.map((card) => {
                  const session = sessionByTent.get(card.tent_id);
                  return (
                    <button key={card.tent_id} onClick={() => setSelected(card)} className="w-full text-left">
                      <Card className={session?.status === "completed" ? "border-primary/30 bg-primary/5" : card.earlyCheckin ? "border-amber-500/60" : ""}>
                        <CardContent className="pt-4"><div className="flex items-start justify-between gap-3"><div><div className="font-serif text-xl">Tält {card.tentNo} – {card.tentName}</div><div className="text-xs text-muted-foreground">{card.position}</div></div><Badge variant={session?.status === "completed" ? "default" : "outline"}>{session?.status === "completed" ? tr(lang, "done") : tr(lang, "notStarted")}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Badge variant="secondary">{card.hasArrival ? tr(lang, "changeover") : tr(lang, "departure")}</Badge>{card.hasArrival && <Badge variant="outline"><Users className="mr-1 h-3 w-3" />{card.guests} {tr(lang, "guests")}</Badge>}{card.children > 0 && <Badge variant="outline">{tr(lang, "children")}: {card.children}</Badge>}{card.earlyCheckin && <Badge className="bg-amber-600">Tidig incheckning</Badge>}{card.lateCheckout && <Badge variant="outline">{tr(lang, "lateCheckout")}</Badge>}</div></CardContent>
                      </Card>
                    </button>
                  );
                })}
              </>
            ) : (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />{tr(lang, "upcomingDates")}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {dataLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : upcoming.length === 0 ? <p className="text-sm text-muted-foreground">{tr(lang, "noUpcoming")}</p> : upcoming.map((item) => (
                    <button key={item.date} className="w-full rounded-lg border p-3 text-left hover:bg-muted/40" onClick={() => { setDate(item.date); setView("day"); }}>
                      <div className="flex items-center justify-between"><div className="font-medium capitalize">{prettyDate(item.date, lang)}</div><Badge>{item.tents.length} {tr(lang, "tentsShort")}</Badge></div><div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span>{item.departures} {tr(lang, "departures")}</span><span>{item.arrivals} {tr(lang, "arrivals")}</span>{item.guests > 0 && <span>{item.guests} {tr(lang, "totalGuests")}</span>}</div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
