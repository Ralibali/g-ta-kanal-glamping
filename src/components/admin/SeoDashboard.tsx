import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search } from "lucide-react";

const GSC_URL = "https://search.google.com/search-console";
const GA4_URL = "https://analytics.google.com/analytics/web/#/p/G-408J0E1ESF/reports/acquisition";

export const SeoDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif">SEO</h1>
        <p className="text-muted-foreground mt-1">Sökoptimering och trafikkällor</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-bold font-serif mb-1">Google Search Console</h2>
              <p className="text-sm text-muted-foreground">Sökord, positioner, klick och visningar</p>
            </div>
            <Button asChild className="gap-2">
              <a href={GSC_URL} target="_blank" rel="noopener noreferrer">
                Öppna Search Console
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-bold font-serif mb-1">Trafikkällor</h2>
              <p className="text-sm text-muted-foreground">Se varifrån dina besökare kommer</p>
            </div>
            <Button asChild className="gap-2">
              <a href={GA4_URL} target="_blank" rel="noopener noreferrer">
                Öppna i Analytics
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
