import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCleaner } from "@/hooks/useCleaner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, LogOut, Sparkles } from "lucide-react";
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
          <p className="text-sm text-muted-foreground">Logga in med lösenordet <strong>topstäd</strong></p>
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
  const [view, setView] = useState<"day" | "overview">("overview");
  const [date, setDate] = useState<string>(todayInStockholm());
  const [stays, setStays] = useState<Stay[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<TentDayData | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingRow[]>([]);

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

  useEffect(() => { if (user && isCleaner && view === "day") load(); }, [user, isCleaner, date, view]);
  useEffect(() => { if (user && isCleaner && view === "overview") loadUpcoming(); }, [user, isCleaner, view]);

  const cards: TentDayData[] = useMemo(() => {
    return TENTS.map((t) => {
      const arr = stays.find((s) => s.tent_id === t.id && s.checkin_date === date);
      const dep = stays.find((s) => s.tent_id === t.id && s.checkout_date === date);
      if (!arr && !dep) return null;
      return {
        tent_id: t.id, tentNo: t.no, tentName: t.name, date,
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

            <div className="flex gap-2">
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


            {view === "overview" ? (
              upcoming.length === 0 ? (
                <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">{tr(lang, "noUpcoming")}</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  <h2 className="font-serif text-lg">{tr(lang, "upcomingDates")}</h2>
                  {upcoming.map((row) => {
                    const dateLabel = new Date(row.date).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", { weekday: "short", day: "numeric", month: "short" });
                    return (
                      <Card key={row.date}>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium capitalize">{dateLabel}</div>
                            <div className="text-xs text-muted-foreground">{row.date}</div>
                          </div>
                          <div className="space-y-1.5">
                            {row.tents.map((t) => (
                              <div key={t.tent_id} className="border rounded p-2">
                                <div className="text-sm font-medium">Tält {t.tentNo} – {t.tentName}</div>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {t.hasArrival && t.hasDeparture && <Badge className="bg-amber-500">{tr(lang, "changeover")}</Badge>}
                                  {t.hasArrival && !t.hasDeparture && <Badge variant="secondary">{tr(lang, "arrival")}</Badge>}
                                  {!t.hasArrival && t.hasDeparture && <Badge variant="secondary">{tr(lang, "departure")}</Badge>}
                                  {t.hasArrival && t.guests > 0 && <Badge variant="outline">{t.guests} {tr(lang, "guests")}</Badge>}
                                  {t.lateCheckout && <Badge variant="outline">{tr(lang, "lateCheckout")}</Badge>}
                                </div>
                              </div>
                            ))}
                          </div>
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
                          <div className="flex-1">
                            <h3 className="font-serif text-xl">{c.tentName}</h3>
                            <p className="text-xs text-muted-foreground">Tält {c.tentNo}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {c.hasArrival && c.hasDeparture && <Badge className="bg-amber-500">{tr(lang, "changeover")}</Badge>}
                              {c.hasArrival && !c.hasDeparture && <Badge variant="secondary">{tr(lang, "arrivalOnly")}</Badge>}
                              {!c.hasArrival && c.hasDeparture && <Badge variant="secondary">{tr(lang, "departure")}</Badge>}
                              {c.hasArrival && <Badge variant="outline">{c.guests} {tr(lang, "guests")}</Badge>}
                              {c.guests > 2 && <Badge variant="outline">{tr(lang, "sofaBed")}</Badge>}
                              {c.children > 0 && <Badge variant="outline">{tr(lang, "children")}: {c.children}</Badge>}
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
