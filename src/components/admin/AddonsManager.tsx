import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, RefreshCw } from "lucide-react";

interface Addon {
  id: string; slug: string;
  name_sv: string; name_en: string;
  description_sv: string | null; description_en: string | null;
  price_sek: number; unit: string; max_quantity: number;
  active: boolean; sort_order: number;
}

export function AddonsManager() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadDays, setLeadDays] = useState(5);
  const [cutoffDays, setCutoffDays] = useState(2);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const load = async () => {
    setLoading(true);
    const [addonsRes, settingsRes] = await Promise.all([
      supabase.from("addons" as any).select("*").order("sort_order"),
      supabase.from("app_settings" as any).select("*"),
    ]);
    setAddons(((addonsRes.data as any[]) ?? []) as Addon[]);
    const sMap: Record<string, any> = {};
    for (const r of ((settingsRes.data as any[]) ?? [])) sMap[r.key] = r.value;
    setLeadDays(Number(sMap["prearrival_lead_days"] ?? 5));
    setCutoffDays(Number(sMap["order_cutoff_days"] ?? 2));
    setOwnerEmail(String(sMap["owner_email"] ?? ""));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveAddon = async (a: Addon) => {
    setSavingId(a.id);
    const { error } = await supabase.from("addons" as any).update({
      name_sv: a.name_sv, name_en: a.name_en,
      description_sv: a.description_sv, description_en: a.description_en,
      price_sek: a.price_sek, max_quantity: a.max_quantity,
      active: a.active, sort_order: a.sort_order,
    } as any).eq("id", a.id);
    setSavingId(null);
    if (error) toast.error(error.message); else toast.success("Sparat");
  };

  const update = (id: string, patch: Partial<Addon>) => {
    setAddons((xs) => xs.map((x) => x.id === id ? { ...x, ...patch } : x));
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    const rows = [
      { key: "prearrival_lead_days", value: leadDays },
      { key: "order_cutoff_days", value: cutoffDays },
      { key: "owner_email", value: ownerEmail },
    ];
    const { error } = await supabase.from("app_settings" as any).upsert(rows as any, { onConflict: "key" });
    setSavingSettings(false);
    if (error) toast.error(error.message); else toast.success("Inställningar sparade");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Tillval</h1>
          <p className="text-muted-foreground text-sm mt-1">Hantera frukost, fikapåse och tidig incheckning.</p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Uppdatera
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inställningar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Skicka utskick (dagar före)</Label>
              <Input type="number" min={1} max={30} value={leadDays} onChange={(e) => setLeadDays(Number(e.target.value))} />
            </div>
            <div>
              <Label>Beställningsstopp (dagar före)</Label>
              <Input type="number" min={0} max={30} value={cutoffDays} onChange={(e) => setCutoffDays(Number(e.target.value))} />
            </div>
            <div>
              <Label>Ägar-mejl (notiser)</Label>
              <Input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
            </div>
          </div>
          <Button onClick={saveSettings} disabled={savingSettings}>
            <Save className="mr-2 h-4 w-4" /> Spara inställningar
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground text-sm">Laddar…</p>
      ) : (
        <div className="space-y-4">
          {addons.map((a) => (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{a.slug}</span>
                  {a.name_sv}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Aktiv</Label>
                  <Switch checked={a.active} onCheckedChange={(v) => update(a.id, { active: v })} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Namn (sv)</Label>
                    <Input value={a.name_sv} onChange={(e) => update(a.id, { name_sv: e.target.value })} />
                  </div>
                  <div>
                    <Label>Namn (en)</Label>
                    <Input value={a.name_en} onChange={(e) => update(a.id, { name_en: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Beskrivning (sv)</Label>
                    <Textarea value={a.description_sv ?? ""} onChange={(e) => update(a.id, { description_sv: e.target.value })} rows={2} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Beskrivning (en)</Label>
                    <Textarea value={a.description_en ?? ""} onChange={(e) => update(a.id, { description_en: e.target.value })} rows={2} />
                  </div>
                  <div>
                    <Label>Pris (kr)</Label>
                    <Input type="number" value={a.price_sek} onChange={(e) => update(a.id, { price_sek: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Max antal</Label>
                    <Input type="number" value={a.max_quantity} onChange={(e) => update(a.id, { max_quantity: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Sortering</Label>
                    <Input type="number" value={a.sort_order} onChange={(e) => update(a.id, { sort_order: Number(e.target.value) })} />
                  </div>
                </div>
                <Button onClick={() => saveAddon(a)} disabled={savingId === a.id}>
                  <Save className="mr-2 h-4 w-4" /> Spara
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
