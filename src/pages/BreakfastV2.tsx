import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Coffee, Croissant, Leaf, Loader2, LogOut, Send, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBreakfast } from "@/hooks/useBreakfast";
import { TENT_BY_ID, todayInStockholm } from "@/cleaning/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const BREAKFAST_EMAIL = "karin@bostallet.se";

type Stay = {
  booking_number: string;
  tent_id: string;
  checkin_date: string;
  checkout_date: string;
  guests: number | null;
  children: number | null;
  guest_name: string | null;
  dietary: string[] | null;
  dietary_note: string | null;
  breakfast_csv_quantity: number;
  breakfast_addon_quantity: number;
  fikapase_csv_quantity: number;
  fikapase_addon_quantity: number;
};

type Delivery = {
  booking_number: string;
  delivery_date: string;
  kind: string;
  status: string;
  sms_status: string | null;
  delivered_at: string | null;
};

type Order = {
  key: string;
  bookingNumber: string;
  guestName: string | null;
  tentIds: string[];
  tentLabel: string;
  date: string;
  kind: "breakfast" | "fikapase";
  quantity: number;
  csvQuantity: number;
  addonQuantity: number;
  dietary: string[];
  dietaryNote: string | null;
  delivery?: Delivery;
};

function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function prettyDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function tentLabel(tentIds: string[]) {
  return tentIds
    .map((id) => TENT_BY_ID[id])
    .filter(Boolean)
    .sort((a, b) => a.no - b.no)
    .map((tent) => `Tält ${tent.no} – ${tent.name}`)
    .join(" + ");
}

function BreakfastLogin() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: BREAKFAST_EMAIL, password });
    setBusy(false);
    if (error) toast.error("Fel lösenord eller inloggning.");
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Coffee className="mx-auto h-8 w-8 text-primary" />
          <CardTitle>Frukostleverans</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={login}>
            <div className="space-y-2">
              <Label>Lösenord</Label>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus required />
            </div>
            <Button className="w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Logga in</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BreakfastV2() {
  const { user, isBreakfast, loading, signOut } = useBreakfast();
  const today = todayInStockholm();
  const [date, setDate] = useState(today);
  const [stays, setStays] = useState<Stay[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [confirm, setConfirm] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setDataLoading(true);
    const end = addDays(today, 60);
    const [stayResult, deliveryResult] = await Promise.all([
      (supabase as any)
        .from("tent_stays")
        .select("booking_number, tent_id, checkin_date, checkout_date, guests, children, guest_name, dietary, dietary_note, breakfast_csv_quantity, breakfast_addon_quantity, fikapase_csv_quantity, fikapase_addon_quantity")
        .gte("checkout_date", today)
        .lte("checkin_date", end),
      (supabase as any)
        .from("breakfast_deliveries")
        .select("booking_number, delivery_date, kind, status, sms_status, delivered_at")
        .gte("delivery_date", today)
        .lte("delivery_date", end),
    ]);

    if (stayResult.error) toast.error(`Kunde inte ladda frukost: ${stayResult.error.message}`);
    if (deliveryResult.error) toast.error(`Kunde inte ladda leveranser: ${deliveryResult.error.message}`);
    setStays((stayResult.data ?? []) as Stay[]);
    setDeliveries((deliveryResult.data ?? []) as Delivery[]);
    setDataLoading(false);
  };

  useEffect(() => {
    if (isBreakfast) void load();
  }, [isBreakfast]);

  const ordersByDate = useMemo(() => {
    const grouped = new Map<string, Stay[]>();
    for (const stay of stays) {
      const key = `${stay.booking_number}|${stay.checkin_date}|${stay.checkout_date}`;
      grouped.set(key, [...(grouped.get(key) ?? []), stay]);
    }

    const result = new Map<string, Order[]>();
    for (const rows of grouped.values()) {
      const first = rows[0];
      const tentIds = Array.from(new Set(rows.map((row) => row.tent_id)));
      const dietary = Array.from(new Set(rows.flatMap((row) => row.dietary ?? [])));
      const notes = Array.from(new Set(rows.map((row) => row.dietary_note).filter(Boolean))) as string[];
      const breakfastCsv = rows.reduce((sum, row) => sum + Number(row.breakfast_csv_quantity ?? 0), 0);
      const breakfastAddon = rows.reduce((sum, row) => sum + Number(row.breakfast_addon_quantity ?? 0), 0);
      const fikaCsv = rows.reduce((sum, row) => sum + Number(row.fikapase_csv_quantity ?? 0), 0);
      const fikaAddon = rows.reduce((sum, row) => sum + Number(row.fikapase_addon_quantity ?? 0), 0);

      const push = (order: Order) => result.set(order.date, [...(result.get(order.date) ?? []), order]);

      if (breakfastCsv + breakfastAddon > 0) {
        push({
          key: `${first.booking_number}|${first.checkout_date}|breakfast`,
          bookingNumber: first.booking_number,
          guestName: first.guest_name,
          tentIds,
          tentLabel: tentLabel(tentIds),
          date: first.checkout_date,
          kind: "breakfast",
          quantity: breakfastCsv + breakfastAddon,
          csvQuantity: breakfastCsv,
          addonQuantity: breakfastAddon,
          dietary,
          dietaryNote: notes.join(" • ") || null,
          delivery: deliveries.find((delivery) => delivery.booking_number === first.booking_number && delivery.delivery_date === first.checkout_date && delivery.kind === "breakfast"),
        });
      }

      if (fikaCsv + fikaAddon > 0) {
        push({
          key: `${first.booking_number}|${first.checkin_date}|fikapase`,
          bookingNumber: first.booking_number,
          guestName: first.guest_name,
          tentIds,
          tentLabel: tentLabel(tentIds),
          date: first.checkin_date,
          kind: "fikapase",
          quantity: fikaCsv + fikaAddon,
          csvQuantity: fikaCsv,
          addonQuantity: fikaAddon,
          dietary,
          dietaryNote: notes.join(" • ") || null,
          delivery: deliveries.find((delivery) => delivery.booking_number === first.booking_number && delivery.delivery_date === first.checkin_date && delivery.kind === "fikapase"),
        });
      }
    }

    for (const list of result.values()) {
      list.sort((a, b) => {
        const aNo = TENT_BY_ID[a.tentIds[0]]?.no ?? 99;
        const bNo = TENT_BY_ID[b.tentIds[0]]?.no ?? 99;
        return aNo - bNo || a.kind.localeCompare(b.kind);
      });
    }
    return result;
  }, [stays, deliveries]);

  const orders = ordersByDate.get(date) ?? [];
  const breakfastCount = orders.filter((order) => order.kind === "breakfast").reduce((sum, order) => sum + order.quantity, 0);
  const fikaCount = orders.filter((order) => order.kind === "fikapase").reduce((sum, order) => sum + order.quantity, 0);

  const deliver = async () => {
    if (!confirm) return;
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-breakfast-delivered`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        },
        body: JSON.stringify({
          booking_number: confirm.bookingNumber,
          delivery_date: confirm.date,
          kind: confirm.kind,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Kunde inte markera leveransen.");
      toast.success("Leveransen är markerad som klar.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunde inte markera leveransen.");
    } finally {
      setSubmitting(false);
      setConfirm(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user) return <BreakfastLogin />;
  if (!isBreakfast) return <div className="min-h-screen flex flex-col items-center justify-center gap-3"><p>Du saknar frukostbehörighet.</p><Button variant="outline" onClick={signOut}>Logga ut</Button></div>;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl space-y-4 p-4 pb-20">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Coffee className="h-6 w-6 text-primary" /><h1 className="font-serif text-2xl">Frukostleverans</h1></div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-1 h-4 w-4" /> Logga ut</Button>
        </header>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="icon" onClick={() => setDate(addDays(date, -1))}><ChevronLeft className="h-4 w-4" /></Button>
              <div className="text-center"><div className="font-medium capitalize">{prettyDate(date)}</div><div className="text-xs text-muted-foreground">{date}</div></div>
              <Button variant="outline" size="icon" onClick={() => setDate(addDays(date, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="mt-3 flex justify-center gap-2"><Button size="sm" variant={date === today ? "default" : "outline"} onClick={() => setDate(today)}>Idag</Button><Button size="sm" variant={date === addDays(today, 1) ? "default" : "outline"} onClick={() => setDate(addDays(today, 1))}>Imorgon</Button></div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="pt-4"><div className="flex items-center gap-1 text-xs font-medium text-amber-800"><Croissant className="h-4 w-4" /> Frukost</div><div className="text-3xl font-bold text-amber-900">{breakfastCount}</div><div className="text-xs text-amber-700">exakta portioner</div></CardContent></Card>
          <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20"><CardContent className="pt-4"><div className="flex items-center gap-1 text-xs font-medium text-emerald-800"><Leaf className="h-4 w-4" /> Fikapåsar</div><div className="text-3xl font-bold text-emerald-900">{fikaCount}</div><div className="text-xs text-emerald-700">exakta påsar</div></CardContent></Card>
        </div>

        {dataLoading ? (
          <Card><CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Laddar…</CardContent></Card>
        ) : orders.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Inga leveranser detta datum.</CardContent></Card>
        ) : orders.map((order) => {
          const breakfast = order.kind === "breakfast";
          const done = order.delivery?.status === "delivered";
          return (
            <Card key={order.key} className={done ? "border-primary/30 bg-primary/5" : ""}>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div><div className="flex flex-wrap items-center gap-2"><Badge className={breakfast ? "bg-amber-600" : "bg-emerald-700"}>{breakfast ? "Frukost" : "Fikapåse"}</Badge><span className="font-medium">{order.tentLabel}</span></div><div className="mt-1 text-xs text-muted-foreground">{order.guestName ?? "Gäst"} • Bokning {order.bookingNumber}</div></div>
                  {done && <Badge variant="outline">Klar</Badge>}
                </div>

                <div className={`rounded-lg border p-3 ${breakfast ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20" : "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20"}`}>
                  <div className="flex items-center gap-3"><Users className="h-7 w-7" /><div><div className="text-xs uppercase tracking-wide text-muted-foreground">Beställt antal</div><div className="text-3xl font-bold">{order.quantity}</div></div></div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {order.csvQuantity > 0 && <Badge variant="outline">Sirvoy CSV: {order.csvQuantity}</Badge>}
                    {order.addonQuantity > 0 && <Badge variant="outline">Webbtillägg: {order.addonQuantity}</Badge>}
                  </div>
                </div>

                {(order.dietary.length > 0 || order.dietaryNote) && <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900"><strong>Kostanpassning:</strong> {[...order.dietary, order.dietaryNote].filter(Boolean).join(" • ")}</div>}

                {done ? <div className="text-xs text-muted-foreground">Levererat {order.delivery?.delivered_at ? new Date(order.delivery.delivered_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }) : ""}</div> : <Button className="w-full" onClick={() => setConfirm(order)}><Send className="mr-2 h-4 w-4" /> Markera levererat</Button>}
              </CardContent>
            </Card>
          );
        })}
      </main>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Markera som levererat?</AlertDialogTitle><AlertDialogDescription>{confirm?.quantity} {confirm?.kind === "breakfast" ? "frukostportioner" : "fikapåsar"} till {confirm?.tentLabel}. Gästen kan få ett SMS.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Avbryt</AlertDialogCancel><AlertDialogAction onClick={() => void deliver()} disabled={submitting}>{submitting ? "Sparar…" : "Ja, levererat"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
