import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Loader2,
  LogOut,
  RefreshCw,
  Sparkles,
  Sunrise,
  UserRound,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCleaner } from "@/hooks/useCleaner";
import { TENTS, TENT_BY_ID, todayInStockholm } from "@/cleaning/config";
import Cleaning from "@/pages/Cleaning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Stay = {
  booking_number: string;
  tent_id: string;
  checkin_date: string;
  checkout_date: string;
  guests: number | null;
  children: number | null;
};

type Assignment = { work_date: string; assigned_user_id: string };
type CleanerName = { user_id: string; display_name: string };
type Availability = { work_date: string; user_id: string };
type Session = { tent_id: string; cleaning_date: string; status: string };
type EarlyFlag = { tent_id: string; date: string; active: boolean };

type TentDayInfo = {
  tent_id: string;
  arrivalGuests: number; // adults + children
  arrivalAdults: number;
  arrivalChildren: number;
  hasArrival: boolean;
  hasDeparture: boolean;
  early: boolean;
  done: boolean;
};

type DayRow = {
  date: string;
  tents: Set<string>;
  arrivals: number;
  departures: number;
  guests: number;
  adults: number;
  children: number;
  earlyTents: Set<string>;
  completedTents: Set<string>;
  perTent: Map<string, TentDayInfo>;
};


type Filter = "all" | "missing" | "assigned" | "self";

function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function formatSvDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
}

export default function CleaningPortal() {
  const { user, isCleaner, isAdmin, loading } = useCleaner();

  const today = todayInStockholm();
  const rangeEnd = useMemo(() => addDays(today, 45), [today]);

  const [stays, setStays] = useState<Stay[]>([]);
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map());
  const [cleanerNames, setCleanerNames] = useState<Map<string, string>>(new Map());
  const [interests, setInterests] = useState<Map<string, Set<string>>>(new Map());
  const [selfCleanDates, setSelfCleanDates] = useState<Set<string>>(new Set());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [earlyFlags, setEarlyFlags] = useState<EarlyFlag[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const loadAll = async () => {
    setDataLoading(true);
    try {
      const [staysRes, assignRes, namesRes, availRes, selfRes, sessRes, earlyRes] = await Promise.all([
        (supabase as any)
          .from("tent_stays")
          .select("booking_number, tent_id, checkin_date, checkout_date, guests, children")
          .or(
            `and(checkin_date.gte.${today},checkin_date.lte.${rangeEnd}),and(checkout_date.gte.${today},checkout_date.lte.${rangeEnd})`,
          ),
        (supabase as any)
          .from("cleaning_assignments")
          .select("work_date, assigned_user_id")
          .gte("work_date", today)
          .lte("work_date", rangeEnd),
        (supabase as any).rpc("list_cleaner_display_names"),
        (supabase as any)
          .from("employee_availability")
          .select("work_date, user_id")
          .gte("work_date", today)
          .lte("work_date", rangeEnd),
        (supabase as any)
          .from("self_clean_dates")
          .select("date")
          .gte("date", today)
          .lte("date", rangeEnd),
        (supabase as any)
          .from("cleaning_sessions")
          .select("tent_id, cleaning_date, status")
          .gte("cleaning_date", today)
          .lte("cleaning_date", rangeEnd),
        (supabase as any)
          .from("early_checkin_flags")
          .select("tent_id, date, active")
          .gte("date", today)
          .lte("date", rangeEnd)
          .eq("active", true),
      ]);

      setStays((staysRes.data ?? []) as Stay[]);

      const aMap = new Map<string, string>();
      for (const r of (assignRes.data ?? []) as Assignment[]) aMap.set(r.work_date, r.assigned_user_id);
      setAssignments(aMap);

      const nMap = new Map<string, string>();
      for (const r of (namesRes.data ?? []) as CleanerName[]) nMap.set(r.user_id, r.display_name);
      setCleanerNames(nMap);

      const iMap = new Map<string, Set<string>>();
      for (const r of (availRes.data ?? []) as Availability[]) {
        if (!iMap.has(r.work_date)) iMap.set(r.work_date, new Set());
        iMap.get(r.work_date)!.add(r.user_id);
      }
      setInterests(iMap);

      setSelfCleanDates(new Set(((selfRes.data ?? []) as { date: string }[]).map((r) => r.date)));
      setSessions((sessRes.data ?? []) as Session[]);
      setEarlyFlags((earlyRes.data ?? []) as EarlyFlag[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte hämta data");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !isAdmin) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  // Build day rows (turnover + arrival-only days included)
  const days = useMemo<DayRow[]>(() => {
    const map = new Map<string, DayRow>();
    const ensure = (d: string) => {
      let row = map.get(d);
      if (!row) {
        row = {
          date: d,
          tents: new Set(),
          arrivals: 0,
          departures: 0,
          guests: 0,
          adults: 0,
          children: 0,
          earlyTents: new Set(),
          completedTents: new Set(),
          perTent: new Map(),
        };
        map.set(d, row);
      }
      return row;
    };
    const ensureTent = (row: DayRow, tid: string): TentDayInfo => {
      let t = row.perTent.get(tid);
      if (!t) {
        t = {
          tent_id: tid,
          arrivalGuests: 0,
          arrivalAdults: 0,
          arrivalChildren: 0,
          hasArrival: false,
          hasDeparture: false,
          early: false,
          done: false,
        };
        row.perTent.set(tid, t);
      }
      return t;
    };
    const arrivalByKey = new Map<string, Stay>();
    for (const s of stays) arrivalByKey.set(`${s.tent_id}|${s.checkin_date}`, s);

    for (const s of stays) {
      if (s.checkout_date >= today && s.checkout_date <= rangeEnd) {
        const row = ensure(s.checkout_date);
        const tInfo = ensureTent(row, s.tent_id);
        if (!row.tents.has(s.tent_id)) {
          row.tents.add(s.tent_id);
          row.departures += 1;
        }
        tInfo.hasDeparture = true;
        const arr = arrivalByKey.get(`${s.tent_id}|${s.checkout_date}`);
        if (arr) {
          const adults = Math.max(0, Number(arr.guests ?? 0));
          const children = Math.max(0, Number(arr.children ?? 0));
          row.arrivals += 1;
          row.guests += adults + children;
          row.adults += adults;
          row.children += children;
          tInfo.hasArrival = true;
          tInfo.arrivalAdults = adults;
          tInfo.arrivalChildren = children;
          tInfo.arrivalGuests = adults + children;
        }
      }
      if (s.checkin_date >= today && s.checkin_date <= rangeEnd) {
        const isTurnover = stays.some(
          (x) => x.tent_id === s.tent_id && x.checkout_date === s.checkin_date,
        );
        if (!isTurnover) {
          const row = ensure(s.checkin_date);
          const tInfo = ensureTent(row, s.tent_id);
          row.tents.add(s.tent_id);
          const adults = Math.max(0, Number(s.guests ?? 0));
          const children = Math.max(0, Number(s.children ?? 0));
          row.arrivals += 1;
          row.guests += adults + children;
          row.adults += adults;
          row.children += children;
          tInfo.hasArrival = true;
          tInfo.arrivalAdults = adults;
          tInfo.arrivalChildren = children;
          tInfo.arrivalGuests = adults + children;
        }
      }
    }

    for (const f of earlyFlags) {
      const row = ensure(f.date);
      row.earlyTents.add(f.tent_id);
      ensureTent(row, f.tent_id).early = true;
    }
    for (const sess of sessions) {
      if (sess.status === "completed") {
        const row = ensure(sess.cleaning_date);
        row.completedTents.add(sess.tent_id);
        ensureTent(row, sess.tent_id).done = true;
      }
    }

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [stays, sessions, earlyFlags, today, rangeEnd]);


  const filteredDays = useMemo(() => {
    return days.filter((d) => {
      const isSelf = selfCleanDates.has(d.date);
      const assigned = assignments.has(d.date);
      if (filter === "self") return isSelf;
      if (filter === "assigned") return assigned && !isSelf;
      if (filter === "missing") return !assigned && !isSelf && d.tents.size > 0;
      return true;
    });
  }, [days, filter, assignments, selfCleanDates]);

  const stats = useMemo(() => {
    const todayRow = days.find((d) => d.date === today);
    const unstaffed = days.filter(
      (d) => d.tents.size > 0 && !assignments.has(d.date) && !selfCleanDates.has(d.date),
    ).length;
    const early = days.reduce((acc, d) => acc + d.earlyTents.size, 0);
    const next = days.find((d) => d.date > today && d.tents.size > 0);
    return {
      todayTents: todayRow?.tents.size ?? 0,
      todayCompleted: todayRow?.completedTents.size ?? 0,
      unstaffed,
      early,
      nextDate: next?.date ?? null,
    };
  }, [days, assignments, selfCleanDates, today]);

  const focusRow = days.find((d) => d.date === today);
  const focusLate = 0; // sena utcheckningar redovisas via addons på checklistan
  const focusEarly = focusRow?.earlyTents.size ?? 0;

  const cleanerOptions = useMemo(
    () =>
      Array.from(cleanerNames.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name, "sv")),
    [cleanerNames],
  );

  const assignDay = async (targetDate: string, userId: string | null) => {
    setSaving(true);
    try {
      if (!userId) {
        const { error } = await (supabase as any)
          .from("cleaning_assignments")
          .delete()
          .eq("work_date", targetDate);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("cleaning_assignments")
          .upsert(
            { work_date: targetDate, assigned_user_id: userId, created_by: user?.id },
            { onConflict: "work_date" },
          );
        if (error) throw error;
      }
      const next = new Map(assignments);
      if (!userId) next.delete(targetDate);
      else next.set(targetDate, userId);
      setAssignments(next);
      toast.success("Tilldelning uppdaterad");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte tilldela");
    } finally {
      setSaving(false);
    }
  };

  const toggleSelfClean = async (targetDate: string) => {
    setSaving(true);
    try {
      if (selfCleanDates.has(targetDate)) {
        const { error } = await (supabase as any)
          .from("self_clean_dates")
          .delete()
          .eq("date", targetDate);
        if (error) throw error;
        const next = new Set(selfCleanDates);
        next.delete(targetDate);
        setSelfCleanDates(next);
        toast.success("Egenstäd borttagen");
      } else {
        const { error } = await (supabase as any)
          .from("self_clean_dates")
          .insert({ date: targetDate, created_by: user?.id });
        if (error) throw error;
        const next = new Set(selfCleanDates);
        next.add(targetDate);
        setSelfCleanDates(next);
        toast.success("Markerad som egenstäd");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte uppdatera");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Fallback: non-admins (including cleaners) get the existing staff workflow untouched
  if (!user || !isAdmin) {
    return <Cleaning />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="font-serif text-2xl font-bold sm:text-3xl">Städ – kontrollpanel</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Översikt kommande 45 dagar · bemanning, egenstäd och intresseanmälan
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/cleaning">
                <Sparkles className="mr-2 h-4 w-4" /> Arbetsvy
              </Link>
            </Button>
            <Button onClick={loadAll} variant="outline" size="sm" disabled={dataLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${dataLoading ? "animate-spin" : ""}`} /> Uppdatera
            </Button>
            <Button
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              variant="ghost"
              size="sm"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Sparkles className="h-4 w-4" />}
            label="Idag"
            value={`${stats.todayCompleted}/${stats.todayTents}`}
            hint="klara / tält"
          />
          <StatCard
            icon={<UserRound className="h-4 w-4" />}
            label="Obemannade"
            value={String(stats.unstaffed)}
            hint="dagar utan städare"
            tone={stats.unstaffed > 0 ? "warn" : "ok"}
          />
          <StatCard
            icon={<Sunrise className="h-4 w-4" />}
            label="Tidiga incheckningar"
            value={String(stats.early)}
            hint="kommande 45 dagar"
          />
          <StatCard
            icon={<CalendarDays className="h-4 w-4" />}
            label="Nästa städdag"
            value={stats.nextDate ? formatSvDate(stats.nextDate) : "–"}
          />
        </div>

        {/* Dagens fokus */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5" /> Dagens fokus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!focusRow || focusRow.tents.size === 0 ? (
              <p className="text-sm text-muted-foreground">Inga tält att städa idag.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">{focusRow.tents.size} tält</Badge>
                  <Badge variant="secondary">{focusRow.arrivals} byten</Badge>
                  <Badge variant="secondary">
                    <Users className="mr-1 h-3 w-3" /> {focusRow.guests} gäster
                  </Badge>
                  {focusEarly > 0 && (
                    <Badge className="bg-amber-500 text-white">
                      <Sunrise className="mr-1 h-3 w-3" /> {focusEarly} tidig
                    </Badge>
                  )}
                  {focusLate > 0 && <Badge variant="outline">{focusLate} sen utcheckning</Badge>}
                </div>
                <div className="h-2 w-full overflow-hidden rounded bg-muted">
                  <div
                    className="h-full bg-green-600 transition-all"
                    style={{
                      width: `${
                        focusRow.tents.size === 0
                          ? 0
                          : Math.round((focusRow.completedTents.size / focusRow.tents.size) * 100)
                      }%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {focusRow.completedTents.size} av {focusRow.tents.size} tält klara
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", label: "Alla" },
              { id: "missing", label: "Saknar" },
              { id: "assigned", label: "Tilldelat" },
              { id: "self", label: "Egenstäd" },
            ] as { id: Filter; label: string }[]
          ).map((f) => (
            <Button
              key={f.id}
              variant={filter === f.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {filteredDays.length} dagar
          </span>
        </div>

        {/* Days list */}
        <div className="space-y-3">
          {dataLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Laddar…
            </div>
          )}
          {!dataLoading && filteredDays.length === 0 && (
            <p className="text-sm text-muted-foreground">Inga dagar matchar filtret.</p>
          )}
          {filteredDays.map((d) => {
            const assignedId = assignments.get(d.date) ?? null;
            const isSelf = selfCleanDates.has(d.date);
            const interested = Array.from(interests.get(d.date) ?? []);
            const done = d.completedTents.size === d.tents.size && d.tents.size > 0;

            return (
              <Card key={d.date} className={d.date === today ? "border-primary" : ""}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{formatSvDate(d.date)}</div>
                      <div className="text-xs text-muted-foreground">{d.date}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {done && (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Klar
                        </Badge>
                      )}
                      {isSelf && <Badge variant="secondary">Egenstäd</Badge>}
                      {!assignedId && !isSelf && d.tents.size > 0 && (
                        <Badge variant="destructive">Saknar städare</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {Array.from(d.tents).map((tid) => {
                      const t = TENT_BY_ID[tid];
                      const isEarly = d.earlyTents.has(tid);
                      const isDone = d.completedTents.has(tid);
                      return (
                        <Badge key={tid} variant="outline" className="gap-1">
                          {isDone && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                          {t ? `${t.no}. ${t.name}` : tid}
                          {isEarly && <Sunrise className="h-3 w-3 text-amber-500" />}
                        </Badge>
                      );
                    })}
                    {d.tents.size === 0 && (
                      <span className="text-muted-foreground">Inga byten</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>{d.arrivals} byten</div>
                    <div>
                      <Users className="mr-1 inline h-3 w-3" />
                      {d.guests} gäster
                    </div>
                    <div>
                      {d.earlyTents.size > 0 && (
                        <span className="text-amber-600">
                          <Sunrise className="mr-1 inline h-3 w-3" />
                          {d.earlyTents.size} tidig
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <Select
                        value={assignedId ?? "none"}
                        onValueChange={(v) => assignDay(d.date, v === "none" ? null : v)}
                        disabled={saving || isSelf}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Tilldela städare" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ingen tilldelad</SelectItem>
                          {cleanerOptions.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                              {interests.get(d.date)?.has(c.id) ? " ⭐" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      {assignedId && !isSelf && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() => assignDay(d.date, null)}
                        >
                          Rensa
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={isSelf ? "secondary" : "outline"}
                        disabled={saving}
                        onClick={() => toggleSelfClean(d.date)}
                      >
                        {isSelf ? "Ta bort egenstäd" : "Egenstäd"}
                      </Button>
                    </div>
                  </div>

                  {interested.length > 0 && (
                    <div className="rounded border bg-muted/40 p-2 text-xs">
                      <span className="font-medium">Intresseanmält: </span>
                      {interested
                        .map((uid) => cleanerNames.get(uid) ?? uid.slice(0, 6))
                        .join(", ")}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="pt-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/cleaning">
              Öppna arbetsvyn <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "ok" | "warn";
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <div
          className={`text-2xl font-semibold ${
            tone === "warn" ? "text-destructive" : tone === "ok" ? "text-green-600" : ""
          }`}
        >
          {value}
        </div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

// keep TENTS reference to satisfy tree-shaker warnings if unused elsewhere
void TENTS;
