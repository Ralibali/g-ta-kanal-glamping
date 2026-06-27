import { AlertTriangle, CheckCircle2, Clock3, LogIn, TentTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type CleaningStatusFilter = "all" | "not_started" | "in_progress" | "completed";

type Props = {
  total: number;
  changeovers: number;
  late: number;
  early: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  filter: CleaningStatusFilter;
  onFilter: (filter: CleaningStatusFilter) => void;
};

export function CleaningStatusSummary(props: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="pt-4"><TentTree className="h-4 w-4" /><div className="text-3xl font-bold">{props.total}</div><div className="text-xs text-muted-foreground">tält idag</div></CardContent></Card>
        <Card className="border-amber-300 bg-amber-50"><CardContent className="pt-4"><LogIn className="h-4 w-4 text-amber-800" /><div className="text-3xl font-bold text-amber-900">{props.changeovers}</div><div className="text-xs text-amber-800">växlingar</div></CardContent></Card>
        <Card className={props.late ? "border-red-400 bg-red-50" : ""}><CardContent className="pt-4"><Clock3 className="h-4 w-4" /><div className="text-3xl font-bold">{props.late}</div><div className="text-xs">efter kl. 12</div></CardContent></Card>
        <Card className={props.early ? "border-orange-400 bg-orange-50" : ""}><CardContent className="pt-4"><AlertTriangle className="h-4 w-4" /><div className="text-3xl font-bold">{props.early}</div><div className="text-xs">tidig incheckning</div></CardContent></Card>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={props.filter === "all" ? "default" : "outline"} onClick={() => props.onFilter("all")}>Alla {props.total}</Button>
        <Button size="sm" variant={props.filter === "not_started" ? "default" : "outline"} onClick={() => props.onFilter("not_started")}>Ej påbörjade {props.notStarted}</Button>
        <Button size="sm" variant={props.filter === "in_progress" ? "default" : "outline"} onClick={() => props.onFilter("in_progress")}>Pågår {props.inProgress}</Button>
        <Button size="sm" variant={props.filter === "completed" ? "default" : "outline"} onClick={() => props.onFilter("completed")}><CheckCircle2 className="mr-1 h-4 w-4" />Klara {props.completed}</Button>
      </div>
    </div>
  );
}
