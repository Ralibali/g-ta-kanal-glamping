import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Download, Check, X, CalendarDays, Clock } from "lucide-react";
import { toast } from "sonner";

type Availability = { id: string; user_id: string; work_date: string; note: string | null };
type TimeEntry = {
  id: string; user_id: string; started_at: string; ended_at: string | null;
  hours: number | null; note: string | null; source: string; approved: boolean;
};
type UserRow = { user_id: string; email: string | null };

function fmt(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map((v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
}

export function EmployeeManager() {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [users, setUsers] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [from, setFrom] = useState(() => {
    const d = new Date(today.getFullYear(), today.getMonth(), 1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return d.toISOString().slice(0, 10);
  });

  const load = async () => {
    setLoading(true);
    const [a, e] = await Promise.all([
      (supabase as any).from("employee_availability").select("id, user_id, work_date, note")
        .gte("work_date", from).lte("work_date", to).order("work_date"),
      (supabase as any).from("time_entries").select("id, user_id, started_at, ended_at, hours, note, source, approved")
        .gte("started_at", `${from}T00:00:00`).lte("started_at", `${to}T23:59:59`)
        .order("started_at", { ascending: false }),
    ]);
    const av = (a.data ?? []) as Availability[];
    const en = (e.data ?? []) as TimeEntry[];
    setAvailability(av);
    setEntries(en);

    // Try to enrich with emails from user_roles + a "profiles" lookup if any; fallback to short uid
    const uids = Array.from(new Set([...av.map((r) => r.user_id), ...en.map((r) => r.user_id)]));
    const map = new Map<string, string>();
    uids.forEach((id) => map.set(id, id.slice(0, 8)));
    setUsers(map);
    setLoading(false);
  };
  useEffect(() => { void load(); }, [from, to]);

  const approve = async (id: string, approved: boolean) => {
    const patch = approved
      ? { approved: true, approved_at: new Date().toISOString() }
      : { approved: false, approved_at: null };
    const { error } = await (supabase as any).from("time_entries").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(approved ? "Godkänd" : "Ångrad"); load(); }
  };

  const totalsByUser = useMemo(() => {
    const m = new Map<string, number>();
    entries.forEach((e) => m.set(e.user_id, (m.get(e.user_id) ?? 0) + Number(e.hours ?? 0)));
    return m;
  }, [entries]);

  const exportCsv = () => {
    const header = ["user", "started_at", "ended_at", "hours", "source", "approved", "note"];
    const rows = entries.map((e) => [
      users.get(e.user_id) ?? e.user_id,
      e.started_at,
      e.ended_at ?? "",
      e.hours ?? "",
      e.source,
      e.approved ? "yes" : "no",
      e.note ?? "",
    ]);
    const csv = toCsv([header, ...rows]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tidrapport_${from}_${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const availabilityByDate = useMemo(() => {
    const m = new Map<string, Availability[]>();
    availability.forEach((r) => {
      if (!m.has(r.work_date)) m.set(r.work_date, []);
      m.get(r.work_date)!.push(r);
    });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [availability]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-serif text-3xl font-bold">Anställda</h1>
          <p className="text-muted-foreground text-sm mt-1">Tillgänglighet, tidsrapporter och godkännande.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={load} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Uppdatera
          </Button>
          <Button onClick={exportCsv} size="sm">
            <Download className="mr-2 h-4 w-4" /> Exportera CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Period</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div>
            <Label>Från</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label>Till</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Tidsrapporter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {totalsByUser.size > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {Array.from(totalsByUser.entries()).map(([uid, h]) => (
                <Badge key={uid} variant="secondary">
                  {users.get(uid) ?? uid.slice(0, 8)}: {h.toFixed(2)} h
                </Badge>
              ))}
            </div>
          )}
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">Inga tidsposter i vald period.</p>
          ) : entries.map((e) => (
            <div key={e.id} className="border rounded p-3 flex items-start justify-between gap-3 text-sm">
              <div className="flex-1">
                <div className="font-medium">
                  {fmt(e.started_at)} → {e.ended_at ? fmt(e.ended_at) : <span className="text-primary">pågår</span>}
                </div>
                <div className="text-xs text-muted-foreground flex gap-2 mt-1 flex-wrap">
                  <span>{users.get(e.user_id) ?? e.user_id.slice(0, 8)}</span>
                  <span>•</span>
                  <span>{e.hours ? `${Number(e.hours).toFixed(2)} h` : "–"}</span>
                  <Badge variant="outline" className="text-[10px]">{e.source === "manual" ? "manuell" : "stämpel"}</Badge>
                  {e.approved && <Badge className="bg-green-600 text-[10px]">godkänd</Badge>}
                </div>
                {e.note && <p className="text-xs mt-1">{e.note}</p>}
              </div>
              <div className="flex gap-1">
                {e.ended_at && !e.approved && (
                  <Button size="sm" variant="outline" onClick={() => approve(e.id, true)}>
                    <Check className="h-4 w-4 mr-1" /> Godkänn
                  </Button>
                )}
                {e.approved && (
                  <Button size="sm" variant="ghost" onClick={() => approve(e.id, false)}>
                    <X className="h-4 w-4 mr-1" /> Ångra
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Tillgänglighet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {availabilityByDate.length === 0 ? (
            <p className="text-muted-foreground text-sm">Inga markerade dagar i vald period.</p>
          ) : availabilityByDate.map(([date, rows]) => (
            <div key={date} className="border rounded p-3 flex items-center justify-between">
              <span className="font-medium">{date}</span>
              <div className="flex gap-1 flex-wrap">
                {rows.map((r) => (
                  <Badge key={r.id} variant="outline">{users.get(r.user_id) ?? r.user_id.slice(0, 8)}</Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
