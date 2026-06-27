import { AlertTriangle, Send, Users } from "lucide-react";
import { TENT_BY_ID, type TentMeta } from "@/cleaning/config";
import type { BreakfastOrder } from "@/lib/breakfast-orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DIETARY_LABELS: Record<string, string> = {
  gluten_free: "Glutenfritt",
  vegan: "Veganskt",
  vegetarian: "Vegetariskt",
  lactose_free: "Laktosfritt",
  nut_allergy: "Nötallergi",
};

export function breakfastTentLabel(tentIds: string[]) {
  return tentIds
    .map((id) => TENT_BY_ID[id])
    .filter((tent): tent is TentMeta => !!tent)
    .sort((a, b) => a.no - b.no)
    .map((tent) => `Tält ${tent.no} – ${tent.name}`)
    .join(" + ");
}

export function BreakfastOrderCard({ order, onDeliver }: { order: BreakfastOrder; onDeliver: (order: BreakfastOrder) => void }) {
  const isBreakfast = order.kind === "breakfast";
  const done = order.delivery?.status === "delivered";

  return (
    <Card className={done ? "border-primary/30 bg-primary/5" : ""}>
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={isBreakfast ? "bg-amber-600" : "bg-emerald-700"}>{isBreakfast ? "Frukost" : "Fikapåse"}</Badge>
              <span className="font-medium">{breakfastTentLabel(order.tentIds)}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{order.guestName ?? "Gäst"} • Bokning {order.bookingNumber}</div>
          </div>
          {done && <Badge variant="outline">Klar</Badge>}
        </div>

        <div className={`rounded-lg border p-3 ${isBreakfast ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20" : "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20"}`}>
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7" />
            <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Leverera detta datum</div><div className="text-3xl font-bold">{order.quantity}</div></div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {order.csvQuantity > 0 && <Badge variant="outline">Sirvoy CSV: {order.csvQuantity}</Badge>}
            {order.addonQuantity > 0 && <Badge variant="outline">Webbtillägg: {order.addonQuantity}</Badge>}
          </div>
        </div>

        {order.warning && <div className="flex gap-2 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-950"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{order.warning}</span></div>}
        {(order.dietary.length > 0 || order.dietaryNote) && (
          <div className="rounded-lg border-2 border-red-500 bg-red-50 p-3 text-sm text-red-950">
            <strong>VIKTIG KOSTANPASSNING:</strong> {[...order.dietary.map((id) => DIETARY_LABELS[id] ?? id), order.dietaryNote].filter(Boolean).join(" • ")}
          </div>
        )}

        {done ? (
          <div className="text-xs text-muted-foreground">Levererat {order.delivery?.delivered_at ? new Date(order.delivery.delivered_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }) : ""}</div>
        ) : (
          <Button className="w-full" onClick={() => onDeliver(order)}><Send className="mr-2 h-4 w-4" /> Markera levererat</Button>
        )}
      </CardContent>
    </Card>
  );
}
