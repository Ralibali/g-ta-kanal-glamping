import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CLEANING_TASKS, GROUP_LABELS, shouldShowTask, type TaskGroup } from "@/cleaning/tasks";
import { tr, type CleanLang } from "@/cleaning/i18n";
import { SOFA_BED_THRESHOLD, isWinter } from "@/cleaning/config";
import { IssueReporter } from "./IssueReporter";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface TentDayData {
  tent_id: string;
  tentNo: number;
  tentName: string;
  position: string;
  date: string;
  hasArrival: boolean;
  hasDeparture: boolean;
  arrivalBooking?: string;
  guests: number;
  children: number;
  breakfast: boolean;
  fikapase: boolean;
  lateCheckout: boolean;
}

interface Props {
  data: TentDayData;
  lang: CleanLang;
  onBack: () => void;
  onCompleted: () => void;
}

export function CleaningChecklist({ data, lang, onBack, onCompleted }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"in_progress" | "completed">("in_progress");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);

  const ctx = useMemo(() => ({
    sofa: data.guests > SOFA_BED_THRESHOLD,
    winter: isWinter(new Date(data.date)),
    breakfast: data.breakfast,
    fikapase: data.fikapase,
  }), [data]);

  const visibleTasks = useMemo(
    () => CLEANING_TASKS.filter((t) => shouldShowTask(t, ctx)),
    [ctx],
  );
  const requiredVisible = visibleTasks.filter((t) => t.required);
  const requiredDone = requiredVisible.filter((t) => checklist[t.id]).length;
  const allRequiredDone = requiredDone === requiredVisible.length;

  // Load existing session
  useEffect(() => {
    (async () => {
      const { data: row } = await (supabase as any)
        .from("cleaning_sessions")
        .select("*")
        .eq("tent_id", data.tent_id)
        .eq("cleaning_date", data.date)
        .maybeSingle();
      if (row) {
        setSessionId(row.id);
        setChecklist(row.checklist || {});
        setStatus(row.status);
        loadIssues(row.id);
      }
    })();
  }, [data.tent_id, data.date]);

  const loadIssues = async (sid: string) => {
    const { data: rows } = await (supabase as any)
      .from("cleaning_issues")
      .select("*")
      .eq("session_id", sid)
      .order("created_at", { ascending: false });
    const signed = await Promise.all((rows ?? []).map(async (r: any) => {
      let signedUrl: string | undefined;
      if (r.photo_path) {
        const { data: s } = await supabase.storage.from("cleaning-photos").createSignedUrl(r.photo_path, 3600);
        signedUrl = s?.signedUrl;
      }
      return { ...r, signedUrl };
    }));
    setIssues(signed);
  };

  const toggle = async (taskId: string, checked: boolean) => {
    const next = { ...checklist };
    if (checked) next[taskId] = new Date().toISOString();
    else delete next[taskId];
    setChecklist(next);

    const payload = {
      tent_id: data.tent_id,
      cleaning_date: data.date,
      arrival_booking: data.arrivalBooking ?? null,
      guests: data.guests,
      sofa_bed_needed: ctx.sofa,
      checklist: next,
      status: "in_progress",
    };
    const { data: row, error } = await (supabase as any)
      .from("cleaning_sessions")
      .upsert(payload, { onConflict: "tent_id,cleaning_date" })
      .select("id")
      .single();
    if (error) { toast.error(error.message); return; }
    if (row?.id && !sessionId) setSessionId(row.id);
  };

  const doComplete = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: row, error } = await (supabase as any)
        .from("cleaning_sessions")
        .upsert({
          tent_id: data.tent_id,
          cleaning_date: data.date,
          arrival_booking: data.arrivalBooking ?? null,
          guests: data.guests,
          sofa_bed_needed: ctx.sofa,
          checklist,
          status: "completed",
          completed_at: new Date().toISOString(),
          completed_by: user?.id ?? null,
        }, { onConflict: "tent_id,cleaning_date" })
        .select("id")
        .single();
      if (error) throw error;
      setSessionId(row.id);
      setStatus("completed");

      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-tent-ready`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        },
        body: JSON.stringify({ tent_id: data.tent_id, cleaning_date: data.date, session_id: row.id }),
      });

      toast.success("✓");
      onCompleted();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSubmitting(false); setConfirmOpen(false); }
  };

  // Group tasks
  const grouped = useMemo(() => {
    const g: Record<TaskGroup, typeof CLEANING_TASKS> = {
      cleaning: [], beds: [], kitchen: [], trash: [], outdoor: [], climate: [],
    };
    for (const t of visibleTasks) g[t.group].push(t);
    return g;
  }, [visibleTasks]);

  return (
    <div className="space-y-4 pb-32">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> {tr(lang, "back")}
      </Button>

      <div>
        <h2 className="font-serif text-2xl">{data.tentName}</h2>
        <p className="text-xs text-muted-foreground">Tält {data.tentNo} • {data.position} • {data.date}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.hasArrival && data.hasDeparture && (
            <Badge className="bg-amber-500">{tr(lang, "changeover")}</Badge>
          )}
          {data.hasArrival && !data.hasDeparture && <Badge variant="secondary">{tr(lang, "arrivalOnly")}</Badge>}
          {!data.hasArrival && data.hasDeparture && <Badge variant="secondary">{tr(lang, "departure")}</Badge>}
          {data.hasArrival && <Badge variant="outline">{data.guests} {tr(lang, "guests")}</Badge>}
          {ctx.sofa && <Badge variant="outline">{tr(lang, "sofaBed")}</Badge>}
          {data.children > 0 && <Badge variant="outline">{tr(lang, "children")}: {data.children}</Badge>}
          {data.breakfast && <Badge variant="outline">{tr(lang, "breakfast")}</Badge>}
          {data.fikapase && <Badge variant="outline">{tr(lang, "fika")}</Badge>}
          {data.lateCheckout && <Badge variant="outline">{tr(lang, "lateCheckout")}</Badge>}
        </div>
      </div>

      <Progress value={(requiredDone / Math.max(1, requiredVisible.length)) * 100} className="h-1" />
      <p className="text-xs text-muted-foreground">{requiredDone} / {requiredVisible.length}</p>

      {(Object.entries(grouped) as [TaskGroup, typeof CLEANING_TASKS][]).map(([group, tasks]) =>
        tasks.length === 0 ? null : (
          <div key={group} className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              {GROUP_LABELS[group][lang]}
            </h3>
            {tasks.map((t) => {
              const Icon = t.icon;
              const checked = !!checklist[t.id];
              return (
                <Card key={t.id} className={`p-4 cursor-pointer transition-colors ${checked ? "bg-primary/5 border-primary/30" : ""}`}
                  onClick={() => toggle(t.id, !checked)}>
                  <div className="flex items-start gap-3">
                    <Checkbox checked={checked} className="mt-1 h-5 w-5" />
                    <Icon className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                    <span className="text-sm leading-snug flex-1">
                      {t.text[lang]}
                      {!t.required && <span className="text-muted-foreground"> ({lang === "sv" ? "valfri" : lang === "en" ? "optional" : "විකල්ප"})</span>}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        ),
      )}

      <IssueReporter
        sessionId={sessionId}
        tentId={data.tent_id}
        date={data.date}
        lang={lang}
        issues={issues}
        onChange={() => sessionId && loadIssues(sessionId)}
      />

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-20">
        {status === "completed" ? (
          <Button className="w-full" disabled>
            <CheckCircle2 className="mr-2 h-5 w-5" /> {tr(lang, "done")}
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            disabled={!allRequiredDone || submitting}
            onClick={() => setConfirmOpen(true)}
          >
            {tr(lang, "markComplete")}
          </Button>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr(lang, "confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {data.hasArrival ? tr(lang, "confirmBodyWithArrival") : tr(lang, "confirmBodyNoArrival")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr(lang, "cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={doComplete} disabled={submitting}>
              {submitting ? tr(lang, "saving") : tr(lang, "confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
