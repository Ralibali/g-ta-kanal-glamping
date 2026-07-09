import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCleaner } from "@/hooks/useCleaner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, LogOut, Play, Square, PencilLine, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const CLEANER_EMAIL = "stadare@goglampingsweden.se";

type Availability = { id: string; work_date: string; note: string | null };
type TimeEntry = {
  id: string;
  started_at: string;
  ended_at: string | null;
  hours: number | null;
  note: string | null;
  source: string;
  approved: boolean;
};

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseDate(s: string): Date {
  return new Date(`${s}T12:00:00`);
}
function fmtDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function diffHours(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(0, Math.round((ms / 3_600_000) * 100) / 100);
}

function LoginForm() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: CLEANER_EMAIL, password });
    setBusy(false);
    if (error) toast.error("Fel lösenord");
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Sparkles className="h-8 w-8 mx-auto text-primary" />
          <CardTitle>Logga in</CardTitle>
          <p className="text-sm text-muted-foreground">För anställda</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={login} className="space-y-3">
            <div>
              <Label>Lösenord</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>Logga in</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Employee() {
  const { user, isCleaner, loading, signOut } = useCleaner();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [busy, setBusy] = useState(false);

  // Manual entry form
  const [manualDate, setManualDate] = useState(fmtDate(new Date()));
  const [manualStart, setManualStart] = useState("08:00");
  const [manualEnd, setManualEnd] = useState("12:00");
  const [manualNote, setManualNote] = useState("");

  const load = async () => {
    if (!user) return;
    const [a, e] = await Promise.all([
      (supabase as any).from("employee_availability").select("id, work_date, note").eq("user_id", user.id).order("work_date"),
      (supabase as any).from("time_entries").select("id, started_at, ended_at, hours, note, source, approved").eq("user_id", user.id).order("started_at", { ascending: false }).limit(100),
    ]);
    setAvailability((a.data ?? []) as Availability[]);
    setEntries((e.data ?? []) as TimeEntry[]);
  };

  useEffect(() => { if (user && isCleaner) void load(); }, [user, isCleaner]);

  const availableDates = useMemo(() => availability.map((r) => parseDate(r.work_date)), [availability]);
  const activeEntry = useMemo(() => entries.find((x) => !x.ended_at) ?? null, [entries]);

  const toggleAvailability = async (dates: Date[] | undefined) => {
    if (!user || !dates) return;
    const wanted = new Set(dates.map(fmtDate));
    const current = new Set(availability.map((r) => r.work_date));
    const toAdd = [...wanted].filter((d) => !current.has(d));
    const toRemove = availability.filter((r) => !wanted.has(r.work_date));
    setBusy(true);
    try {
      if (toAdd.length) {
        const { error } = await (supabase as any)
          .from("employee_availability")
          .insert(toAdd.map((d) => ({ user_id: user.id, work_date: d })));
        if (error) throw error;
      }
      if (toRemove.length) {
        const { error } = await (supabase as any)
          .from("employee_availability")
          .delete()
          .in("id", toRemove.map((r) => r.id));
        if (error) throw error;
      }
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Kunde inte spara");
    } finally {
      setBusy(false);
    }
  };

  const clockIn = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await (supabase as any).from("time_entries").insert({
      user_id: user.id,
      started_at: new Date().toISOString(),
      source: "clock",
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Instämplad"); await load(); }
  };

  const clockOut = async () => {
    if (!user || !activeEntry) return;
    setBusy(true);
    const endedAt = new Date().toISOString();
    const hours = diffHours(activeEntry.started_at, endedAt);
    const { error } = await (supabase as any)
      .from("time_entries")
      .update({ ended_at: endedAt, hours })
      .eq("id", activeEntry.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(`Utstämplad – ${hours} h`); await load(); }
  };

  const saveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const startIso = new Date(`${manualDate}T${manualStart}:00`).toISOString();
    const endIso = new Date(`${manualDate}T${manualEnd}:00`).toISOString();
    if (new Date(endIso) <= new Date(startIso)) {
      toast.error("Sluttid måste vara efter starttid");
      return;
    }
    const hours = diffHours(startIso, endIso);
    setBusy(true);
    const { error } = await (supabase as any).from("time_entries").insert({
      user_id: user.id,
      started_at: startIso,
      ended_at: endIso,
      hours,
      note: manualNote.trim() || null,
      source: "manual",
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(`Sparade ${hours} h`); setManualNote(""); await load(); }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Ta bort tidsposten?")) return;
    const { error } = await (supabase as any).from("time_entries").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Borttagen"); await load(); }
  };

  const totalHours = useMemo(
    () => entries.reduce((sum, e) => sum + Number(e.hours ?? 0), 0),
    [entries],
  );
  const monthHours = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return entries.reduce((sum, e) => {
      const d = new Date(e.started_at);
      if (d.getFullYear() === y && d.getMonth() === m) return sum + Number(e.hours ?? 0);
      return sum;
    }, 0);
  }, [entries]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">…</div>;
  if (!user) return <LoginForm />;
  if (!isCleaner) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-3 text-center">
      <p>Du har inte behörighet.</p>
      <Button variant="outline" onClick={signOut}>Logga ut</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto p-4 flex items-center justify-between gap-3">
          <h1 className="font-serif text-lg">Mitt jobb</h1>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4 pb-16">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Denna månad</div>
              <div className="text-2xl font-bold">{monthHours.toFixed(2)} h</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Totalt (100 senaste)</div>
              <div className="text-2xl font-bold">{totalHours.toFixed(2)} h</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="clock">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="clock"><Clock className="h-4 w-4 mr-1" />Stämpla</TabsTrigger>
            <TabsTrigger value="manual"><PencilLine className="h-4 w-4 mr-1" />Manuell</TabsTrigger>
            <TabsTrigger value="schedule"><CalendarDays className="h-4 w-4 mr-1" />Schema</TabsTrigger>
            <TabsTrigger value="log">Loggar</TabsTrigger>
          </TabsList>

          <TabsContent value="clock" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Stämpla in/ut</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {activeEntry ? (
                  <>
                    <div className="rounded border p-3 bg-primary/5">
                      <div className="text-xs text-muted-foreground">Instämplad sedan</div>
                      <div className="font-medium">{fmtDateTimeLocal(activeEntry.started_at)}</div>
                    </div>
                    <Button onClick={clockOut} disabled={busy} className="w-full" size="lg">
                      <Square className="h-4 w-4 mr-2" /> Stämpla ut
                    </Button>
                  </>
                ) : (
                  <Button onClick={clockIn} disabled={busy} className="w-full" size="lg">
                    <Play className="h-4 w-4 mr-2" /> Stämpla in nu
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Fyll i timmar i efterhand</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={saveManual} className="space-y-3">
                  <div>
                    <Label>Datum</Label>
                    <Input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Start</Label>
                      <Input type="time" value={manualStart} onChange={(e) => setManualStart(e.target.value)} required />
                    </div>
                    <div>
                      <Label>Slut</Label>
                      <Input type="time" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} required />
                    </div>
                  </div>
                  <div>
                    <Label>Anteckning (valfritt)</Label>
                    <Textarea value={manualNote} onChange={(e) => setManualNote(e.target.value)} rows={3} placeholder="Vad gjorde du?" />
                  </div>
                  <Button type="submit" disabled={busy} className="w-full">Spara</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vilka dagar kan du jobba?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Klicka på datum för att markera/avmarkera.</p>
                <div className="flex justify-center">
                  <Calendar
                    mode="multiple"
                    selected={availableDates}
                    onSelect={(d) => void toggleAvailability(d as Date[] | undefined)}
                    weekStartsOn={1}
                    className="pointer-events-auto"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {availability.length} valda dagar
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="log" className="space-y-2">
            {entries.length === 0 ? (
              <p className="text-muted-foreground text-sm p-4">Inga tidsposter ännu.</p>
            ) : entries.map((e) => (
              <div key={e.id} className="border rounded p-3 flex items-start justify-between gap-3 text-sm">
                <div className="flex-1">
                  <div className="font-medium">
                    {fmtDateTimeLocal(e.started_at)} → {e.ended_at ? fmtDateTimeLocal(e.ended_at) : <span className="text-primary">pågår</span>}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                    <span>{e.hours ? `${Number(e.hours).toFixed(2)} h` : "–"}</span>
                    <Badge variant="outline" className="text-[10px]">{e.source === "manual" ? "manuell" : "stämpel"}</Badge>
                    {e.approved && <Badge className="bg-green-600 text-[10px]">godkänd</Badge>}
                  </div>
                  {e.note && <p className="text-xs mt-1">{e.note}</p>}
                </div>
                {!e.approved && (
                  <Button size="icon" variant="ghost" onClick={() => deleteEntry(e.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
