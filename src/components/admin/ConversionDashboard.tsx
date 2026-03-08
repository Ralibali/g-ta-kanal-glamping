import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { StatsCard } from "./StatsCard";
import { MousePointerClick, CalendarCheck, TrendingUp, Lightbulb, Target, ArrowDown } from "lucide-react";

const weeklyConversion = [
  { vecka: "V1", rate: 3.2 },
  { vecka: "V2", rate: 4.1 },
  { vecka: "V3", rate: 3.8 },
  { vecka: "V4", rate: 5.2 },
  { vecka: "V5", rate: 4.6 },
  { vecka: "V6", rate: 4.9 },
  { vecka: "V7", rate: 5.5 },
  { vecka: "V8", rate: 4.3 },
];

const exitPages = [
  { sida: "Bokningssektionen", exits: 145, pct: 34 },
  { sida: "Priser (ej synliga)", exits: 89, pct: 21 },
  { sida: "Startsidan (snabb bounce)", exits: 78, pct: 18 },
  { sida: "FAQ", exits: 52, pct: 12 },
  { sida: "Övriga", exits: 63, pct: 15 },
];

const clickEvents = [
  { element: "Boka nu (hero)", klick: 234, conversion: "6.2%" },
  { element: "Boka nu (navbar)", klick: 156, conversion: "4.8%" },
  { element: "Sirvoy widget öppnad", klick: 89, conversion: "22.5%" },
  { element: "Galleri öppnat", klick: 312, conversion: "1.9%" },
  { element: "FAQ expanderad", klick: 198, conversion: "2.1%" },
  { element: "Språkbyte (EN)", klick: 67, conversion: "3.0%" },
];

const recommendations = [
  {
    priority: "Hög",
    title: "Visa priser direkt vid tälten",
    description: "21% av besökarna lämnar sidan vid bokningssektionen – troligtvis för att de inte ser priset förrän de öppnar Sirvoy. Testa att visa 'från X kr/natt' vid varje tält.",
    impact: "Kan öka konvertering med uppskattningsvis 15-25%",
  },
  {
    priority: "Hög",
    title: "Optimera mobil bokningsupplevelse",
    description: "Mobila besökare har 60% lägre konverteringsgrad. Sirvoy-widgeten kan vara svår att använda på små skärmar. Överväg en enklare mobil bokningsflow.",
    impact: "62% av trafiken är mobil – stor potential",
  },
  {
    priority: "Medium",
    title: "Lägg till social proof närmare bokningen",
    description: "Omdömen och recensioner visas för tidigt på sidan. Flytta ett par omdömen till precis ovanför bokningswidgeten.",
    impact: "Social proof nära beslutspunkten ökar konvertering",
  },
  {
    priority: "Medium",
    title: "Skapa urgency/knapphet",
    description: "Lägg till 'Bara X platser kvar denna helg' eller liknande text nära bokningsknappen. Knapphet driver beslut.",
    impact: "Typiskt 5-15% ökning i konvertering",
  },
];

const chartConfig = {
  rate: { label: "Konverteringsgrad %", color: "hsl(145, 30%, 25%)" },
};

export const ConversionDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif">Konverteringsanalys</h1>
        <p className="text-muted-foreground mt-1">Förstå varför besökare inte bokar – och vad du kan göra åt det</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Konverteringsgrad" value="4.6%" change="+0.8% denna månad" changeType="positive" icon={Target} />
        <StatsCard title="Klick på 'Boka'" value="390" change="+22%" changeType="positive" icon={MousePointerClick} />
        <StatsCard title="Slutförda bokningar" value="20" icon={CalendarCheck} />
        <StatsCard title="Avhoppsfrekvens (bokning)" value="78%" change="-2%" changeType="positive" icon={ArrowDown} description="Av de som klickar boka" />
      </div>

      {/* Conversion trend */}
      <Card>
        <CardHeader>
          <CardTitle>Konverteringsgrad över tid</CardTitle>
          <CardDescription>Veckovis trend – mål: 6%</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px]">
            <LineChart data={weeklyConversion}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="vecka" />
              <YAxis domain={[0, 8]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="rate" stroke="hsl(145, 30%, 25%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(145, 30%, 25%)" }} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exit pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-red-500" />
              Var lämnar besökare sidan?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exitPages.map((page) => (
                <div key={page.sida} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{page.sida}</span>
                    <span className="font-medium text-red-500">{page.pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${page.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Click tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Klickspårning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clickEvents.map((event) => (
                <div key={event.element} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm">{event.element}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{event.klick} klick</span>
                    <span className="text-sm font-semibold text-primary">{event.conversion}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <div>
        <h2 className="text-xl font-bold font-serif mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          Rekommendationer för att öka bokningar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <Card key={rec.title} className={`border-l-4 ${rec.priority === "Hög" ? "border-l-red-400" : "border-l-accent"}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm">{rec.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rec.priority === "Hög" ? "bg-red-100 text-red-700" : "bg-accent/10 text-accent"}`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{rec.description}</p>
                <p className="text-xs font-medium text-primary">{rec.impact}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
