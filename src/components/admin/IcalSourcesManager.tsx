import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, RefreshCw, Trash2, Plus, Copy, ExternalLink } from "lucide-react";

interface Unit {
  id: string;
  name: string;
  legacy_tent_id: string;
  ical_feed_token: string;
  property_id: string;
}

interface Source {
  id: string;
  unit_id: string;
  property_id: string;
  name: string;
  url: string;
  active: boolean;
  last_synced_at: string | null;
  last_status: string | null;
  last_error: string | null;
  events_count: number;
}

const FUNCTIONS_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co`;

export function IcalSourcesManager() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  // new source form
  const [newUnitId, setNewUnitId] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [u, s] = await Promise.all([
      (supabase as any).from("be_units").select("id,name,legacy_tent_id,ical_feed_token,property_id").order("sort_order"),
      (supabase as any).from("be_ical_sources").select("*").order("created_at", { ascending: false }),
    ]);
    if (u.error) toast.error("Kunde inte hämta tält: " + u.error.message);
    if (s.error) toast.error("Kunde inte hämta iCal-källor: " + s.error.message);
    setUnits(u.data ?? []);
    setSources(s.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addSource = async () => {
    if (!newUnitId || !newName.trim() || !newUrl.trim()) {
      toast.error("Fyll i tält, namn och URL");
      return;
    }
    const unit = units.find(u => u.id === newUnitId);
    if (!unit) return;
    setSaving(true);
    const { error } = await (supabase as any).from("be_ical_sources").insert({
      unit_id: unit.id,
      property_id: unit.property_id,
      name: newName.trim(),
      url: newUrl.trim(),
      active: true,
    });
    setSaving(false);
    if (error) { toast.error("Kunde inte spara: " + error.message); return; }
    toast.success("iCal-källa tillagd");
    setNewName(""); setNewUrl(""); setNewUnitId("");
    load();
  };

  const toggleActive = async (s: Source, active: boolean) => {
    const { error } = await (supabase as any).from("be_ical_sources").update({ active }).eq("id", s.id);
    if (error) toast.error(error.message); else { toast.success(active ? "Aktiverad" : "Pausad"); load(); }
  };

  const remove = async (s: Source) => {
    if (!confirm(`Ta bort iCal-källan "${s.name}"?`)) return;
    const { error } = await (supabase as any).from("be_ical_sources").delete().eq("id", s.id);
    if (error) toast.error(error.message); else { toast.success("Borttagen"); load(); }
  };

  const runSync = async (sourceId?: string) => {
    if (sourceId) setSyncingId(sourceId); else setSyncingAll(true);
    try {
      const { data, error } = await (supabase as any).functions.invoke("ical-sync", {
        body: sourceId ? { source_id: sourceId } : {},
      });
      if (error) throw error;
      const results = (data?.results ?? []) as Array<{ source: string; ok: boolean; error?: string; created?: number; updated?: number; cancelled?: number }>;
      const okCount = results.filter(r => r.ok).length;
      const failed = results.filter(r => !r.ok);
      toast.success(`Synkat ${okCount} källa(-or)${failed.length ? `, ${failed.length} misslyckades` : ""}`);
      if (failed.length) failed.forEach(f => toast.error(`${f.source}: ${f.error || "fel"}`));
      await load();
    } catch (e: any) {
      toast.error("Synk misslyckades: " + (e?.message ?? e));
    } finally {
      setSyncingId(null); setSyncingAll(false);
    }
  };

  const copyExportUrl = (unit: Unit) => {
    const url = `${FUNCTIONS_URL}/ical-export?token=${unit.ical_feed_token}`;
    navigator.clipboard.writeText(url);
    toast.success(`Export-URL för ${unit.name} kopierad`);
  };

  const sourcesByUnit = (unitId: string) => sources.filter(s => s.unit_id === unitId);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-serif">iCal-synk (Airbnb / Booking.com)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Lägg till iCal-URL:er från Airbnb och Booking.com så importeras deras bokningar automatiskt.
            Använd export-URL:en per tält för att skicka dina bokningar tillbaka till kanalerna.
          </p>
        </div>
        <Button onClick={() => runSync()} disabled={syncingAll || loading}>
          {syncingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Synka alla nu
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Lägg till ny iCal-källa</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <Label>Tält</Label>
            <Select value={newUnitId} onValueChange={setNewUnitId}>
              <SelectTrigger><SelectValue placeholder="Välj tält" /></SelectTrigger>
              <SelectContent>
                {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Namn (t.ex. "Airbnb")</Label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Airbnb" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>iCal-URL</Label>
            <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://www.airbnb.com/calendar/ical/..." />
          </div>
          <div className="md:col-span-4">
            <Button onClick={addSource} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Lägg till
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="grid gap-4">
          {units.map(unit => {
            const list = sourcesByUnit(unit.id);
            return (
              <Card key={unit.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                  <div>
                    <CardTitle className="text-lg">{unit.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Legacy: {unit.legacy_tent_id}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyExportUrl(unit)}>
                    <Copy className="mr-2 h-3 w-3" /> Kopiera export-URL
                  </Button>
                </CardHeader>
                <CardContent>
                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Inga iCal-källor kopplade ännu.</p>
                  ) : (
                    <div className="space-y-3">
                      {list.map(s => (
                        <div key={s.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{s.name}</span>
                                {s.last_status === "ok" && <Badge variant="secondary" className="bg-green-100 text-green-800">OK</Badge>}
                                {s.last_status && s.last_status !== "ok" && <Badge variant="destructive">{s.last_status}</Badge>}
                                {!s.active && <Badge variant="outline">Pausad</Badge>}
                              </div>
                              <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline flex items-center gap-1 mt-1 break-all">
                                {s.url} <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                              <div className="text-xs text-muted-foreground mt-1">
                                {s.events_count} event · {s.last_synced_at ? `senast synkad ${new Date(s.last_synced_at).toLocaleString("sv-SE")}` : "aldrig synkad"}
                              </div>
                              {s.last_error && <div className="text-xs text-destructive mt-1">Fel: {s.last_error}</div>}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <Switch checked={s.active} onCheckedChange={(v) => toggleActive(s, v)} />
                              </div>
                              <Button variant="outline" size="sm" onClick={() => runSync(s.id)} disabled={syncingId === s.id}>
                                {syncingId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => remove(s)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
