import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCleaner } from "@/hooks/useCleaner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle2, LogOut, Sparkles, Users } from "lucide-react";
import { TENT_BY_ID, TENTS, todayInStockholm } from "@/cleaning/config";
import { CLEAN_LANGS, getStoredLang, setStoredLang, tr, type CleanLang } from "@/cleaning/i18n";
import { CleaningChecklist, type TentDayData } from "@/components/cleaning/CleaningChecklist";
import { toast } from "sonner";

type Stay = {
  booking_number: string;
  tent_id: string;
  checkin_date: string;
  checkout_date: string;
  guests: number;
  children: number;
  breakfast: boolean;
  fikapase: boolean;
  late_checkout: boolean;
};

type Session = { tent_id: string; cleaning_date: string; status: string };

const CLEANER_EMAIL = "stadare@goglampingsweden.se";

function LoginForm({ lang }: { lang: CleanLang }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: CLEANER_EMAIL, password: pw });
    setBusy(false);
    if (error) toast.error(tr(lang, "loginFailed"));
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Sparkles className="h-8 w-8 mx-auto text-primary" />
          <CardTitle>{tr(lang, "loginTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{tr(lang, "loginHint")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label>{tr(lang, "password")}</Label>
              <Input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoFocus
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{tr(lang, "signIn")}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


type UpcomingRow = {
  date: string;
  tents: {
    tent_id: string;
    tentNo: number;
    tentName: string;
    hasArrival: boolean;
    hasDeparture: boolean;
    guests: number;
    lateCheckout: boolean;
  }[];
};

export default function Cleaning() {
  const { user, isCleaner, loading, signOut } = useCleaner();
  const [lang, setLang] = useState<CleanLang>(getStoredLang());
  const [view, setView] = useState<"day" | "overview" | "calendar">("calendar");
  const [calMonth, setCalMonth] = useState<Date>(() => { const d = new Date(); d.setDate(1); return d; });
  const [date, setDate] = useState<string>(todayInStockholm());
  const [stays, setStays] = useState<Stay[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<TentDayData | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingRow[]>([]);
  const [calData, setCalData] = useState<Map<string, { arrivals: number; departures: number; total: number }>>(new Map());
  const [nextCleaning, setNextCleaning] = useState<{ date: string; tents: number; arrivals: number; departures: number; guests: number } | null>(null);

  const changeLang = (l: CleanLang) => { setLang(l); setStoredLang(l); };

  const load = async () => {
    const { data: stayRows } = await (supabase as any)
      .from("tent_stays")
      .select("booking_number, tent_id, checkin_date, checkout_date, guests, children, breakfast, fikapase, late_checkout")
      .or(`checkin_date.eq.${date},checkout_date.eq.${date}`);
    setStays((stayRows ?? []) as Stay[]);
    const { data: sessRows } = await (supabase as any)
      .from("cleaning_sessions")
      .select("tent_id, cleaning_date, status")
      .eq("cleaning_date", date);
    setSessions((sessRows ?? []) as Session[]);
  };

  const loadUpcoming = async () => {
    const today = todayInStockholm();
    const end = new Date();
    end.setDate(end.getDate() + 60);
    const endStr = end.toISOString().slice(0, 10);
    const { data } = await (supabase as any)
      .from("tent_stays")
      .select("tent_id, checkin_date, checkout_date, guests, late_checkout")
      .or(`and(checkin_date.gte.${today},checkin_date.lte.${endStr}),and(checkout_date.gte.${today},checkout_date.lte.${endStr})`);
    const rows = (data ?? []) as Stay[];
    const map = new Map<string, UpcomingRow>();
    const addDate = (d: string) => {
      if (!map.has(d)) map.set(d, { date: d, tents: [] });
      return map.get(d)!;
    };
    TENTS.forEach((t) => {
      rows.forEach((s) => {
        if (s.tent_id !== t.id) return;
        const dates: { d: string; arr: boolean; dep: boolean }[] = [];
        if (s.checkin_date >= today && s.checkin_date <= endStr) dates.push({ d: s.checkin_date, arr: true, dep: false });
        if (s.checkout_date >= today && s.checkout_date <= endStr) dates.push({ d: s.checkout_date, arr: false, dep: true });
        dates.forEach(({ d, arr, dep }) => {
          const row = addDate(d);
          let existing = row.tents.find((x) => x.tent_id === t.id);
          if (!existing) {
            existing = {
              tent_id: t.id, tentNo: t.no, tentName: t.name,
              hasArrival: false, hasDeparture: false,
              guests: 0, lateCheckout: false,
            };
            row.tents.push(existing);
          }
          if (arr) {
            existing.hasArrival = true;
            existing.guests = s.guests ?? 0;
          }
          if (dep) {
            existing.hasDeparture = true;
            existing.lateCheckout = !!s.late_checkout;
          }
        });
      });
    });
    const list = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    list.forEach((r) => r.tents.sort((a, b) => a.tentNo - b.tentNo));
    setUpcoming(list);
  };

  const loadCalendar = async (monthStart: Date) => {
    const start = new Date(monthStart); start.setDate(1);
    const end = new Date(monthStart); end.setMonth(end.getMonth() + 1); end.setDate(0);
    const s = start.toISOString().slice(0, 10);
    const e = end.toISOString().slice(0, 10);
    const { data } = await (supabase as any)
      .from("tent_stays")
      .select("tent_id, checkin_date, checkout_date")
      .or(`and(checkin_date.gte.${s},checkin_date.lte.${e}),and(checkout_date.gte.${s},checkout_date.lte.${e})`);
    const rows = (data ?? []) as { tent_id?: string; checkin_date: string; checkout_date: string }[];
    const tentsByDate = new Map<string, Set<string>>();
    const arrByDate = new Map<string, Set<string>>();
    const depByDate = new Map<string, Set<string>>();
    const bump = (map: Map<string, Set<string>>, d: string, tent: string) => {
      if (d < s || d > e) return;
      if (!map.has(d)) map.set(d, new Set());
      map.get(d)!.add(tent);
    };
    rows.forEach((r: any) => {
      const tent = r.tent_id ?? Math.random().toString();
      bump(tentsByDate, r.checkin_date, tent);
      bump(tentsByDate, r.checkout_date, tent);
      bump(arrByDate, r.checkin_date, tent);
      bump(depByDate, r.checkout_date, tent);
    });
    const m = new Map<string, { arrivals: number; departures: number; total: number }>();
    tentsByDate.forEach((set, d) => {
      m.set(d, {
        arrivals: arrByDate.get(d)?.size ?? 0,
        departures: depByDate.get(d)?.size ?? 0,
        total: set.size,
      });
    });
    setCalData(m as any);
  };

  useEffect(() => { if (user && isCleaner && view === "day") load(); }, [user, isCleaner, date, view]);
  useEffect(() => { if (user && isCleaner && view === "overview") loadUpcoming(); }, [user, isCleaner, view]);
  useEffect(() => { if (user && isCleaner && view === "calendar") loadCalendar(calMonth); }, [user, isCleaner, view, calMonth]);

  // Load next upcoming cleaning date (banner) once when authed
  useEffect(() => {
    if (!user || !isCleaner) return;
    (async () => {
      const today = todayInStockholm();
      const end = new Date();
      end.setDate(end.getDate() + 90);
      const endStr = end.toISOString().slice(0, 10);
      const { data } = await (supabase as any)
        .from("tent_stays")
        .select("tent_id, checkin_date, checkout_date, guests")
        .or(`and(checkin_date.gte.${today},checkin_date.lte.${endStr}),and(checkout_date.gte.${today},checkout_date.lte.${endStr})`);
      const rows = (data ?? []) as { tent_id: string; checkin_date: string; checkout_date: string; guests: number }[];
      const byDate = new Map<string, { tents: Set<string>; arrivals: Set<string>; departures: Set<string>; guests: number }>();
      const bump = (d: string) => {
        if (!byDate.has(d)) byDate.set(d, { tents: new Set(), arrivals: new Set(), departures: new Set(), guests: 0 });
        return byDate.get(d)!;
      };
      rows.forEach((r) => {
        if (r.checkin_date >= today && r.checkin_date <= endStr) {
          const b = bump(r.checkin_date); b.tents.add(r.tent_id); b.arrivals.add(r.tent_id); b.guests += r.guests ?? 0;
        }
        if (r.checkout_date >= today && r.checkout_date <= endStr) {
          const b = bump(r.checkout_date); b.tents.add(r.tent_id); b.departures.add(r.tent_id);
        }
      });
      const sorted = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      if (sorted.length === 0) { setNextCleaning(null); return; }
      const [d, info] = sorted[0];
      setNextCleaning({ date: d, tents: info.tents.size, arrivals: info.arrivals.size, departures: info.departures.size, guests: info.guests });
    })();
  }, [user, isCleaner]);

  const cards: TentDayData[] = useMemo(() => {
    return TENTS.map((t) => {
      const arr = stays.find((s) => s.tent_id === t.id && s.checkin_date === date);
      const dep = stays.find((s) => s.tent_id === t.id && s.checkout_date === date);
      if (!arr && !dep) return null;
      return {
        tent_id: t.id, tentNo: t.no, tentName: t.name, position: t.position[lang], date,
        hasArrival: !!arr, hasDeparture: !!dep,
        arrivalBooking: arr?.booking_number,
        guests: arr?.guests ?? 0,
        children: arr?.children ?? 0,
        breakfast: !!arr?.breakfast, fikapase: !!arr?.fikapase,
        lateCheckout: !!dep?.late_checkout,
      } as TentDayData;
    }).filter(Boolean) as TentDayData[];
  }, [stays, date]);

  const sessByTent = useMemo(() => {
    const m = new Map<string, Session>();
    sessions.forEach((s) => m.set(s.tent_id, s));
    return m;
  }, [sessions]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">…</div>;
  if (!user) return <LoginForm lang={lang} />;
  if (!isCleaner) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-3 text-center">
      <p>{tr(lang, "noAccess")}</p>
      <Button variant="outline" onClick={signOut}>{tr(lang, "signOut")}</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto p-4 flex items-center justify-between gap-3">
          <h1 className="font-serif text-lg">{tr(lang, "appTitle")}</h1>
          <div className="flex items-center gap-2">
            <select
              aria-label={tr(lang, "language")}
              value={lang}
              onChange={(e) => changeLang(e.target.value as CleanLang)}
              className="text-sm bg-transparent border rounded px-2 py-1"
            >
              {CLEAN_LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {selected ? (
          <CleaningChecklist
            data={selected}
            lang={lang}
            onBack={() => { setSelected(null); load(); }}
            onCompleted={() => { setSelected(null); load(); }}
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground italic">{tr(lang, "intro")}</p>


            {nextCleaning && (() => {
              const today = todayInStockholm();
              const nd = new Date(nextCleaning.date);
              const td = new Date(today);
              const diffDays = Math.round((nd.getTime() - td.getTime()) / 86400000);
              const dateLocale = lang === "sv" ? "sv-SE" : lang === "si" ? "si-LK" : "en-GB";
              const dateLabel = nd.toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" });
              const whenLabel = diffDays === 0
                ? tr(lang, "today")
                : diffDays === 1
                  ? tr(lang, "tomorrow")
                  : `${tr(lang, "inDays")} ${diffDays} ${diffDays === 1 ? tr(lang, "daysOne") : tr(lang, "days")}`;
              return (
                <button
                  onClick={() => { setDate(nextCleaning.date); setView("day"); }}
                  className="w-full text-left rounded-xl border-2 border-primary/40 bg-primary/10 p-4 hover:bg-primary/15 transition shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/20 p-2.5 shrink-0">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">{tr(lang, "nextCleaning")}</div>
                      <div className="font-serif text-lg leading-tight capitalize truncate">{dateLabel}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{whenLabel}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-primary leading-none">{nextCleaning.tents}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{tr(lang, "tentsCount")}</div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-3 pt-3 border-t border-primary/20 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <strong>{nextCleaning.arrivals}</strong> {tr(lang, "arrivals")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <strong>{nextCleaning.departures}</strong> {tr(lang, "departures")}
                    </span>
                    {nextCleaning.guests > 0 && (
                      <span className="flex items-center gap-1.5 ml-auto">
                        <Users className="h-3.5 w-3.5" />
                        <strong>{nextCleaning.guests}</strong> {tr(lang, "totalGuests")}
                      </span>
                    )}
                  </div>
                </button>
              );
            })()}

            <div className="flex gap-2">
              <Button
                variant={view === "calendar" ? "default" : "outline"}
                size="sm" className="flex-1"
                onClick={() => setView("calendar")}
              >{tr(lang, "calendar")}</Button>
              <Button
                variant={view === "overview" ? "default" : "outline"}
                size="sm" className="flex-1"
                onClick={() => setView("overview")}
              >{tr(lang, "overview")}</Button>
              <Button
                variant={view === "day" ? "default" : "outline"}
                size="sm" className="flex-1"
                onClick={() => setView("day")}
              >{tr(lang, "dayView")}</Button>
            </div>

            {view === "day" && (
              <div>
                <Label className="text-xs">{tr(lang, "date")}</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">
                  {cards.length} {tr(lang, "tentsToHandle")}
                </p>
              </div>
            )}


            {view === "calendar" ? (
              (() => {
                const year = calMonth.getFullYear();
                const month = calMonth.getMonth();
                const first = new Date(year, month, 1);
                const last = new Date(year, month + 1, 0);
                // Monday = 0
                const startOffset = (first.getDay() + 6) % 7;
                const cells: (Date | null)[] = [];
                for (let i = 0; i < startOffset; i++) cells.push(null);
                for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
                while (cells.length % 7 !== 0) cells.push(null);
                const monthLabel = first.toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", { month: "long", year: "numeric" });
                const dayNames = lang === "sv"
                  ? ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"]
                  : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                const todayStr = todayInStockholm();
                const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                return (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Button variant="ghost" size="sm" onClick={() => setCalMonth(new Date(year, month - 1, 1))}>‹</Button>
                        <div className="font-medium capitalize">{monthLabel}</div>
                        <Button variant="ghost" size="sm" onClick={() => setCalMonth(new Date(year, month + 1, 1))}>›</Button>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5 text-xs text-muted-foreground text-center font-medium">
                        {dayNames.map((n) => <div key={n} className="py-1">{n}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-1.5">
                        {cells.map((d, i) => {
                          if (!d) return <div key={i} className="min-h-[64px]" />;
                          const key = fmt(d);
                          const info = calData.get(key);
                          const work = info?.total ?? 0;
                          const isToday = key === todayStr;
                          return (
                            <button
                              key={i}
                              onClick={() => { setDate(key); setView("day"); }}
                              className={`min-h-[64px] rounded-lg border p-1.5 flex flex-col items-center justify-between text-xs transition hover:bg-muted active:scale-95 ${isToday ? "ring-2 ring-primary" : ""} ${work > 0 ? "bg-primary/10 border-primary/40" : "border-border/60"}`}
                            >
                              <span className={`text-sm font-semibold ${work > 0 ? "text-primary" : isToday ? "text-primary" : ""}`}>{d.getDate()}</span>
                              {work > 0 && (
                                <div className="flex flex-col items-center gap-0.5 w-full">
                                  <div className="flex gap-1">
                                    {(info!.arrivals ?? 0) > 0 && (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{info!.arrivals}
                                      </span>
                                    )}
                                    {(info!.departures ?? 0) > 0 && (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-500">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{info!.departures}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-bold text-primary">{work} {tr(lang, "tentsShort")}</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground justify-center pt-2 border-t">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {tr(lang, "arrival")}</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> {tr(lang, "departure")}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()
            ) : view === "overview" ? (
              upcoming.length === 0 ? (
                <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">{tr(lang, "noUpcoming")}</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  <h2 className="font-serif text-lg">{tr(lang, "upcomingDates")}</h2>
                  {upcoming.map((row) => {
                    const dateLabel = new Date(row.date).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", { weekday: "short", day: "numeric", month: "short" });
                    const total = row.tents.length;
                    return (
                      <Card key={row.date} className="cursor-pointer" onClick={() => { setDate(row.date); setView("day"); }}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <div className="font-medium capitalize">{dateLabel}</div>
                            <div className="text-xs text-muted-foreground">{row.date}</div>
                          </div>
                          <Badge variant="secondary">{total} {tr(lang, "tentsShort")}</Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )
            ) : cards.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">{tr(lang, "noTentsToday")}</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {cards.map((c) => {
                  const sess = sessByTent.get(c.tent_id);
                  const done = sess?.status === "completed";
                  const inProg = sess?.status === "in_progress";
                  return (
                    <Card key={c.tent_id} className={`cursor-pointer ${done ? "border-green-500/50 bg-green-500/5" : ""}`}
                      onClick={() => setSelected(c)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-serif text-xl">{c.tentName}</h3>
                            <p className="text-xs text-muted-foreground">Tält {c.tentNo} – {c.position}</p>

                            {c.hasArrival && (
                              <div className="mt-3 flex items-center gap-3 rounded-lg bg-primary/10 border border-primary/30 p-3">
                                <Users className="h-7 w-7 text-primary shrink-0" />
                                <div className="flex-1">
                                  <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">{tr(lang, "guestsLabel")}</div>
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-3xl font-bold text-primary leading-none">{c.guests}</span>
                                    <span className="text-sm text-muted-foreground">{tr(lang, "guests").toLowerCase()}</span>
                                    {c.children > 0 && (
                                      <span className="text-xs text-muted-foreground ml-1">({c.children} {tr(lang, "children").toLowerCase()})</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {c.hasArrival && c.hasDeparture && <Badge className="bg-amber-500">{tr(lang, "changeover")}</Badge>}
                              {c.hasArrival && !c.hasDeparture && <Badge variant="secondary">{tr(lang, "arrivalOnly")}</Badge>}
                              {!c.hasArrival && c.hasDeparture && <Badge variant="secondary">{tr(lang, "departure")}</Badge>}
                              {c.guests > 2 && <Badge variant="outline">{tr(lang, "sofaBed")}</Badge>}
                              {c.breakfast && <Badge variant="outline">{tr(lang, "breakfast")}</Badge>}
                              {c.fikapase && <Badge variant="outline">{tr(lang, "fika")}</Badge>}
                              {c.lateCheckout && <Badge variant="outline">{tr(lang, "lateCheckout")}</Badge>}
                            </div>
                          </div>
                          {done ? <CheckCircle2 className="h-6 w-6 text-green-600" />
                            : inProg ? <Badge>{tr(lang, "inProgress")}</Badge>
                            : <Badge variant="outline">{tr(lang, "notStarted")}</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
