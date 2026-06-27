import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChefHat, ChevronLeft, ChevronRight, Coffee, Croissant, Leaf, Loader2, LogOut, Printer, RefreshCw } from "lucide-react";
import { useBreakfast } from "@/hooks/useBreakfast";
import { useBreakfastOrders } from "@/hooks/useBreakfastOrders";
import { TENT_BY_ID, todayInStockholm } from "@/cleaning/config";
import type { BreakfastOrder } from "@/lib/breakfast-orders";
import { BreakfastLogin } from "@/components/breakfast/BreakfastLogin";
import { BreakfastOrderCardV2, breakfastTentLabelV2 } from "@/components/breakfast/BreakfastOrderCardV2";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

type Filter = "all" | "pending" | "prepared" | "delivered";

function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function prettyDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function statusOf(order: BreakfastOrder): Filter {
  if (order.delivery?.status === "delivered") return "delivered";
  if (order.delivery?.status === "prepared") return "prepared";
  return "pending";
}

export default function BreakfastV4() {
  const { user, isBreakfast, loading, signOut } = useBreakfast();
  const today = todayInStockholm();
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState<Filter>("all");
  const [confirm, setConfirm] = useState<BreakfastOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { orders: allOrders, loading: dataLoading, load, markPrepared, markDelivered } = useBreakfastOrders(isBreakfast);

  const dayOrders = useMemo(() => allOrders.filter((order) => order.date === date).sort((a, b) => {
    const aCritical = Number(a.dietary.length > 0 || !!a.dietaryNote);
    const bCritical = Number(b.dietary.length > 0 || !!b.dietaryNote);
    if (aCritical !== bCritical) return bCritical - aCritical;
    const aStatus = statusOf(a) === "pending" ? 0 : statusOf(a) === "prepared" ? 1 : 2;
    const bStatus = statusOf(b) === "pending" ? 0 : statusOf(b) === "prepared" ? 1 : 2;
    if (aStatus !== bStatus) return aStatus - bStatus;
    const aNo = TENT_BY_ID[a.tentIds[0]]?.no ?? 99;
    const bNo = TENT_BY_ID[b.tentIds[0]]?.no ?? 99;
    return aNo - bNo || a.kind.localeCompare(b.kind);
  }), [allOrders, date]);

  const orders = useMemo(() => filter === "all" ? dayOrders : dayOrders.filter((order) => statusOf(order) === filter), [dayOrders, filter]);
  const breakfastCount = dayOrders.filter((order) => order.kind === "breakfast").reduce((sum, order) => sum + order.quantity, 0);
  const fikaCount = dayOrders.filter((order) => order.kind === "fikapase").reduce((sum, order) => sum + order.quantity, 0);
  const pendingCount = dayOrders.filter((order) => statusOf(order) === "pending").length;
  const preparedCount = dayOrders.filter((order) => statusOf(order) === "prepared").length;
  const deliveredCount = dayOrders.filter((order) => statusOf(order) === "delivered").length;
  const dietaryCount = dayOrders.filter((order) => order.dietary.length > 0 || !!order.dietaryNote).length;

  const prepare = async (order: BreakfastOrder) => {
    try {
      await markPrepared(order);
      toast.success(`${order.quantity} st markerade som förberedda.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunde inte markera som förberedd.");
    }
  };

  const deliver = async () => {
    if (!confirm) return;
    setSubmitting(true);
    try {
      await markDelivered(confirm);
      toast.success("Leveransen är markerad som levererad.");
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
      <main className="mx-auto max-w-2xl space-y-4 p-4 pb-20 print:max-w-none print:p-0">
        <header className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2"><Coffee className="h-6 w-6 text-primary" /><div><h1 className="font-serif text-2xl">Bostället – leveranser</h1><p className="text-xs text-muted-foreground">Förberedd → levererad → SMS</p></div></div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-1 h-4 w-4" /> Logga ut</Button>
        </header>

        <Card className="print:border-0 print:shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-2 print:justify-start">
              <Button className="print:hidden" variant="outline" size="icon" onClick={() => setDate(addDays(date, -1))}><ChevronLeft className="h-4 w-4" /></Button>
              <div className="text-center print:text-left"><div className="font-medium capitalize">{prettyDate(date)}</div><div className="text-xs text-muted-foreground">{date}</div></div>
              <Button className="print:hidden" variant="outline" size="icon" onClick={() => setDate(addDays(date, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2 print:hidden">
              <Button size="sm" variant={date === today ? "default" : "outline"} onClick={() => setDate(today)}>Idag</Button>
              <Button size="sm" variant={date === addDays(today, 1) ? "default" : "outline"} onClick={() => setDate(addDays(today, 1))}>Imorgon</Button>
              <Button size="sm" variant="outline" onClick={() => void load()}><RefreshCw className="mr-1 h-4 w-4" /> Uppdatera</Button>
              <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" /> Skriv ut</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="border-amber-200 bg-amber-50"><CardContent className="pt-4"><div className="flex items-center gap-1 text-xs font-medium text-amber-800"><Croissant className="h-4 w-4" /> Frukost</div><div className="text-3xl font-bold text-amber-900">{breakfastCount}</div><div className="text-xs text-amber-700">portioner</div></CardContent></Card>
          <Card className="border-emerald-200 bg-emerald-50"><CardContent className="pt-4"><div className="flex items-center gap-1 text-xs font-medium text-emerald-800"><Leaf className="h-4 w-4" /> Fika</div><div className="text-3xl font-bold text-emerald-900">{fikaCount}</div><div className="text-xs text-emerald-700">påsar</div></CardContent></Card>
          <Card className="border-blue-200 bg-blue-50"><CardContent className="pt-4"><div className="flex items-center gap-1 text-xs font-medium text-blue-800"><ChefHat className="h-4 w-4" /> Förberedda</div><div className="text-3xl font-bold text-blue-900">{preparedCount}</div><div className="text-xs text-blue-700">leveranser</div></CardContent></Card>
          <Card className={dietaryCount > 0 ? "border-red-400 bg-red-50" : ""}><CardContent className="pt-4"><div className="flex items-center gap-1 text-xs font-medium"><AlertTriangle className="h-4 w-4" /> Specialkost</div><div className="text-3xl font-bold">{dietaryCount}</div><div className="text-xs text-muted-foreground">att kontrollera</div></CardContent></Card>
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>Alla {dayOrders.length}</Button>
          <Button size="sm" variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>Ej påbörjade {pendingCount}</Button>
          <Button size="sm" variant={filter === "prepared" ? "default" : "outline"} onClick={() => setFilter("prepared")}>Förberedda {preparedCount}</Button>
          <Button size="sm" variant={filter === "delivered" ? "default" : "outline"} onClick={() => setFilter("delivered")}><CheckCircle2 className="mr-1 h-4 w-4" /> Levererade {deliveredCount}</Button>
        </div>

        {dataLoading ? (
          <Card><CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Laddar…</CardContent></Card>
        ) : orders.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Inga leveranser i detta urval.</CardContent></Card>
        ) : orders.map((order) => <BreakfastOrderCardV2 key={order.key} order={order} onPrepare={(item) => void prepare(item)} onDeliver={setConfirm} />)}
      </main>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Är leveransen på plats?</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.quantity} {confirm?.kind === "breakfast" ? "frukostportioner" : "fikapåsar"} till {confirm ? breakfastTentLabelV2(confirm.tentIds) : ""}. När du bekräftar markeras den som levererad och gästens SMS skickas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Avbryt</AlertDialogCancel><AlertDialogAction onClick={() => void deliver()} disabled={submitting}>{submitting ? "Sparar…" : "Levererad – skicka SMS"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
