import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CLEANING_TASKS, GROUP_LABELS, shouldShowTask, type TaskGroup } from "@/cleaning/tasks";
import { SOFA_BED_THRESHOLD, isWinter } from "@/cleaning/config";
import { tr, type CleanLang } from "@/cleaning/i18n";
import { towelInstruction } from "@/lib/cleaning-operations";
import { IssueReporter } from "./IssueReporter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export type TentDayDataV2 = {
  tent_id: string;
  tentNo: number;
  tentName: string;
  position: string;
  date: string;
  hasArrival: boolean;
  arrivalBooking?: string;
  nextArrivalDate?: string;
  guests: number;
  children: number;
  breakfast: boolean;
  fikapase: boolean;
  lateCheckout: boolean;
  earlyCheckin?: boolean;
};

type Props = { data: TentDayDataV2; lang: CleanLang; onBack: () => void; onCompleted: () => void };

function lateText(lang: CleanLang) {
  if (lang === "en") return "Late check-out at 12:00. Start cleaning after that time.";
  if (lang === "si") return "ප්‍රමාද පිටවීම 12.00 ටයි. ඉන් පසුව පිරිසිදු කිරීම ආරම්භ කරන්න.";
  return "Sen utcheckning kl. 12.00. Påbörja städningen först därefter.";
}

export function CleaningChecklistV2({ data, lang, onBack, onCompleted }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("in_progress");
  const [issues, setIssues] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const ctx = useMemo(() => ({
    sofa: data.guests > SOFA_BED_THRESHOLD,
    winter: isWinter(new Date(`${data.date}T12:00:00`)),
    breakfast: data.breakfast,
    fikapase: data.fikapase,
  }), [data]);

  const tasks = useMemo(() => CLEANING_TASKS
    .filter((task) => shouldShowTask(task, ctx))
    .filter((task) => task.id !== "handdukar" || data.guests > 0)
    .map((task) => task.id === "handdukar" ? {
      ...task,
      text: {
        sv: towelInstruction(data.guests, "sv"),
        en: towelInstruction(data.guests, "en"),
        si: towelInstruction(data.guests, "si"),
      },
    } : task), [ctx, data.guests]);

  const required = tasks.filter((task) => task.required);
  const done = required.filter((task) => checklist[task.id]).length;
  const complete = done === required.length;

  const loadIssues = async (id: string) => {
    const { data: rows } = await (supabase as any).from("cleaning_issues").select("*").eq("session_id", id).order("created_at", { ascending: false });
    const withUrls = await Promise.all((rows ?? []).map(async (row: any) => {
      if (!row.photo_path) return row;
      const { data: signed } = await supabase.storage.from("cleaning-photos").createSignedUrl(row.photo_path, 3600);
      return { ...row, signedUrl: signed?.signedUrl };
    }));
    setIssues(withUrls);
  };

  useEffect(() => {
    void (async () => {
      const { data: row } = await (supabase as any).from("cleaning_sessions").select("*").eq("tent_id", data.tent_id).eq("cleaning_date", data.date).maybeSingle();
      if (!row) return;
      setSessionId(row.id);
      setChecklist(row.checklist ?? {});
      setStatus(row.status);
      await loadIssues(row.id);
    })();
  }, [data.tent_id, data.date]);

  const save = async (next: Record<string, string>, nextStatus = "in_progress") => {
    const { data: row, error } = await (supabase as any).from("cleaning_sessions").upsert({
      tent_id: data.tent_id,
      cleaning_date: data.date,
      arrival_booking: data.arrivalBooking ?? null,
      guests: data.guests,
      sofa_bed_needed: ctx.sofa,
      checklist: next,
      status: nextStatus,
      completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
    }, { onConflict: "tent_id,cleaning_date" }).select("id").single();
    if (error) throw error;
    setSessionId(row.id);
    return row.id as string;
  };

  const toggle = async (id: string) => {
    const next = { ...checklist };
    if (next[id]) delete next[id]; else next[id] = new Date().toISOString();
    setChecklist(next);
    try { await save(next); } catch (error: any) { toast.error(error.message); }
  };

  const finish = async () => {
    setSaving(true);
    try {
      await save(checklist, "completed");
      setStatus("completed");
      toast.success("Tältet är markerat som klart");
      onCompleted();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const grouped = useMemo(() => {
    const groups: Record<TaskGroup, typeof CLEANING_TASKS> = { cleaning: [], beds: [], kitchen: [], trash: [], outdoor: [], climate: [] };
    tasks.forEach((task) => groups[task.group].push(task));
    return groups;
  }, [tasks]);

  return (
    <div className="space-y-4 pb-28">
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />{tr(lang, "back")}</Button>
      <div>
        <h2 className="font-serif text-2xl">{data.tentName}</h2>
        <p className="text-xs text-muted-foreground">Tält {data.tentNo} • {data.position} • {data.date}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">{data.hasArrival ? tr(lang, "changeover") : tr(lang, "departure")}</Badge>
          {data.guests > 0 && <Badge variant="outline">{data.guests} {tr(lang, "guests")}</Badge>}
          {data.children > 0 && <Badge variant="outline">{tr(lang, "children")}: {data.children}</Badge>}
          {data.lateCheckout && <Badge className="bg-red-600">Sen utcheckning kl. 12.00</Badge>}
        </div>
        {!data.hasArrival && data.nextArrivalDate && <p className="mt-2 text-sm font-medium">Förbereds för nästa bokning: {data.guests} gäster, ankomst {data.nextArrivalDate}</p>}
      </div>

      {data.lateCheckout && <Card className="border-2 border-red-500 bg-red-50 p-4 text-red-950"><div className="flex gap-3"><Clock3 className="h-5 w-5 shrink-0" /><strong>{lateText(lang)}</strong></div></Card>}

      <Progress value={(done / Math.max(1, required.length)) * 100} className="h-1" />
      <p className="text-xs text-muted-foreground">{done} / {required.length}</p>

      {(Object.entries(grouped) as [TaskGroup, typeof CLEANING_TASKS][]).map(([group, groupTasks]) => groupTasks.length > 0 && (
        <section key={group} className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{GROUP_LABELS[group][lang]}</h3>
          {groupTasks.map((task) => {
            const Icon = task.icon;
            const checked = !!checklist[task.id];
            return <Card key={task.id} className={`cursor-pointer p-4 ${checked ? "border-primary/30 bg-primary/5" : ""}`} onClick={() => void toggle(task.id)}><div className="flex items-start gap-3"><Checkbox checked={checked} className="mt-1 h-5 w-5" /><Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span className="text-sm">{task.text[lang]}</span></div></Card>;
          })}
        </section>
      ))}

      <IssueReporter sessionId={sessionId} tentId={data.tent_id} date={data.date} lang={lang} issues={issues} onChange={() => sessionId && void loadIssues(sessionId)} />

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background p-4">
        {status === "completed" ? <Button className="w-full" disabled><CheckCircle2 className="mr-2 h-5 w-5" />{tr(lang, "done")}</Button> : <Button className="w-full" size="lg" disabled={!complete || saving} onClick={() => void finish()}>{saving ? tr(lang, "saving") : tr(lang, "markComplete")}</Button>}
      </div>
    </div>
  );
}
