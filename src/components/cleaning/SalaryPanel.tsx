import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ChevronLeft, ChevronRight, Info, CheckCircle2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { computeObBreakdown, OB_EVENING_RATE, OB_NIGHT_RATE, type TimeEntryLike } from "@/lib/ob-salary";

function firstOfMonth(y: number, m: number) { return new Date(y, m, 1); }
function lastOfMonth(y: number, m: number) { return new Date(y, m + 1, 0); }
function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function money(n: number) {
  return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 2 }).format(n);
}

type Profile = { hourly_rate: number | null; vacation_pct: number | null; display_name: string | null };
type Entry = TimeEntryLike & { id: string; hours: number | null; approved: boolean; paid_at: string | null };

export function SalaryPanel({ userId }: { userId: string }) {
  const now = new Date();
  const [month, setMonth] = useState<Date>(firstOfMonth(now.getFullYear(), now.getMonth()));
  const [monthEntries, setMonthEntries] = useState<Entry[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  const range = useMemo(() => ({
    from: fmtDate(month),
    to: fmtDate(lastOfMonth(month.getFullYear(), month.getMonth())),
  }), [month]);

  const payoutDate = useMemo(
    () => new Date(month.getFullYear(), month.getMonth() + 1, 25),
    [month],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [teRes, allRes, pRes] = await Promise.all([
        (supabase as any).from("time_entries")
          .select("id, started_at, ended_at, hours, approved, paid_at")
          .eq("user_id", userId)
          .gte("started_at", `${range.from}T00:00:00`)
          .lte("started_at", `${range.to}T23:59:59`)
          .order("started_at"),
        (supabase as any).from("time_entries")
          .select("id, started_at, ended_at, hours, approved, paid_at")
          .eq("user_id", userId)
          .not("ended_at", "is", null)
          .order("started_at", { ascending: false })
          .limit(2000),
        (supabase as any).from("cleaner_profiles")
          .select("hourly_rate, vacation_pct, display_name")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setLoading(false);
      if (teRes.error) { toast.error(teRes.error.message); return; }
      setMonthEntries((teRes.data ?? []) as Entry[]);
      setAllEntries((allRes.data ?? []) as Entry[]);
      setProfile((pRes.data ?? null) as Profile | null);
    })();
    return () => { cancelled = true; };
  }, [userId, range.from, range.to]);

  const rate = Number(profile?.hourly_rate ?? 0);
  const vacationPct = Number(profile?.vacation_pct ?? 0);

  const unpaidEntries = useMemo(() => monthEntries.filter((e) => !e.paid_at), [monthEntries]);
  const paidEntries = useMemo(() => monthEntries.filter((e) => !!e.paid_at), [monthEntries]);

  const breakdown = useMemo(() => computeObBreakdown(unpaidEntries), [unpaidEntries]);
  const baseGross = breakdown.totalHours * rate;
  const gross = baseGross + breakdown.obTotal;
  const vacationPay = gross * vacationPct / 100;
  const total = gross + vacationPay;

  // Lifetime totals
  const lifetimeAll = useMemo(() => computeObBreakdown(allEntries), [allEntries]);
  const lifetimePaid = useMemo(() => computeObBreakdown(allEntries.filter((e) => !!e.paid_at)), [allEntries]);
  const lifetimeGross = lifetimeAll.totalHours * rate + lifetimeAll.obTotal;
  const lifetimeTotal = lifetimeGross * (1 + vacationPct / 100);
  const paidGross = lifetimePaid.totalHours * rate + lifetimePaid.obTotal;
  const paidTotal = paidGross * (1 + vacationPct / 100);

  const monthLabel = month.toLocaleDateString("sv-SE", { month: "long", year: "numeric" });
  const allPaidThisMonth = monthEntries.length > 0 && unpaidEntries.length === 0;

  return (
    <div className="space-y-4">
      {/* Livstidskort */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-amber-800 font-semibold">
              <TrendingUp className="h-3.5 w-3.5" /> Totalt intjänat hos Go Glamping
            </div>
            <div className="text-2xl font-serif font-bold text-amber-900 mt-1">{money(lifetimeTotal)}</div>
            <div className="text-[11px] text-amber-800/80 mt-0.5">
              {lifetimeAll.totalHours.toFixed(2)} h · varav utbetalt {money(paidTotal)}
            </div>
          </div>
          <Wallet className="h-10 w-10 text-amber-600/40" />
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Min lön – aktuell period
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Intjänandemånad</div>
              <div className="font-medium capitalize">{monthLabel}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Räknar…</p>
          ) : monthEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Inga tidsposter denna månad.</p>
          ) : allPaidThisMonth ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <div className="font-medium text-emerald-900">Utbetald ✓</div>
              <div className="text-xs text-emerald-800/80 mt-1">
                Alla {paidEntries.length} tidsposter för {monthLabel} är utbetalda.
              </div>
              <div className="text-xs text-emerald-800/80 mt-2">
                Utbetalt belopp: {money(computeObBreakdown(paidEntries).totalHours * rate + computeObBreakdown(paidEntries).obTotal)}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Timmar (obetalt)</div>
                  <div className="text-2xl font-serif font-semibold">{breakdown.totalHours.toFixed(2)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Timlön</div>
                  <div className="text-2xl font-serif font-semibold">{money(rate)}</div>
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Grundlön ({breakdown.totalHours.toFixed(2)} h × {money(rate)})</span>
                  <span className="font-semibold">{money(baseGross)}</span>
                </div>

                {breakdown.eveningObHours > 0.001 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      OB kväll/helg ({breakdown.eveningObHours.toFixed(2)} h × {money(OB_EVENING_RATE)})
                      <Badge variant="outline" className="text-[9px]">+27,59/h</Badge>
                    </span>
                    <span className="font-semibold">{money(breakdown.obEveningAmount)}</span>
                  </div>
                )}

                {breakdown.nightObHours > 0.001 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      OB natt 01–06 ({breakdown.nightObHours.toFixed(2)} h × {money(OB_NIGHT_RATE)})
                      <Badge variant="outline" className="text-[9px]">+51,90/h</Badge>
                    </span>
                    <span className="font-semibold">{money(breakdown.obNightAmount)}</span>
                  </div>
                )}

                <div className="border-t pt-2 flex items-center justify-between text-sm">
                  <span>Bruttolön (inkl. OB)</span>
                  <span className="font-semibold">{money(gross)}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Semesterersättning ({vacationPct}%) – utbetalas på slutlön</span>
                  <span>{money(vacationPay)}</span>
                </div>

                <div className="border-t pt-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Att få ut</span>
                  <span className="text-lg font-serif font-bold text-primary">{money(total)}</span>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 border p-3 text-xs text-muted-foreground flex gap-2">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div>
                  OB enligt Gröna riksavtalet: +27,59 kr/h vardag efter 20.00, lör från 12.00, sön &amp; röda dagar hela dagen. Natt 01–06: sammanlagt +51,90 kr/h.
                </div>
              </div>

              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-900">
                <div className="text-[10px] uppercase tracking-wider font-semibold">Betalas ut</div>
                <div className="font-medium capitalize">
                  {payoutDate.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>
                <div className="text-xs mt-1">
                  Bruttolön ({money(gross)}) betalas ut den 25:e nästa månad. Semesterersättningen sparas och betalas ut på slutlönen.
                </div>
              </div>

              {paidEntries.length > 0 && (
                <div className="rounded-lg border border-dashed p-2 text-xs text-muted-foreground">
                  {paidEntries.length} tidsposter i {monthLabel} är redan utbetalda och räknas inte in ovan.
                </div>
              )}

              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">Visa tidsposter ({monthEntries.length})</summary>
                <div className="mt-2 space-y-1">
                  {monthEntries.map((e) => (
                    <div key={e.id} className="flex justify-between border-b py-1">
                      <span>
                        {new Date(e.started_at).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm", dateStyle: "short", timeStyle: "short" })}
                        {" – "}
                        {e.ended_at ? new Date(e.ended_at).toLocaleTimeString("sv-SE", { timeZone: "Europe/Stockholm", hour: "2-digit", minute: "2-digit" }) : "pågår"}
                      </span>
                      <span>
                        {Number(e.hours ?? 0).toFixed(2)} h
                        {e.paid_at && <Badge className="ml-1 h-4 text-[9px] bg-emerald-600">utbetald</Badge>}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
