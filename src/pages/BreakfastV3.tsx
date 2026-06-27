import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Coffee, Croissant, Leaf, Loader2, LogOut } from "lucide-react";
import { useBreakfast } from "@/hooks/useBreakfast";
import { useBreakfastOrders } from "@/hooks/useBreakfastOrders";
import { TENT_BY_ID, todayInStockholm } from "@/cleaning/config";
import type { BreakfastOrder } from "@/lib/breakfast-orders";
import { BreakfastLogin } from "@/components/breakfast/BreakfastLogin";
import { BreakfastOrderCard, breakfastTentLabel } from "@/components/breakfast/BreakfastOrderCard";
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

export default function BreakfastV3() {
  const { user, isBreakfast, loading, signOut } = useBreakfast();
  const today = todayInStockholm();
  const [date, setDate] = useState(today);
  const [confirm, setConfirm] = useState<BreakfastOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { orders: allOrders, loading: dataLoading, markDelivered } = useBreakfastOrders(isBreakfast);

  const orders = useMemo(() => allOrders.filter((order) => order.date === date).sort((a, b) => {
    const aNo = TENT_BY_ID[a.tentIds[0]]?.no ?? 99;
    const bNo = TENT_BY_ID[b.tentIds[0]]?.no ?? 99;
    return aNo - bNo || a.kind.localeCompare(b.kind);
  }), [allOrders, date]);

  const breakfastCount = orders.filter((order) => order.kind === "breakfast").reduce((sum, order) => sum + order.quantity, 0);
  const fikaCount = orders.filter((order) => order.kind === "fikapase").reduce((sum, order) => sum + order.quantity, 0);

  const deliver = async () => {
    if (!confirm) return;
    setSubmitting(true);
    try {
      await markDelivered(confirm);
      toast.success("Leveransen är markerad som klar.");
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
            <div className="mt-3 flex justify-center gap-2">
              <Button size="sm" variant={date === today ? "default" : "outline"} onClick={() => setDate(today)}>Idag</Button>
              <Button size="sm" variant={date === addDays(today, 1) ? "default" : "outline"} onClick={() => setDate(addDays(today, 1))}>Imorgon</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="pt-4"><div className="flex items-center gap-1 text-xs font-medium text-amber-800"><Croissant className="h-4 w-4" /> Frukost</div><div className="text-3xl font-bold text-amber-900">{breakfastCount}</div><div className="text-xs text-amber-700">portioner denna morgon</div></CardContent></Card>
          <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20"><CardContent className="pt-4"><div className="flex items-center gap-1 text-xs font-medium text-emerald-800"><Leaf className="h-4 w-4" /> Fikapåsar</div><div className="text-3xl font-bold text-emerald-900">{fikaCount}</div><div className="text-xs text-emerald-700">påsar denna dag</div></CardContent></Card>
        </div>

        {dataLoading ? (
          <Card><CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Laddar…</CardContent></Card>
        ) : orders.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Inga leveranser detta datum.</CardContent></Card>
        ) : orders.map((order) => <BreakfastOrderCard key={order.key} order={order} onDeliver={setConfirm} />)}
      </main>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Markera som levererat?</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.quantity} {confirm?.kind === "breakfast" ? "frukostportioner" : "fikapåsar"} till {confirm ? breakfastTentLabel(confirm.tentIds) : ""}. Gästen kan få ett SMS.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Avbryt</AlertDialogCancel><AlertDialogAction onClick={() => void deliver()} disabled={submitting}>{submitting ? "Sparar…" : "Ja, levererat"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
