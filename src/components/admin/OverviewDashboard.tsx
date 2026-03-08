import { Users, Eye, MousePointerClick, CalendarCheck, Clock, TrendingDown, ArrowRight, AlertTriangle } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Mock data – replace with real analytics when connected
const weeklyVisitors = [
  { day: "Mån", besökare: 45, bokningar: 2 },
  { day: "Tis", besökare: 52, bokningar: 1 },
  { day: "Ons", besökare: 38, bokningar: 3 },
  { day: "Tor", besökare: 65, bokningar: 2 },
  { day: "Fre", besökare: 78, bokningar: 5 },
  { day: "Lör", besökare: 92, bokningar: 4 },
  { day: "Sön", besökare: 67, bokningar: 3 },
];

const trafficSources = [
  { name: "Google Sök", value: 45, color: "hsl(145, 30%, 25%)" },
  { name: "Direkttrafik", value: 25, color: "hsl(30, 50%, 45%)" },
  { name: "Social media", value: 15, color: "hsl(32, 30%, 85%)" },
  { name: "Referral", value: 15, color: "hsl(35, 20%, 70%)" },
];

const funnelData = [
  { step: "Besökte sidan", antal: 437, pct: 100 },
  { step: "Scrollade till tält", antal: 312, pct: 71 },
  { step: "Klickade 'Boka'", antal: 89, pct: 20 },
  { step: "Öppnade bokningswidget", antal: 67, pct: 15 },
  { step: "Slutförde bokning", antal: 20, pct: 5 },
];

const dropoffInsights = [
  {
    icon: AlertTriangle,
    title: "71% lämnar innan bokning",
    description: "De flesta besökare scrollar genom tält-sektionen men klickar aldrig på 'Boka'. Överväg att göra bokningsknappen mer synlig eller lägga till priser direkt vid tälten.",
  },
  {
    icon: Clock,
    title: "Genomsnittlig session: 1m 42s",
    description: "Besökare spenderar mest tid på galleriet (38s) och tält-sektionen (28s). FAQ-sektionen har lägst engagemang.",
  },
  {
    icon: TrendingDown,
    title: "Mobila besökare bokar 60% mindre",
    description: "Konverteringsgraden på mobil är 2.1% jämfört med 5.8% på desktop. Bokningswidgeten kan behöva optimeras för mobil.",
  },
];

const chartConfig = {
  besökare: { label: "Besökare", color: "hsl(145, 30%, 25%)" },
  bokningar: { label: "Bokningar", color: "hsl(30, 50%, 45%)" },
};

export const OverviewDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Översikt över hemsidans prestanda denna vecka</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Besökare denna vecka"
          value="437"
          change="+12% vs förra veckan"
          changeType="positive"
          icon={Users}
        />
        <StatsCard
          title="Sidvisningar"
          value="1,284"
          change="+8% vs förra veckan"
          changeType="positive"
          icon={Eye}
        />
        <StatsCard
          title="Konverteringsgrad"
          value="4.6%"
          change="-0.3% vs förra veckan"
          changeType="negative"
          icon={MousePointerClick}
          description="Besökare → Bokning"
        />
        <StatsCard
          title="Bokningar"
          value="20"
          change="+5 vs förra veckan"
          changeType="positive"
          icon={CalendarCheck}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visitors Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Besökare & Bokningar</CardTitle>
            <CardDescription>Senaste 7 dagarna</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={weeklyVisitors}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="besökare"
                  stackId="1"
                  stroke="hsl(145, 30%, 25%)"
                  fill="hsl(145, 30%, 25%)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="bokningar"
                  stackId="2"
                  stroke="hsl(30, 50%, 45%)"
                  fill="hsl(30, 50%, 45%)"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Trafikkällor</CardTitle>
            <CardDescription>Var kommer besökarna ifrån?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {trafficSources.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {trafficSources.map((source) => (
                <div key={source.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                    <span>{source.name}</span>
                  </div>
                  <span className="font-medium">{source.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Bokningstratt – Var tappar vi besökare?</CardTitle>
          <CardDescription>Följ besökarens resa från landning till bokning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((step, i) => (
              <div key={step.step} className="flex items-center gap-4">
                <div className="w-48 text-sm font-medium">{step.step}</div>
                <div className="flex-1 relative">
                  <div className="h-8 bg-muted rounded-md overflow-hidden">
                    <div
                      className="h-full bg-primary/80 rounded-md transition-all flex items-center px-3"
                      style={{ width: `${step.pct}%` }}
                    >
                      <span className="text-xs font-medium text-primary-foreground whitespace-nowrap">
                        {step.antal} ({step.pct}%)
                      </span>
                    </div>
                  </div>
                </div>
                {i < funnelData.length - 1 && (
                  <div className="text-xs text-red-500 font-medium w-16 text-right">
                    -{funnelData[i].antal - funnelData[i + 1].antal}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <div>
        <h2 className="text-xl font-bold font-serif mb-4">Insikter & Rekommendationer</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dropoffInsights.map((insight) => (
            <Card key={insight.title} className="border-l-4 border-l-accent">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg mt-0.5">
                    <insight.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{insight.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
