import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Download, Check, X, CalendarDays, Clock, User as UserIcon, Save } from "lucide-react";
import { toast } from "sonner";

type Availability = { id: string; user_id: string; work_date: string; note: string | null };
type TimeEntry = {
  id: string; user_id: string; started_at: string; ended_at: string | null;
  hours: number | null; note: string | null; source: string; approved: boolean;
};
type Profile = {
  user_id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
  hourly_rate: number | null;
  vacation_pct: number | null;
  active: boolean;
};

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
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRate, setSavingRate] = useState<string | null>(null);
  const [rateDraft, setRateDraft] = useState<Record<string, { hourly_rate: string; vacation_pct: string }>>({});

  const today = new Date();
  const [from, setFrom] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    const [a, e, p] = await Promise.all([
      (supabase as any).from("employee_availability").select("id, user_id, work_date, note")
        .gte("work_date", from).lte("work_date", to).order("work_date"),
      (supabase as any).from("time_entries").select("id, user_id, started_at, ended_at, hours, note, source, approved")
        .gte("started_at", `${from}T00:00:00`).lte("started_at", `${to}T23:59:59`)
        .order("started_at", { ascending: false }),
      (supabase as any).from("cleaner_profiles")
        .select("user_id, display_name, full_name, email, hourly_rate, vacation_pct, active")
        .order("sort_order"),
    ]);
    setAvailability((a.data ?? []) as Availability[]);
    setEntries((e.data ?? []) as TimeEntry[]);
    const profs = (p.data ?? []) as Profile[];
    setProfiles(profs);
    const draft: Record<string, { hourly_rate: string; vacation_pct: string }> = {};
    profs.forEach((pr) => {
      draft[pr.user_id] = {
        hourly_rate: String(pr.hourly_rate ?? 0),
        vacation_pct: String(pr.vacation_pct ?? 12),
      };
    });
    setRateDraft(draft);
    setLoading(false);
  };
  useEffect(() => { void load(); }, [from, to]);

  const nameFor = (uid: string) => {
    const p = profiles.find((x) => x.user_id === uid);
    return p?.display_name || p?.full_name || p?.email || uid.slice(0, 8);
  };

  const approve = async (id: string, approved: boolean) => {
    const patch = approved
      ? { approved: true, approved_at: new Date().toISOString() }
      : { approved: false, approved_at: null };
    const { error } = await (supabase as any).from("time_entries").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(approved ? "Godkänd" : "Ångrad"); load(); }
  };

  const saveRate = async (uid: string) => {
    setSavingRate(uid);
    const d = rateDraft[uid];
    const { error } = await (supabase as any).from("cleaner_profiles").update({
      hourly_rate: Number(d.hourly_rate) || 0,
      vacation_pct: Number(d.vacation_pct) || 0,
    }).eq("user_id", uid);
    setSavingRate(null);
    if (error) toast.error(error.message);
    else { toast.success("Sparat"); load(); }
  };

  const byUser = useMemo(() => {
    const ids = new Set<string>();
    profiles.forEach((p) => ids.add(p.user_id));
    entries.forEach((e) => ids.add(e.user_id));
    availability.forEach((a) => ids.add(a.user_id));
    return Array.from(ids).map((uid) => {
      const prof = profiles.find((p) => p.user_id === uid) ?? null;
      const uEntries = entries.filter((e) => e.user_id === uid);
      const uAvail = availability.filter((a) => a.user_id === uid).sort((a, b) => a.work_date.localeCompare(b.work_date));
      const hours = uEntries.reduce((s, e) => s + Number(e.hours ?? 0), 0);
      const rate = Number(prof?.hourly_rate ?? 0);
      const vac = Number(prof?.vacation_pct ?? 0);
      const gross = hours * rate;
      const vp = gross * vac / 100;
      return { uid, prof, entries: uEntries, availability: uAvail, hours, gross, vp, total: gross + vp };
    }).sort((a, b) => nameFor(a.uid).localeCompare(nameFor(b.uid)));
  }, [profiles, entries, availability]);

  const exportCsv = () => {
    const header = ["user", "started_at", "ended_at", "hours", "source", "approved", "note"];
    const rows = entries.map((e) => [
      nameFor(e.user_id),
      e.started_at, e.ended_at ?? "", e.hours ?? "", e.source,
      e.approved ? "yes" : "no", e.note ?? "",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-serif text-3xl font-bold">Anställda</h1>
          <p className="text-muted-foreground text-sm mt-1">Tillgänglighet, tidsrapporter, löneunderlag och lönesatser.</p>
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

      {byUser.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Inga anställda hittades.</CardContent></Card>
      )}

      {byUser.map(({ uid, prof, entries: uEntries, availability: uAvail, hours, gross, vp, total }) => (
        <Card key={uid}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-wrap">
              <UserIcon className="h-5 w-5" />
              <span>{nameFor(uid)}</span>
              {prof?.email && <span className="text-xs text-muted-foreground font-normal">{prof.email}</span>}
              {prof && !prof.active && <Badge variant="outline">inaktiv</Badge>}
              {!prof && <Badge variant="outline">saknar profil</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Lönesatser */}
            {prof && (
              <div className="rounded-lg border p-3 bg-muted/30">
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <Label className="text-xs">Timlön (SEK)</Label>
                    <Input
                      type="number" step="0.01" className="w-32"
                      value={rateDraft[uid]?.hourly_rate ?? ""}
                      onChange={(e) => setRateDraft((d) => ({ ...d, [uid]: { ...d[uid], hourly_rate: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Semester %</Label>
                    <Input
                      type="number" step="0.01" className="w-24"
                      value={rateDraft[uid]?.vacation_pct ?? ""}
                      onChange={(e) => setRateDraft((d) => ({ ...d, [uid]: { ...d[uid], vacation_pct: e.target.value } }))}
                    />
                  </div>
                  <Button size="sm" onClick={() => saveRate(uid)} disabled={savingRate === uid}>
                    <Save className="mr-2 h-4 w-4" /> Spara
                  </Button>
                  <div className="ml-auto text-sm space-x-3">
                    <Badge variant="secondary">{hours.toFixed(2)} h</Badge>
                    <Badge variant="secondary">Brutto {gross.toFixed(2)} kr</Badge>
                    <Badge variant="secondary">Semester {vp.toFixed(2)} kr</Badge>
                    <Badge>Totalt {total.toFixed(2)} kr</Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Tillgänglighet */}
            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Önskade dagar ({uAvail.length})
              </div>
              {uAvail.length === 0 ? (
                <p className="text-muted-foreground text-sm">Inga markerade dagar i vald period.</p>
              ) : (
                <div className="flex gap-1 flex-wrap">
                  {uAvail.map((r) => (
                    <Badge key={r.id} variant="outline" title={r.note ?? ""}>{r.work_date}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Tidsposter */}
            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Tidsposter ({uEntries.length})
              </div>
              {uEntries.length === 0 ? (
                <p className="text-muted-foreground text-sm">Inga tidsposter i vald period.</p>
              ) : (
                <div className="space-y-2">
                  {uEntries.map((e) => (
                    <div key={e.id} className="border rounded p-2 flex items-start justify-between gap-3 text-sm">
                      <div className="flex-1">
                        <div className="font-medium">
                          {fmt(e.started_at)} → {e.ended_at ? fmt(e.ended_at) : <span className="text-primary">pågår</span>}
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-2 mt-1 flex-wrap">
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
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
