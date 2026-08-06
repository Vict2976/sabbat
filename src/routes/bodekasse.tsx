import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Coins, PiggyBank, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/bodekasse")({
  component: BodekassePage,
  head: () => ({ meta: [{ title: "Bødekasse — FC Sabbatår" }] }),
});

type Player = { id: string; name: string };
type Fine = { id: string; player_id: string; amount: number; reason: string; paid: boolean; created_at: string };

// @uxid src/routes/bodekasse::BodekassePage
function BodekassePage() {
  const { user, openLoginDialog } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [playerId, setPlayerId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [showPaid, setShowPaid] = useState(true);

  const load = async () => {
    const [{ data: ps }, { data: fs }] = await Promise.all([
      supabase.from("players").select("id,name").order("name"),
      supabase.from("fines").select("*").order("created_at", { ascending: false }),
    ]);
    setPlayers(ps ?? []);
    setFines((fs ?? []) as Fine[]);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return openLoginDialog();
    const amt = Number(amount);
    if (!playerId) return toast.error("Vælg en spiller");
    if (!Number.isFinite(amt) || amt <= 0) return toast.error("Indtast et positivt beløb");
    if (!reason.trim()) return toast.error("Årsag er påkrævet");
    if (reason.length > 200) return toast.error("Årsagen er for lang");
    const { error } = await supabase.from("fines").insert({ player_id: playerId, amount: amt, reason: reason.trim() });
    if (error) toast.error(error.message);
    else { setAmount(""); setReason(""); toast.success("Bøde tilføjet 💸"); load(); }
  };

  const togglePaid = async (f: Fine) => {
    if (!user) return openLoginDialog();
    const next = !f.paid;
    setFines((prev) => prev.map((x) => (x.id === f.id ? { ...x, paid: next } : x)));
    const { error } = await supabase.from("fines").update({ paid: next }).eq("id", f.id);
    if (error) { toast.error(error.message); load(); }
    else toast.success(next ? "Markeret som betalt ✅" : "Markeret som ubetalt");
  };

  const remove = async (id: string) => {
    if (!user) return openLoginDialog();
    const { error } = await supabase.from("fines").delete().eq("id", id);
    if (error) toast.error(error.message);
    else load();
  };

  const markAllPaid = async (pid: string) => {
    if (!user) return openLoginDialog();
    const ids = fines.filter((f) => f.player_id === pid && !f.paid).map((f) => f.id);
    if (ids.length === 0) return;
    if (!confirm(`Markér ${ids.length} bøde(r) som betalt?`)) return;
    const { error } = await supabase.from("fines").update({ paid: true }).in("id", ids);
    if (error) toast.error(error.message);
    else { toast.success("Betalt!"); load(); }
  };

  const owedTotals = new Map<string, number>();
  const paidTotals = new Map<string, number>();
  fines.forEach((f) => {
    const m = f.paid ? paidTotals : owedTotals;
    m.set(f.player_id, (m.get(f.player_id) ?? 0) + Number(f.amount));
  });

  const totalOwed = fines.filter((f) => !f.paid).reduce((s, f) => s + Number(f.amount), 0);
  const totalPaid = fines.filter((f) => f.paid).reduce((s, f) => s + Number(f.amount), 0);
  const playerName = (id: string) => players.find((p) => p.id === id)?.name ?? "Ukendt";

  const sortedPlayers = [...players].sort((a, b) => (owedTotals.get(b.id) ?? 0) - (owedTotals.get(a.id) ?? 0));
  const visibleFines = showPaid ? fines : fines.filter((f) => !f.paid);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Holdets kasse</p>
        <h1 className="font-display text-4xl sm:text-5xl">Bødekasse</h1>
      </section>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-destructive/40 bg-card px-4 py-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Coins className="h-3.5 w-3.5" /> Skyldigt
          </div>
          <div className="font-display text-3xl text-destructive mt-1">{totalOwed.toFixed(0)} kr</div>
        </div>
        <div className="rounded-xl border border-primary/40 bg-card px-4 py-4 shadow-[var(--shadow-glow)]">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <PiggyBank className="h-3.5 w-3.5" /> Betalt
          </div>
          <div className="font-display text-3xl text-primary mt-1">{totalPaid.toFixed(0)} kr</div>
        </div>
      </div>

      {/* Add fine form */}
      <form onSubmit={add} className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Tilføj bøde</p>
        <Select value={playerId} onValueChange={setPlayerId}>
          <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Vælg spiller…" /></SelectTrigger>
          <SelectContent>
            {players.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" min="1" placeholder="Beløb (kr)" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-input border-border" />
          <Input placeholder="Årsag…" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} className="bg-input border-border" />
        </div>
        <Button type="submit" className="w-full gap-2"><Plus className="h-4 w-4" /> Tilføj bøde</Button>
      </form>

      {/* Per-player cards */}
      <section>
        <h2 className="font-display text-xl mb-3">Skyldigt pr. spiller</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedPlayers.map((p) => {
            const owed = owedTotals.get(p.id) ?? 0;
            const paid = paidTotals.get(p.id) ?? 0;
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-display text-sm shrink-0">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">Betalt: {paid.toFixed(0)} kr</div>
                    </div>
                  </div>
                  <span className={`font-display text-2xl shrink-0 ${owed > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {owed.toFixed(0)} kr
                  </span>
                </div>
                {owed > 0 && (
                  <button
                    onClick={() => markAllPaid(p.id)}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold uppercase tracking-wider py-2.5 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Markér alt som betalt
                  </button>
                )}
              </div>
            );
          })}
          {players.length === 0 && <p className="text-muted-foreground text-sm">Tilføj spillere under Trup først.</p>}
        </div>
      </section>

      {/* Fine list */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl">Alle bøder</h2>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <Checkbox checked={showPaid} onCheckedChange={(v) => setShowPaid(!!v)} />
            Vis betalte
          </label>
        </div>
        {visibleFines.length === 0 ? (
          <p className="text-muted-foreground text-sm">Ingen bøder at vise.</p>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border/60">
            {visibleFines.map((f) => (
              <div
                key={f.id}
                className={`flex items-start gap-3 px-4 py-3 ${f.paid ? "opacity-60" : ""}`}
              >
                <Checkbox
                  checked={f.paid}
                  onCheckedChange={() => togglePaid(f)}
                  className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`font-semibold text-sm truncate ${f.paid ? "line-through" : ""}`}>
                      {playerName(f.player_id)}
                    </span>
                    <span className={`font-display text-base shrink-0 ${f.paid ? "text-muted-foreground line-through" : "text-destructive"}`}>
                      {Number(f.amount).toFixed(0)} kr
                    </span>
                  </div>
                  <div className={`text-xs mt-0.5 ${f.paid ? "line-through text-muted-foreground" : "text-muted-foreground"}`}>
                    {f.reason}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {new Date(f.created_at).toLocaleDateString("da-DK")}
                    {f.paid && <span className="ml-2 text-primary font-semibold">✓ Betalt</span>}
                  </div>
                </div>
                <button
                  onClick={() => remove(f.id)}
                  className="text-muted-foreground hover:text-destructive p-1 -mr-1 shrink-0 mt-0.5"
                  aria-label="Slet bøde"
                >
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
