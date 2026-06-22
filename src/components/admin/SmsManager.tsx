import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { MessageSquare, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { TENT_BY_ID } from "@/cleaning/config";

interface Sms {
  id: string;
  booking_number: string | null;
  tent_id: string | null;
  cleaning_date_key: string | null;
  to_phone: string | null;
  lang: string | null;
  body: string | null;
  status: string;
  provider_id: string | null;
  error: string | null;
  created_at: string;
  sent_at: string | null;
}

const RANGES = [
  { value: "24h", label: "Senaste 24h", hours: 24 },
  { value: "7d", label: "Senaste 7 dagar", hours: 24 * 7 },
  { value: "30d", label: "Senaste 30 dagar", hours: 24 * 30 },
  { value: "all", label: "Allt", hours: 0 },
];

const STATUS_META: Record<string, { label: string; className: string; icon: any }> = {
  sent: { label: "Skickat", className: "bg-green-600 hover:bg-green-700", icon: CheckCircle2 },
  delivered: { label: "Levererat", className: "bg-green-600 hover:bg-green-700", icon: CheckCircle2 },
  queued: { label: "Köad", className: "bg-amber-500 hover:bg-amber-600", icon: Clock },
  pending: { label: "Väntar", className: "bg-amber-500 hover:bg-amber-600", icon: Clock },
  failed: { label: "Misslyckat", className: "bg-red-600 hover:bg-red-700", icon: XCircle },
  error: { label: "Fel", className: "bg-red-600 hover:bg-red-700", icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, className: "bg-muted text-foreground", icon: MessageSquare };
  const Icon = meta.icon;
  return (
    <Badge className={meta.className}>
      <Icon className="h-3 w-3 mr-1" /> {meta.label}
    </Badge>
  );
}

export function SmsManager() {
  const [rows, setRows] = useState<Sms[]>([]);
  const [clickMap, setClickMap] = useState<Record<string, { clicks: number; slug: string }>>({});
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    let q = (supabase as any).from("sms_outbox").select("*").order("created_at", { ascending: false }).limit(500);
    const rng = RANGES.find((r) => r.value === range);
    if (rng && rng.hours > 0) {
      const since = new Date(Date.now() - rng.hours * 3600 * 1000).toISOString();
      q = q.gte("created_at", since);
    }
    const { data } = await q;
    setRows((data ?? []) as Sms[]);

    // Senaste short_link per bokning för klickstatistik
    const { data: links } = await (supabase as any)
      .from("short_links")
      .select("slug, clicks, created_at, booking_id, bookings!inner(booking_number)")
      .order("created_at", { ascending: false })
      .limit(1000);
    const map: Record<string, { clicks: number; slug: string }> = {};
    (links ?? []).forEach((l: any) => {
      const bn = l.bookings?.booking_number;
      if (bn && !map[bn]) map[bn] = { clicks: l.clicks ?? 0, slug: l.slug };
    });
    setClickMap(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, [range]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        const hay = `${r.to_phone ?? ""} ${r.booking_number ?? ""} ${r.tent_id ?? ""} ${r.body ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const sent = rows.filter((r) => r.status === "sent" || r.status === "delivered").length;
    const failed = rows.filter((r) => r.status === "failed" || r.status === "error").length;
    const pending = rows.filter((r) => r.status === "queued" || r.status === "pending").length;
    return { total, sent, failed, pending };
  }, [rows]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.status));
    return Array.from(set).sort();
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">SMS</h1>
          <p className="text-muted-foreground text-sm mt-1">Logg över utskickade SMS till gäster och städ.</p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Uppdatera
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Totalt</div><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Skickade</div><div className="text-2xl font-bold text-green-600">{stats.sent}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Misslyckade</div><div className="text-2xl font-bold text-red-600">{stats.failed}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Väntar</div><div className="text-2xl font-bold text-amber-600">{stats.pending}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> SMS-logg</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-full md:w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla statusar</SelectItem>
                {statusOptions.map((s) => <SelectItem key={s} value={s}>{STATUS_META[s]?.label ?? s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              placeholder="Sök telefon, bokning, tält eller text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mottagare</TableHead>
                  <TableHead>Bokning</TableHead>
                  <TableHead>Tält</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Meddelande</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {loading ? "Laddar..." : "Inga SMS i denna vy."}
                  </TableCell></TableRow>
                ) : filtered.map((r) => {
                  const tent = r.tent_id ? TENT_BY_ID[r.tent_id] : null;
                  const ts = r.sent_at ?? r.created_at;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(ts).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                        {r.error && <div className="text-xs text-red-600 mt-1 max-w-[200px] truncate" title={r.error}>{r.error}</div>}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{r.to_phone ?? "—"}</TableCell>
                      <TableCell className="text-sm">{r.booking_number ?? "—"}</TableCell>
                      <TableCell className="text-sm">{tent ? `${tent.no} – ${tent.name}` : (r.tent_id ?? "—")}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{r.cleaning_date_key ?? "—"}</TableCell>
                      <TableCell className="text-sm max-w-[360px]">
                        <div className="line-clamp-2 whitespace-pre-wrap" title={r.body ?? ""}>{r.body ?? "—"}</div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="text-xs text-muted-foreground">Visar {filtered.length} av {rows.length} rader.</div>
        </CardContent>
      </Card>
    </div>
  );
}
