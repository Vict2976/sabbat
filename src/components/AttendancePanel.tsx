import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Plus, Minus, X, RotateCcw, Lock, Timer } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Player = { id: string; name: string };
type Status = "yes" | "no";
type Answer = Status | null;
type AttendanceRow = { player_id: string; status: Status };

// Teams are picked 48 hours before kickoff, so that is when sign-up closes.
const SIGNUP_CLOSES_BEFORE_MS = 48 * 60 * 60 * 1000;

// Kickoff in local time; a fixture without a kickoff time counts from the start of match day.
function signupDeadline(playedAt: string, kickoffTime: string | null): Date {
  const [y, m, d] = playedAt.split("-").map(Number);
  const [h, min] = (kickoffTime ?? "00:00").split(":").map(Number);
  return new Date(new Date(y, m - 1, d, h, min).getTime() - SIGNUP_CLOSES_BEFORE_MS);
}

function formatCountdown(ms: number): string {
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${days > 0 ? `${days}d ` : ""}${pad(hours)}t ${pad(minutes)}m ${pad(seconds)}s`;
}

// Sign-up for one fixture. Open to every member — no login — since players answer for themselves.
// After the deadline it locks; a logged-in admin can still make late changes.
export function AttendancePanel({
  fixtureId, players, playedAt, kickoffTime,
}: { fixtureId: string; players: Player[]; playedAt: string; kickoffTime: string | null }) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Map<string, Status>>(new Map());
  // Set after mount so the server-rendered markup does not disagree about "now".
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const deadline = useMemo(() => signupDeadline(playedAt, kickoffTime), [playedAt, kickoffTime]);
  const remaining = now === null ? null : deadline.getTime() - now;
  const closed = remaining !== null && remaining <= 0;
  const locked = closed && !user;

  const load = async () => {
    const { data, error } = await supabase
      .from("fixture_attendance")
      .select("player_id,status")
      .eq("fixture_id", fixtureId);
    if (error) return toast.error(error.message);
    setAnswers(new Map((data as AttendanceRow[]).map((r) => [r.player_id, r.status])));
  };

  useEffect(() => { load(); }, [fixtureId]);

  // null clears the answer, moving the player back to "Ej tilkendegivet".
  const answer = async (playerId: string, status: Answer) => {
    if (locked) return toast.error("Tilmeldingen er lukket");
    setAnswers((prev) => {
      const next = new Map(prev);
      if (status) next.set(playerId, status);
      else next.delete(playerId);
      return next;
    });
    const { error } = status
      ? await supabase
          .from("fixture_attendance")
          .upsert(
            { fixture_id: fixtureId, player_id: playerId, status, updated_at: new Date().toISOString() },
            { onConflict: "fixture_id,player_id" },
          )
      : await supabase.from("fixture_attendance").delete().eq("fixture_id", fixtureId).eq("player_id", playerId);
    if (error) toast.error(error.message);
    load();
  };

  const groups = useMemo(() => {
    const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name, "da"));
    return {
      pending: sorted.filter((p) => !answers.has(p.id)),
      yes: sorted.filter((p) => answers.get(p.id) === "yes"),
      no: sorted.filter((p) => answers.get(p.id) === "no"),
    };
  }, [players, answers]);

  const total = players.length || 1;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-display text-xl">Tilmelding</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {locked
              ? "Holdet er sat — tilmeldingen er lukket."
              : "Tryk + eller − for at svare. Højreklik (eller hold fingeren) på en spiller for at ændre svaret."}
          </p>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl text-primary leading-none">{groups.yes.length}</div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">kan spille</div>
        </div>
      </div>

      <SignupCountdown remaining={remaining} deadline={deadline} canOverride={closed && !!user} />

      <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
        <div className="bg-primary transition-all" style={{ width: `${(groups.yes.length / total) * 100}%` }} />
        <div className="bg-destructive transition-all" style={{ width: `${(groups.no.length / total) * 100}%` }} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <AttendanceColumn title="Ej tilkendegivet" count={groups.pending.length} empty="Alle har svaret">
          {groups.pending.map((p) => (
            <PlayerRow key={p.id} player={p} current={null} onAnswer={answer} locked={locked}>
              {locked ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : (
                <>
                  <AnswerButton kind="yes" onClick={() => answer(p.id, "yes")} />
                  <AnswerButton kind="no" onClick={() => answer(p.id, "no")} />
                </>
              )}
            </PlayerRow>
          ))}
        </AttendanceColumn>

        <AttendanceColumn title="Tilmeldt" count={groups.yes.length} tone="primary" empty="Ingen tilmeldte endnu">
          {groups.yes.map((p) => (
            <PlayerRow key={p.id} player={p} current="yes" onAnswer={answer} locked={locked}>
              {locked ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : (
                <AnswerButton kind="no" onClick={() => answer(p.id, "no")} label="Afmeld igen" icon={<X className="h-4 w-4" />} />
              )}
            </PlayerRow>
          ))}
        </AttendanceColumn>

        <AttendanceColumn title="Afmeldt" count={groups.no.length} tone="destructive" empty="Ingen afmeldte">
          {groups.no.map((p) => (
            <PlayerRow key={p.id} player={p} current="no" onAnswer={answer} locked={locked}>
              {locked ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : (
                <AnswerButton kind="yes" onClick={() => answer(p.id, "yes")} label="Tilmeld igen" />
              )}
            </PlayerRow>
          ))}
        </AttendanceColumn>
      </div>
    </section>
  );
}

function SignupCountdown({
  remaining, deadline, canOverride,
}: { remaining: number | null; deadline: Date; canOverride: boolean }) {
  const deadlineLabel = deadline.toLocaleString("da-DK", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });
  const closed = remaining !== null && remaining <= 0;
  // Last 24 hours before the deadline get a warning tone.
  const urgent = remaining !== null && !closed && remaining < 24 * 60 * 60 * 1000;

  if (closed) {
    return (
      <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3 flex items-center gap-3">
        <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-semibold">Tilmeldingen er lukket</div>
          <div className="text-xs text-muted-foreground">
            Lukkede {deadlineLabel}{canOverride && " · Du er logget ind og kan stadig rette svar"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${urgent ? "border-destructive/50 bg-destructive/10" : "border-primary/40 bg-primary/10"}`}>
      <Timer className={`h-5 w-5 shrink-0 ${urgent ? "text-destructive" : "text-primary"}`} />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Tid til at tilmelde sig</div>
        <div className="text-xs text-muted-foreground">Holdet sættes {deadlineLabel}</div>
      </div>
      <div className={`font-display text-xl sm:text-2xl tabular-nums shrink-0 ${urgent ? "text-destructive" : "text-primary"}`}>
        {remaining === null ? "—" : formatCountdown(remaining)}
      </div>
    </div>
  );
}

function AttendanceColumn({
  title, count, tone, empty, children,
}: { title: string; count: number; tone?: "primary" | "destructive"; empty: string; children: React.ReactNode }) {
  const accent =
    tone === "primary" ? "border-t-primary text-primary" :
    tone === "destructive" ? "border-t-destructive text-destructive" :
    "border-t-muted-foreground/40 text-muted-foreground";
  return (
    <div className={`rounded-xl border border-border border-t-2 bg-card overflow-hidden ${accent}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <span className="text-[10px] uppercase tracking-wider font-semibold">{title}</span>
        <span className="font-display text-lg leading-none">{count}</span>
      </div>
      {count === 0 ? (
        <p className="px-4 py-6 text-xs text-center text-muted-foreground">{empty}</p>
      ) : (
        <div className="divide-y divide-border/60 text-foreground">{children}</div>
      )}
    </div>
  );
}

function PlayerRow({
  player, current, onAnswer, locked, children,
}: {
  player: Player; current: Answer; onAnswer: (playerId: string, status: Answer) => void; locked: boolean;
  children: React.ReactNode;
}) {
  const avatar =
    current === "yes" ? "bg-primary text-primary-foreground" :
    current === "no" ? "bg-destructive/15 text-destructive" :
    "bg-secondary";
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild disabled={locked}>
        <div className="flex items-center gap-3 px-4 py-2.5 select-none cursor-context-menu data-[disabled]:cursor-default hover:bg-secondary/40 data-[state=open]:bg-secondary/60 transition-colors">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-display text-xs shrink-0 ${avatar}`}>
            {player.name.slice(0, 2).toUpperCase()}
          </div>
          <span className={`text-sm font-semibold truncate flex-1 ${current === "no" ? "text-muted-foreground" : ""}`}>
            {player.name}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">{children}</div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <div className="px-2 py-1.5 text-xs font-semibold truncate">{player.name}</div>
        <ContextMenuSeparator />
        <ContextMenuItem disabled={current === "yes"} onSelect={() => onAnswer(player.id, "yes")} className="gap-2">
          <Plus className="h-4 w-4 text-primary" /> Tilmeld
        </ContextMenuItem>
        <ContextMenuItem disabled={current === "no"} onSelect={() => onAnswer(player.id, "no")} className="gap-2">
          <Minus className="h-4 w-4 text-destructive" /> Afmeld
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled={current === null} onSelect={() => onAnswer(player.id, null)} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Flyt til Ej tilkendegivet
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function AnswerButton({
  kind, onClick, label, icon,
}: { kind: Status; onClick: () => void; label?: string; icon?: React.ReactNode }) {
  const yes = kind === "yes";
  const title = label ?? (yes ? "Kan spille" : "Kan ikke spille");
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-colors ${
        yes
          ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
          : "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
      }`}
    >
      {icon ?? (yes ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />)}
    </button>
  );
}
