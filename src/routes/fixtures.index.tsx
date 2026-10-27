import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, ChevronRight, Trophy, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSeason } from "@/contexts/SeasonContext";

export const Route = createFileRoute("/fixtures/")({
  component: FixturesPage,
  head: () => ({ meta: [{ title: "Kampe — FC Sabbatår" }] }),
});

type Fixture = {
  id: string;
  opponent: string;
  our_score: number | null;
  their_score: number | null;
  played_at: string;
  formation: string;
  kickoff_time: string | null;
  meeting_time: string | null;
};

function FixturesPage() {
  const { user, openLoginDialog } = useAuth();
  const { season, seasonId } = useSeason();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [opponent, setOpponent] = useState("");
  const [playedAt, setPlayedAt] = useState("");
  const [loading, setLoading] = useState(false);

  // Filled after mount so the server-rendered markup does not disagree about "today".
  useEffect(() => { setPlayedAt(new Date().toLocaleDateString("sv-SE")); }, []);

  const load = async () => {
    if (!seasonId) return;
    const { data, error } = await supabase
      .from("fixtures")
      .select("id,opponent,our_score,their_score,played_at,formation,kickoff_time,meeting_time")
      .eq("season_id", seasonId)
      .order("played_at", { ascending: true })
      .order("kickoff_time", { ascending: true });
    if (error) return toast.error(error.message);
    // Nearest match first: upcoming ones soonest-first, then past ones most-recent-first.
    const today = new Date().toLocaleDateString("sv-SE");
    const rows = data ?? [];
    setFixtures([
      ...rows.filter((f) => f.played_at >= today),
      ...rows.filter((f) => f.played_at < today).reverse(),
    ]);
  };

  useEffect(() => { setFixtures([]); load(); }, [seasonId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return openLoginDialog();
    if (!seasonId) return toast.error("Vælg en sæson først");
    const trimmed = opponent.trim();
    if (!trimmed) return;
    if (trimmed.length > 60) return toast.error("Modstanderens navn er for langt");
    setLoading(true);
    const { error } = await supabase
      .from("fixtures")
      .insert({ opponent: trimmed, season_id: seasonId, ...(playedAt ? { played_at: playedAt } : {}) });
    setLoading(false);
    if (error) toast.error(error.message);
    else { setOpponent(""); toast.success("Kamp tilføjet"); load(); }
  };

  const remove = async (f: Fixture) => {
    if (!user) return openLoginDialog();
    if (!confirm(`Slet kampen mod ${f.opponent}?`)) return;
    const { error } = await supabase.from("fixtures").delete().eq("id", f.id);
    if (error) toast.error(error.message);
    else { toast.success("Kamp slettet"); load(); }
  };

  const wins = fixtures.filter((f) => f.our_score != null && f.their_score != null && f.our_score > f.their_score).length;
  const draws = fixtures.filter((f) => f.our_score != null && f.their_score != null && f.our_score === f.their_score).length;
  const losses = fixtures.filter((f) => f.our_score != null && f.their_score != null && f.our_score < f.their_score).length;
  const scored = fixtures.reduce((s, f) => s + (f.our_score ?? 0), 0);
  const conceded = fixtures.reduce((s, f) => s + (f.their_score ?? 0), 0);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">{season?.name ?? "Sæsonen"}</p>
        <h1 className="font-display text-4xl sm:text-5xl">Kampe</h1>
        <p className="text-muted-foreground mt-1 text-sm">Tilføj kampe, redigér opstilling og indtast resultatet. Kampe hører til den valgte sæson.</p>
      </section>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        <RecordCard label="Sejre" value={wins} tone="primary" />
        <RecordCard label="Uafgjort" value={draws} />
        <RecordCard label="Nederlag" value={losses} tone="destructive" />
        <RecordCard label="Scoret" value={scored} tone="primary" />
        <RecordCard label="Indkasseret" value={conceded} tone="destructive" />
      </div>

      <form onSubmit={add} className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Modstanderens navn…"
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
          maxLength={60}
          className="bg-card border-border sm:flex-1"
        />
        <div className="flex gap-2">
          <Input
            type="date"
            aria-label="Kampdato"
            value={playedAt}
            onChange={(e) => setPlayedAt(e.target.value)}
            className="bg-card border-border flex-1 sm:w-[10.5rem] sm:flex-none"
          />
          <Button type="submit" disabled={loading} className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" /> Tilføj
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        {fixtures.map((f) => {
          const played = f.our_score != null && f.their_score != null;
          const result = played
            ? f.our_score! > f.their_score! ? "W" : f.our_score! < f.their_score! ? "L" : "D"
            : null;
          const resultColor =
            result === "W" ? "bg-primary text-primary-foreground" :
            result === "L" ? "bg-destructive text-destructive-foreground" :
            result === "D" ? "bg-muted text-foreground" :
            "bg-secondary text-muted-foreground";
          return (
            <Link
              key={f.id}
              to="/fixtures/$fixtureId"
              params={{ fixtureId: f.id }}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 hover:border-primary/50 active:bg-secondary/30 transition-colors"
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-display text-base shrink-0 ${resultColor}`}>
                {result ?? <Trophy className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{f.opponent}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(f.played_at).toLocaleDateString("da-DK")} · {f.formation}
                </div>
                {(f.kickoff_time || f.meeting_time) && (
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    {f.kickoff_time && (
                      <span className="inline-flex items-center gap-1 text-primary font-semibold" title="Kampstart">
                        <Clock className="h-3 w-3" /> {f.kickoff_time.slice(0, 5)}
                      </span>
                    )}
                    {f.meeting_time && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground" title="Mødetid">
                        <Users className="h-3 w-3" /> Mødetid {f.meeting_time.slice(0, 5)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="font-display text-xl shrink-0">
                {played
                  ? `${f.our_score}–${f.their_score}`
                  : <span className="text-muted-foreground text-xs font-sans">Ikke spillet</span>}
              </div>
              <button
                onClick={(e) => { e.preventDefault(); remove(f); }}
                className="text-muted-foreground hover:text-destructive p-1 -mr-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity"
                aria-label="Slet kamp"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          );
        })}
        {fixtures.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Ingen kampe i {season?.name ?? "denne sæson"} endnu — tilføj den første ovenfor.
          </p>
        )}
      </div>
    </div>
  );
}

function RecordCard({ label, value, tone }: { label: string; value: number; tone?: "primary" | "destructive" }) {
  const color = tone === "primary" ? "text-primary" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground truncate">{label}</div>
      <div className={`font-display text-2xl sm:text-3xl mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}
