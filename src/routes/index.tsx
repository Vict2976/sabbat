import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Goal, Handshake, Square } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: StatsPage,
  head: () => ({ meta: [{ title: "Stats — FC Sabbatår" }] }),
});

type Player = {
  id: string;
  name: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
};

type StatKey = "goals" | "assists" | "yellow_cards" | "red_cards";

function StatsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("goals", { ascending: false });
    if (error) toast.error(error.message);
    else setPlayers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const bump = async (p: Player, key: StatKey, delta: number) => {
    const next = Math.max(0, p[key] + delta);
    setPlayers((prev) => prev.map((x) => (x.id === p.id ? { ...x, [key]: next } : x)));
    const { error } = await supabase.from("players").update({ [key]: next }).eq("id", p.id);
    if (error) { toast.error(error.message); load(); }
  };

  const totals = players.reduce(
    (acc, p) => ({
      goals: acc.goals + p.goals,
      assists: acc.assists + p.assists,
      yellow: acc.yellow + p.yellow_cards,
      red: acc.red + p.red_cards,
    }),
    { goals: 0, assists: 0, yellow: 0, red: 0 },
  );

  const filtered = players.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Season overview</p>
        <h1 className="font-display text-5xl md:text-6xl">The Numbers</h1>
        <p className="text-muted-foreground mt-2">Track every goal, assist and card. Tap +/- to update.</p>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TotalCard icon={<Goal className="h-5 w-5" />} label="Goals" value={totals.goals} accent />
        <TotalCard icon={<Handshake className="h-5 w-5" />} label="Assists" value={totals.assists} />
        <TotalCard icon={<Square className="h-5 w-5 fill-warning text-warning" />} label="Yellow" value={totals.yellow} />
        <TotalCard icon={<Square className="h-5 w-5 fill-destructive text-destructive" />} label="Red" value={totals.red} />
      </div>

      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Player Stats</h2>
        <Input
          placeholder="Search player…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-card border-border"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : players.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[var(--shadow-card)]">
          <div className="hidden md:grid grid-cols-[1fr_repeat(4,minmax(0,140px))] gap-2 px-5 py-3 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>Player</span><span>Goals</span><span>Assists</span><span>Yellow</span><span>Red</span>
          </div>
          {filtered.map((p, i) => (
            <div key={p.id} className={`grid grid-cols-2 md:grid-cols-[1fr_repeat(4,minmax(0,140px))] gap-2 items-center px-5 py-4 ${i !== filtered.length - 1 ? "border-b border-border/60" : ""} hover:bg-secondary/40 transition-colors`}>
              <div className="col-span-2 md:col-span-1 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center font-display text-sm">
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="font-semibold">{p.name}</span>
              </div>
              <StatCell value={p.goals} onInc={() => bump(p, "goals", 1)} onDec={() => bump(p, "goals", -1)} label="G" />
              <StatCell value={p.assists} onInc={() => bump(p, "assists", 1)} onDec={() => bump(p, "assists", -1)} label="A" />
              <StatCell value={p.yellow_cards} onInc={() => bump(p, "yellow_cards", 1)} onDec={() => bump(p, "yellow_cards", -1)} label="Y" tone="warning" />
              <StatCell value={p.red_cards} onInc={() => bump(p, "red_cards", 1)} onDec={() => bump(p, "red_cards", -1)} label="R" tone="destructive" />
            </div>
          ))}
        </div>
      )}
    </div>
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

function StatCell({ value, onInc, onDec, label, tone }: { value: number; onInc: () => void; onDec: () => void; label: string; tone?: "warning" | "destructive" }) {
  const color = tone === "warning" ? "text-warning" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <div className="flex items-center justify-between md:justify-start gap-2">
      <span className="md:hidden text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <button onClick={onDec} className="h-7 w-7 rounded-md bg-secondary hover:bg-secondary/70 text-sm">−</button>
        <span className={`w-8 text-center font-display text-xl ${color}`}>{value}</span>
        <button onClick={onInc} className="h-7 w-7 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-sm font-bold">+</button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-muted-foreground">No players yet.</p>
      <a href="/squad"><Button className="mt-4">Add players</Button></a>
    </div>
  );
}
