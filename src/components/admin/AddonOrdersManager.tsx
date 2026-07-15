import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, RefreshCw, Clock, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface OrderRow {
  id: string;
  booking_id: string;
  quantity: number;
  unit_price_sek: number;
  total_sek: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  addons: { slug: string; name_sv: string } | null;
  bookings: {
    booking_number: string;
    guest_name: string | null;
    tent_id: string;
    tent_name: string | null;
    checkin_date: string;
    email: string | null;
  } | null;
}

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  requested: { label: "Önskemål", variant: "secondary" },
  pending: { label: "Avvaktar", variant: "secondary" },
  paid: { label: "Bekräftad / betald", variant: "default" },
  confirmed: { label: "Bekräftad", variant: "default" },
  cancelled: { label: "Avbokad", variant: "destructive" },
};

export function AddonOrdersManager() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "swish" | "open" | "early" | "done">("swish");
  const [working, setWorking] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("addon_orders")
      .select("id, booking_id, quantity, unit_price_sek, total_sek, status, paid_at, created_at, addons:addon_id(slug, name_sv), bookings:booking_id(booking_number, guest_name, tent_id, tent_name, checkin_date, email)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setOrders(((data as OrderRow[]) ?? []));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const act = async (id: string, action: "confirm" | "cancel") => {
    setWorking(id);
    try {
      const { error } = await (supabase as any).functions.invoke("confirm-addon-order", { body: { order_id: id, action } });
      if (error) throw error;
      toast.success(action === "confirm" ? "Bekräftat" : "Avbokat");
      await load();
    } catch (e: any) { toast.error(e?.message ?? "Fel"); }
    setWorking(null);
  };

  const filtered = orders.filter((o) => {
    if (filter === "swish") return o.status === "requested" && !o.paid_at;
    if (filter === "open") return ["requested", "pending"].includes(o.status);
    if (filter === "done") return ["paid", "confirmed"].includes(o.status);
    if (filter === "early") return o.addons?.slug === "early_checkin";
    return true;
  });

  const swishCount = orders.filter((o) => o.status === "requested" && !o.paid_at).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Tillvalsbeställningar</h1>
          <p className="text-muted-foreground text-sm mt-1">Bekräfta önskemål efter att du fakturerat gästen. Tidig incheckning flaggar tältet i städlistan.</p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Uppdatera
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["swish", "open", "early", "done", "all"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f === "swish" ? <><Smartphone className="h-4 w-4 mr-1" /> Swish att bekräfta{swishCount > 0 ? ` (${swishCount})` : ""}</> : f === "open" ? "Att hantera" : f === "early" ? "Tidig incheckning" : f === "done" ? "Klara" : "Alla"}
          </Button>
        ))}
      </div>

      {filter === "swish" && (
        <p className="text-sm text-muted-foreground -mt-2">
          Gäster som valt Swish. Kontrollera att beloppet kommit in i Swish-appen med rätt referens, klicka sedan <strong>Markera som betald</strong>.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{filtered.length} beställning{filtered.length === 1 ? "" : "ar"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Laddar…</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm">Inga beställningar.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Skapat</TableHead>
                    <TableHead>Gäst</TableHead>
                    <TableHead>Incheckning</TableHead>
                    <TableHead>Tält</TableHead>
                    <TableHead>Tillval</TableHead>
                    <TableHead>Antal</TableHead>
                    <TableHead>Summa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => {
                    const st = STATUS_LABEL[o.status] ?? { label: o.status, variant: "outline" as const };
                    const isEarly = o.addons?.slug === "early_checkin";
                    const open = ["requested", "pending"].includes(o.status);
                    return (
                      <TableRow key={o.id} className={isEarly && open ? "bg-amber-500/5" : ""}>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(o.created_at).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                        <TableCell>
                          <div>{o.bookings?.guest_name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{o.bookings?.booking_number}</div>
                          {o.bookings?.email && <div className="text-xs text-muted-foreground">{o.bookings.email}</div>}
                        </TableCell>
                        <TableCell className="text-xs">{o.bookings?.checkin_date ?? "—"}</TableCell>
                        <TableCell><Badge variant="secondary">{o.bookings?.tent_name ?? o.bookings?.tent_id}</Badge></TableCell>
                        <TableCell>
                          {isEarly && <Clock className="inline h-4 w-4 mr-1 text-amber-600" />}
                          {o.addons?.name_sv ?? "—"}
                        </TableCell>
                        <TableCell>{o.quantity}</TableCell>
                        <TableCell className="font-semibold">{o.total_sek} kr</TableCell>
                        <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                        <TableCell>
                          {open && (
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => act(o.id, "confirm")} disabled={working === o.id}>
                                <CheckCircle2 className="h-4 w-4 mr-1" /> {o.status === "requested" ? "Markera som betald" : "Bekräfta"}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => act(o.id, "cancel")} disabled={working === o.id}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
