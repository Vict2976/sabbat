import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, ChevronRight, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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
};

function FixturesPage() {
  const { user, openLoginDialog } = useAuth();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [opponent, setOpponent] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("fixtures")
      .select("id,opponent,our_score,their_score,played_at,formation")
      .order("played_at", { ascending: false });
    if (error) toast.error(error.message);
    else setFixtures(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return openLoginDialog();
    const trimmed = opponent.trim();
    if (!trimmed) return;
    if (trimmed.length > 60) return toast.error("Modstanderens navn er for langt");
    setLoading(true);
    const { error } = await supabase.from("fixtures").insert({ opponent: trimmed });
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
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Sæsonen</p>
        <h1 className="font-display text-4xl sm:text-5xl">Kampe</h1>
        <p className="text-muted-foreground mt-1 text-sm">Tilføj kampe, redigér opstilling og indtast resultatet.</p>
      </section>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        <RecordCard label="Sejre" value={wins} tone="primary" />
        <RecordCard label="Uafgjort" value={draws} />
        <RecordCard label="Nederlag" value={losses} tone="destructive" />
        <RecordCard label="Scoret" value={scored} tone="primary" />
        <RecordCard label="Indkasseret" value={conceded} tone="destructive" />
      </div>

      <form onSubmit={add} className="flex gap-2">
        <Input
          placeholder="Modstanderens navn…"
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
          maxLength={60}
          className="bg-card border-border"
        />
        <Button type="submit" disabled={loading} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Tilføj
        </Button>
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
          <p className="text-muted-foreground text-sm">Ingen kampe endnu — tilføj den første ovenfor.</p>
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
