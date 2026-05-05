import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Coins, PiggyBank } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/bodekasse")({
  component: BodekassePage,
  head: () => ({ meta: [{ title: "Bødekasse — FC Sabbatår" }] }),
});

type Player = { id: string; name: string };
type Fine = { id: string; player_id: string; amount: number; reason: string; created_at: string };

function BodekassePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [playerId, setPlayerId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const load = async () => {
    const [{ data: ps }, { data: fs }] = await Promise.all([
      supabase.from("players").select("id,name").order("name"),
      supabase.from("fines").select("*").order("created_at", { ascending: false }),
    ]);
    setPlayers(ps ?? []);
    setFines(fs ?? []);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!playerId) return toast.error("Vælg en spiller");
    if (!Number.isFinite(amt) || amt <= 0) return toast.error("Indtast et positivt beløb");
    if (!reason.trim()) return toast.error("Årsag er påkrævet");
    if (reason.length > 200) return toast.error("Årsagen er for lang");
    const { error } = await supabase.from("fines").insert({
      player_id: playerId, amount: amt, reason: reason.trim(),
    });
    if (error) toast.error(error.message);
    else { setAmount(""); setReason(""); toast.success("Bøde tilføjet 💸"); load(); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("fines").delete().eq("id", id);
    if (error) toast.error(error.message);
    else load();
  };

  const totals = new Map<string, number>();
  fines.forEach((f) => totals.set(f.player_id, (totals.get(f.player_id) ?? 0) + Number(f.amount)));
  const grandTotal = fines.reduce((s, f) => s + Number(f.amount), 0);
  const playerName = (id: string) => players.find((p) => p.id === id)?.name ?? "Ukendt";

  const sortedPlayers = [...players].sort(
    (a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0),
  );

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Holdets kasse</p>
          <h1 className="font-display text-5xl md:text-6xl">Bødekasse</h1>
        </div>
        <div className="rounded-xl border border-primary/40 bg-card px-6 py-4 shadow-[var(--shadow-glow)]">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <PiggyBank className="h-4 w-4" /> Samlet pulje
          </div>
          <div className="font-display text-4xl text-primary mt-1">{grandTotal.toFixed(0)} kr</div>
        </div>
      </section>

      <form onSubmit={add} className="grid md:grid-cols-[1fr_140px_1fr_auto] gap-2 items-start rounded-xl border border-border bg-card p-4">
        <Select value={playerId} onValueChange={setPlayerId}>
          <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Spiller" /></SelectTrigger>
          <SelectContent>
            {players.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="number" min="1" placeholder="Beløb" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-input border-border" />
        <Input placeholder="Årsag (fx for sent fremmøde)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} className="bg-input border-border" />
        <Button type="submit" className="gap-2"><Coins className="h-4 w-4" /> Tilføj bøde</Button>
      </form>

      <section>
        <h2 className="font-display text-2xl mb-4">Skyldigt pr. spiller</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedPlayers.map((p) => {
            const owed = totals.get(p.id) ?? 0;
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-display">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold">{p.name}</span>
                </div>
                <span className={`font-display text-2xl ${owed > 0 ? "text-primary" : "text-muted-foreground"}`}>{owed.toFixed(0)} kr</span>
              </div>
            );
          })}
          {players.length === 0 && <p className="text-muted-foreground col-span-full">Tilføj spillere under fanen Trup først.</p>}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-4">Alle bøder</h2>
        {fines.length === 0 ? (
          <p className="text-muted-foreground">Ingen bøder endnu — sådan skal det være 😉</p>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {fines.map((f, i) => (
              <div key={f.id} className={`flex items-center gap-4 px-5 py-3 ${i !== fines.length - 1 ? "border-b border-border/60" : ""}`}>
                <div className="font-semibold w-32 truncate">{playerName(f.player_id)}</div>
                <div className="font-display text-primary w-20">{Number(f.amount).toFixed(0)} kr</div>
                <div className="flex-1 text-muted-foreground truncate">{f.reason}</div>
                <div className="text-xs text-muted-foreground hidden sm:block">{new Date(f.created_at).toLocaleDateString("da-DK")}</div>
                <button onClick={() => remove(f.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
