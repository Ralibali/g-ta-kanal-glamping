import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Croissant,
  Leaf,
  LogOut,
  Milk as MilkIcon,
  Nut,
  Pencil,
  Send,
  Sprout,
  Users,
  Wheat,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBreakfast } from "@/hooks/useBreakfast";
import { useBreakfastOrders } from "@/hooks/useBreakfastOrders";
import { BreakfastLogin } from "@/components/breakfast/BreakfastLogin";
import { TENT_BY_ID, todayInStockholm } from "@/cleaning/config";
import type { BreakfastOrder } from "@/lib/breakfast-orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const DIET_OPTIONS: { id: string; label: string; icon: typeof Wheat; color: string }[] = [
  { id: "gluten_free", label: "Glutenfritt", icon: Wheat, color: "text-amber-700" },
  { id: "vegan", label: "Veganskt", icon: Sprout, color: "text-emerald-700" },
  { id: "vegetarian", label: "Vegetariskt", icon: Leaf, color: "text-emerald-600" },
  { id: "lactose_free", label: "Laktosfritt", icon: MilkIcon, color: "text-sky-700" },
  { id: "nut_allergy", label: "Nötallergi", icon: Nut, color: "text-red-700" },
];

const DIET_BY_ID = Object.fromEntries(DIET_OPTIONS.map((item) => [item.id, item]));

function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function prettyDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function tentLabel(tentIds: string[]): string {
  return tentIds
    .map((id) => TENT_BY_ID[id])
    .filter(Boolean)
    .sort((a, b) => a.no - b.no)
    .map((tent) => `Tält ${tent.no} – ${tent.name}`)
    .join(" + ");
}

function buildMonthCells(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const offset = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let index = 0; index < offset; index += 1) cells.push(null);
  for (let day = 1; day <= last.getDate(); day += 1) cells.push(new Date(year, monthIndex, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export default function Breakfast() {
  const { user, isBreakfast, loading, signOut } = useBreakfast();
  const { orders, loading: dataLoading, load, markDelivered } = useBreakfastOrders(isBreakfast);
  const today = todayInStockholm();
  const [view, setView] = useState<"day" | "calendar">("day");
  const [date, setDate] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const value = new Date(`${today}T12:00:00`);
    value.setDate(1);
    return value;
  });
  const [confirm, setConfirm] = useState<BreakfastOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editDiet, setEditDiet] = useState<BreakfastOrder | null>(null);
  const [dietDraft, setDietDraft] = useState<string[]>([]);
  const [dietNoteDraft, setDietNoteDraft] = useState("");
  const [savingDiet, setSavingDiet] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Frukostleverans";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.title = previousTitle;
      meta.remove();
    };
  }, []);

  const ordersByDate = useMemo(() => {
    const map = new Map<string, BreakfastOrder[]>();
    for (const order of orders) {
      map.set(order.date, [...(map.get(order.date) ?? []), order]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const aNo = TENT_BY_ID[a.tentIds[0]]?.no ?? 99;
        const bNo = TENT_BY_ID[b.tentIds[0]]?.no ?? 99;
        return aNo - bNo || a.kind.localeCompare(b.kind);
      });
    }
    return map;
  }, [orders]);

  const dayOrders = ordersByDate.get(date) ?? [];
  const breakfastCount = dayOrders
    .filter((order) => order.kind === "breakfast")
    .reduce((sum, order) => sum + order.quantity, 0);
  const fikaCount = dayOrders
    .filter((order) => order.kind === "fikapase")
    .reduce((sum, order) => sum + order.quantity, 0);
  const totalPortions = dayOrders.reduce((sum, order) => sum + order.quantity, 0);
  const undeliveredPortions = dayOrders
    .filter((order) => order.delivery?.status !== "delivered")
    .reduce((sum, order) => sum + order.quantity, 0);

  const nextDelivery = useMemo(() => {
    const sorted = Array.from(ordersByDate.entries()).sort(([a], [b]) => a.localeCompare(b));
    for (const [deliveryDate, list] of sorted) {
      const remaining = list.filter((order) => order.delivery?.status !== "delivered");
      if (remaining.length === 0) continue;
      return {
        date: deliveryDate,
        breakfast: remaining
          .filter((order) => order.kind === "breakfast")
          .reduce((sum, order) => sum + order.quantity, 0),
        fika: remaining
          .filter((order) => order.kind === "fikapase")
          .reduce((sum, order) => sum + order.quantity, 0),
        total: remaining.length,
      };
    }
    return null;
  }, [ordersByDate]);

  const openDietEditor = (order: BreakfastOrder) => {
    setDietDraft(order.dietary ?? []);
    setDietNoteDraft(order.dietaryNote ?? "");
    setEditDiet(order);
  };

  const saveDiet = async () => {
    if (!editDiet) return;
    setSavingDiet(true);
    try {
      for (const tentId of editDiet.tentIds) {
        const { error } = await (supabase as any).rpc("set_stay_dietary", {
          p_booking_number: editDiet.bookingNumber,
          p_tent_id: tentId,
          p_dietary: dietDraft,
          p_dietary_note: dietNoteDraft || null,
        });
        if (error) throw error;
      }
      toast.success("Kostanpassning sparad");
      setEditDiet(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunde inte spara kostanpassningen.");
    } finally {
      setSavingDiet(false);
    }
  };

  const deliver = async () => {
    if (!confirm) return;
    setSubmitting(true);
    try {
      await markDelivered(confirm);
      toast.success("Levererat – SMS hanterat.");
      setConfirm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunde inte markera leveransen.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Laddar…</div>;
  if (!user) return <BreakfastLogin />;
  if (!isBreakfast) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-sm">Du har inte frukostbehörighet.</p>
        <Button variant="outline" onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> Logga ut</Button>
      </div>
    );
  }

  const calendarCells = buildMonthCells(calendarMonth);
  const monthLabel = calendarMonth.toLocaleDateString("sv-SE", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="h-6 w-6 text-primary" />
            <h1 className="font-serif text-2xl">Frukostleverans</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-1" /> Logga ut</Button>
        </header>

        <p className="text-sm text-muted-foreground">
          Här ser du vilka tält som ska ha frukost eller fikapåse. När du tryckt ”Levererat” går ett SMS till gästen.
        </p>

        {nextDelivery && (() => {
          const deliveryDate = new Date(`${nextDelivery.date}T12:00:00`);
          const todayDate = new Date(`${today}T12:00:00`);
          const diffDays = Math.round((deliveryDate.getTime() - todayDate.getTime()) / 86_400_000);
          const whenLabel = diffDays === 0 ? "Idag" : diffDays === 1 ? "Imorgon" : `om ${diffDays} dagar`;
          return (
            <button
              onClick={() => { setDate(nextDelivery.date); setView("day"); }}
              className="w-full text-left rounded-xl border-2 border-primary/40 bg-primary/10 p-4 hover:bg-primary/15 transition shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2.5 shrink-0"><CalendarDays className="h-5 w-5 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">Nästa leverans</div>
                  <div className="font-serif text-lg leading-tight capitalize truncate">{prettyDate(nextDelivery.date)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{whenLabel}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-primary leading-none">{nextDelivery.total}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">leveranser</div>
                </div>
              </div>
              <div className="flex gap-3 mt-3 pt-3 border-t border-primary/20 text-xs">
                {nextDelivery.breakfast > 0 && <span className="flex items-center gap-1.5"><Croissant className="h-3.5 w-3.5 text-amber-700" /><strong>{nextDelivery.breakfast}</strong> frukostportioner</span>}
                {nextDelivery.fika > 0 && <span className="flex items-center gap-1.5"><Leaf className="h-3.5 w-3.5 text-emerald-700" /><strong>{nextDelivery.fika}</strong> fikapåsar</span>}
              </div>
            </button>
          );
        })()}

        <div className="flex gap-2">
          <Button variant={view === "day" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setView("day")}>Dagsvy</Button>
          <Button variant={view === "calendar" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setView("calendar")}>Kalender</Button>
        </div>

        {view === "calendar" ? (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>‹</Button>
                <div className="font-medium capitalize">{monthLabel}</div>
                <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>›</Button>
              </div>
              <div className="grid grid-cols-7 gap-1.5 text-xs text-muted-foreground text-center font-medium">
                {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((name) => <div key={name} className="py-1">{name}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {calendarCells.map((cell, index) => {
                  if (!cell) return <div key={`empty-${index}`} className="min-h-[64px]" />;
                  const key = formatDate(cell);
                  const list = ordersByDate.get(key) ?? [];
                  const breakfast = list.filter((order) => order.kind === "breakfast").reduce((sum, order) => sum + order.quantity, 0);
                  const fika = list.filter((order) => order.kind === "fikapase").reduce((sum, order) => sum + order.quantity, 0);
                  const hasWork = list.length > 0;
                  return (
                    <button
                      key={key}
                      onClick={() => { setDate(key); setView("day"); }}
                      className={`min-h-[64px] rounded-lg border p-1.5 flex flex-col items-center justify-between text-xs transition hover:bg-muted active:scale-95 ${key === today ? "ring-2 ring-primary" : ""} ${hasWork ? "bg-primary/10 border-primary/40" : "border-border/60"}`}
                    >
                      <span className={`text-sm font-semibold ${hasWork || key === today ? "text-primary" : ""}`}>{cell.getDate()}</span>
                      {hasWork && <div className="flex gap-1">{breakfast > 0 && <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700"><Croissant className="h-2.5 w-2.5" />{breakfast}</span>}{fika > 0 && <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700"><Leaf className="h-2.5 w-2.5" />{fika}</span>}</div>}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground justify-center pt-2 border-t">
                <span className="flex items-center gap-1.5"><Croissant className="h-3.5 w-3.5 text-amber-700" /> Frukostportioner</span>
                <span className="flex items-center gap-1.5"><Leaf className="h-3.5 w-3.5 text-emerald-700" /> Fikapåsar</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <Button variant="outline" size="icon" onClick={() => setDate(addDays(date, -1))}><ChevronLeft className="h-4 w-4" /></Button>
                  <div className="text-center flex-1"><div className="font-medium capitalize">{prettyDate(date)}</div><div className="text-xs text-muted-foreground">{date}</div></div>
                  <Button variant="outline" size="icon" onClick={() => setDate(addDays(date, 1))}><ChevronRight className="h-4 w-4" /></Button>
                </div>
                <div className="flex justify-center gap-2 mt-3">
                  <Button variant={date === today ? "default" : "outline"} size="sm" onClick={() => setDate(today)}>Idag</Button>
                  <Button variant={date === addDays(today, 1) ? "default" : "outline"} size="sm" onClick={() => setDate(addDays(today, 1))}>Imorgon</Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-amber-50 border-amber-200"><CardContent className="pt-4"><div className="flex items-center gap-1.5 text-[10px] text-amber-800 uppercase tracking-wide font-semibold"><Croissant className="h-3.5 w-3.5" /> Frukost</div><div className="text-3xl font-serif font-semibold text-amber-900">{breakfastCount}</div><div className="text-[10px] text-amber-700">portioner</div></CardContent></Card>
              <Card className="bg-emerald-50 border-emerald-200"><CardContent className="pt-4"><div className="flex items-center gap-1.5 text-[10px] text-emerald-800 uppercase tracking-wide font-semibold"><Leaf className="h-3.5 w-3.5" /> Fikapåsar</div><div className="text-3xl font-serif font-semibold text-emerald-900">{fikaCount}</div><div className="text-[10px] text-emerald-700">påsar</div></CardContent></Card>
              <Card className={undeliveredPortions > 0 ? "bg-primary/5 border-primary/30" : ""}><CardContent className="pt-4"><div className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Kvar att leverera</div><div className="text-3xl font-serif font-semibold">{undeliveredPortions}</div><div className="text-[10px] text-muted-foreground">av {totalPortions} portioner</div></CardContent></Card>
            </div>

            {dataLoading ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Laddar…</CardContent></Card>
            ) : dayOrders.length === 0 ? (
              <Card><CardContent className="pt-6 pb-6 text-center text-muted-foreground text-sm">Inga leveranser detta datum.</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {dayOrders.map((order) => {
                  const done = order.delivery?.status === "delivered";
                  const breakfast = order.kind === "breakfast";
                  return (
                    <Card key={order.key} className={done ? "bg-primary/5 border-primary/30" : ""}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap"><Badge className={breakfast ? "bg-amber-600" : "bg-emerald-700"}>{breakfast ? <><Croissant className="h-3 w-3 mr-1" /> Frukost</> : <><Leaf className="h-3 w-3 mr-1" /> Fikapåse</>}</Badge><span className="font-medium">{tentLabel(order.tentIds)}</span></div>
                            <div className="text-xs text-muted-foreground mt-1">{order.guestName ?? "Gäst"} • Bokning {order.bookingNumber}</div>
                          </div>
                          {done && <Badge variant="outline" className="border-primary text-primary shrink-0"><CheckCircle2 className="h-3 w-3 mr-1" /> Klar</Badge>}
                        </div>

                        {!breakfast && <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3"><Leaf className="h-6 w-6 text-emerald-700 shrink-0" /><div className="flex-1"><div className="text-[10px] uppercase tracking-wider text-emerald-800 font-semibold">Fikapåse</div><div className="text-sm font-medium text-emerald-900">{order.quantity} påsar – hämtas av mig hos Bostället</div><div className="text-xs text-muted-foreground">Behöver inte levereras till tältet.</div></div></div>}

                        {breakfast && <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3"><Users className="h-7 w-7 text-amber-700 shrink-0" /><div className="flex-1"><div className="text-[10px] uppercase tracking-wider text-amber-800 font-semibold">Portioner till tältet</div><div className="flex items-baseline gap-1.5"><span className="text-3xl font-bold text-amber-900 leading-none">{order.quantity}</span><span className="text-sm text-muted-foreground">personer</span></div>{(order.csvQuantity > 0 || order.addonQuantity > 0) && <div className="mt-1 flex flex-wrap gap-1.5 text-xs">{order.csvQuantity > 0 && <Badge variant="outline">Sirvoy: {order.csvQuantity}</Badge>}{order.addonQuantity > 0 && <Badge variant="outline">Webbtillägg: {order.addonQuantity}</Badge>}</div>}</div></div>}

                        {order.warning && <div className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-950"><div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{order.warning}</span></div></div>}

                        {(order.dietary.length > 0 || order.dietaryNote) ? (
                          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-700 shrink-0" /><div className="text-[11px] uppercase tracking-wider text-red-800 font-bold">Kostanpassning</div></div><Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openDietEditor(order)}><Pencil className="h-3 w-3 mr-1" /> Ändra</Button></div>
                            {order.dietary.length > 0 && <div className="flex flex-wrap gap-1.5">{order.dietary.map((id) => { const definition = DIET_BY_ID[id]; if (!definition) return <Badge key={id} variant="outline">{id}</Badge>; const Icon = definition.icon; return <Badge key={id} className="bg-red-100 text-red-900 hover:bg-red-100 border border-red-300"><Icon className="h-3 w-3 mr-1" />{definition.label}</Badge>; })}</div>}
                            {order.dietaryNote && <p className="text-sm text-red-900 font-medium leading-snug">”{order.dietaryNote}”</p>}
                          </div>
                        ) : (
                          <button onClick={() => openDietEditor(order)} className="w-full text-left text-xs text-muted-foreground border border-dashed rounded-lg p-2 hover:bg-muted/40 flex items-center gap-2"><Pencil className="h-3 w-3" /> Lägg till kostanpassning (gluten, vegan, allergi…)</button>
                        )}

                        {done ? <div className="text-xs text-muted-foreground">Levererat{order.delivery?.delivered_at ? ` ${new Date(order.delivery.delivered_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}` : ""}{order.delivery?.sms_status ? ` • SMS: ${order.delivery.sms_status}` : ""}</div> : <Button className="w-full" onClick={() => setConfirm(order)}><Send className="h-4 w-4 mr-2" /> Markera levererat</Button>}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <Card>
              <CardHeader><CardTitle className="text-base">Kommande dagar</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Array.from(ordersByDate.entries()).filter(([deliveryDate]) => deliveryDate !== date).slice(0, 10).map(([deliveryDate, list]) => {
                  const breakfast = list.filter((order) => order.kind === "breakfast").reduce((sum, order) => sum + order.quantity, 0);
                  const fika = list.filter((order) => order.kind === "fikapase").reduce((sum, order) => sum + order.quantity, 0);
                  return <button key={deliveryDate} onClick={() => setDate(deliveryDate)} className="w-full flex justify-between items-center border rounded p-2 hover:bg-muted/50 text-sm"><span className="capitalize">{prettyDate(deliveryDate)}</span><span className="text-muted-foreground text-xs flex items-center gap-2">{breakfast > 0 && <span className="flex items-center gap-1"><Croissant className="h-3 w-3 text-amber-700" />{breakfast}</span>}{fika > 0 && <span className="flex items-center gap-1"><Leaf className="h-3 w-3 text-emerald-700" />{fika}</span>}</span></button>;
                })}
                {ordersByDate.size <= 1 && <p className="text-xs text-muted-foreground">Inga fler beställningar de närmsta 60 dagarna.</p>}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Markera som levererat?</AlertDialogTitle><AlertDialogDescription>{confirm && <>{tentLabel(confirm.tentIds)} ({confirm.kind === "breakfast" ? `frukost för ${confirm.quantity} personer` : `${confirm.quantity} fikapåsar`}). Ett SMS skickas till gästen om leveransen.</>}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Avbryt</AlertDialogCancel><AlertDialogAction onClick={() => void deliver()} disabled={submitting}>{submitting ? "Skickar…" : "Bekräfta & skicka SMS"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editDiet} onOpenChange={(open) => !open && setEditDiet(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Kostanpassning</DialogTitle><DialogDescription>{editDiet && <>{tentLabel(editDiet.tentIds)} • Bokning {editDiet.bookingNumber}</>}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">{DIET_OPTIONS.map((option) => { const checked = dietDraft.includes(option.id); const Icon = option.icon; return <label key={option.id} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition ${checked ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}><Checkbox checked={checked} onCheckedChange={(value) => setDietDraft((previous) => value ? Array.from(new Set([...previous, option.id])) : previous.filter((item) => item !== option.id))} /><Icon className={`h-4 w-4 ${option.color}`} /><span className="text-sm font-medium">{option.label}</span></label>; })}</div>
            <div className="space-y-1.5"><Label htmlFor="diet-note" className="text-xs">Övriga allergier / kommentar</Label><Textarea id="diet-note" value={dietNoteDraft} onChange={(event) => setDietNoteDraft(event.target.value)} placeholder="T.ex. allergisk mot jordnötter" rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditDiet(null)} disabled={savingDiet}>Avbryt</Button><Button onClick={() => void saveDiet()} disabled={savingDiet}>{savingDiet ? "Sparar…" : "Spara"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
