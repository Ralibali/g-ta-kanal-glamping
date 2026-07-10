import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type Salary = {
  hours: number;
  hourly_rate: number;
  vacation_pct: number;
  gross: number;
  vacation_pay: number;
  total: number;
};

function firstOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

function lastOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0);
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function money(n: number) {
  return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 2 }).format(n);
}

export function SalaryPanel({ userId }: { userId: string }) {
  const now = new Date();
  const [month, setMonth] = useState<Date>(firstOfMonth(now.getFullYear(), now.getMonth()));
  const [data, setData] = useState<Salary | null>(null);
  const [loading, setLoading] = useState(false);

  const range = useMemo(() => {
    const from = fmtDate(month);
    const to = fmtDate(lastOfMonth(month.getFullYear(), month.getMonth()));
    return { from, to };
  }, [month]);

  const payoutDate = useMemo(() => {
    // Utbetalning den 25:e månaden EFTER intjänandemånaden
    const d = new Date(month.getFullYear(), month.getMonth() + 1, 25);
    return d;
  }, [month]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: rows, error } = await (supabase as any).rpc("get_cleaner_salary", {
        p_user_id: userId,
        p_from: range.from,
        p_to: range.to,
      });
      if (cancelled) return;
      setLoading(false);
      if (error) {
        toast.error(error.message);
        setData(null);
        return;
      }
      const row = Array.isArray(rows) ? rows[0] : rows;
      setData(row ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, range.from, range.to]);

  const monthLabel = month.toLocaleDateString("sv-SE", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Min lön
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
          ) : !data ? (
            <p className="text-sm text-muted-foreground text-center py-4">Ingen lönedata.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Timmar</div>
                  <div className="text-2xl font-serif font-semibold">{Number(data.hours).toFixed(2)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Timlön</div>
                  <div className="text-2xl font-serif font-semibold">{money(Number(data.hourly_rate))}</div>
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Bruttolön ({Number(data.hours).toFixed(2)} h × {money(Number(data.hourly_rate))})</span>
                  <span className="font-semibold">{money(Number(data.gross))}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Semesterersättning ({Number(data.vacation_pct)}%) – utbetalas på slutlön</span>
                  <span>{money(Number(data.vacation_pay))}</span>
                </div>
                <div className="border-t pt-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Total intjänad</span>
                  <span className="text-lg font-serif font-bold text-primary">{money(Number(data.total))}</span>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-900">
                <div className="text-[10px] uppercase tracking-wider font-semibold">Betalas ut</div>
                <div className="font-medium capitalize">
                  {payoutDate.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>
                <div className="text-xs mt-1">
                  Bruttolön ({money(Number(data.gross))}) betalas ut den 25:e nästa månad. Semesterersättningen sparas och betalas ut på slutlönen.
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
