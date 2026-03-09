import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MousePointerClick } from "lucide-react";

const GA4_URL = "https://analytics.google.com/analytics/web/#/p/G-408J0E1ESF/reports/conversions";

export const ConversionDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif">Konverteringar</h1>
        <p className="text-muted-foreground mt-1">Konverteringsdata samlas i Google Analytics</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-8 flex flex-col items-center text-center gap-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <MousePointerClick className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground max-w-md">
            Se konverteringsgrad, bokningstratt och händelser direkt i Google Analytics.
          </p>
          <Button asChild size="lg" className="gap-2">
            <a href={GA4_URL} target="_blank" rel="noopener noreferrer">
              Öppna konverteringsdata
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
