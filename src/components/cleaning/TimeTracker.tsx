import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Play, Square, Plus, Trash2, CircleCheck } from "lucide-react";
import { toast } from "sonner";

type Entry = {
  id: string;
  started_at: string;
  ended_at: string | null;
  hours: number | null;
  note: string | null;
  source: string;
};

function localDateValue(): string {
  return new Date().toLocaleDateString("sv-CA");
}

function hoursBetween(start: string, end: string): number {
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000);
}

function readableDuration(hours: number): string {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (wholeHours === 0) return `${minutes} min`;
  if (minutes === 0) return `${wholeHours} h`;
  return `${wholeHours} h ${minutes} min`;
}

export function TimeTracker({ userId }: { userId: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => new Date().toISOString());
  const [manualDate, setManualDate] = useState(localDateValue);
  const [manualHours, setManualHours] = useState("");
  const [manualNote, setManualNote] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("time_entries")
      .select("id, started_at, ended_at, hours, note, source")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(50);
    if (error) toast.error(error.message);
    setEntries((data ?? []) as Entry[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [userId]);

  const open = entries.find((entry) => entry.ended_at == null);

  useEffect(() => {
    if (!open) return;
    setNow(new Date().toISOString());
    const timer = window.setInterval(() => setNow(new Date().toISOString()), 30_000);
    return () => window.clearInterval(timer);
  }, [open?.id]);

  const clockIn = async () => {
    if (open || busy) return;
    setBusy(true);
    const { error } = await (supabase as any)
      .from("time_entries")
      .insert({ user_id: userId, started_at: new Date().toISOString(), source: "clock" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Du är instämplad");
    await load();
  };

  const clockOut = async () => {
    if (!open || busy) return;
    setBusy(true);
    const endedAt = new Date().toISOString();
    const hours = Number(hoursBetween(open.started_at, endedAt).toFixed(2));
    const { error } = await (supabase as any)
      .from("time_entries")
      .update({ ended_at: endedAt, hours })
      .eq("id", open.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Utstämplad – ${readableDuration(hours)}`);
    await load();
  };

  const addManual = async () => {
    const hours = Number(manualHours.replace(",", "."));
    if (!manualDate || !Number.isFinite(hours) || hours <= 0 || hours > 24) {
      toast.error("Ange ett datum och antal timmar mellan 0 och 24");
      return;
    }

    setBusy(true);
    const startedAt = new Date(`${manualDate}T09:00:00`).toISOString();
    const endedAt = new Date(new Date(startedAt).getTime() + hours * 3_600_000).toISOString();
    const { error } = await (supabase as any).from("time_entries").insert({
      user_id: userId,
      started_at: startedAt,
      ended_at: endedAt,
      hours,
      source: "manual",
      note: manualNote.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);

    setManualHours("");
    setManualNote("");
    toast.success(`Tid tillagd – ${readableDuration(hours)}`);
    await load();
  };

  const removeEntry = async (id: string) => {
    if (!window.confirm("Ta bort denna tidpost?")) return;
    const { error } = await (supabase as any).from("time_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Tidposten är borttagen");
    await load();
  };

  return (
    <div className="space-y-4">
      <Card className={open ? "border-2 border-emerald-500/60 bg-emerald-500/5" : undefined}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" aria-hidden="true" /> Arbetstid
          </CardTitle>
        </CardHeader>
        <CardContent>
          {open ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-600 p-4 text-white text-center">
                <CircleCheck className="mx-auto h-7 w-7 mb-1" aria-hidden="true" />
                <p className="text-sm font-medium">Du är instämplad</p>
                <p className="text-3xl font-bold mt-1">{readableDuration(hoursBetween(open.started_at, now))}</p>
                <p className="text-xs text-white/80 mt-1">
                  Start {new Date(open.started_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <Button className="w-full min-h-12" variant="destructive" size="lg" onClick={clockOut} disabled={busy}>
                <Square className="h-4 w-4 mr-2" aria-hidden="true" />
                {busy ? "Sparar…" : "Stämpla ut"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Stämpla in när du börjar arbeta och ut när du är klar.
              </p>
              <Button className="w-full min-h-14 text-base" size="lg" onClick={clockIn} disabled={busy}>
                <Play className="h-5 w-5 mr-2" aria-hidden="true" />
                {busy ? "Sparar…" : "Stämpla in nu"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" /> Glömt att stämpla?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Fyll i arbetstiden i efterhand. Exempel: 3,5 timmar.</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="manual-date" className="text-xs">Datum</Label>
              <Input id="manual-date" type="date" value={manualDate} onChange={(event) => setManualDate(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="manual-hours" className="text-xs">Antal timmar</Label>
              <Input
                id="manual-hours"
                inputMode="decimal"
                placeholder="t.ex. 3,5"
                value={manualHours}
                onChange={(event) => setManualHours(event.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="manual-note" className="text-xs">Vad gjorde du? (valfritt)</Label>
            <Textarea
              id="manual-note"
              rows={2}
              value={manualNote}
              onChange={(event) => setManualNote(event.target.value)}
              placeholder="t.ex. Städade tält 2 och 3"
            />
          </div>
          <Button variant="secondary" className="w-full min-h-11" onClick={addManual} disabled={busy || !manualHours}>
            Spara arbetstid
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Senaste arbetspassen</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Laddar…</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga arbetspass registrerade ännu.</p>
          ) : (
            <ul className="divide-y">
              {entries.map((entry) => {
                const start = new Date(entry.started_at);
                const hours = entry.hours ?? (entry.ended_at ? hoursBetween(entry.started_at, entry.ended_at) : hoursBetween(entry.started_at, now));
                return (
                  <li key={entry.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium capitalize">
                        {start.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })}
                        {entry.source === "manual" && <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">manuell</span>}
                        {!entry.ended_at && <span className="ml-2 text-[10px] uppercase tracking-wider text-emerald-700">pågår</span>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {start.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                        {entry.ended_at && ` – ${new Date(entry.ended_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`}
                        {entry.note ? ` • ${entry.note}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-semibold">{readableDuration(hours)}</span>
                      {entry.ended_at && (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Ta bort tidpost"
                          onClick={() => void removeEntry(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
