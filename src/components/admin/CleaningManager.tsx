import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Sparkles, RefreshCw, MessageSquare, AlertTriangle, CheckCircle2 } from "lucide-react";
import { TENT_BY_ID, todayInStockholm } from "@/cleaning/config";
import { toast } from "sonner";

interface Session { id: string; tent_id: string; cleaning_date: string; status: string; completed_at: string | null; guests: number | null; }
interface Issue { id: string; session_id: string; tent_id: string; description: string; photo_path: string | null; resolved: boolean; created_at: string; signedUrl?: string; }
interface Sms { id: string; tent_id: string; cleaning_date_key: string; status: string; error: string | null; sent_at: string | null; }

export function CleaningManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [sms, setSms] = useState<Sms[]>([]);
  const [loading, setLoading] = useState(true);
  const today = todayInStockholm();



  const load = async () => {
    setLoading(true);
    const { data: sessRows } = await (supabase as any)
      .from("cleaning_sessions").select("*").order("cleaning_date", { ascending: false }).limit(60);
    const sess: Session[] = (sessRows ?? []) as Session[];
    setSessions(sess);
    const ids = sess.map((s) => s.id);
    if (ids.length) {
      const { data: issueRows } = await (supabase as any)
        .from("cleaning_issues").select("*").in("session_id", ids);
      const list = (issueRows ?? []) as Issue[];
      const signed = await Promise.all(list.map(async (it) => {
        if (!it.photo_path) return it;
        const { data } = await supabase.storage.from("cleaning-photos").createSignedUrl(it.photo_path, 3600);
        return { ...it, signedUrl: data?.signedUrl };
      }));
      setIssues(signed);
    } else setIssues([]);
    const { data: smsRows } = await (supabase as any)
      .from("sms_outbox").select("*").order("created_at", { ascending: false }).limit(60);
    setSms((smsRows ?? []) as Sms[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const markResolved = async (id: string) => {
    const { error } = await (supabase as any).from("cleaning_issues").update({ resolved: true }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("✓"); load(); }
  };

  const todaySessions = sessions.filter((s) => s.cleaning_date === today);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Städning</h1>
          <p className="text-muted-foreground text-sm mt-1">Status, checklistor och felrapporter från städningen.</p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Uppdatera
        </Button>
      </div>



      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Idag</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {todaySessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">Inga städsessioner registrerade idag ännu.</p>
          ) : todaySessions.map((s) => {
            const tent = TENT_BY_ID[s.tent_id];
            const issueCount = issues.filter((i) => i.session_id === s.id).length;
            return (
              <div key={s.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-medium">Tält {tent?.no} – {tent?.name ?? s.tent_id}</div>
                  <div className="text-xs text-muted-foreground">{s.guests ?? "?"} gäster • {issueCount} fel</div>
                </div>
                {s.status === "completed" ? (
                  <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Klar</Badge>
                ) : <Badge variant="secondary">Pågår</Badge>}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Logg (senaste)</CardTitle></CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {sessions.map((s) => {
              const tent = TENT_BY_ID[s.tent_id];
              const sessIssues = issues.filter((i) => i.session_id === s.id);
              const smsRow = sms.find((x) => x.tent_id === s.tent_id && x.cleaning_date_key === s.cleaning_date);
              return (
                <AccordionItem key={s.id} value={s.id}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-3 text-sm">
                      <span>{s.cleaning_date}</span>
                      <span className="font-medium">Tält {tent?.no} – {tent?.name ?? s.tent_id}</span>
                      {s.status === "completed" ? <Badge className="bg-green-600">Klar</Badge> : <Badge variant="secondary">Pågår</Badge>}
                      {sessIssues.length > 0 && <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />{sessIssues.length}</Badge>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-2 text-sm">
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" />
                        SMS: {smsRow ? `${smsRow.status}${smsRow.error ? ` (${smsRow.error})` : ""}` : "—"}
                      </div>
                      {sessIssues.length === 0 ? (
                        <p className="text-muted-foreground">Inga fel rapporterade.</p>
                      ) : sessIssues.map((it) => (
                        <div key={it.id} className="flex gap-3 border rounded p-2">
                          {it.signedUrl ? (
                            <a href={it.signedUrl} target="_blank" rel="noreferrer">
                              <img src={it.signedUrl} alt="" className="w-20 h-20 object-cover rounded" />
                            </a>
                          ) : <div className="w-20 h-20 rounded bg-muted" />}
                          <div className="flex-1">
                            <p>{it.description}</p>
                            <p className="text-xs text-muted-foreground">{new Date(it.created_at).toLocaleString("sv-SE")}</p>
                            {!it.resolved && <Button size="sm" variant="outline" className="mt-2" onClick={() => markResolved(it.id)}>Markera åtgärdad</Button>}
                            {it.resolved && <Badge className="mt-2 bg-green-600">Åtgärdad</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lägg till städare</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>1. Skapa städarens konto i Lovable Cloud (Backend → Users).</p>
          <p>2. Kör i SQL Editor: <code className="bg-muted px-1 rounded">INSERT INTO public.user_roles (user_id, role) VALUES ('&lt;uuid&gt;','cleaner');</code></p>
          <p>3. Städaren loggar in på <code className="bg-muted px-1 rounded">/stad</code>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
