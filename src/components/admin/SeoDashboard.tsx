import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { StatsCard } from "./StatsCard";
import { Search, TrendingUp, Link2, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";

const searchKeywords = [
  { keyword: "glamping sverige", position: 12, impressions: 2400, clicks: 180, ctr: "7.5%", trend: "up" },
  { keyword: "glamping östergötland", position: 5, impressions: 890, clicks: 134, ctr: "15.1%", trend: "up" },
  { keyword: "bergs slussar boende", position: 3, impressions: 420, clicks: 126, ctr: "30%", trend: "up" },
  { keyword: "glamping göta kanal", position: 4, impressions: 650, clicks: 117, ctr: "18%", trend: "up" },
  { keyword: "glamping linköping", position: 8, impressions: 380, clicks: 42, ctr: "11.1%", trend: "down" },
  { keyword: "lyxcamping sverige", position: 18, impressions: 1200, clicks: 36, ctr: "3%", trend: "down" },
  { keyword: "tältsemester", position: 24, impressions: 3200, clicks: 28, ctr: "0.9%", trend: "neutral" },
];

const referralSources = [
  { source: "google.se", visits: 1240 },
  { source: "google.com", visits: 320 },
  { source: "facebook.com", visits: 180 },
  { source: "instagram.com", visits: 95 },
  { source: "gotakanal.se", visits: 72 },
  { source: "visitostergotland.se", visits: 58 },
];

const blogPerformance = [
  { title: "Glamping vid Göta kanal", views: 420, fromSearch: 280, avgTime: "2m 45s" },
  { title: "Bergs Slussar – guide", views: 380, fromSearch: 310, avgTime: "3m 12s" },
  { title: "Fem naturupplevelser", views: 210, fromSearch: 140, avgTime: "2m 18s" },
];

const chartConfig = {
  clicks: { label: "Klick", color: "hsl(145, 30%, 25%)" },
  impressions: { label: "Visningar", color: "hsl(32, 30%, 85%)" },
};

export const SeoDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif">SEO & Trafikkällor</h1>
        <p className="text-muted-foreground mt-1">Sökord, ranking och var trafiken kommer ifrån</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Organiska klick (månad)" value="663" change="+23%" changeType="positive" icon={Search} />
        <StatsCard title="Genomsnittlig position" value="8.2" change="-1.4 (bättre)" changeType="positive" icon={TrendingUp} />
        <StatsCard title="Referral-besök" value="405" icon={Link2} />
        <StatsCard title="Blogg-trafik" value="1,010" change="+45%" changeType="positive" icon={FileText} />
      </div>

      {/* Keywords Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sökord i Google</CardTitle>
          <CardDescription>Data från Google Search Console (simulerad)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Sökord</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Position</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Visningar</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Klick</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">CTR</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Trend</th>
                </tr>
              </thead>
              <tbody>
                {searchKeywords.map((kw) => (
                  <tr key={kw.keyword} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-2 font-medium">{kw.keyword}</td>
                    <td className="text-right py-3 px-2">
                      <span className={`font-semibold ${kw.position <= 5 ? "text-green-600" : kw.position <= 10 ? "text-accent" : "text-muted-foreground"}`}>
                        #{kw.position}
                      </span>
                    </td>
                    <td className="text-right py-3 px-2 text-muted-foreground">{kw.impressions.toLocaleString()}</td>
                    <td className="text-right py-3 px-2 font-medium">{kw.clicks}</td>
                    <td className="text-right py-3 px-2">{kw.ctr}</td>
                    <td className="text-right py-3 px-2">
                      {kw.trend === "up" && <ArrowUpRight className="h-4 w-4 text-green-600 inline" />}
                      {kw.trend === "down" && <ArrowDownRight className="h-4 w-4 text-red-500 inline" />}
                      {kw.trend === "neutral" && <span className="text-muted-foreground">–</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral sources */}
        <Card>
          <CardHeader>
            <CardTitle>Hänvisande webbplatser</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <BarChart data={referralSources} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" />
                <YAxis dataKey="source" type="category" width={130} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="visits" fill="hsl(145, 30%, 25%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Blog performance */}
        <Card>
          <CardHeader>
            <CardTitle>Blogg-prestanda</CardTitle>
            <CardDescription>Hur blogginläggen driver trafik</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {blogPerformance.map((post) => (
                <div key={post.title} className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">{post.title}</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Visningar</span>
                      <span className="font-semibold">{post.views}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Från sök</span>
                      <span className="font-semibold">{post.fromSearch}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Snittid</span>
                      <span className="font-semibold">{post.avgTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
