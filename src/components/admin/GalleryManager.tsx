import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import glampingSunset from "@/assets/glamping-sunset.jpg";
import glampingExterior from "@/assets/glamping-exterior-deck.jpg";
import glampingInterior from "@/assets/glamping-interior-cozy.jpg";
import glampingNature from "@/assets/glamping-nature-kids.jpg";
import glampingReading from "@/assets/glamping-reading.jpg";
import glampingView from "@/assets/glamping-view-field.jpg";
import glampingNight from "@/assets/glamping-night-lights.jpg";
import glampingInteriorWide from "@/assets/glamping-interior-wide.jpg";
import glampingPersonDeck from "@/assets/glamping-person-deck.jpg";
import glampingInteriorBeds from "@/assets/glamping-interior-beds.jpg";

const images = [
  { src: glampingSunset, name: "Solnedgång" },
  { src: glampingExterior, name: "Exteriör med trädäck" },
  { src: glampingInterior, name: "Interiör mysig" },
  { src: glampingNature, name: "Natur med barn" },
  { src: glampingReading, name: "Läsa" },
  { src: glampingView, name: "Vy över fält" },
  { src: glampingNight, name: "Nattbelysning" },
  { src: glampingInteriorWide, name: "Interiör bred" },
  { src: glampingPersonDeck, name: "Person på trädäck" },
  { src: glampingInteriorBeds, name: "Interiör sängar" },
];

export const GalleryManager = () => {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif">Bildgalleri</h1>
          <p className="text-muted-foreground mt-1">Hantera bilder som visas på hemsidan</p>
        </div>
        <Button onClick={() => toast({ title: "Kommer snart", description: "Bilduppladdning kräver Cloud Storage." })}>
          <Upload className="h-4 w-4 mr-2" /> Ladda upp
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img) => (
          <Card key={img.name} className="overflow-hidden group">
            <div className="relative aspect-[4/3]">
              <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.name}
                </span>
              </div>
            </div>
          </Card>
        ))}

        <Card className="border-dashed flex items-center justify-center aspect-[4/3] cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => toast({ title: "Kommer snart", description: "Bilduppladdning kräver Cloud Storage." })}>
          <div className="text-center p-4">
            <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <span className="text-sm text-muted-foreground">Lägg till bild</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
