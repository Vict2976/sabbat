import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/squad")({
  component: SquadPage,
  head: () => ({ meta: [{ title: "Trup — FC Sabbatår" }] }),
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

function SquadPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("players")
      .select("id,name,goals,assists,yellow_cards,red_cards")
      .order("name");
    if (error) toast.error(error.message);
    else setPlayers(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed.length > 60) return toast.error("Navnet er for langt");
    setLoading(true);
    const { error } = await supabase.from("players").insert({ name: trimmed });
    setLoading(false);
    if (error) toast.error(error.message);
    else { setName(""); toast.success(`${trimmed} er tilføjet til truppen`); load(); }
  };

  const remove = async (p: Player) => {
    if (!confirm(`Fjern ${p.name} fra truppen?`)) return;
    const { error } = await supabase.from("players").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else { toast.success("Spiller fjernet"); load(); }
  };

  const bump = async (p: Player, key: StatKey, delta: number) => {
    const next = Math.max(0, p[key] + delta);

    // Cap player goals at team's total scored across fixtures
    if (key === "goals" && delta > 0) {
      const { data: fx } = await supabase.from("fixtures").select("our_score");
      const teamScored = (fx ?? []).reduce((s, x) => s + (x.our_score ?? 0), 0);
      const otherPlayerGoals = players.filter((x) => x.id !== p.id).reduce((s, x) => s + x.goals, 0);
      if (otherPlayerGoals + next > teamScored) {
        toast.error(`Holdet har kun scoret ${teamScored} mål i alt. Tilføj kampresultater først.`);
        return;
      }
    }

    setPlayers((prev) => prev.map((x) => (x.id === p.id ? { ...x, [key]: next } : x)));
    const update: Partial<Record<StatKey, number>> = { [key]: next };
    const { error } = await supabase.from("players").update(update).eq("id", p.id);
    if (error) { toast.error(error.message); load(); }
  };

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Spillertrup</p>
        <h1 className="font-display text-5xl md:text-6xl">Truppen</h1>
        <p className="text-muted-foreground mt-2">Tilføj spillere og rediger deres mål, assists og kort.</p>
      </section>

      <form onSubmit={add} className="flex gap-2 max-w-xl">
        <Input
          placeholder="Navn på ny spiller…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          className="bg-card border-border"
        />
        <Button type="submit" disabled={loading} className="gap-2">
          <UserPlus className="h-4 w-4" /> Tilføj
        </Button>
      </form>

      <div className="space-y-2">
        {players.map((p) => {
          const open = openId === p.id;
          return (
            <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setOpenId(open ? null : p.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-display">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold">{p.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-3 text-sm text-muted-foreground">
                    <span><span className="text-foreground font-display">{p.goals}</span> M</span>
                    <span><span className="text-foreground font-display">{p.assists}</span> A</span>
                    <span><span className="text-warning font-display">{p.yellow_cards}</span> G</span>
                    <span><span className="text-destructive font-display">{p.red_cards}</span> R</span>
                  </div>
                  {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>
              {open && (
                <div className="border-t border-border/60 px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatEditor label="Mål" value={p.goals} onInc={() => bump(p, "goals", 1)} onDec={() => bump(p, "goals", -1)} />
                  <StatEditor label="Assists" value={p.assists} onInc={() => bump(p, "assists", 1)} onDec={() => bump(p, "assists", -1)} />
                  <StatEditor label="Gule kort" value={p.yellow_cards} tone="warning" onInc={() => bump(p, "yellow_cards", 1)} onDec={() => bump(p, "yellow_cards", -1)} />
                  <StatEditor label="Røde kort" value={p.red_cards} tone="destructive" onInc={() => bump(p, "red_cards", 1)} onDec={() => bump(p, "red_cards", -1)} />
                  <div className="col-span-2 md:col-span-4 flex justify-end pt-2">
                    <button onClick={() => remove(p)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" /> Fjern spiller
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {players.length === 0 && (
          <p className="text-muted-foreground">Ingen spillere endnu — tilføj den første ovenfor.</p>
        )}
      </div>
    </div>
  );
}

function StatEditor({ label, value, onInc, onDec, tone }: { label: string; value: number; onInc: () => void; onDec: () => void; tone?: "warning" | "destructive" }) {
  const color = tone === "warning" ? "text-warning" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
      <div className="flex items-center justify-between">
        <button onClick={onDec} className="h-8 w-8 rounded-md bg-secondary hover:bg-secondary/70 text-base">−</button>
        <span className={`font-display text-2xl ${color}`}>{value}</span>
        <button onClick={onInc} className="h-8 w-8 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-base font-bold">+</button>
      </div>
    </div>
  );
}
