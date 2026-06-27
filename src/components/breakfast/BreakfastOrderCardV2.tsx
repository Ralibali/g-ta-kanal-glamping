import { AlertTriangle, CheckCircle2, ChefHat, MessageSquareWarning, Send } from "lucide-react";
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

function time(value: string | null | undefined) {
  return value ? new Date(value).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }) : "";
}

function smsLabel(status: string | null | undefined) {
  if (status === "sent") return "SMS skickat";
  if (status === "queued") return "SMS köat";
  if (status === "failed") return "SMS kunde inte skickas";
  if (status === "skipped") return "Inget SMS skickades";
  return null;
}

export function breakfastTentLabelV2(tentIds: string[]) {
  return tentIds
    .map((id) => TENT_BY_ID[id])
    .filter((tent): tent is TentMeta => !!tent)
    .sort((a, b) => a.no - b.no)
    .map((tent) => `Tält ${tent.no} – ${tent.name}`)
    .join(" + ");
}

export function BreakfastOrderCardV2({
  order,
  onPrepare,
  onDeliver,
}: {
  order: BreakfastOrder;
  onPrepare: (order: BreakfastOrder) => void;
  onDeliver: (order: BreakfastOrder) => void;
}) {
  const isBreakfast = order.kind === "breakfast";
  const delivered = order.delivery?.status === "delivered";
  const prepared = order.delivery?.status === "prepared";
  const changedAfterPrepared = prepared && order.delivery?.prepared_quantity != null && order.delivery.prepared_quantity !== order.quantity;
  const sms = smsLabel(order.delivery?.sms_status);

  return (
    <Card className={delivered ? "border-primary/30 bg-primary/5" : prepared ? "border-blue-300 bg-blue-50/50" : ""}>
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold">{breakfastTentLabelV2(order.tentIds)}</div>
            <div className="text-sm text-muted-foreground">{order.guestName ?? "Gäst"}</div>
          </div>
          <Badge className={isBreakfast ? "bg-amber-600" : "bg-emerald-700"}>{isBreakfast ? "Frukost" : "Fikapåse"}</Badge>
        </div>

        <div className={`rounded-lg border p-4 text-center ${isBreakfast ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
          <div className="text-sm text-muted-foreground">Antal</div>
          <div className="text-4xl font-bold">{order.quantity}</div>
        </div>

        {order.warning && <div className="flex gap-2 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-950"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{order.warning}</span></div>}
        {changedAfterPrepared && <div className="flex gap-2 rounded-lg border-2 border-orange-500 bg-orange-50 p-3 text-sm font-medium text-orange-950"><MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0" /><span>Antalet har ändrats efter förberedelsen. Kontrollera leveransen igen.</span></div>}
        {(order.dietary.length > 0 || order.dietaryNote) && (
          <div className="rounded-lg border-2 border-red-500 bg-red-50 p-3 text-sm text-red-950">
            <strong>SPECIALKOST/ALLERGI:</strong> {[...order.dietary.map((id) => DIETARY_LABELS[id] ?? id), order.dietaryNote].filter(Boolean).join(" • ")}
          </div>
        )}

        {delivered ? (
          <div className="rounded-lg bg-primary/5 p-3 text-sm">
            <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" /> Levererad {time(order.delivery?.delivered_at)}</div>
            {sms && <div className="mt-1 text-xs text-muted-foreground">{sms}</div>}
          </div>
        ) : prepared ? (
          <Button className="w-full" size="lg" onClick={() => onDeliver(order)}><Send className="mr-2 h-4 w-4" /> Levererad – skicka SMS</Button>
        ) : (
          <Button className="w-full" size="lg" variant="secondary" onClick={() => onPrepare(order)}><ChefHat className="mr-2 h-4 w-4" /> Förberedd</Button>
        )}
      </CardContent>
    </Card>
  );
}
