import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSeason } from "@/contexts/SeasonContext";

export const Route = createFileRoute("/squad")({
  component: SquadPage,
  head: () => ({ meta: [{ title: "Trup — FC Sabbatår" }] }),
});

type Player = { id: string; name: string };

function SquadPage() {
  const { user, openLoginDialog } = useAuth();
  const { season, seasonId } = useSeason();
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [squadIds, setSquadIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Players are shared across seasons; season_players decides who is in the selected season's trup.
  const load = async () => {
    if (!seasonId) return;
    const [{ data: ps, error }, { data: sp, error: spError }] = await Promise.all([
      supabase.from("players").select("id,name").order("name"),
      supabase.from("season_players").select("player_id").eq("season_id", seasonId),
    ]);
    if (error || spError) return toast.error((error ?? spError)!.message);
    setAllPlayers(ps ?? []);
    setSquadIds(new Set((sp ?? []).map((r) => r.player_id)));
  };

  useEffect(() => { load(); }, [seasonId]);

  const players = allPlayers.filter((p) => squadIds.has(p.id));
  const others = allPlayers.filter((p) => !squadIds.has(p.id));

  const addToSeason = async (p: Player) => {
    if (!user) return openLoginDialog();
    if (!seasonId) return;
    const { error } = await supabase.from("season_players").insert({ season_id: seasonId, player_id: p.id });
    if (error) toast.error(error.message);
    else { toast.success(`${p.name} er tilføjet til truppen`); load(); }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return openLoginDialog();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed.length > 60) return toast.error("Navnet er for langt");
    if (!seasonId) return toast.error("Vælg en sæson først");
    // Typing the name of a player from another season adds them instead of creating a duplicate.
    const existing = allPlayers.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (squadIds.has(existing.id)) return toast.error(`${existing.name} er allerede i truppen`);
      setName("");
      return addToSeason(existing);
    }
    setLoading(true);
    const { data, error } = await supabase.from("players").insert({ name: trimmed }).select("id").single();
    const { error: spError } = data
      ? await supabase.from("season_players").insert({ season_id: seasonId, player_id: data.id })
      : { error: null };
    setLoading(false);
    if (error || spError) toast.error((error ?? spError)!.message);
    else { setName(""); toast.success(`${trimmed} er tilføjet til truppen`); load(); }
  };

  const remove = async (p: Player) => {
    if (!user) return openLoginDialog();
    if (!seasonId) return;
    if (!confirm(`Fjern ${p.name} fra truppen i ${season?.name ?? "denne sæson"}?`)) return;
    // Only leaves this season's trup — the player, their stats and bøder stay.
    const { error } = await supabase.from("season_players").delete().eq("season_id", seasonId).eq("player_id", p.id);
    if (error) toast.error(error.message);
    else { toast.success("Spiller fjernet"); load(); }
  };

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Spillertrup · {season?.name ?? "Sæsonen"}</p>
        <h1 className="font-display text-4xl sm:text-5xl">Truppen</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {players.length} spillere i {season?.name ?? "denne sæson"}. Hver sæson har sin egen trup — mål, assists og kort registreres på hver enkelt kamp.
        </p>
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
        {players.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-display">
                {p.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-semibold">{p.name}</span>
            </div>
            <button onClick={() => remove(p)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {players.length === 0 && (
          <p className="text-muted-foreground">Ingen spillere i {season?.name ?? "denne sæson"} endnu — tilføj den første ovenfor.</p>
        )}
      </div>

      {others.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">Ikke i truppen</h2>
            <p className="text-xs text-muted-foreground mt-1">Spillere fra andre sæsoner. Tryk + for at tilføje dem.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {others.map((p) => (
              <button
                key={p.id}
                onClick={() => addToSeason(p)}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-card/50 pl-3 pr-2 py-1.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                {p.name} <Plus className="h-3.5 w-3.5 text-primary" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
