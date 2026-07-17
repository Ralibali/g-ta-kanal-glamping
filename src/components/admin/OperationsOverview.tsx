import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, CreditCard,
  LogIn, LogOut, RefreshCw, Sparkles, Sunrise, UserRound, Users, Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TENT_BY_ID, todayInStockholm } from "@/cleaning/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

const svDay = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });

type Stay = {
  booking_number: string;
  tent_id: string;
  checkin_date: string;
  checkout_date: string;
  guests: number | null;
  children: number | null;
  guest_name: string | null;
};

type Session = { tent_id: string; cleaning_date: string; status: string };
type Order = {
  id: string;
  status: string;
  total_sek: number;
  created_at: string;
  addons: { slug: string; name_sv: string } | null;
  bookings: { guest_name: string | null; booking_number: string; checkin_date: string } | null;
};

export function OperationsOverview() {
  const today = todayInStockholm();
  const tomorrow = addDays(today, 1);
  const weekAgo = addDays(today, -7);
  const weekAhead = addDays(today, 7);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-operations-overview", today],
    refetchInterval: 60_000,
    queryFn: async () => {
      const [staysRes, sessionsRes, assignRes, selfRes, ordersRes, earlyRes, namesRes] = await Promise.all([
        (supabase as any)
          .from("tent_stays")
          .select("booking_number, tent_id, checkin_date, checkout_date, guests, children, guest_name")
          .or(
            `and(checkin_date.lte.${weekAhead},checkout_date.gt.${weekAgo}),and(checkin_date.gte.${weekAgo},checkin_date.lte.${weekAhead})`,
          ),
        (supabase as any)
          .from("cleaning_sessions")
          .select("tent_id, cleaning_date, status")
          .gte("cleaning_date", weekAgo)
          .lte("cleaning_date", weekAhead),
        (supabase as any)
          .from("cleaning_assignments")
          .select("work_date, assigned_user_id")
          .gte("work_date", today)
          .lte("work_date", weekAhead),
        (supabase as any)
          .from("self_clean_dates")
          .select("date")
          .gte("date", weekAgo)
          .lte("date", weekAhead),
        (supabase as any)
          .from("addon_orders")
          .select("id, status, total_sek, created_at, addons:addon_id(slug, name_sv), bookings:booking_id(guest_name, booking_number, checkin_date)")
          .in("status", ["requested", "pending"])
          .order("created_at", { ascending: false })
          .limit(50),
        (supabase as any)
          .from("early_checkin_flags")
          .select("tent_id, date")
          .eq("active", true)
          .gte("date", today)
          .lte("date", tomorrow),
        (supabase as any).rpc("list_cleaner_display_names"),
      ]);
      for (const res of [staysRes, sessionsRes, assignRes, selfRes, ordersRes, earlyRes, namesRes]) {
        if (res.error) console.error("OperationsOverview query failed", res.error);
      }
      return {
        stays: (staysRes.data ?? []) as Stay[],
        sessions: (sessionsRes.data ?? []) as Session[],
        assignments: (assignRes.data ?? []) as { work_date: string; assigned_user_id: string }[],
        selfClean: new Set(((selfRes.data ?? []) as { date: string }[]).map((r) => r.date)),
        orders: (ordersRes.data ?? []) as Order[],
        early: (earlyRes.data ?? []) as { tent_id: string; date: string }[],
        cleanerNames: new Map<string, string>(
          ((namesRes.data ?? []) as { user_id: string; display_name: string }[]).map((r) => [r.user_id, r.display_name]),
        ),
      };
    },
  });

  const model = useMemo(() => {
    const stays = data?.stays ?? [];
    const sessions = data?.sessions ?? [];
    const selfClean = data?.selfClean ?? new Set<string>();
    const doneKeys = new Set(
      sessions.filter((s) => s.status === "completed").map((s) => `${s.tent_id}|${s.cleaning_date}`),
    );
    const sessionByKey = new Map(sessions.map((s) => [`${s.tent_id}|${s.cleaning_date}`, s]));

    const arrivalsToday = stays.filter((s) => s.checkin_date === today);
    const departuresToday = stays.filter((s) => s.checkout_date === today);
    const onSite = stays.filter((s) => s.checkin_date <= today && s.checkout_date > today);
    const guestsOnSite = onSite.reduce((sum, s) => sum + Number(s.guests ?? 0), 0);

    const overdue = stays.filter(
      (s) => s.checkout_date < today && !doneKeys.has(`${s.tent_id}|${s.checkout_date}`) && !selfClean.has(s.checkout_date),
    );

    // Fastnade kortbetalningar: gästen nådde Stripe men betalningen bekräftades aldrig
    const stuckCutoff = Date.now() - 30 * 60 * 1000;
    const swishWaiting = (data?.orders ?? []).filter((o) => o.status === "requested");
    const stripeStuck = (data?.orders ?? []).filter(
      (o) => o.status === "pending" && new Date(o.created_at).getTime() < stuckCutoff,
    );

    // Obemannade städdagar kommande veckan
    const assignmentByDate = new Map((data?.assignments ?? []).map((a) => [a.work_date, a.assigned_user_id]));
    const workDays = new Set<string>();
    for (const s of stays) if (s.checkout_date >= today && s.checkout_date <= weekAhead) workDays.add(s.checkout_date);
    const unstaffed = Array.from(workDays).filter((d) => !assignmentByDate.has(d) && !selfClean.has(d)).sort();

    const upcoming = stays
      .filter((s) => s.checkin_date >= today && s.checkin_date <= weekAhead)
      .sort((a, b) => a.checkin_date.localeCompare(b.checkin_date))
      .slice(0, 12);

    const earlyToday = (data?.early ?? []).filter((e) => e.date === today).length;
    const earlyTomorrow = (data?.early ?? []).filter((e) => e.date === tomorrow).length;

    const todayCleanerId = assignmentByDate.get(today) ?? null;
    const todayCleaner = todayCleanerId ? data?.cleanerNames.get(todayCleanerId) ?? "Tilldelad" : null;

    return {
      arrivalsToday, departuresToday, onSite, guestsOnSite, overdue, swishWaiting, stripeStuck,
      unstaffed, upcoming, earlyToday, earlyTomorrow, todayCleaner, sessionByKey, doneKeys,
      selfCleanToday: selfClean.has(today),
    };
  }, [data, today, tomorrow, weekAhead]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  const doneToday = model.departuresToday.filter((s) => model.doneKeys.has(`${s.tent_id}|${today}`)).length;
  const swishSum = model.swishWaiting.reduce((sum, o) => sum + Number(o.total_sek ?? 0), 0);
  const hasAlerts = model.overdue.length > 0 || model.swishWaiting.length > 0 || model.stripeStuck.length > 0;

  const kpis = [
    { icon: LogIn, label: "Ankomster idag", value: model.arrivalsToday.length, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { icon: LogOut, label: "Avresor idag", value: model.departuresToday.length, color: "text-amber-600", bg: "bg-amber-500/10" },
    { icon: Users, label: "Gäster på plats", value: model.guestsOnSite, color: "text-primary", bg: "bg-primary/10" },
    {
      icon: Sparkles, label: "Städat idag", value: `${doneToday}/${model.departuresToday.length}`,
      color: model.departuresToday.length === 0 || doneToday === model.departuresToday.length ? "text-emerald-600" : "text-amber-600",
      bg: model.departuresToday.length === 0 || doneToday === model.departuresToday.length ? "bg-emerald-500/10" : "bg-amber-500/10",
    },
    {
      icon: AlertTriangle, label: "Försenade städningar", value: model.overdue.length,
      color: model.overdue.length > 0 ? "text-red-600" : "text-emerald-600",
      bg: model.overdue.length > 0 ? "bg-red-500/10" : "bg-emerald-500/10",
    },
    {
      icon: Wallet, label: "Swish att bekräfta", value: model.swishWaiting.length,
      color: model.swishWaiting.length > 0 ? "text-orange-600" : "text-emerald-600",
      bg: model.swishWaiting.length > 0 ? "bg-orange-500/10" : "bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold font-serif">Driftöversikt</h2>
          <p className="text-sm text-muted-foreground capitalize">{svDay(today)} · uppdateras automatiskt var minut</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Uppdatera
        </Button>
      </div>

      {/* Åtgärder som inte kan vänta */}
      {hasAlerts && (
        <div className="space-y-2">
          {model.overdue.length > 0 && (
            <Card className="border-red-500/50 bg-red-500/5">
              <CardContent className="flex flex-wrap items-center gap-3 p-3.5">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                <div className="min-w-[220px] flex-1">
                  <div className="text-sm font-semibold text-red-800 dark:text-red-300">
                    {model.overdue.length} tält inte utstädat efter avresa
                  </div>
                  <div className="text-xs text-red-700/80 dark:text-red-300/70">
                    Tälten måste vara redo för nya bokningar — åtgärda direkt i städportalen.
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {model.overdue.map((s) => (
                    <Badge key={`${s.tent_id}|${s.checkout_date}`} variant="destructive">
                      {TENT_BY_ID[s.tent_id]?.name ?? s.tent_id} · {s.checkout_date}
                    </Badge>
                  ))}
                </div>
                <Button asChild size="sm" variant="destructive">
                  <Link to="/stad">Öppna <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {model.swishWaiting.length > 0 && (
            <Card className="border-orange-500/50 bg-orange-500/5">
              <CardContent className="flex flex-wrap items-center gap-3 p-3.5">
                <Wallet className="h-5 w-5 shrink-0 text-orange-600" />
                <div className="min-w-[220px] flex-1">
                  <div className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                    {model.swishWaiting.length} Swish-order{model.swishWaiting.length > 1 ? "ar" : ""} väntar på bekräftelse ({swishSum} kr)
                  </div>
                  <div className="text-xs text-orange-700/80 dark:text-orange-300/70">
                    Kontrollera Swish-appen och bekräfta betalningarna.
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {model.swishWaiting.slice(0, 4).map((o) => (
                    <Badge key={o.id} variant="outline" className="border-orange-500/60 text-orange-700 dark:text-orange-300">
                      {o.bookings?.guest_name ?? o.bookings?.booking_number ?? "Gäst"} · {o.total_sek} kr
                    </Badge>
                  ))}
                </div>
                <Button asChild size="sm" variant="outline" className="border-orange-500/60">
                  <Link to="/admin/addon-orders">Bekräfta <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {model.stripeStuck.length > 0 && (
            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardContent className="flex flex-wrap items-center gap-3 p-3.5">
                <CreditCard className="h-5 w-5 shrink-0 text-amber-600" />
                <div className="min-w-[220px] flex-1">
                  <div className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    {model.stripeStuck.length} kortbetalning{model.stripeStuck.length > 1 ? "ar" : ""} har fastnat
                  </div>
                  <div className="text-xs text-amber-700/80 dark:text-amber-300/70">
                    Gästen öppnade Stripe för över 30 min sedan utan att betalningen bekräftats. Kontrollera i Stripe och makulera vid behov.
                  </div>
                </div>
                <Button asChild size="sm" variant="outline" className="border-amber-500/60">
                  <Link to="/admin/addon-orders">Granska <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* KPI-kort */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label} className="border-border/50">
            <CardContent className="p-3 text-center">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mx-auto mb-1`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="text-xl font-semibold text-foreground">{value}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Dagens städning */}
        <Card className="border-border/50">
          <CardHeader className="px-4 py-3">
            <CardTitle className="font-serif text-sm flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Dagens städning
                {model.earlyToday > 0 && (
                  <Badge className="bg-amber-500 text-white text-[10px]">
                    <Sunrise className="mr-1 h-3 w-3" /> {model.earlyToday} tidig{model.earlyToday > 1 ? "a" : ""} incheckning{model.earlyToday > 1 ? "ar" : ""}
                  </Badge>
                )}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {model.selfCleanToday ? "🧹 Egenstäd" : model.todayCleaner ? <>🧹 {model.todayCleaner}</> : "Ej tilldelad"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {model.departuresToday.length === 0 && model.arrivalsToday.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Inga avresor eller ankomster idag.</p>
            ) : (
              <>
                {model.departuresToday.map((s) => {
                  const session = model.sessionByKey.get(`${s.tent_id}|${today}`);
                  const done = session?.status === "completed";
                  const started = !!session && !done;
                  const turnover = model.arrivalsToday.some((a) => a.tent_id === s.tent_id);
                  return (
                    <div key={`dep-${s.tent_id}`} className="flex items-center gap-2 text-xs">
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ml-0.5 mr-0.5 ${started ? "bg-amber-500" : "bg-red-500"}`} />
                      )}
                      <span className="font-medium">{TENT_BY_ID[s.tent_id]?.name ?? s.tent_id}</span>
                      {turnover && <Badge className="bg-amber-500 text-white text-[9px]">Byte</Badge>}
                      <span className="text-muted-foreground ml-auto">
                        {done ? "Klar" : started ? "Pågår" : "Ej påbörjad"}
                      </span>
                    </div>
                  );
                })}
                {model.arrivalsToday
                  .filter((a) => !model.departuresToday.some((d) => d.tent_id === a.tent_id))
                  .map((a) => (
                    <div key={`arr-${a.tent_id}`} className="flex items-center gap-2 text-xs">
                      <LogIn className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="font-medium">{TENT_BY_ID[a.tent_id]?.name ?? a.tent_id}</span>
                      <span className="text-muted-foreground">Ny ankomst · {Number(a.guests ?? 0)} gäster</span>
                      <span className="text-muted-foreground ml-auto">Inget byte</span>
                    </div>
                  ))}
              </>
            )}
            <div className="pt-1">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/stad">Öppna städportalen <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Kommande ankomster */}
        <Card className="border-border/50">
          <CardHeader className="px-4 py-3">
            <CardTitle className="font-serif text-sm flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Kommande ankomster (7 dagar)
              </span>
              {model.earlyTomorrow > 0 && (
                <Badge variant="outline" className="border-amber-500/60 text-amber-700 text-[10px]">
                  <Sunrise className="mr-1 h-3 w-3" /> {model.earlyTomorrow} tidig{model.earlyTomorrow > 1 ? "a" : ""} imorgon
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {model.upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Inga ankomster inbokade kommande veckan.</p>
            ) : (
              <div className="space-y-1.5">
                {model.upcoming.map((s) => (
                  <div key={`${s.booking_number}|${s.tent_id}`} className="flex items-center gap-2 text-xs">
                    <span className="w-20 shrink-0 font-medium capitalize">{svDay(s.checkin_date)}</span>
                    <span className="truncate">{s.guest_name ?? "Gäst"}</span>
                    <span className="text-muted-foreground ml-auto shrink-0">
                      {TENT_BY_ID[s.tent_id]?.name ?? s.tent_id} · {Number(s.guests ?? 0)} gäster
                    </span>
                  </div>
                ))}
              </div>
            )}
            {model.unstaffed.length > 0 && (
              <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-2.5 text-xs">
                <span className="font-medium text-amber-800 dark:text-amber-300">
                  <UserRound className="mr-1 inline h-3.5 w-3.5" />
                  {model.unstaffed.length} städdag{model.unstaffed.length > 1 ? "ar" : ""} utan tilldelad städare:
                </span>{" "}
                <span className="text-muted-foreground">{model.unstaffed.slice(0, 4).map(svDay).join(", ")}{model.unstaffed.length > 4 ? "…" : ""}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Snabblänkar */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><Link to="/stad"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Städportal</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/admin/bookings"><CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Bokningar & import</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/admin/addon-orders"><Wallet className="mr-1.5 h-3.5 w-3.5" /> Tillvalsordrar</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/admin/checkins"><LogIn className="mr-1.5 h-3.5 w-3.5" /> Incheckningar</Link></Button>
      </div>
    </div>
  );
}
