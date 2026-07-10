import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock, Clock3, Heart, LogOut, Sparkles, Users, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCleaner } from "@/hooks/useCleaner";
import { TENTS, todayInStockholm } from "@/cleaning/config";
import { CLEAN_LANGS, getStoredLang, setStoredLang, tr, type CleanLang } from "@/cleaning/i18n";
import { CleaningChecklist, type TentDayData } from "@/components/cleaning/CleaningChecklist";
import { CleanerLoginForm } from "@/components/cleaning/CleanerLoginForm";
import { TimeTracker } from "@/components/cleaning/TimeTracker";
import { SalaryPanel } from "@/components/cleaning/SalaryPanel";
import { pickPreparationStay, towelInstruction, type CleaningStayLike } from "@/lib/cleaning-operations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";


type Stay = CleaningStayLike & {
  breakfast_csv_quantity: number | null;
  breakfast_addon_quantity: number | null;
  fikapase_csv_quantity: number | null;
  fikapase_addon_quantity: number | null;
  late_checkout: boolean;
};

type Session = {
  tent_id: string;
  cleaning_date: string;
  status: string;
};

type OverviewRow = {
  date: string;
  tents: string[];
  arrivals: number;
  departures: number;
  guests: number;
};

type CalendarInfo = {
  arrivals: number;
  departures: number;
  total: number;
};

function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function formatDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}


function monthCells(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const offset = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let index = 0; index < offset; index += 1) cells.push(null);
  for (let day = 1; day <= last.getDate(); day += 1) cells.push(new Date(year, monthIndex, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

type Assignment = { work_date: string; assigned_user_id: string };
type CleanerName = { user_id: string; display_name: string };

export default function Cleaning() {
  const { user, isCleaner, isAdmin, profile, loading, signOut } = useCleaner();
  const [lang, setLang] = useState<CleanLang>(getStoredLang());
  const [view, setView] = useState<"calendar" | "overview" | "day" | "time" | "salary">("calendar");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const value = new Date(`${todayInStockholm()}T12:00:00`);
    value.setDate(1);
    return value;
  });
  const [date, setDate] = useState(todayInStockholm());
  const [stays, setStays] = useState<Stay[]>([]);
  const [futureStays, setFutureStays] = useState<Stay[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [earlyTents, setEarlyTents] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<TentDayData | null>(null);
  const [overview, setOverview] = useState<OverviewRow[]>([]);
  const [calendarData, setCalendarData] = useState<Map<string, CalendarInfo>>(new Map());
  const [selfCleanDates, setSelfCleanDates] = useState<Set<string>>(new Set());
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map());
  const [cleanerNames, setCleanerNames] = useState<Map<string, string>>(new Map());
  const [interests, setInterests] = useState<Map<string, Set<string>>>(new Map());
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [togglingInterest, setTogglingInterest] = useState(false);

  const [togglingSelfClean, setTogglingSelfClean] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const changeLanguage = (next: CleanLang) => {
    setLang(next);
    setStoredLang(next);
  };

  const loadSelfClean = async () => {
    const { data } = await (supabase as any).from("self_clean_dates").select("date");
    setSelfCleanDates(new Set((data ?? []).map((row: { date: string }) => row.date)));
  };

  const loadDay = async () => {
    setDataLoading(true);
    const columns = "booking_number, tent_id, checkin_date, checkout_date, guests, children, breakfast_csv_quantity, breakfast_addon_quantity, fikapase_csv_quantity, fikapase_addon_quantity, late_checkout";
    const [dayResult, futureResult, sessionResult, earlyResult] = await Promise.all([
      (supabase as any).from("tent_stays").select(columns).or(`checkout_date.eq.${date},checkin_date.eq.${date}`),
      (supabase as any).from("tent_stays").select(columns).gt("checkin_date", date).order("checkin_date", { ascending: true }),
      (supabase as any).from("cleaning_sessions").select("tent_id, cleaning_date, status").eq("cleaning_date", date),
      (supabase as any).from("early_checkin_flags").select("tent_id").eq("date", date).eq("active", true),
    ]);
    if (dayResult.error) toast.error(dayResult.error.message);
    if (futureResult.error) toast.error(futureResult.error.message);
    setStays((dayResult.data ?? []) as Stay[]);
    setFutureStays((futureResult.data ?? []) as Stay[]);
    setSessions((sessionResult.data ?? []) as Session[]);
    setEarlyTents(new Set((earlyResult.data ?? []).map((row: { tent_id: string }) => row.tent_id)));
    setDataLoading(false);
  };

  const loadOverview = async () => {
    setDataLoading(true);
    const today = todayInStockholm();
    const end = addDays(today, 90);
    const { data, error } = await (supabase as any)
      .from("tent_stays")
      .select("booking_number, tent_id, checkin_date, checkout_date, guests, children")
      .or(`and(checkin_date.gte.${today},checkin_date.lte.${end}),and(checkout_date.gte.${today},checkout_date.lte.${end})`);
    if (error) {
      toast.error(error.message);
      setDataLoading(false);
      return;
    }
    const rows = (data ?? []) as Stay[];
    const arrivals = new Map(rows.map((row) => [`${row.tent_id}|${row.checkin_date}`, row]));
    const map = new Map<string, OverviewRow>();
    for (const departure of rows) {
      if (departure.checkout_date < today || departure.checkout_date > end) continue;
      const item = map.get(departure.checkout_date) ?? { date: departure.checkout_date, tents: [], arrivals: 0, departures: 0, guests: 0 };
      if (!item.tents.includes(departure.tent_id)) {
        item.tents.push(departure.tent_id);
        item.departures += 1;
      }
      const arrival = arrivals.get(`${departure.tent_id}|${departure.checkout_date}`);
      if (arrival) {
        item.arrivals += 1;
        item.guests += Number(arrival.guests ?? 0);
      }
      map.set(item.date, item);
    }
    setOverview(Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)));
    setDataLoading(false);
  };

  const loadCalendar = async () => {
    setDataLoading(true);
    const start = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const startDate = formatDate(start);
    const endDate = formatDate(end);
    const nextDate = addDays(endDate, 1);
    const { data, error } = await (supabase as any)
      .from("tent_stays")
      .select("tent_id, checkin_date, checkout_date")
      .or(`and(checkin_date.gte.${startDate},checkin_date.lte.${nextDate}),and(checkout_date.gte.${startDate},checkout_date.lte.${endDate})`);
    if (error) {
      toast.error(error.message);
      setDataLoading(false);
      return;
    }
    const rows = (data ?? []) as Array<{ tent_id: string; checkin_date: string; checkout_date: string }>;
    const arrivalKeys = new Set(rows.map((row) => `${row.tent_id}|${row.checkin_date}`));
    const tentsByDate = new Map<string, Set<string>>();
    const arrivalsByDate = new Map<string, Set<string>>();
    const departuresByDate = new Map<string, Set<string>>();
    const add = (map: Map<string, Set<string>>, targetDate: string, tentId: string) => {
      if (targetDate < startDate || targetDate > endDate) return;
      if (!map.has(targetDate)) map.set(targetDate, new Set());
      map.get(targetDate)!.add(tentId);
    };
    for (const row of rows) {
      if (row.checkout_date < startDate || row.checkout_date > endDate) continue;
      add(tentsByDate, row.checkout_date, row.tent_id);
      add(departuresByDate, row.checkout_date, row.tent_id);
      if (arrivalKeys.has(`${row.tent_id}|${row.checkout_date}`)) add(arrivalsByDate, row.checkout_date, row.tent_id);
    }
    const next = new Map<string, CalendarInfo>();
    tentsByDate.forEach((tentIds, targetDate) => {
      next.set(targetDate, {
        arrivals: arrivalsByDate.get(targetDate)?.size ?? 0,
        departures: departuresByDate.get(targetDate)?.size ?? 0,
        total: tentIds.size,
      });
    });
    setCalendarData(next);
    setDataLoading(false);
  };

  useEffect(() => {
    if (!user || !isCleaner) return;
    void loadSelfClean();
  }, [user, isCleaner]);

  useEffect(() => {
    if (!user || !isCleaner) return;
    if (view === "day") void loadDay();
    if (view === "overview") void loadOverview();
    if (view === "calendar") void loadCalendar();
  }, [user, isCleaner, view, date, calendarMonth]);

  const toggleSelfClean = async (targetDate: string) => {
    if (!isAdmin || togglingSelfClean) return;
    setTogglingSelfClean(true);
    try {
      if (selfCleanDates.has(targetDate)) {
        const { error } = await (supabase as any).from("self_clean_dates").delete().eq("date", targetDate);
        if (error) throw error;
        toast.success(tr(lang, "unmarkSelfClean"));
      } else {
        const { error } = await (supabase as any).from("self_clean_dates").insert({ date: targetDate, created_by: user?.id });
        if (error) throw error;
        toast.success(tr(lang, "selfClean"));
      }
      await loadSelfClean();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunde inte uppdatera egenstäd.");
    } finally {
      setTogglingSelfClean(false);
    }
  };

  const cards = useMemo(() => {
    return TENTS.map((tent) => {
      const departure = stays.find((stay) => stay.tent_id === tent.id && stay.checkout_date === date);
      if (!departure) return null;
      const arrival = stays.find((stay) => stay.tent_id === tent.id && stay.checkin_date === date);
      const preparation = pickPreparationStay(arrival, futureStays, tent.id, date) as Stay | undefined;
      return {
        tent_id: tent.id,
        tentNo: tent.no,
        tentName: tent.name,
        position: tent.position[lang],
        date,
        hasArrival: !!arrival,
        hasDeparture: true,
        arrivalBooking: arrival?.booking_number,
        guests: Number(preparation?.guests ?? 0),
        children: Number(preparation?.children ?? 0),
        breakfast: Number(preparation?.breakfast_csv_quantity ?? 0) + Number(preparation?.breakfast_addon_quantity ?? 0) > 0,
        fikapase: Number(preparation?.fikapase_csv_quantity ?? 0) + Number(preparation?.fikapase_addon_quantity ?? 0) > 0,
        lateCheckout: !!departure.late_checkout,
        earlyCheckin: earlyTents.has(tent.id),
      } satisfies TentDayData;
    })
      .filter((card): card is NonNullable<typeof card> => card != null)
      .sort((a, b) => Number(b.earlyCheckin) - Number(a.earlyCheckin) || a.tentNo - b.tentNo);
  }, [stays, futureStays, date, lang, earlyTents]);

  const sessionByTent = useMemo(() => new Map(sessions.map((session) => [session.tent_id, session])), [sessions]);

  const nextCleaning = useMemo(() => {
    return overview.find((item) => !selfCleanDates.has(item.date)) ?? null;
  }, [overview, selfCleanDates]);

  useEffect(() => {
    if (user && isCleaner && overview.length === 0) void loadOverview();
  }, [user, isCleaner]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">…</div>;
  if (!user) return <CleanerLoginForm />;
  if (!isCleaner) return <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-3 text-center"><p>{tr(lang, "noAccess")}</p><Button variant="outline" onClick={signOut}>{tr(lang, "signOut")}</Button></div>;

  const cells = monthCells(calendarMonth);
  const locale = lang === "sv" ? "sv-SE" : lang === "si" ? "si-LK" : "en-GB";
  const dayNames = lang === "sv" ? ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"] : lang === "si" ? ["සඳු", "අඟ", "බදා", "බ්‍රහ", "සිකු", "සෙන", "ඉරි"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto p-4 flex items-center justify-between gap-3">
          <h1 className="font-serif text-lg">{tr(lang, "appTitle")}</h1>
          <div className="flex items-center gap-2">
            <select aria-label={tr(lang, "language")} value={lang} onChange={(event) => changeLanguage(event.target.value as CleanLang)} className="text-sm bg-transparent border rounded px-2 py-1">{CLEAN_LANGS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        {selected ? (
          <CleaningChecklist data={selected} lang={lang} onBack={() => { setSelected(null); void loadDay(); }} onCompleted={() => { setSelected(null); void loadDay(); }} />
        ) : (
          <>
            <p className="text-sm text-muted-foreground italic">{tr(lang, "intro")}</p>
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900">📅 {tr(lang, "thursdayNotice")}</div>

            {nextCleaning && (() => {
              const nextDate = new Date(`${nextCleaning.date}T12:00:00`);
              const currentDate = new Date(`${todayInStockholm()}T12:00:00`);
              const difference = Math.round((nextDate.getTime() - currentDate.getTime()) / 86_400_000);
              const when = difference === 0 ? tr(lang, "today") : difference === 1 ? tr(lang, "tomorrow") : `${tr(lang, "inDays")} ${difference} ${tr(lang, "days")}`;
              return (
                <button onClick={() => { setDate(nextCleaning.date); setView("day"); }} className="w-full text-left rounded-xl border-2 border-primary/40 bg-primary/10 p-4 hover:bg-primary/15 transition shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/20 p-2.5 shrink-0"><CalendarDays className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1 min-w-0"><div className="text-[11px] uppercase tracking-wider text-primary font-semibold">{tr(lang, "nextCleaning")}</div><div className="font-serif text-lg leading-tight capitalize truncate">{nextDate.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</div><div className="text-xs text-muted-foreground mt-0.5">{when}</div></div>
                    <div className="text-right shrink-0"><div className="text-2xl font-bold text-primary leading-none">{nextCleaning.tents.length}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{tr(lang, "tentsCount")}</div></div>
                  </div>
                  <div className="flex gap-3 mt-3 pt-3 border-t border-primary/20 text-xs"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /><strong>{nextCleaning.arrivals}</strong> {tr(lang, "arrivals")}</span><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /><strong>{nextCleaning.departures}</strong> {tr(lang, "departures")}</span>{nextCleaning.guests > 0 && <span className="flex items-center gap-1.5 ml-auto"><Users className="h-3.5 w-3.5" /><strong>{nextCleaning.guests}</strong> {tr(lang, "totalGuests")}</span>}</div>
                </button>
              );
            })()}

            <div className="flex gap-2">
              <Button variant={view === "calendar" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setView("calendar")}>{tr(lang, "calendar")}</Button>
              <Button variant={view === "overview" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setView("overview")}>{tr(lang, "overview")}</Button>
              <Button variant={view === "day" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setView("day")}>{tr(lang, "dayView")}</Button>
            </div>

            {view === "day" && (
              <div className="space-y-2">
                <div><Label className="text-xs">{tr(lang, "date")}</Label><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /><p className="text-xs text-muted-foreground mt-1">{cards.length} {tr(lang, "tentsToHandle")}</p></div>
                {selfCleanDates.has(date) && <div className="rounded-lg border-2 border-blue-500/50 bg-blue-500/10 p-3 text-sm"><div className="font-semibold text-blue-900">🧹 {tr(lang, "selfClean")}</div><div className="text-xs text-blue-900/80 mt-1">{tr(lang, "selfCleanBannerDay")}</div></div>}
                {isAdmin && <Button variant={selfCleanDates.has(date) ? "outline" : "secondary"} size="sm" className="w-full" disabled={togglingSelfClean} onClick={() => void toggleSelfClean(date)}>{selfCleanDates.has(date) ? tr(lang, "unmarkSelfClean") : tr(lang, "markSelfClean")}</Button>}
              </div>
            )}

            {view === "calendar" ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between"><Button variant="ghost" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>‹</Button><div className="font-medium capitalize">{calendarMonth.toLocaleDateString(locale, { month: "long", year: "numeric" })}</div><Button variant="ghost" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>›</Button></div>
                  <div className="grid grid-cols-7 gap-1.5 text-xs text-muted-foreground text-center font-medium">{dayNames.map((name) => <div key={name} className="py-1">{name}</div>)}</div>
                  <div className="grid grid-cols-7 gap-1.5">{cells.map((cell, index) => {
                    if (!cell) return <div key={`empty-${index}`} className="min-h-[64px]" />;
                    const key = formatDate(cell);
                    const info = calendarData.get(key);
                    const work = info?.total ?? 0;
                    const isToday = key === todayInStockholm();
                    const isSelf = selfCleanDates.has(key) && work > 0;
                    return <button key={key} onClick={() => { setDate(key); setView("day"); }} className={`min-h-[78px] rounded-lg border p-1 flex flex-col items-stretch text-xs transition hover:bg-muted active:scale-95 overflow-hidden ${isToday ? "ring-2 ring-primary" : ""} ${isSelf ? "bg-blue-500/10 border-blue-500/60" : work > 0 ? "bg-emerald-500/10 border-emerald-500/50" : "border-border/60"}`}><div className="flex items-center justify-between px-0.5"><span className={`text-sm font-semibold ${isSelf ? "text-blue-700" : work > 0 ? "text-emerald-700" : isToday ? "text-primary" : ""}`}>{cell.getDate()}</span>{work > 0 && <span className={`text-[10px] font-bold ${isSelf ? "text-blue-700" : "text-emerald-700"}`}>{work}</span>}</div>{work > 0 && <div className="mt-auto flex flex-col items-center gap-0.5"><span className={`w-full rounded text-[9px] font-bold uppercase tracking-tight py-0.5 text-center ${isSelf ? "bg-blue-500 text-white" : "bg-emerald-600 text-white"}`}>{isSelf ? `👤 ${tr(lang, "christofferLabel")}` : `🧹 ${tr(lang, "topstadLabel")}`}</span><div className="flex gap-1">{(info?.arrivals ?? 0) > 0 && <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{info?.arrivals}</span>}{(info?.departures ?? 0) > 0 && <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{info?.departures}</span>}</div></div>}</button>;
                  })}</div>
                  <div className="pt-2 border-t space-y-2"><div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{tr(lang, "whoCleansLegend")}</div><div className="flex gap-2 flex-wrap text-xs"><span className="rounded bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5">🧹 {tr(lang, "topstadLabel")}</span><span className="rounded bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5">👤 {tr(lang, "christofferLabel")}</span></div></div>
                </CardContent>
              </Card>
            ) : view === "overview" ? (
              dataLoading ? <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">Laddar…</CardContent></Card> : overview.length === 0 ? <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">{tr(lang, "noUpcoming")}</CardContent></Card> : <div className="space-y-3"><h2 className="font-serif text-lg">{tr(lang, "upcomingDates")}</h2>{overview.map((row) => <Card key={row.date} className="cursor-pointer" onClick={() => { setDate(row.date); setView("day"); }}><CardContent className="p-4 flex items-center justify-between"><div><div className="font-medium capitalize">{new Date(`${row.date}T12:00:00`).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}</div><div className="text-xs text-muted-foreground">{row.date}</div></div><Badge variant="secondary">{row.tents.length} {tr(lang, "tentsShort")}</Badge></CardContent></Card>)}</div>
            ) : dataLoading ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">Laddar…</CardContent></Card>
            ) : cards.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">{tr(lang, "noTentsToday")}</CardContent></Card>
            ) : (
              <div className="space-y-3">{cards.map((card) => {
                const session = sessionByTent.get(card.tent_id);
                const done = session?.status === "completed";
                const inProgress = session?.status === "in_progress";
                return <Card key={card.tent_id} className={`cursor-pointer ${done ? "border-green-500/50 bg-green-500/5" : card.earlyCheckin ? "border-2 border-amber-500 bg-amber-500/5" : card.lateCheckout ? "border-2 border-red-500/70" : ""}`} onClick={() => setSelected(card)}>{card.earlyCheckin && <div className="px-4 py-2 bg-amber-500 text-white text-xs font-bold uppercase tracking-wide rounded-t-lg">⏰ {lang === "sv" ? "Tidig incheckning kl. 12.00 – städa detta tält först" : "Early check-in 12:00 – clean this tent first"}</div>}<CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div className="flex-1 min-w-0"><h3 className="font-serif text-xl">{card.tentName}</h3><p className="text-xs text-muted-foreground">{tr(lang, "tentLabel")} {card.tentNo} – {card.position}</p><div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium">🔒 {lang === "sv" ? "Kod till hänglåset" : lang === "si" ? "අගුළු කේතය" : "Lock code"}: <span className="font-mono tracking-widest">2018</span></div>{card.guests > 0 && <div className="mt-3 flex items-center gap-3 rounded-lg bg-primary/10 border border-primary/30 p-3"><Users className="h-7 w-7 text-primary shrink-0" /><div className="flex-1"><div className="text-[10px] uppercase tracking-wider text-primary font-semibold">{tr(lang, "guestsLabel")}</div><div className="flex items-baseline gap-1.5"><span className="text-3xl font-bold text-primary leading-none">{card.guests}</span><span className="text-sm text-muted-foreground">{tr(lang, "guests").toLowerCase()}</span>{card.children > 0 && <span className="text-xs text-muted-foreground ml-1">({card.children} {tr(lang, "children").toLowerCase()})</span>}</div></div></div>}<div className="mt-2 rounded-md bg-muted p-3 text-sm font-medium">{towelInstruction(card.guests, lang)}</div><div className="flex flex-wrap gap-1.5 mt-2">{card.hasArrival ? <Badge className="bg-amber-500">{tr(lang, "changeover")}</Badge> : <Badge variant="secondary">{tr(lang, "departure")}</Badge>}{card.guests > 2 && <Badge variant="outline">{tr(lang, "sofaBed")}</Badge>}{card.breakfast && <Badge variant="outline">{tr(lang, "breakfast")}</Badge>}{card.fikapase && <Badge variant="outline">{tr(lang, "fika")}</Badge>}{card.lateCheckout && <Badge className="bg-red-600"><Clock3 className="mr-1 h-3 w-3" />Sen utcheckning kl. 12.00</Badge>}</div></div>{done ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : inProgress ? <Badge>{tr(lang, "inProgress")}</Badge> : <Badge variant="outline">{tr(lang, "notStarted")}</Badge>}</div></CardContent></Card>;
              })}</div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
