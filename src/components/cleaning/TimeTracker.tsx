import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Play, Square, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Entry = {
  id: string;
  started_at: string;
  ended_at: string | null;
  hours: number | null;
  note: string | null;
  source: string;
};

function hoursBetween(a: string, b: string | null): number {
  if (!b) return 0;
  return (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;
}

export function TimeTracker({ userId }: { userId: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [manualDate, setManualDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [manualHours, setManualHours] = useState<string>("");
  const [manualNote, setManualNote] = useState<string>("");

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

  useEffect(() => { void load(); }, [userId]);

  const open = entries.find((e) => e.ended_at == null);

  const clockIn = async () => {
    setBusy(true);
    const { error } = await (supabase as any)
      .from("time_entries")
      .insert({ user_id: userId, started_at: new Date().toISOString(), source: "clock" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Instämplad");
    void load();
  };

  const clockOut = async () => {
    if (!open) return;
    setBusy(true);
    const ended = new Date().toISOString();
    const h = Number(hoursBetween(open.started_at, ended).toFixed(2));
    const { error } = await (supabase as any)
      .from("time_entries")
      .update({ ended_at: ended, hours: h })
      .eq("id", open.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Utstämplad – ${h.toFixed(2)} timmar`);
    void load();
  };

  const addManual = async () => {
    const h = Number(manualHours.replace(",", "."));
    if (!manualDate || !isFinite(h) || h <= 0) return toast.error("Ange datum och timmar");
    setBusy(true);
    const started = new Date(`${manualDate}T09:00:00`).toISOString();
    const ended = new Date(new Date(started).getTime() + h * 3_600_000).toISOString();
    const { error } = await (supabase as any).from("time_entries").insert({
      user_id: userId,
      started_at: started,
      ended_at: ended,
      hours: h,
      source: "manual",
      note: manualNote || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setManualHours("");
    setManualNote("");
    toast.success("Tid tillagd");
    void load();
  };

  const removeEntry = async (id: string) => {
    if (!confirm("Ta bort denna tidpost?")) return;
    const { error } = await (supabase as any).from("time_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Borttagen");
    void load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Stämpla klocka
          </CardTitle>
        </CardHeader>
        <CardContent>
          {open ? (
            <div className="space-y-3">
              <div className="text-sm">
                Instämplad{" "}
                <strong>
                  {new Date(open.started_at).toLocaleString("sv-SE", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>{" "}
                — pågår ({hoursBetween(open.started_at, new Date().toISOString()).toFixed(2)} h)
              </div>
              <Button className="w-full" onClick={clockOut} disabled={busy}>
                <Square className="h-4 w-4 mr-2" /> Stämpla ut
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={clockIn} disabled={busy}>
              <Play className="h-4 w-4 mr-2" /> Stämpla in
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Fyll i timmar i efterhand
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Datum</Label>
              <Input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Timmar</Label>
              <Input inputMode="decimal" placeholder="t.ex. 3,5" value={manualHours} onChange={(e) => setManualHours(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Anteckning (valfri)</Label>
            <Textarea rows={2} value={manualNote} onChange={(e) => setManualNote(e.target.value)} placeholder="t.ex. Städ Tält 2 + 3" />
          </div>
          <Button variant="secondary" className="w-full" onClick={addManual} disabled={busy}>
            Lägg till
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Senaste tidposter</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Laddar…</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga tidposter ännu.</p>
          ) : (
            <ul className="divide-y">
              {entries.map((entry) => {
                const start = new Date(entry.started_at);
                const h = entry.hours ?? (entry.ended_at ? hoursBetween(entry.started_at, entry.ended_at) : 0);
                return (
                  <li key={entry.id} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium capitalize">
                        {start.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })}
                        {entry.source === "manual" && <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">manuell</span>}
                        {!entry.ended_at && <span className="ml-2 text-[10px] uppercase tracking-wider text-primary">pågår</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {start.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                        {entry.ended_at && ` – ${new Date(entry.ended_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`}
                        {entry.note ? ` • ${entry.note}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{h.toFixed(2)} h</span>
                      <Button size="icon" variant="ghost" onClick={() => void removeEntry(entry.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
