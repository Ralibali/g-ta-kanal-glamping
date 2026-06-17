import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Camera, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { tr, type CleanLang } from "@/cleaning/i18n";

interface Issue {
  id: string;
  description: string;
  photo_path: string | null;
  signedUrl?: string;
}

interface Props {
  sessionId: string | null;
  tentId: string;
  date: string;
  lang: CleanLang;
  issues: Issue[];
  onChange: () => void;
}

export function IssueReporter({ sessionId, tentId, date, lang, issues, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!sessionId) { toast.error("Spara checklistan först (kryssa något)"); return; }
    if (!desc.trim()) return;
    setBusy(true);
    try {
      let photo_path: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${tentId}/${date}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("cleaning-photos").upload(path, file, { contentType: file.type || "image/jpeg" });
        if (upErr) throw upErr;
        photo_path = path;
      }
      const { error } = await (supabase as any).from("cleaning_issues").insert({
        session_id: sessionId, tent_id: tentId, description: desc.trim(), photo_path,
      });
      if (error) throw error;
      setDesc(""); setFile(null); setOpen(false);
      if (fileRef.current) fileRef.current.value = "";
      onChange();
      toast.success("✓");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-serif text-lg">{tr(lang, "issuesTitle")}</h3>
      {issues.map((it) => (
        <Card key={it.id} className="p-3 flex gap-3 items-start">
          {it.signedUrl ? (
            <img src={it.signedUrl} alt="" className="w-16 h-16 object-cover rounded" />
          ) : (
            <div className="w-16 h-16 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">—</div>
          )}
          <p className="text-sm flex-1">{it.description}</p>
        </Card>
      ))}
      {open ? (
        <Card className="p-3 space-y-3">
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={tr(lang, "issueDescPlaceholder")} rows={3} />
          <div className="flex gap-2 items-center">
            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" id="issue-photo" />
            <Button asChild type="button" variant="outline" size="sm">
              <label htmlFor="issue-photo" className="cursor-pointer">
                <Camera className="mr-2 h-4 w-4" /> {tr(lang, "takePhoto")}
              </label>
            </Button>
            {file && <span className="text-xs text-muted-foreground truncate">{file.name}</span>}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setDesc(""); setFile(null); }}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={submit} disabled={busy || !desc.trim()}>
              {tr(lang, "save")}
            </Button>
          </div>
        </Card>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {tr(lang, "addIssue")}
        </Button>
      )}
    </div>
  );
}
