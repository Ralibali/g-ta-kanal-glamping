import { useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, Clock, Loader2, Play, RefreshCw, Sparkles, Square, Sun, MoonStar, Coffee, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { tr, type CleanLang } from "@/cleaning/i18n";
import type { TentDayData } from "@/components/cleaning/CleaningChecklist";

type Session = { tent_id: string; cleaning_date: string; status: string };
type OpenEntry = { id: string; started_at: string } | null;

function readableDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

const TODAY_LABELS: Record<CleanLang, {
  todayTitle: string; noWorkToday: string; noWorkBody: string;
  progressLabel: string; progressDone: string;
  clockInBig: string; clockOutBig: string; savedIn: string; savedOut: string;
  runningNow: string; startAt: string;
  cardOpen: string; cardDone: string; cardTodo: string;
  earlyBadge: string; lateBadge: string; departureBadge: string;
}> = {
  sv: {
    todayTitle: "Idag",
    noWorkToday: "Inga tält att städa idag",
    noWorkBody: "Bra jobbat – dagen är ledig. Kolla översikten för nästa arbetsdag.",
    progressLabel: "Klart",
    progressDone: "av",
    clockInBig: "Stämpla in nu",
    clockOutBig: "Stämpla ut",
    savedIn: "Du är instämplad",
    savedOut: "Utstämplad",
    runningNow: "Pågår",
    startAt: "Start",
    cardOpen: "Öppna",
    cardDone: "Klart",
    cardTodo: "Att göra",
    earlyBadge: "Tidig incheckning",
    lateBadge: "Sen utcheckning",
    departureBadge: "Avresa",
  },
  en: {
    todayTitle: "Today",
    noWorkToday: "No tents to clean today",
    noWorkBody: "Nice – you're off. Check the overview for the next cleaning day.",
    progressLabel: "Done",
    progressDone: "of",
    clockInBig: "Clock in now",
    clockOutBig: "Clock out",
    savedIn: "You're clocked in",
    savedOut: "Clocked out",
    runningNow: "Running",
    startAt: "Started",
    cardOpen: "Open",
    cardDone: "Done",
    cardTodo: "To do",
    earlyBadge: "Early check-in",
    lateBadge: "Late checkout",
    departureBadge: "Departure",
  },
  si: {
    todayTitle: "අද",
    noWorkToday: "අද පිරිසිදු කිරීමට කූඩාරම් නැත",
    noWorkBody: "අද නිවාඩුවක්. ඊළඟ දිනය සඳහා දළ දර්ශනය බලන්න.",
    progressLabel: "අවසන්",
    progressDone: "න්",
    clockInBig: "දැන් ඇතුල් වන්න",
    clockOutBig: "පිටවන්න",
    savedIn: "ඔබ ඇතුල් වී ඇත",
    savedOut: "පිටව ඇත",
    runningNow: "ක්‍රියාත්මකයි",
    startAt: "ආරම්භය",
    cardOpen: "විවෘත කරන්න",
    cardDone: "අවසන්",
    cardTodo: "කළ යුතුයි",
    earlyBadge: "කලින් ඇතුල් වීම",
    lateBadge: "පසුව පිටවීම",
    departureBadge: "පිටවීම",
  },
};

interface Props {
  lang: CleanLang;
  userId: string;
  cards: TentDayData[];
  sessions: Session[];
  loading: boolean;
  onOpen: (card: TentDayData) => void;
  onReload: () => void;
}

export function TodayView({ lang, userId, cards, sessions, loading, onOpen, onReload }: Props) {
  const labels = TODAY_LABELS[lang] ?? TODAY_LABELS.sv;
  const [openEntry, setOpenEntry] = useState<OpenEntry>(null);
  const [entryLoading, setEntryLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  const loadOpen = async () => {
    setEntryLoading(true);
    const { data } = await (supabase as any)
      .from("time_entries")
      .select("id, started_at")
      .eq("user_id", userId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1);
    setOpenEntry(((data ?? [])[0] as OpenEntry) ?? null);
    setEntryLoading(false);
  };

  useEffect(() => { void loadOpen(); }, [userId]);

  useEffect(() => {
    if (!openEntry) return;
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, [openEntry?.id]);

  const clockIn = async () => {
    if (busy || openEntry) return;
    setBusy(true);
    const { error } = await (supabase as any).from("time_entries").insert({
      user_id: userId, started_at: new Date().toISOString(), source: "clock",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(labels.savedIn);
    void loadOpen();
  };

  const clockOut = async () => {
    if (busy || !openEntry) return;
    setBusy(true);
    const endedAt = new Date().toISOString();
    const hours = Number(((Date.now() - new Date(openEntry.started_at).getTime()) / 3_600_000).toFixed(2));
    const { error } = await (supabase as any).from("time_entries")
      .update({ ended_at: endedAt, hours }).eq("id", openEntry.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${labels.savedOut} – ${readableDuration(hours * 3_600_000)}`);
    setOpenEntry(null);
  };

  const total = cards.length;
  const doneCount = cards.filter((card) =>
    sessions.some((session) => session.tent_id === card.tent_id && session.cleaning_date === card.date && session.status === "completed"),
  ).length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  const runningMs = openEntry ? Date.now() - new Date(openEntry.started_at).getTime() : 0;
  // reference `now` so the running duration re-renders on the interval tick
  void now;

  return (
    <div className="space-y-4">
      {/* Sticky progress */}
      {total > 0 && (
        <div className="sticky top-[73px] z-10 -mx-4 px-4 py-2 bg-background/95 backdrop-blur border-b" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>{labels.todayTitle}</span>
              <span className="text-muted-foreground font-normal">
                {doneCount} {labels.progressDone} {total} {labels.progressLabel.toLowerCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary">{percent}%</span>
              <button
                type="button"
                onClick={onReload}
                aria-label={lang === "sv" ? "Uppdatera" : "Refresh"}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
              </button>
            </div>
          </div>
          <Progress value={percent} className="h-2" aria-label={`${doneCount} ${labels.progressDone} ${total}`} />
        </div>
      )}

      {/* Big time clock */}
      <Card className={openEntry ? "border-2 border-emerald-500/60 bg-emerald-500/5" : "border-2 border-primary/30"}>
        <CardContent className="pt-5 pb-4">
          {entryLoading ? (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            </div>
          ) : openEntry ? (
            <div className="space-y-3">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                  {labels.runningNow}
                </div>
                <p className="text-4xl font-bold mt-3 tabular-nums">
                  {readableDuration(runningMs)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {labels.startAt} {new Date(openEntry.started_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <Button
                onClick={clockOut}
                disabled={busy}
                variant="destructive"
                className="w-full min-h-14 text-base"
                aria-label={labels.clockOutBig}
              >
                <Square className="h-5 w-5 mr-2" aria-hidden="true" />
                {busy ? "…" : labels.clockOutBig}
              </Button>
            </div>
          ) : (
            <Button
              onClick={clockIn}
              disabled={busy}
              className="w-full min-h-16 text-base"
              size="lg"
              aria-label={labels.clockInBig}
            >
              <Play className="h-6 w-6 mr-2" aria-hidden="true" />
              {busy ? "…" : labels.clockInBig}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Today's tents */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        </div>
      ) : total === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-6 text-center space-y-2">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" aria-hidden="true" />
            <p className="font-medium">{labels.noWorkToday}</p>
            <p className="text-sm text-muted-foreground">{labels.noWorkBody}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {(() => {
            const arrivalCards = cards.filter((c) => c.hasArrival);
            const totalAdults = arrivalCards.reduce((a, c) => a + (c.guests || 0), 0);
            const totalChildren = arrivalCards.reduce((a, c) => a + (c.children || 0), 0);
            const totalGuests = totalAdults + totalChildren;
            if (totalGuests === 0) return null;
            return (
              <div className="flex items-center gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-3">
                <Users className="h-6 w-6 text-primary shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                    {lang === "sv" ? "Gäster som checkar in idag" : lang === "si" ? "අද ඇතුල්වන ආගන්තුකයන්" : "Guests checking in today"}
                  </div>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-2xl font-bold text-primary leading-none tabular-nums">
                      {totalGuests}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {tr(lang, "totalGuests")}
                    </span>
                    {totalChildren > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        ({totalAdults} {tr(lang, "guests").toLowerCase()} + {totalChildren} {tr(lang, "children").toLowerCase()})
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground ml-auto">
                      {arrivalCards.length} / {total} {lang === "sv" ? "tält med ankomst" : lang === "si" ? "කූඩාරම්" : "tents arriving"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
          <ul className="space-y-3" aria-label={tr(lang, "dayView")}>
          {cards.map((card) => {
            // Matcha på tält + datum så att försenade kort inte ärver dagens session
            const session = sessions.find((s) => s.tent_id === card.tent_id && s.cleaning_date === card.date);
            const isDone = session?.status === "completed";
            return (
              <li key={`${card.tent_id}|${card.date}`}>
                <button
                  type="button"
                  onClick={() => onOpen(card)}
                  aria-label={`${card.tentName} – ${isDone ? labels.cardDone : labels.cardTodo}`}
                  className={
                    "w-full text-left rounded-xl border-2 p-4 min-h-16 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 " +
                    (isDone
                      ? "border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10"
                      : card.overdue
                        ? "border-red-500/60 bg-red-500/10 hover:bg-red-500/15"
                        : card.earlyCheckin
                          ? "border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/15"
                          : "border-border bg-card hover:bg-accent")
                  }
                >
                  <div className="flex items-start gap-3">
                    <div className={"rounded-full p-2 shrink-0 " + (isDone ? "bg-emerald-500 text-white" : "bg-primary/15 text-primary")}>
                      {isDone ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <CircleDashed className="h-5 w-5" aria-hidden="true" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif text-lg leading-tight">{card.tentName}</span>
                        <span className="text-xs text-muted-foreground">#{card.tentNo}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{card.position}</p>

                      {card.hasArrival ? (
                        <div className="mt-2.5 flex items-center gap-3 rounded-lg bg-primary/10 border border-primary/30 p-2.5">
                          <Users className="h-6 w-6 text-primary shrink-0" aria-hidden="true" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                              {tr(lang, "guestsLabel")}
                            </div>
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-2xl font-bold text-primary leading-none tabular-nums">
                                {card.guests + card.children}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {tr(lang, "guests").toLowerCase()}
                              </span>
                              {card.children > 0 && (
                                <span className="text-[11px] text-muted-foreground">
                                  ({card.guests} {tr(lang, "guests").toLowerCase()} + {card.children} {tr(lang, "children").toLowerCase()})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2.5 rounded-lg bg-muted/60 border border-border p-2 text-xs text-muted-foreground">
                          {labels.departureBadge} · {lang === "sv" ? "ingen ny gäst idag" : lang === "si" ? "අද අලුත් ආගන්තුකයෙක් නැත" : "no new guest today"}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {card.overdue && (
                          <Badge variant="destructive" className="text-[10px]">
                            {lang === "sv" ? `Försenad · avresa ${card.date}` : lang === "si" ? "ප්‍රමාද වූ" : `Overdue · checkout ${card.date}`}
                          </Badge>
                        )}
                        {card.earlyCheckin && (
                          <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[10px]">
                            <Sun className="h-3 w-3 mr-1" aria-hidden="true" />{labels.earlyBadge}
                          </Badge>
                        )}
                        {card.lateCheckout && (
                          <Badge variant="secondary" className="text-[10px]">
                            <MoonStar className="h-3 w-3 mr-1" aria-hidden="true" />{labels.lateBadge}
                          </Badge>
                        )}
                        {card.hasArrival && card.hasDeparture && (
                          <Badge variant="outline" className="text-[10px]">
                            {lang === "sv" ? "Byte" : lang === "si" ? "මාරුව" : "Turnover"}
                          </Badge>
                        )}
                        {card.breakfast && (
                          <Badge variant="outline" className="text-[10px]">
                            <Coffee className="h-3 w-3 mr-1" aria-hidden="true" />
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-primary text-sm font-medium shrink-0 self-center">
                      {isDone ? labels.cardDone : labels.cardOpen} →
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        </>
      )}
    </div>
  );
}
