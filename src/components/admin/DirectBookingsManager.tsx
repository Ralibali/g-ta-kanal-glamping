import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string;
  created_at: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  checkin_date: string;
  checkout_date: string;
  guests: number | null;
  total_amount: number;
  payment_amount: number | null;
  payment_method: string;
  payment_status: string;
  status: string;
  source: string;
  stripe_session_id: string | null;
  payment_ref: string | null;
  public_token: string;
  be_units: { name: string } | null;
};

const statusColor: Record<string, string> = {
  paid: "bg-green-500/15 text-green-700 border-green-500/30",
  pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  none: "bg-muted text-muted-foreground",
  cancelled: "bg-red-500/15 text-red-700 border-red-500/30",
  refunded: "bg-blue-500/15 text-blue-700 border-blue-500/30",
};

export const DirectBookingsManager = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "cancelled">("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("be_bookings")
      .select("id, created_at, guest_name, guest_email, guest_phone, checkin_date, checkout_date, guests, total_amount, payment_amount, payment_method, payment_status, status, source, stripe_session_id, payment_ref, public_token, be_units(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error("Kunde inte hämta bokningar");
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("be-bookings-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "be_bookings" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const markPaid = async (id: string) => {
    const { error } = await supabase
      .from("be_bookings")
      .update({ payment_status: "paid", status: "confirmed" })
      .eq("id", id);
    if (error) toast.error("Kunde inte markera betald");
    else { toast.success("Markerad som betald"); load(); }
  };

  const filtered = rows.filter((r) =>
    filter === "all" ? r.source !== "ical" : r.payment_status === filter && r.source !== "ical"
  );

  const counts = {
    all: rows.filter(r => r.source !== "ical").length,
    paid: rows.filter(r => r.payment_status === "paid" && r.source !== "ical").length,
    pending: rows.filter(r => r.payment_status === "pending" && r.source !== "ical").length,
    cancelled: rows.filter(r => r.payment_status === "cancelled" && r.source !== "ical").length,
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Direktbokningar (StayBoost)</CardTitle>
            <CardDescription>
              Bokningar via /boka-direkt. Betalstatus uppdateras automatiskt via Stripe-webhook.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(["all", "pending", "paid", "cancelled"] as const).map((k) => (
              <Button
                key={k}
                variant={filter === k ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(k)}
              >
                {k === "all" ? "Alla" : k === "pending" ? "Väntande" : k === "paid" ? "Betalda" : "Avbrutna"}
                <Badge variant="secondary" className="ml-2">{counts[k]}</Badge>
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Laddar…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Inga bokningar än.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Skapad</TableHead>
                    <TableHead>Gäst</TableHead>
                    <TableHead>Tält</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Belopp</TableHead>
                    <TableHead>Metod</TableHead>
                    <TableHead>Betalstatus</TableHead>
                    <TableHead className="text-right">Åtgärd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{r.guest_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{r.guest_email ?? r.guest_phone ?? ""}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{r.be_units?.name ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {r.checkin_date} → {r.checkout_date}
                        {r.guests ? <span className="text-muted-foreground"> · {r.guests}g</span> : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {Math.round(r.payment_amount ?? r.total_amount)} kr
                      </TableCell>
                      <TableCell className="capitalize text-sm">{r.payment_method}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColor[r.payment_status] ?? ""}>
                          {r.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        {r.payment_status === "pending" && (
                          <Button size="sm" variant="secondary" onClick={() => markPaid(r.id)}>
                            Markera betald
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" asChild>
                          <a href={`/stay/${r.public_token}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectBookingsManager;
