import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogIn, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CheckIn {
  id: string;
  booking_number: string;
  tent_id: string;
  lang: string;
  checked_in_at: string;
  user_agent: string | null;
}

const TENT_LABELS: Record<string, string> = {
  sjobris: "Sjöbrisretreatet",
  naturkarnan: "Naturkärnan",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function CheckInsManager() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("check_ins")
      .select("*")
      .order("checked_in_at", { ascending: false })
      .limit(200);
    if (error) console.error(error);
    setCheckIns((data as CheckIn[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const todayCount = checkIns.filter((c) => isToday(c.checked_in_at)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Incheckningar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Logg över gäster som genomfört digital incheckning.
          </p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Uppdatera
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Idag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totalt (senaste 200)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{checkIns.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Senaste incheckningar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Laddar...</p>
          ) : checkIns.length === 0 ? (
            <p className="text-muted-foreground text-sm">Inga incheckningar ännu.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tid</TableHead>
                  <TableHead>Bokningsnummer</TableHead>
                  <TableHead>Tält</TableHead>
                  <TableHead>Språk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkIns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(c.checked_in_at)}
                      {isToday(c.checked_in_at) && (
                        <Badge variant="secondary" className="ml-2">Idag</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{c.booking_number}</TableCell>
                    <TableCell>{TENT_LABELS[c.tent_id] ?? c.tent_id}</TableCell>
                    <TableCell className="uppercase text-xs text-muted-foreground">{c.lang}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
