import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBreakfast } from "@/hooks/useBreakfast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Coffee, LogOut, CheckCircle2, Send, ChevronLeft, ChevronRight,
  Users, CalendarDays, Croissant, Leaf, AlertTriangle, Pencil, Wheat, Sprout,
  Milk as MilkIcon, Nut,
} from "lucide-react";
import { TENT_BY_ID, todayInStockholm } from "@/cleaning/config";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const BREAKFAST_EMAIL = "Karin@bostallet.se";

function normalizeBreakfastPassword(password: string) {
  const normalized = password.trim().normalize("NFC").toLocaleLowerCase("sv-SE");
  return normalized === "bostället" || normalized === "bostallet" ? "bostället" : password;
}

const DIET_OPTIONS: { id: string; label: string; icon: typeof Wheat; color: string }[] = [
  { id: "gluten_free", label: "Glutenfritt", icon: Wheat, color: "text-amber-700" },
  { id: "vegan", label: "Veganskt", icon: Sprout, color: "text-emerald-700" },
  { id: "vegetarian", label: "Vegetariskt", icon: Leaf, color: "text-emerald-600" },
  { id: "lactose_free", label: "Laktosfritt", icon: MilkIcon, color: "text-sky-700" },
  { id: "nut_allergy", label: "Nötallergi", icon: Nut, color: "text-red-700" },
];
const DIET_BY_ID = Object.fromEntries(DIET_OPTIONS.map((d) => [d.id, d]));

type Stay = {
  booking_number: string;
  tent_id: string;
  checkin_date: string;
  checkout_date: string;
  guests: number;
  adults: number | null;
  children: number | null;
  breakfast: boolean;
  fikapase: boolean;
  guest_name: string | null;
  dietary: string[] | null;
  dietary_note: string | null;
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
  booking_number: string;
  tent_id: string;
  tentNo: number;
  tentName: string;
  guestName: string | null;
  guests: number;
  children: number;
  kind: "breakfast" | "fikapase";
  deliveryDate: string;
  dietary: string[];
  dietaryNote: string | null;
  delivered?: Delivery;
};

function LoginForm() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: BREAKFAST_EMAIL,
      password: normalizeBreakfastPassword(pw),
    });
    setBusy(false);
    if (error) toast.error("Fel lösenord");
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Coffee className="h-8 w-8 mx-auto text-primary" />
          <CardTitle>Frukostleverans</CardTitle>
          <p className="text-sm text-muted-foreground">
            Logga in med lösenordet <strong>bostället</strong>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label>Lösenord</Label>
              <Input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoFocus
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>Logga in</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: string, n: number): string {
  const dt = new Date(d + "T12:00:00");
  dt.setDate(dt.getDate() + n);
  return fmtDate(dt);
}

function prettyDate(d: string): string {
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });
}

export default function Breakfast() {
  const { user, isBreakfast, loading, signOut } = useBreakfast();
  const today = todayInStockholm();
  const [view, setView] = useState<"day" | "calendar">("day");
  const [date, setDate] = useState<string>(today);
  const [calMonth, setCalMonth] = useState<Date>(() => { const d = new Date(); d.setDate(1); return d; });
  const [stays, setStays] = useState<Stay[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [confirm, setConfirm] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [upcomingWindow, setUpcomingWindow] = useState(45);
  const [editDiet, setEditDiet] = useState<Order | null>(null);
  const [dietDraft, setDietDraft] = useState<string[]>([]);
  const [dietNoteDraft, setDietNoteDraft] = useState<string>("");
  const [savingDiet, setSavingDiet] = useState(false);

  const openDietEditor = (o: Order) => {
    setDietDraft(o.dietary ?? []);
    setDietNoteDraft(o.dietaryNote ?? "");
    setEditDiet(o);
  };

  const saveDiet = async () => {
    if (!editDiet) return;
    setSavingDiet(true);
    try {
      const { error } = await (supabase as any).rpc("set_stay_dietary", {
        p_booking_number: editDiet.booking_number,
        p_tent_id: editDiet.tent_id,
        p_dietary: dietDraft,
        p_dietary_note: dietNoteDraft || null,
      });
      if (error) throw error;
      toast.success("Kostanpassning sparad");
      setEditDiet(null);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte spara");
    } finally {
      setSavingDiet(false);
    }
  };

  const load = async () => {
    const { data: stayRows } = await (supabase as any)
      .from("tent_stays")
      .select("booking_number, tent_id, checkin_date, checkout_date, guests, adults, children, breakfast, fikapase, guest_name, dietary, dietary_note")
      .or("breakfast.eq.true,fikapase.eq.true")
      .gte("checkout_date", today)
      .lte("checkin_date", addDays(today, upcomingWindow));
    setStays((stayRows ?? []) as Stay[]);

    const { data: delRows } = await (supabase as any)
      .from("breakfast_deliveries")
      .select("booking_number, delivery_date, kind, status, sms_status, delivered_at")
      .gte("delivery_date", today)
      .lte("delivery_date", addDays(today, upcomingWindow));
    setDeliveries((delRows ?? []) as Delivery[]);
  };

  useEffect(() => {
    if (isBreakfast) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBreakfast, upcomingWindow]);

  // Build orders for every day in the window
  const ordersByDate = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (let i = 0; i < upcomingWindow; i++) {
      const d = addDays(today, i);
      const list: Order[] = [];
      stays.forEach((s) => {
        const tent = TENT_BY_ID[s.tent_id];
        if (!tent) return;
        // Frukost levereras på utcheckningsdagen.
        if (s.breakfast && d === s.checkout_date) {
          list.push({
            key: `${s.booking_number}_${d}_breakfast`,
            booking_number: s.booking_number,
            tent_id: s.tent_id,
            tentNo: tent.no,
            tentName: tent.name,
            guestName: s.guest_name,
            guests: s.guests ?? s.adults ?? 0,
            children: s.children ?? 0,
            kind: "breakfast",
            deliveryDate: d,
            dietary: s.dietary ?? [],
            dietaryNote: s.dietary_note ?? null,
            delivered: deliveries.find((x) => x.booking_number === s.booking_number && x.delivery_date === d && x.kind === "breakfast"),
          });
        }
        // Fikapåse levereras på incheckningsdagen.
        if (s.fikapase && d === s.checkin_date) {
          list.push({
            key: `${s.booking_number}_${d}_fikapase`,
            booking_number: s.booking_number,
            tent_id: s.tent_id,
            tentNo: tent.no,
            tentName: tent.name,
            guestName: s.guest_name,
            guests: s.guests ?? s.adults ?? 0,
            children: s.children ?? 0,
            kind: "fikapase",
            deliveryDate: d,
            dietary: s.dietary ?? [],
            dietaryNote: s.dietary_note ?? null,
            delivered: deliveries.find((x) => x.booking_number === s.booking_number && x.delivery_date === d && x.kind === "fikapase"),
          });
        }
      });
      list.sort((a, b) => a.tentNo - b.tentNo || (a.kind === "breakfast" ? -1 : 1));
      if (list.length) map.set(d, list);
    }
    return map;
  }, [stays, deliveries, today, upcomingWindow]);

  const dayOrders = ordersByDate.get(date) ?? [];
  const breakfastCount = dayOrders.filter((o) => o.kind === "breakfast").reduce((sum, o) => sum + o.guests, 0);
  const fikaCount = dayOrders.filter((o) => o.kind === "fikapase").length;
  const undeliveredCount = dayOrders.filter((o) => o.delivered?.status !== "delivered").length;

  // Next upcoming delivery date (the soonest day that still has work)
  const nextDelivery = useMemo(() => {
    const sorted = Array.from(ordersByDate.entries()).sort(([a], [b]) => a.localeCompare(b));
    for (const [d, list] of sorted) {
      const remaining = list.filter((o) => o.delivered?.status !== "delivered");
      if (remaining.length > 0) {
        const bf = remaining.filter((x) => x.kind === "breakfast").reduce((s, x) => s + x.guests, 0);
        const fk = remaining.filter((x) => x.kind === "fikapase").length;
        return { date: d, breakfast: bf, fika: fk, total: remaining.length };
      }
    }
    return null;
  }, [ordersByDate]);

  const doDeliver = async () => {
    if (!confirm) return;
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-breakfast-delivered`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        },
        body: JSON.stringify({
          booking_number: confirm.booking_number,
          delivery_date: confirm.deliveryDate,
          kind: confirm.kind,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Kunde inte markera levererat");
      toast.success(json.sms_status === "sent" ? "✓ Levererat – SMS skickat" : `Levererat (SMS: ${json.sms_status})`);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
      setConfirm(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Laddar...</div>;
  }
  if (!user) return <LoginForm />;
  if (!isBreakfast) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-sm">Du har inte frukost-behörighet.</p>
        <Button variant="outline" onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> Logga ut</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="h-6 w-6 text-primary" />
            <h1 className="font-serif text-2xl">Frukostleverans</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-1" /> Logga ut
          </Button>
        </header>

        <p className="text-sm text-muted-foreground">
          Här ser du vilka tält som ska ha frukost eller fikapåse. När du tryckt "Levererat" går ett SMS till gästen.
        </p>

        {/* Next delivery banner */}
        {nextDelivery && (() => {
          const nd = new Date(nextDelivery.date + "T12:00:00");
          const td = new Date(today + "T12:00:00");
          const diffDays = Math.round((nd.getTime() - td.getTime()) / 86400000);
          const whenLabel = diffDays === 0
            ? "Idag"
            : diffDays === 1
              ? "Imorgon"
              : `om ${diffDays} dagar`;
          return (
            <button
              onClick={() => { setDate(nextDelivery.date); setView("day"); }}
              className="w-full text-left rounded-xl border-2 border-primary/40 bg-primary/10 p-4 hover:bg-primary/15 transition shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2.5 shrink-0">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
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
                {nextDelivery.breakfast > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Croissant className="h-3.5 w-3.5 text-amber-700" />
                    <strong>{nextDelivery.breakfast}</strong> frukostportioner
                  </span>
                )}
                {nextDelivery.fika > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Leaf className="h-3.5 w-3.5 text-emerald-700" />
                    <strong>{nextDelivery.fika}</strong> fikapåsar
                  </span>
                )}
              </div>
            </button>
          );
        })()}

        {/* View toggle */}
        <div className="flex gap-2">
          <Button
            variant={view === "day" ? "default" : "outline"}
            size="sm" className="flex-1"
            onClick={() => setView("day")}
          >Dagsvy</Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm" className="flex-1"
            onClick={() => setView("calendar")}
          >Kalender</Button>
        </div>

        {view === "calendar" ? (
          (() => {
            const year = calMonth.getFullYear();
            const month = calMonth.getMonth();
            const first = new Date(year, month, 1);
            const last = new Date(year, month + 1, 0);
            const startOffset = (first.getDay() + 6) % 7; // Monday = 0
            const cells: (Date | null)[] = [];
            for (let i = 0; i < startOffset; i++) cells.push(null);
            for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
            while (cells.length % 7 !== 0) cells.push(null);
            const monthLabel = first.toLocaleDateString("sv-SE", { month: "long", year: "numeric" });
            const dayNames = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
            const fmt = (d: Date) =>
              `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            return (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setCalMonth(new Date(year, month - 1, 1))}>‹</Button>
                    <div className="font-medium capitalize">{monthLabel}</div>
                    <Button variant="ghost" size="sm" onClick={() => setCalMonth(new Date(year, month + 1, 1))}>›</Button>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 text-xs text-muted-foreground text-center font-medium">
                    {dayNames.map((n) => <div key={n} className="py-1">{n}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {cells.map((d, i) => {
                      if (!d) return <div key={i} className="min-h-[64px]" />;
                      const key = fmt(d);
                      const list = ordersByDate.get(key) ?? [];
                      const bf = list.filter((x) => x.kind === "breakfast").reduce((s, x) => s + x.guests, 0);
                      const fk = list.filter((x) => x.kind === "fikapase").length;
                      const work = list.length;
                      const isToday = key === today;
                      return (
                        <button
                          key={i}
                          onClick={() => { setDate(key); setView("day"); }}
                          className={`min-h-[64px] rounded-lg border p-1.5 flex flex-col items-center justify-between text-xs transition hover:bg-muted active:scale-95 ${isToday ? "ring-2 ring-primary" : ""} ${work > 0 ? "bg-primary/10 border-primary/40" : "border-border/60"}`}
                        >
                          <span className={`text-sm font-semibold ${work > 0 || isToday ? "text-primary" : ""}`}>{d.getDate()}</span>
                          {work > 0 && (
                            <div className="flex flex-col items-center gap-0.5 w-full">
                              <div className="flex gap-1">
                                {bf > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-500">
                                    <Croissant className="h-2.5 w-2.5" />{bf}
                                  </span>
                                )}
                                {fk > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                    <Leaf className="h-2.5 w-2.5" />{fk}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
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
            );
          })()
        ) : (
          <>
            {/* Date navigator */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <Button variant="outline" size="icon" onClick={() => setDate(addDays(date, -1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-center flex-1">
                    <div className="font-medium capitalize">{prettyDate(date)}</div>
                    <div className="text-xs text-muted-foreground">{date}</div>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setDate(addDays(date, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-center gap-2 mt-3">
                  <Button variant={date === today ? "default" : "outline"} size="sm" onClick={() => setDate(today)}>Idag</Button>
                  <Button variant={date === addDays(today, 1) ? "default" : "outline"} size="sm" onClick={() => setDate(addDays(today, 1))}>Imorgon</Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-800 dark:text-amber-300 uppercase tracking-wide font-semibold">
                    <Croissant className="h-3.5 w-3.5" /> Frukost
                  </div>
                  <div className="text-3xl font-serif font-semibold text-amber-900 dark:text-amber-200">{breakfastCount}</div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400">portioner</div>
                </CardContent>
              </Card>
              <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 dark:text-emerald-300 uppercase tracking-wide font-semibold">
                    <Leaf className="h-3.5 w-3.5" /> Fikapåsar
                  </div>
                  <div className="text-3xl font-serif font-semibold text-emerald-900 dark:text-emerald-200">{fikaCount}</div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400">påsar</div>
                </CardContent>
              </Card>
              <Card className={undeliveredCount > 0 ? "bg-primary/5 border-primary/30" : ""}>
                <CardContent className="pt-4">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Kvar att leverera</div>
                  <div className="text-3xl font-serif font-semibold">{undeliveredCount}</div>
                  <div className="text-[10px] text-muted-foreground">av {dayOrders.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Orders */}
            {dayOrders.length === 0 ? (
              <Card>
                <CardContent className="pt-6 pb-6 text-center text-muted-foreground text-sm">
                  Inga leveranser detta datum.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {dayOrders.map((o) => {
                  const done = o.delivered?.status === "delivered";
                  const isBreakfast = o.kind === "breakfast";
                  return (
                    <Card key={o.key} className={done ? "bg-primary/5 border-primary/30" : ""}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={isBreakfast ? "bg-amber-600 hover:bg-amber-600" : "bg-emerald-700 hover:bg-emerald-700"}>
                                {isBreakfast ? <><Croissant className="h-3 w-3 mr-1" /> Frukost</> : <><Leaf className="h-3 w-3 mr-1" /> Fikapåse</>}
                              </Badge>
                              <span className="font-medium">Tält {o.tentNo} – {o.tentName}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {o.guestName ?? "Gäst"} • Bokning {o.booking_number}
                            </div>
                          </div>
                          {done && (
                            <Badge variant="outline" className="border-primary text-primary shrink-0">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Klar
                            </Badge>
                          )}
                        </div>

                        {/* Fikapåse: hämtas av mig hos Bostället — behöver inte levereras */}
                        {!isBreakfast && (
                          <div className="flex items-center gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-3">
                            <Leaf className="h-6 w-6 text-emerald-700 dark:text-emerald-400 shrink-0" />
                            <div className="flex-1">
                              <div className="text-[10px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-semibold">Fikapåse</div>
                              <div className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Hämtas av mig hos Bostället</div>
                              <div className="text-xs text-muted-foreground">Behöver inte levereras till tältet.</div>
                            </div>
                          </div>
                        )}

                        {/* Prominent guest count for breakfast */}
                        {isBreakfast && (
                          <div className="flex items-center gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3">
                            <Users className="h-7 w-7 text-amber-700 dark:text-amber-400 shrink-0" />
                            <div className="flex-1">
                              <div className="text-[10px] uppercase tracking-wider text-amber-800 dark:text-amber-300 font-semibold">Portioner till tältet</div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-bold text-amber-900 dark:text-amber-200 leading-none">{o.guests}</span>
                                <span className="text-sm text-muted-foreground">personer</span>
                                {o.children > 0 && (
                                  <span className="text-xs text-muted-foreground ml-1">({o.children} barn)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}


                        {/* Dietary needs – prominent so Karin never misses them */}
                        {(o.dietary.length > 0 || o.dietaryNote) ? (
                          <div className="rounded-lg border-2 border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-700 dark:text-red-400 shrink-0" />
                                <div className="text-[11px] uppercase tracking-wider text-red-800 dark:text-red-300 font-bold">Kostanpassning</div>
                              </div>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openDietEditor(o)}>
                                <Pencil className="h-3 w-3 mr-1" /> Ändra
                              </Button>
                            </div>
                            {o.dietary.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {o.dietary.map((id) => {
                                  const def = DIET_BY_ID[id];
                                  if (!def) return <Badge key={id} variant="outline">{id}</Badge>;
                                  const Icon = def.icon;
                                  return (
                                    <Badge key={id} className="bg-red-100 text-red-900 hover:bg-red-100 border border-red-300 dark:bg-red-900/40 dark:text-red-100 dark:border-red-800">
                                      <Icon className="h-3 w-3 mr-1" />{def.label}
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                            {o.dietaryNote && (
                              <p className="text-sm text-red-900 dark:text-red-100 font-medium leading-snug">
                                "{o.dietaryNote}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => openDietEditor(o)}
                            className="w-full text-left text-xs text-muted-foreground border border-dashed rounded-lg p-2 hover:bg-muted/40 flex items-center gap-2"
                          >
                            <Pencil className="h-3 w-3" /> Lägg till kostanpassning (gluten, vegan, allergi…)
                          </button>
                        )}


                        {done ? (
                          <div className="text-xs text-muted-foreground">
                            Levererat{o.delivered?.delivered_at ? ` ${new Date(o.delivered.delivered_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}` : ""}
                            {o.delivered?.sms_status && ` • SMS: ${o.delivered.sms_status}`}
                          </div>
                        ) : (
                          <Button className="w-full" onClick={() => setConfirm(o)}>
                            <Send className="h-4 w-4 mr-2" /> Markera levererat
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Future dates summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kommande dagar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from(ordersByDate.entries())
                  .filter(([d]) => d !== date)
                  .slice(0, 10)
                  .map(([d, list]) => {
                    const bf = list.filter((x) => x.kind === "breakfast").reduce((s, x) => s + x.guests, 0);
                    const fk = list.filter((x) => x.kind === "fikapase").length;
                    return (
                      <button
                        key={d}
                        onClick={() => setDate(d)}
                        className="w-full flex justify-between items-center border rounded p-2 hover:bg-muted/50 text-sm"
                      >
                        <span className="capitalize">{prettyDate(d)}</span>
                        <span className="text-muted-foreground text-xs flex items-center gap-2">
                          {bf > 0 && <span className="flex items-center gap-1"><Croissant className="h-3 w-3 text-amber-700" />{bf}</span>}
                          {fk > 0 && <span className="flex items-center gap-1"><Leaf className="h-3 w-3 text-emerald-700" />{fk}</span>}
                        </span>
                      </button>
                    );
                  })}
                {ordersByDate.size <= 1 && (
                  <p className="text-xs text-muted-foreground">Inga fler beställningar de närmsta {upcomingWindow} dagarna.</p>
                )}
                <div className="flex justify-center pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setUpcomingWindow((w) => w + 14)}>
                    Visa fler dagar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Markera som levererat?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm && (
                <>
                  Tält {confirm.tentNo} – {confirm.tentName} ({confirm.kind === "breakfast" ? `frukost för ${confirm.guests} pers` : "fikapåse"}).
                  Ett SMS skickas till gästen om att leveransen är i backen.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={doDeliver} disabled={submitting}>
              {submitting ? "Skickar..." : "Bekräfta & skicka SMS"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editDiet} onOpenChange={(open) => !open && setEditDiet(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kostanpassning</DialogTitle>
            <DialogDescription>
              {editDiet && <>Tält {editDiet.tentNo} – {editDiet.tentName} • Bokning {editDiet.booking_number}</>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {DIET_OPTIONS.map((opt) => {
                const checked = dietDraft.includes(opt.id);
                const Icon = opt.icon;
                return (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition ${checked ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        setDietDraft((prev) => v ? [...prev, opt.id] : prev.filter((x) => x !== opt.id));
                      }}
                    />
                    <Icon className={`h-4 w-4 ${opt.color}`} />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                );
              })}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="diet-note" className="text-xs">Övriga allergier / kommentar</Label>
              <Textarea
                id="diet-note"
                value={dietNoteDraft}
                onChange={(e) => setDietNoteDraft(e.target.value)}
                placeholder="T.ex. 'Allergisk mot jordnötter, ej skaldjur'"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDiet(null)} disabled={savingDiet}>Avbryt</Button>
            <Button onClick={saveDiet} disabled={savingDiet}>{savingDiet ? "Sparar..." : "Spara"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
