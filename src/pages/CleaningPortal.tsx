import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Users,
} from "lucide-react";
import Cleaning from "./Cleaning";
import { useCleaner } from "@/hooks/useCleaner";
import { supabase } from "@/integrations/supabase/client";
import { TENT_BY_ID, todayInStockholm } from "@/cleaning/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Stay = {
  tent_id: string;
  checkin_date: string;
  checkout_date: string;
  guests: number | null;
  children: number | null;
  late_checkout: boolean | null;
};

type Assignment = {
  work_date: string;
  assigned_user_id: string;
};

type CleanerName = {
  user_id: string;
  display_name: string;
};

type Availability = {
  work_date: string;
  user_id: string;
};

type CleaningSession = {
  tent_id: string;
  cleaning_date: string;
  status: string;
};

type EarlyCheckin = {
  tent_id: string;
  date: string;
};

type DayRow = {
  date: string;
  tents: string[];
  arrivals: number;
  guests: number;
  earlyCheckins: number;
  lateCheckouts: number;
  completed: number;
  inProgress: number;
  assignedUserId: string | null;
  selfClean: boolean;
  interestedIds: string[];
};

type Filter = "all" | "needs" | "assigned" | "self";

function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function dateLabel(date: string, withYear = false): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

function relativeDate(date: string): string {
  const today = new Date(`${todayInStockholm()}T12:00:00`);
  const target = new Date(`${date}T12:00:00`);
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (days === 0) return "I dag";
  if (days === 1) return "I morgon";
  return `Om ${days} dagar`;
}

export default function CleaningPortal() {
  const { user, isAdmin, profile, loading, signOut } = useCleaner();
  const [rows, setRows] = useState<DayRow[]>([]);
  const [cleaners, setCleaners] = useState<CleanerName[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [savingDate, setSavingDate] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user || !isAdmin) return;
    setDataLoading(true);
    const start = todayInStockholm();
    const end = addDays(start, 45);

    const [staysResult, assignmentsResult, namesResult, availabilityResult, selfCleanResult, sessionsResult, earlyResult] = await Promise.all([
      (supabase as any)
        .from("tent_stays")
        .select("tent_id, checkin_date, checkout_date, guests, children, late_checkout")
        .or(`and(checkin_date.gte.${start},checkin_date.lte.${end}),and(checkout_date.gte.${start},checkout_date.lte.${end})`),
      (supabase as any)
        .from("cleaning_assignments")
        .select("work_date, assigned_user_id")
        .gte("work_date", start)
        .lte("work_date", end),
      (supabase as any).rpc("list_cleaner_display_names"),
      (supabase as any)
        .from("employee_availability")
        .select("work_date, user_id")
        .gte("work_date", start)
        .lte("work_date", end),
      (supabase as any)
        .from("self_clean_dates")
        .select("date")
        .gte("date", start)
        .lte("date", end),
      (supabase as any)
        .from("cleaning_sessions")
        .select("tent_id, cleaning_date, status")
        .gte("cleaning_date", start)
        .lte("cleaning_date", end),
      (supabase as any)
        .from("early_checkin_flags")
        .select("tent_id, date")
        .eq("active", true)
        .gte("date", start)
        .lte("date", end),
    ]);

    const firstError = [
      staysResult.error,
      assignmentsResult.error,
      namesResult.error,
      availabilityResult.error,
      selfCleanResult.error,
      sessionsResult.error,
      earlyResult.error,
    ].find(Boolean);

    if (firstError) {
      toast.error(firstError.message ?? "Kunde inte ladda adminöversikten");
      setDataLoading(false);
      return;
    }

    const stays = (staysResult.data ?? []) as Stay[];
    const assignmentMap = new Map(
      ((assignmentsResult.data ?? []) as Assignment[]).map((item) => [item.work_date, item.assigned_user_id]),
    );
    const selfCleanDates = new Set(
      (selfCleanResult.data ?? []).map((item: { date: string }) => item.date),
    );
    const availability = new Map<string, string[]>();
    for (const item of (availabilityResult.data ?? []) as Availability[]) {
      availability.set(item.work_date, [...(availability.get(item.work_date) ?? []), item.user_id]);
    }
    const sessionMap = new Map<string, CleaningSession[]>();
    for (const session of (sessionsResult.data ?? []) as CleaningSession[]) {
      sessionMap.set(session.cleaning_date, [...(sessionMap.get(session.cleaning_date) ?? []), session]);
    }
    const earlyKeys = new Set(
      ((earlyResult.data ?? []) as EarlyCheckin[]).map((item) => `${item.date}|${item.tent_id}`),
    );
    const arrivals = new Map(stays.map((stay) => [`${stay.checkin_date}|${stay.tent_id}`, stay]));
    const dayMap = new Map<string, DayRow>();

    for (const departure of stays) {
      if (departure.checkout_date < start || departure.checkout_date > end) continue;
      const existing = dayMap.get(departure.checkout_date) ?? {
        date: departure.checkout_date,
        tents: [],
        arrivals: 0,
        guests: 0,
        earlyCheckins: 0,
        lateCheckouts: 0,
        completed: 0,
        inProgress: 0,
        assignedUserId: assignmentMap.get(departure.checkout_date) ?? null,
        selfClean: selfCleanDates.has(departure.checkout_date),
        interestedIds: availability.get(departure.checkout_date) ?? [],
      };

      if (!existing.tents.includes(departure.tent_id)) existing.tents.push(departure.tent_id);
      const arrival = arrivals.get(`${departure.checkout_date}|${departure.tent_id}`);
      if (arrival) {
        existing.arrivals += 1;
        existing.guests += Number(arrival.guests ?? 0);
      }
      if (earlyKeys.has(`${departure.checkout_date}|${departure.tent_id}`)) existing.earlyCheckins += 1;
      if (departure.late_checkout) existing.lateCheckouts += 1;
      dayMap.set(departure.checkout_date, existing);
    }

    for (const row of dayMap.values()) {
      const daySessions = sessionMap.get(row.date) ?? [];
      row.completed = daySessions.filter((session) => session.status === "completed").length;
      row.inProgress = daySessions.filter((session) => session.status === "in_progress").length;
      row.tents.sort((a, b) => (TENT_BY_ID[a]?.no ?? 99) - (TENT_BY_ID[b]?.no ?? 99));
    }

    setCleaners(
      ((namesResult.data ?? []) as CleanerName[]).sort((a, b) => a.display_name.localeCompare(b.display_name, "sv")),
    );
    setRows(Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date)));
    setDataLoading(false);
  }, [isAdmin, user]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const cleanerNameById = useMemo(
    () => new Map(cleaners.map((cleaner) => [cleaner.user_id, cleaner.display_name])),
    [cleaners],
  );

  const filteredRows = useMemo(() => {
    if (filter === "needs") return rows.filter((row) => !row.selfClean && !row.assignedUserId);
    if (filter === "assigned") return rows.filter((row) => !row.selfClean && !!row.assignedUserId);
    if (filter === "self") return rows.filter((row) => row.selfClean);
    return rows;
  }, [filter, rows]);

  const todayRow = rows.find((row) => row.date === todayInStockholm()) ?? null;
  const nextRow = rows.find((row) => row.date >= todayInStockholm()) ?? null;
  const unassignedCount = rows.filter((row) => !row.selfClean && !row.assignedUserId).length;
  const earlyCount = rows.reduce((sum, row) => sum + row.earlyCheckins, 0);

  const assignDay = async (date: string, userId: string | null) => {
    if (!user || savingDate) return;
    setSavingDate(date);
    try {
      if (userId) {
        const { error } = await (supabase as any).from("cleaning_assignments").upsert(
          { work_date: date, assigned_user_id: userId, created_by: user.id },
          { onConflict: "work_date" },
        );
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("cleaning_assignments").delete().eq("work_date", date);
        if (error) throw error;
      }
      toast.success("Bemanningen är uppdaterad");
      await loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunde inte uppdatera bemanningen");
    } finally {
      setSavingDate(null);
    }
  };

  const toggleSelfClean = async (row: DayRow) => {
    if (!user || savingDate) return;
    setSavingDate(row.date);
    try {
      if (row.selfClean) {
        const { error } = await (supabase as any).from("self_clean_dates").delete().eq("date", row.date);
        if (error) throw error;
        toast.success("Egenstäd borttagen");
      } else {
        const { error } = await (supabase as any)
          .from("self_clean_dates")
          .insert({ date: row.date, created_by: user.id });
        if (error) throw error;
        toast.success("Markerad som egenstäd");
      }
      await loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunde inte ändra egenstäd");
    } finally {
      setSavingDate(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Laddar…</div>;
  }

  if (!user || !isAdmin) return <Cleaning />;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h1 className="truncate font-serif text-lg font-semibold">Städadmin</h1>
              <Badge variant="secondary" className="hidden sm:inline-flex">Admin</Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.display_name ? `Inloggad som ${profile.display_name}` : "Bemanning och driftöversikt"}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/cleaning">Öppna personalvyn</Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => void loadDashboard()} disabled={dataLoading} aria-label="Uppdatera">
              <RefreshCw className={`h-4 w-4 ${dataLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Logga ut">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 pb-24">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Dagens tält</span><Sparkles className="h-4 w-4" />
              </div>
              <div className="mt-2 text-3xl font-bold">{todayRow?.tents.length ?? 0}</div>
              <p className="mt-1 text-xs text-muted-foreground">{todayRow ? `${todayRow.completed} klara` : "Ingen städning"}</p>
            </CardContent>
          </Card>
          <Card className={unassignedCount > 0 ? "border-amber-500/50" : undefined}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Obemannade dagar</span><CircleAlert className="h-4 w-4" />
              </div>
              <div className="mt-2 text-3xl font-bold">{unassignedCount}</div>
              <p className="mt-1 text-xs text-muted-foreground">Kommande 45 dagar</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Tidiga incheckningar</span><Clock3 className="h-4 w-4" />
              </div>
              <div className="mt-2 text-3xl font-bold">{earlyCount}</div>
              <p className="mt-1 text-xs text-muted-foreground">Prioriteras först</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Nästa städdag</span><CalendarDays className="h-4 w-4" />
              </div>
              <div className="mt-2 text-lg font-bold capitalize">{nextRow ? dateLabel(nextRow.date) : "–"}</div>
              <p className="mt-1 text-xs text-muted-foreground">{nextRow ? `${nextRow.tents.length} tält · ${relativeDate(nextRow.date)}` : "Inget planerat"}</p>
            </CardContent>
          </Card>
        </section>

        {todayRow && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Dagens fokus</p>
                  <CardTitle className="mt-1 text-xl">{todayRow.tents.length} tält att hantera</CardTitle>
                </div>
                <Badge className={todayRow.completed === todayRow.tents.length ? "bg-emerald-600" : undefined}>
                  {todayRow.completed}/{todayRow.tents.length} klara
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 pt-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-md bg-background px-2.5 py-1.5 shadow-sm">{todayRow.arrivals} byten</span>
                <span className="rounded-md bg-background px-2.5 py-1.5 shadow-sm">{todayRow.guests} gäster</span>
                {todayRow.earlyCheckins > 0 && <span className="rounded-md bg-amber-100 px-2.5 py-1.5 text-amber-900">{todayRow.earlyCheckins} tidig incheckning</span>}
                {todayRow.lateCheckouts > 0 && <span className="rounded-md bg-red-100 px-2.5 py-1.5 text-red-900">{todayRow.lateCheckouts} sen utcheckning</span>}
              </div>
              <Button asChild>
                <Link to="/cleaning">Öppna dagens arbetsvy <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold">Bemanning framåt</h2>
              <p className="text-sm text-muted-foreground">Tilldela städare och markera egenstäd direkt i listan.</p>
            </div>
            <div className="grid grid-cols-4 gap-1 rounded-lg border bg-background p-1 text-xs">
              {([
                ["all", "Alla"],
                ["needs", "Saknar"],
                ["assigned", "Tilldelat"],
                ["self", "Egenstäd"],
              ] as const).map(([value, label]) => (
                <Button key={value} variant={filter === value ? "default" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setFilter(value)}>
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {dataLoading ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Laddar planeringen…</CardContent></Card>
          ) : filteredRows.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Inga dagar matchar filtret.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredRows.map((row) => {
                const assignedName = row.assignedUserId ? cleanerNameById.get(row.assignedUserId) ?? "Okänd" : null;
                const interestedNames = row.interestedIds.map((id) => cleanerNameById.get(id) ?? "Okänd");
                const progressDone = row.tents.length > 0 && row.completed === row.tents.length;
                return (
                  <Card key={row.date} className={row.date === todayInStockholm() ? "ring-2 ring-primary/30" : undefined}>
                    <CardContent className="p-4">
                      <div className="grid gap-4 lg:grid-cols-[190px_1fr_280px] lg:items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold capitalize">{dateLabel(row.date, true)}</div>
                            {row.date === todayInStockholm() && <Badge>I dag</Badge>}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{relativeDate(row.date)} · {row.tents.length} tält</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {row.tents.map((tentId) => (
                              <Badge key={tentId} variant="outline">Tält {TENT_BY_ID[tentId]?.no ?? "?"}</Badge>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                          <div className="rounded-lg bg-muted/70 p-2.5"><div className="text-xs text-muted-foreground">Byten</div><div className="font-semibold">{row.arrivals}</div></div>
                          <div className="rounded-lg bg-muted/70 p-2.5"><div className="text-xs text-muted-foreground">Gäster</div><div className="font-semibold">{row.guests}</div></div>
                          <div className={`rounded-lg p-2.5 ${row.earlyCheckins > 0 ? "bg-amber-100 text-amber-950" : "bg-muted/70"}`}><div className="text-xs opacity-70">Tidiga</div><div className="font-semibold">{row.earlyCheckins}</div></div>
                          <div className={`rounded-lg p-2.5 ${progressDone ? "bg-emerald-100 text-emerald-950" : "bg-muted/70"}`}><div className="text-xs opacity-70">Klart</div><div className="flex items-center gap-1 font-semibold">{progressDone && <CheckCircle2 className="h-3.5 w-3.5" />}{row.completed}/{row.tents.length}</div></div>
                        </div>

                        <div className="space-y-2">
                          {row.selfClean ? (
                            <div className="flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-50 p-2.5 text-sm text-blue-950">
                              <UserRoundCheck className="h-4 w-4" />
                              <span className="font-medium">Egenstäd av Christoffer</span>
                            </div>
                          ) : (
                            <Select
                              value={row.assignedUserId ?? "none"}
                              onValueChange={(value) => void assignDay(row.date, value === "none" ? null : value)}
                              disabled={savingDate === row.date}
                            >
                              <SelectTrigger className={!assignedName ? "border-amber-500/60" : undefined}>
                                <SelectValue placeholder="Välj städare" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Ej tilldelad · default F</SelectItem>
                                {cleaners.map((cleaner) => (
                                  <SelectItem key={cleaner.user_id} value={cleaner.user_id}>{cleaner.display_name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant={row.selfClean ? "outline" : "secondary"}
                              size="sm"
                              className="flex-1"
                              disabled={savingDate === row.date}
                              onClick={() => void toggleSelfClean(row)}
                            >
                              {row.selfClean ? "Ta bort egenstäd" : "Jag städar"}
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link to="/cleaning" aria-label={`Öppna arbetsvyn för ${row.date}`}><ChevronRight className="h-4 w-4" /></Link>
                            </Button>
                          </div>

                          {interestedNames.length > 0 && (
                            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span>Intresserade: {interestedNames.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <Button asChild variant="outline" className="w-full sm:hidden">
          <Link to="/cleaning">Öppna personalens arbetsvy</Link>
        </Button>
      </main>
    </div>
  );
}
