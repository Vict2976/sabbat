import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/squad")({
  component: SquadPage,
  head: () => ({ meta: [{ title: "Trup — FC Sabbatår" }] }),
});

type Player = { id: string; name: string };

// @uxid src/routes/squad::SquadPage
function SquadPage() {
  const { user, openLoginDialog } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("players").select("id,name").order("name");
    if (error) toast.error(error.message);
    else setPlayers(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return openLoginDialog();
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
    if (!user) return openLoginDialog();
    if (!confirm(`Fjern ${p.name} fra truppen?`)) return;
    const { error } = await supabase.from("players").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else { toast.success("Spiller fjernet"); load(); }
  };

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Spillertrup</p>
        <h1 className="font-display text-4xl sm:text-5xl">Truppen</h1>
        <p className="text-muted-foreground mt-1 text-sm">Mål, assists og kort registreres på hver enkelt kamp.</p>
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
          <p className="text-muted-foreground">Ingen spillere endnu — tilføj den første ovenfor.</p>
        )}
      </div>
    </div>
  );
}
