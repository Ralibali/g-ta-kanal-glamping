import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, BarChart3, Users, MousePointerClick, Search } from "lucide-react";

const GA4_URL = "https://analytics.google.com/analytics/web/#/p/G-408J0E1ESF";

const quickLinks = [
  { title: "Besökarstatistik", description: "Se besökare, sessioner och sidvisningar i realtid", icon: Users, path: "/reports/dashboard" },
  { title: "Konverteringar", description: "Följ bokningar och andra händelser", icon: MousePointerClick, path: "/reports/conversions" },
  { title: "Sökanalys", description: "Se vilka sökord som driver trafik", icon: Search, path: "/reports/acquisition" },
  { title: "Beteende", description: "Analysera hur besökare navigerar på sidan", icon: BarChart3, path: "/reports/engagement" },
];

export const OverviewDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif">Dashboard</h1>
        <p className="text-muted-foreground mt-1">All statistik samlas i Google Analytics 4</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-8 flex flex-col items-center text-center gap-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif mb-2">Google Analytics 4</h2>
            <p className="text-muted-foreground max-w-md">
              Din webbplats är kopplad till GA4. All trafik, konverteringar och besökardata samlas där automatiskt.
            </p>
          </div>
          <Button asChild size="lg" className="gap-2 mt-2">
            <a href={GA4_URL} target="_blank" rel="noopener noreferrer">
              Öppna Google Analytics
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map((link) => (
          <a key={link.title} href={GA4_URL + link.path} target="_blank" rel="noopener noreferrer" className="block">
            <Card className="hover:shadow-md transition-shadow h-full cursor-pointer hover:border-primary/30">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="p-2.5 bg-primary/10 rounded-lg">
                  <link.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{link.title}</h3>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
};
