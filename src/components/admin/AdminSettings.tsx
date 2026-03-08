import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Globe, Shield, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const AdminSettings = () => {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif">Inställningar</h1>
        <p className="text-muted-foreground mt-1">Generella inställningar för hemsidan</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4" /> Webbplats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webbplats-titel</Label>
            <Input defaultValue="Bergs Slussar Glamping" />
          </div>
          <div className="space-y-2">
            <Label>Meta-beskrivning</Label>
            <Input defaultValue="Glamping vid Göta kanal i Östergötland. Unika tält med komfort och naturupplevelser vid Bergs Slussar." />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Underhållsläge</Label>
              <p className="text-xs text-muted-foreground">Visar en 'under konstruktion'-sida</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Analys-integrationer</CardTitle>
          <CardDescription>Koppla externa analysverktyg</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Google Analytics 4 (Mätnings-ID)</Label>
            <Input placeholder="G-XXXXXXXXXX" />
            <p className="text-xs text-muted-foreground">Koppla GA4 för att ersätta mockdata med riktig statistik</p>
          </div>
          <div className="space-y-2">
            <Label>Google Search Console</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verifierad</span>
              <span className="text-xs text-muted-foreground">TyB3XoBEw128FkpGKG1o4Wrq_GNjZYEXBTKj7oM02rU</span>
            </div>
          </div>
          <Button onClick={() => toast({ title: "Sparad", description: "Inställningarna har uppdaterats." })}>
            Spara inställningar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
