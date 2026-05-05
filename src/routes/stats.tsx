import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Goal, Handshake, Square } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
  head: () => ({ meta: [{ title: "Statistik — FC Sabbatår" }] }),
});

type Player = {
  id: string;
  name: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
};

function StatsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [teamScored, setTeamScored] = useState(0);
  const [teamConceded, setTeamConceded] = useState(0);

  const load = async () => {
    const [{ data: ps, error }, { data: fx }] = await Promise.all([
      supabase.from("players").select("*"),
      supabase.from("fixtures").select("our_score,their_score"),
    ]);
    if (error) toast.error(error.message);
    else setPlayers(ps ?? []);
    setTeamScored((fx ?? []).reduce((s, x) => s + (x.our_score ?? 0), 0));
    setTeamConceded((fx ?? []).reduce((s, x) => s + (x.their_score ?? 0), 0));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const playerGoals = players.reduce((s, p) => s + p.goals, 0);

  const totals = {
    goals: teamScored,
    assists: players.reduce((s, p) => s + p.assists, 0),
    yellow: players.reduce((s, p) => s + p.yellow_cards, 0),
    red: players.reduce((s, p) => s + p.red_cards, 0),
    conceded: teamConceded,
  };

  // Sort: goals desc, assists desc, red asc, yellow asc, name asc
  const sorted = [...players].sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    if (b.assists !== a.assists) return b.assists - a.assists;
    if (a.red_cards !== b.red_cards) return a.red_cards - b.red_cards;
    if (a.yellow_cards !== b.yellow_cards) return a.yellow_cards - b.yellow_cards;
    return a.name.localeCompare(b.name, "da");
  });

  const filtered = sorted.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Sæsonoverblik</p>
        <h1 className="font-display text-5xl md:text-6xl">Tallene</h1>
        <p className="text-muted-foreground mt-2">Sorteret efter mål, så assists, færrest røde, færrest gule. Rediger tallene under fanen Trup.</p>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <TotalCard icon={<Goal className="h-5 w-5" />} label="Scoret" value={totals.goals} accent />
        <TotalCard icon={<Goal className="h-5 w-5 rotate-180" />} label="Indkasseret" value={totals.conceded} />
        <TotalCard icon={<Handshake className="h-5 w-5" />} label="Assists" value={totals.assists} />
        <TotalCard icon={<Square className="h-5 w-5 fill-warning text-warning" />} label="Gule" value={totals.yellow} />
        <TotalCard icon={<Square className="h-5 w-5 fill-destructive text-destructive" />} label="Røde" value={totals.red} />
      </div>

      {teamScored - playerGoals > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-display text-primary text-base">{teamScored - playerGoals}</span> mål mangler at blive tildelt en spiller. Tilføj dem i fanen <Link to="/squad" className="text-primary underline">Trup</Link>.
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Topscorerlisten</h2>
        <Input
          placeholder="Søg spiller…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-card border-border"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Indlæser…</p>
      ) : players.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[var(--shadow-card)]">
          <div className="hidden md:grid grid-cols-[40px_1fr_repeat(4,minmax(0,90px))] gap-2 px-5 py-3 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>#</span><span>Spiller</span>
            <span className="text-right">Mål</span>
            <span className="text-right">Assists</span>
            <span className="text-right">Gule</span>
            <span className="text-right">Røde</span>
          </div>
          {filtered.map((p, i) => {
            const rank = sorted.indexOf(p) + 1;
            const podium = rank === 1 ? "text-primary" : rank <= 3 ? "text-foreground" : "text-muted-foreground";
            return (
              <div key={p.id} className={`grid grid-cols-[30px_1fr_auto] md:grid-cols-[40px_1fr_repeat(4,minmax(0,90px))] gap-2 items-center px-5 py-4 ${i !== filtered.length - 1 ? "border-b border-border/60" : ""} hover:bg-secondary/30 transition-colors`}>
                <span className={`font-display text-xl ${podium}`}>{rank}</span>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center font-display text-sm shrink-0">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold truncate">{p.name}</span>
                </div>
                <div className="md:hidden flex items-center gap-3 text-sm font-display">
                  <Stat label="M" value={p.goals} />
                  <Stat label="A" value={p.assists} />
                  <Stat label="G" value={p.yellow_cards} tone="warning" />
                  <Stat label="R" value={p.red_cards} tone="destructive" />
                </div>
                <span className="hidden md:block text-right font-display text-xl">{p.goals}</span>
                <span className="hidden md:block text-right font-display text-xl">{p.assists}</span>
                <span className="hidden md:block text-right font-display text-xl text-warning">{p.yellow_cards}</span>
                <span className="hidden md:block text-right font-display text-xl text-destructive">{p.red_cards}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warning" | "destructive" }) {
  const color = tone === "warning" ? "text-warning" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <span className="flex items-center gap-1">
      <span className="text-[10px] uppercase text-muted-foreground">{label}</span>
      <span className={color}>{value}</span>
    </span>
  );
}

function TotalCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent?: boolean }) {
  return (
    <div className={`relative rounded-xl border p-5 overflow-hidden ${accent ? "border-primary/40" : "border-border"} bg-card shadow-[var(--shadow-card)]`}>
      {accent && <div className="absolute inset-0 opacity-20" style={{ background: "var(--gradient-primary)" }} />}
      <div className="relative">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">{icon}{label}</div>
        <div className="font-display text-4xl mt-2">{value}</div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-muted-foreground">Ingen spillere endnu.</p>
      <a href="/squad"><Button className="mt-4">Tilføj spillere</Button></a>
    </div>
  );
}
