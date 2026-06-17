import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBreakfast } from "@/hooks/useBreakfast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, LogOut, CheckCircle2, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { TENT_BY_ID, todayInStockholm } from "@/cleaning/config";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BREAKFAST_EMAIL = "frukost@goglampingsweden.se";

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
  kind: "breakfast" | "fikapase";
  deliveryDate: string;
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
      password: pw,
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
            Logga in med lösenordet <strong>karin</strong>
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
  const [date, setDate] = useState<string>(today);
  const [stays, setStays] = useState<Stay[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [confirm, setConfirm] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [upcomingWindow, setUpcomingWindow] = useState(14);

  const load = async () => {
    // For the breakfast app, deliver date = the night spent → we serve breakfast on each night from checkin to (checkout-1)
    // Simpler: show orders for the selected date if it falls within [checkin, checkout-1]
    const { data: stayRows } = await (supabase as any)
      .from("tent_stays")
      .select("booking_number, tent_id, checkin_date, checkout_date, guests, adults, children, breakfast, fikapase, guest_name")
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

  // Build orders for the selected date
  const ordersByDate = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (let i = 0; i < upcomingWindow; i++) {
      const d = addDays(today, i);
      const list: Order[] = [];
      stays.forEach((s) => {
        // Breakfast is served on each morning from checkin_date+1 up to checkout_date (you stay night → breakfast next morning)
        // Common practice: breakfast is served the morning(s) of the stay. We'll serve from checkin_date+1 to checkout_date inclusive
        // Actually most glamping serves breakfast the morning(s) you wake up there:
        // if checkin = Mon, checkout = Wed → breakfast Tue & Wed.
        if (d <= s.checkin_date || d > s.checkout_date) return;
        const tent = TENT_BY_ID[s.tent_id];
        if (!tent) return;
        if (s.breakfast) {
          const k = `${s.booking_number}_${d}_breakfast`;
          list.push({
            key: k,
            booking_number: s.booking_number,
            tent_id: s.tent_id,
            tentNo: tent.no,
            tentName: tent.name,
            guestName: s.guest_name,
            guests: s.guests ?? s.adults ?? 0,
            kind: "breakfast",
            deliveryDate: d,
            delivered: deliveries.find((x) => x.booking_number === s.booking_number && x.delivery_date === d && x.kind === "breakfast"),
          });
        }
        // Fikapåse: levereras en gång under vistelsen, helst första dagen (checkin_date+1 om endast en frukost-dag, annars samma logik). Vi visar på första morgonen.
        if (s.fikapase) {
          const firstMorning = addDays(s.checkin_date, 1);
          if (d === firstMorning) {
            const k = `${s.booking_number}_${d}_fikapase`;
            list.push({
              key: k,
              booking_number: s.booking_number,
              tent_id: s.tent_id,
              tentNo: tent.no,
              tentName: tent.name,
              guestName: s.guest_name,
              guests: s.guests ?? s.adults ?? 0,
              kind: "fikapase",
              deliveryDate: d,
              delivered: deliveries.find((x) => x.booking_number === s.booking_number && x.delivery_date === d && x.kind === "fikapase"),
            });
          }
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
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Frukostportioner</div>
              <div className="text-3xl font-serif font-semibold">{breakfastCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Fikapåsar</div>
              <div className="text-3xl font-serif font-semibold">{fikaCount}</div>
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
              return (
                <Card key={o.key} className={done ? "bg-primary/5 border-primary/30" : ""}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={o.kind === "breakfast" ? "bg-amber-600" : "bg-emerald-700"}>
                            {o.kind === "breakfast" ? "🥐 Frukost" : "🌿 Fikapåse"}
                          </Badge>
                          <span className="font-medium">Tält {o.tentNo} – {o.tentName}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {o.guestName ?? "Gäst"} • Bokning {o.booking_number}
                          {o.kind === "breakfast" && ` • ${o.guests} pers`}
                        </div>
                      </div>
                      {done && (
                        <Badge variant="outline" className="border-primary text-primary">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Klar
                        </Badge>
                      )}
                    </div>
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
                    <span className="text-muted-foreground text-xs">
                      {bf > 0 && `🥐 ${bf}`} {fk > 0 && `🌿 ${fk}`}
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
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Markera som levererat?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm && (
                <>
                  Tält {confirm.tentNo} – {confirm.tentName} ({confirm.kind === "breakfast" ? "frukost" : "fikapåse"}).
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
    </div>
  );
}
