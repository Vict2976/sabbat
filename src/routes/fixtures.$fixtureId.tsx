import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, X } from "lucide-react";
import { toast } from "sonner";
import { FORMATIONS, formationPositions } from "@/lib/formations";

export const Route = createFileRoute("/fixtures/$fixtureId")({
  component: FixtureDetail,
  head: () => ({ meta: [{ title: "Kamp — FC Sabbatår" }] }),
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
  place: string | null;
};
type Player = { id: string; name: string };
type LineupRow = { id: string; fixture_id: string; player_id: string; position: string; slot: number; is_sub: boolean };

const SUB_COUNT = 3;

function FixtureDetail() {
  const { fixtureId } = Route.useParams();
  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [lineup, setLineup] = useState<LineupRow[]>([]);
  const [opponent, setOpponent] = useState("");
  const [playedAt, setPlayedAt] = useState("");
  const [ourScore, setOurScore] = useState("");
  const [theirScore, setTheirScore] = useState("");
  const [formation, setFormation] = useState("4-3-3");
  const [kickoff, setKickoff] = useState("");
  const [meeting, setMeeting] = useState("");
  const [place, setPlace] = useState("");

  const load = async () => {
    const [{ data: f }, { data: ps }, { data: l }] = await Promise.all([
      supabase.from("fixtures").select("*").eq("id", fixtureId).maybeSingle(),
      supabase.from("players").select("id,name").order("name"),
      supabase.from("fixture_lineups").select("*").eq("fixture_id", fixtureId),
    ]);
    if (f) {
      setFixture(f as Fixture);
      setOpponent(f.opponent);
      setPlayedAt(f.played_at);
      setOurScore(f.our_score?.toString() ?? "");
      setTheirScore(f.their_score?.toString() ?? "");
      setFormation(f.formation);
      setKickoff(f.kickoff_time?.slice(0, 5) ?? "");
      setMeeting(f.meeting_time?.slice(0, 5) ?? "");
    }
    setPlayers(ps ?? []);
    setLineup((l ?? []) as LineupRow[]);
  };

  useEffect(() => { load(); }, [fixtureId]);

  const positions = useMemo(() => formationPositions(formation), [formation]);
  const totalSlots = positions.length + SUB_COUNT; // 14

  const lineupBySlot = useMemo(() => {
    const m = new Map<number, LineupRow>();
    lineup.forEach((r) => m.set(r.slot, r));
    return m;
  }, [lineup]);

  const usedPlayerIds = new Set(lineup.map((r) => r.player_id));

  const assign = async (slot: number, position: string, isSub: boolean, playerId: string | null) => {
    const existing = lineupBySlot.get(slot);
    if (!playerId) {
      if (existing) {
        const { error } = await supabase.from("fixture_lineups").delete().eq("id", existing.id);
        if (error) return toast.error(error.message);
      }
    } else {
      // remove this player from any other slot first
      const dup = lineup.find((r) => r.player_id === playerId && r.slot !== slot);
      if (dup) await supabase.from("fixture_lineups").delete().eq("id", dup.id);

      if (existing) {
        const { error } = await supabase
          .from("fixture_lineups")
          .update({ player_id: playerId, position, is_sub: isSub })
          .eq("id", existing.id);
        if (error) return toast.error(error.message);
      } else {
        const { error } = await supabase.from("fixture_lineups").insert({
          fixture_id: fixtureId, player_id: playerId, position, slot, is_sub: isSub,
        });
        if (error) return toast.error(error.message);
      }
    }
    load();
  };

  const saveDetails = async () => {
    const updates: Partial<Fixture> = {
      opponent: opponent.trim() || "TBD",
      played_at: playedAt,
      formation,
      our_score: ourScore === "" ? null : Math.max(0, Number(ourScore)),
      their_score: theirScore === "" ? null : Math.max(0, Number(theirScore)),
      kickoff_time: kickoff || null,
      meeting_time: meeting || null,
    };

    // Validate goals against player goals total
    if (updates.our_score != null) {
      const [{ data: allFixtures }, { data: allPlayers }] = await Promise.all([
        supabase.from("fixtures").select("our_score").neq("id", fixtureId),
        supabase.from("players").select("goals"),
      ]);
      const otherScored = (allFixtures ?? []).reduce((s, x) => s + (x.our_score ?? 0), 0);
      const newTeamScored = otherScored + updates.our_score;
      const playerGoals = (allPlayers ?? []).reduce((s, p) => s + (p.goals ?? 0), 0);
      if (playerGoals > newTeamScored) {
        return toast.error(
          `Spillerne har allerede ${playerGoals} mål registreret. Holdets samlede mål kan ikke være lavere.`,
        );
      }
    }

    const { error } = await supabase.from("fixtures").update(updates).eq("id", fixtureId);
    if (error) toast.error(error.message);
    else { toast.success("Gemt"); load(); }
  };

  const changeFormation = async (newFormation: string) => {
    if (newFormation === formation) return;
    if (lineup.some((r) => !r.is_sub)) {
      if (!confirm("Skift af formation rydder startopstillingen. Fortsæt?")) return;
      await supabase.from("fixture_lineups").delete().eq("fixture_id", fixtureId).eq("is_sub", false);
    }
    setFormation(newFormation);
    await supabase.from("fixtures").update({ formation: newFormation }).eq("id", fixtureId);
    load();
  };

  if (!fixture) return <p className="text-muted-foreground">Indlæser…</p>;

  const startersFilled = lineup.filter((r) => !r.is_sub).length;
  const subsFilled = lineup.filter((r) => r.is_sub).length;

  return (
    <div className="space-y-8">
      <Link to="/fixtures" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Alle kampe
      </Link>

      <section>
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Kamp</p>
        <h1 className="font-display text-4xl md:text-5xl">FC Sabbatår vs {fixture.opponent}</h1>
      </section>

      <div className="rounded-xl border border-border bg-card p-5 grid md:grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Modstander</label>
          <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} maxLength={60} className="bg-input border-border mt-1" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Dato</label>
          <Input type="date" value={playedAt} onChange={(e) => setPlayedAt(e.target.value)} className="bg-input border-border mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Mødetid</label>
            <Input type="time" value={meeting} onChange={(e) => setMeeting(e.target.value)} className="bg-input border-border mt-1" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Kampstart</label>
            <Input type="time" value={kickoff} onChange={(e) => setKickoff(e.target.value)} className="bg-input border-border mt-1" />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Vores mål</label>
          <Input type="number" min="0" value={ourScore} onChange={(e) => setOurScore(e.target.value)} placeholder="–" className="bg-input border-border mt-1" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Modstanderens mål</label>
          <Input type="number" min="0" value={theirScore} onChange={(e) => setTheirScore(e.target.value)} placeholder="–" className="bg-input border-border mt-1" />
        </div>
        <div className="flex items-end">
          <Button onClick={saveDetails} className="gap-2 w-full"><Save className="h-4 w-4" /> Gem</Button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-2xl">Opstilling</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {startersFilled}/{positions.length} startere · {subsFilled}/{SUB_COUNT} skiftere · i alt {startersFilled + subsFilled}/{totalSlots}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-muted-foreground tracking-wider">Formation</span>
            <Select value={formation} onValueChange={changeFormation}>
              <SelectTrigger className="w-32 bg-card border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(FORMATIONS).map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pitch */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 p-6 md:p-10" style={{
          background: "repeating-linear-gradient(180deg, oklch(0.32 0.08 145) 0 60px, oklch(0.28 0.07 145) 60px 120px)",
        }}>
          <div className="absolute inset-3 border-2 border-white/30 rounded-xl pointer-events-none" />
          <div className="absolute left-1/2 top-3 bottom-3 w-px bg-white/30 pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full border-2 border-white/30 pointer-events-none" />

          <div className="relative space-y-6">
            {/* Attack on top, defense on bottom (reverse) */}
            {[...FORMATIONS[formation]?.rows ?? []].reverse().map((row, ri) => {
              // Calculate slot offset: GK=0, then rows in original order starting at 1
              const rows = FORMATIONS[formation].rows;
              const reversedIndex = rows.length - 1 - ri;
              const offset = 1 + rows.slice(0, reversedIndex).reduce((s, r) => s + r.length, 0);
              return (
                <div key={ri} className="flex justify-evenly gap-3 flex-wrap">
                  {row.map((pos, pi) => {
                    const slot = offset + pi;
                    return (
                      <SlotCard
                        key={slot}
                        slot={slot}
                        position={pos}
                        isSub={false}
                        current={lineupBySlot.get(slot)}
                        players={players}
                        usedPlayerIds={usedPlayerIds}
                        onAssign={assign}
                      />
                    );
                  })}
                </div>
              );
            })}
            {/* Goalkeeper */}
            <div className="flex justify-center">
              <SlotCard
                slot={0}
                position="GK"
                isSub={false}
                current={lineupBySlot.get(0)}
                players={players}
                usedPlayerIds={usedPlayerIds}
                onAssign={assign}
              />
            </div>
          </div>
        </div>

        {/* Subs bench */}
        <div>
          <h3 className="font-display text-lg mb-3 text-muted-foreground uppercase tracking-wider text-sm">Bænken</h3>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: SUB_COUNT }).map((_, i) => {
              const slot = 100 + i;
              return (
                <SlotCard
                  key={slot}
                  slot={slot}
                  position={`SUB ${i + 1}`}
                  isSub
                  current={lineupBySlot.get(slot)}
                  players={players}
                  usedPlayerIds={usedPlayerIds}
                  onAssign={assign}
                  bench
                />
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function SlotCard({
  slot, position, isSub, current, players, usedPlayerIds, onAssign, bench,
}: {
  slot: number;
  position: string;
  isSub: boolean;
  current: LineupRow | undefined;
  players: Player[];
  usedPlayerIds: Set<string>;
  onAssign: (slot: number, position: string, isSub: boolean, playerId: string | null) => void;
  bench?: boolean;
}) {
  const currentPlayer = current ? players.find((p) => p.id === current.player_id) : undefined;
  const available = players.filter((p) => !usedPlayerIds.has(p.id) || p.id === current?.player_id);

  return (
    <div className={`relative rounded-xl border ${bench ? "border-border bg-card" : "border-white/30 bg-background/85 backdrop-blur-sm"} p-2 min-w-[110px] max-w-[140px] shadow-[var(--shadow-card)]`}>
      <div className={`text-[10px] uppercase tracking-wider mb-1 ${bench ? "text-muted-foreground" : "text-primary"}`}>{position}</div>
      <Select value={current?.player_id ?? ""} onValueChange={(v) => onAssign(slot, position, isSub, v || null)}>
        <SelectTrigger className="h-8 text-xs bg-input border-border w-full">
          <SelectValue placeholder="Vælg…">{currentPlayer?.name}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {available.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>
      {current && (
        <button
          onClick={() => onAssign(slot, position, isSub, null)}
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-90"
          aria-label="Fjern"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
