import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search } from "lucide-react";

const GA4_URL = "https://analytics.google.com/analytics/web/#/p/G-408J0E1ESF";
const GSC_URL = "https://search.google.com/search-console";

export const SeoDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif">SEO</h1>
        <p className="text-muted-foreground mt-1">Sökoptimering – Google Search Console & Analytics</p>
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
              <h2 className="font-bold font-serif mb-1">Google Analytics</h2>
              <p className="text-sm text-muted-foreground">Avancerad trafikanalys och segmentering</p>
            </div>
            <Button asChild className="gap-2">
              <a href={GA4_URL} target="_blank" rel="noopener noreferrer">
                Öppna Analytics
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
