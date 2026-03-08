import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { StatsCard } from "./StatsCard";
import { Users, Clock, Monitor, Smartphone, Globe } from "lucide-react";

const monthlyVisitors = [
  { month: "Jan", besökare: 820 },
  { month: "Feb", besökare: 950 },
  { month: "Mar", besökare: 1200 },
  { month: "Apr", besökare: 1800 },
  { month: "Maj", besökare: 2400 },
  { month: "Jun", besökare: 3100 },
  { month: "Jul", besökare: 3800 },
  { month: "Aug", besökare: 3200 },
  { month: "Sep", besökare: 2100 },
  { month: "Okt", besökare: 1400 },
  { month: "Nov", besökare: 900 },
  { month: "Dec", besökare: 700 },
];

const pageViews = [
  { sida: "Startsidan", visningar: 4200, tid: "2m 15s" },
  { sida: "Galleri", visningar: 2800, tid: "1m 38s" },
  { sida: "Tälten", visningar: 2100, tid: "1m 28s" },
  { sida: "Boka", visningar: 1800, tid: "3m 05s" },
  { sida: "Om oss", visningar: 900, tid: "0m 52s" },
  { sida: "FAQ", visningar: 650, tid: "1m 12s" },
  { sida: "Blogg", visningar: 420, tid: "2m 45s" },
];

const deviceData = [
  { device: "Mobil", pct: 62 },
  { device: "Desktop", pct: 31 },
  { device: "Surfplatta", pct: 7 },
];

const topCountries = [
  { country: "Sverige", pct: 78 },
  { country: "Norge", pct: 8 },
  { country: "Danmark", pct: 5 },
  { country: "Tyskland", pct: 4 },
  { country: "Övriga", pct: 5 },
];

const chartConfig = {
  besökare: { label: "Besökare", color: "hsl(145, 30%, 25%)" },
  visningar: { label: "Visningar", color: "hsl(30, 50%, 45%)" },
};

export const VisitorsDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif">Besökarstatistik</h1>
        <p className="text-muted-foreground mt-1">Detaljerad analys av besökare och engagemang</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Unika besökare (månad)" value="1,847" change="+15%" changeType="positive" icon={Users} />
        <StatsCard title="Genomsnittlig sessionstid" value="1m 42s" change="+12s" changeType="positive" icon={Clock} />
        <StatsCard title="Mobila besökare" value="62%" description="Mest trafik från mobil" icon={Smartphone} />
        <StatsCard title="Bounce rate" value="38%" change="-3%" changeType="positive" icon={Monitor} />
      </div>

      {/* Monthly trend */}
      <Card>
        <CardHeader>
          <CardTitle>Besökare per månad</CardTitle>
          <CardDescription>Årsöversikt – tydlig säsongstopp maj-aug</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <AreaChart data={monthlyVisitors}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="besökare" stroke="hsl(145, 30%, 25%)" fill="hsl(145, 30%, 25%)" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular pages */}
        <Card>
          <CardHeader>
            <CardTitle>Populäraste sidorna</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pageViews.map((page, i) => (
                <div key={page.sida} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}.</span>
                    <span className="font-medium text-sm">{page.sida}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{page.tid}</span>
                    <span className="text-sm font-semibold w-16 text-right">{page.visningar.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device & Geography */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Enheter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deviceData.map((d) => (
                  <div key={d.device} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{d.device}</span>
                      <span className="font-medium">{d.pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4" /> Länder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topCountries.map((c) => (
                  <div key={c.country} className="flex justify-between text-sm py-1">
                    <span>{c.country}</span>
                    <span className="font-medium">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
