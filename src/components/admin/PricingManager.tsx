import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Save, Tent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const tents = [
  { id: 1, name: "Glamping Deluxe", price: "1 495 kr/natt", guests: "2 vuxna + 2 barn", description: "Stort tält med dubbelsäng, loungeområde och eget trädäck." },
  { id: 2, name: "Glamping Standard", price: "1 195 kr/natt", guests: "2 vuxna", description: "Mysigt tält med dubbelsäng och utsikt över ängarna." },
  { id: 3, name: "Glamping Familj", price: "1 795 kr/natt", guests: "2 vuxna + 3 barn", description: "Extra rymligt familjetält med flera sovplatser." },
];

export const PricingManager = () => {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif">Priser & Tält</h1>
          <p className="text-muted-foreground mt-1">Hantera tälttyper och prissättning</p>
        </div>
        <Button onClick={() => toast({ title: "Kommer snart", description: "Prisändringar kräver databaslagring." })}>
          <Save className="h-4 w-4 mr-2" /> Spara ändringar
        </Button>
      </div>

      <div className="grid gap-4">
        {tents.map((tent) => (
          <Card key={tent.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Tent className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{tent.name}</h3>
                    <span className="text-lg font-bold text-accent">{tent.price}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Gäster</Label>
                      <Input defaultValue={tent.guests} className="text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Pris</Label>
                      <Input defaultValue={tent.price} className="text-sm" />
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <Label className="text-xs text-muted-foreground">Beskrivning</Label>
                    <Input defaultValue={tent.description} className="text-sm" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Tent className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Priser hanteras via Sirvoy</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            De faktiska priserna och tillgängligheten styrs av ditt bokningssystem Sirvoy. Ändra priser där för att de ska uppdateras i bokningswidgeten.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
