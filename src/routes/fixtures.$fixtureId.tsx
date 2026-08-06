import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ArrowLeft, Save, X, ChevronsUpDown, Pencil, CalendarDays, Clock, Users, MapPin } from "lucide-react";
import { toast } from "sonner";
import { FORMATIONS, formationPositions, parseFormation, parseFormationPattern } from "@/lib/formations";
import { useAuth } from "@/contexts/AuthContext";

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
type EventType = "goal" | "assist" | "yellow_card" | "red_card";
type FixtureEvent = { id: string; fixture_id: string; player_id: string; event_type: EventType };

const SUB_COUNT = 3;

// @uxid src/routes/fixtures.$fixtureId::FixtureDetail
function FixtureDetail() {
  const { user, openLoginDialog } = useAuth();
  const { fixtureId } = Route.useParams();
  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [lineup, setLineup] = useState<LineupRow[]>([]);
  const [events, setEvents] = useState<FixtureEvent[]>([]);
  const [editing, setEditing] = useState(false);

  const [opponent, setOpponent] = useState("");
  const [playedAt, setPlayedAt] = useState("");
  const [ourScore, setOurScore] = useState("");
  const [theirScore, setTheirScore] = useState("");
  const [formation, setFormation] = useState("4-3-3");
  const [customFormation, setCustomFormation] = useState("");
  const [kickoff, setKickoff] = useState("");
  const [meeting, setMeeting] = useState("");
  const [place, setPlace] = useState("");

  const load = async () => {
    const [{ data: f }, { data: ps }, { data: l }, { data: ev }] = await Promise.all([
      supabase.from("fixtures").select("*").eq("id", fixtureId).maybeSingle(),
      supabase.from("players").select("id,name").order("name"),
      supabase.from("fixture_lineups").select("*").eq("fixture_id", fixtureId),
      supabase.from("fixture_events").select("*").eq("fixture_id", fixtureId),
    ]);
    if (f) {
      setFixture(f as Fixture);
      setOpponent(f.opponent);
      setPlayedAt(f.played_at);
      setOurScore(f.our_score?.toString() ?? "");
      setTheirScore(f.their_score?.toString() ?? "");
      setFormation(f.formation);
      setCustomFormation(FORMATIONS[f.formation] ? "" : f.formation);
      setKickoff(f.kickoff_time?.slice(0, 5) ?? "");
      setMeeting(f.meeting_time?.slice(0, 5) ?? "");
      setPlace(f.place ?? "");
    }
    setPlayers(ps ?? []);
    setLineup((l ?? []) as LineupRow[]);
    setEvents((ev ?? []) as FixtureEvent[]);
  };

  useEffect(() => { load(); }, [fixtureId]);

  const positions = useMemo(() => formationPositions(formation), [formation]);
  const editFormation = useMemo(() => parseFormation(formation), [formation]);
  const totalSlots = positions.length + SUB_COUNT;

  const lineupBySlot = useMemo(() => {
    const m = new Map<number, LineupRow>();
    lineup.forEach((r) => m.set(r.slot, r));
    return m;
  }, [lineup]);

  const usedPlayerIds = new Set(lineup.map((r) => r.player_id));
  const playerName = (id: string) => players.find((p) => p.id === id)?.name ?? "—";

  const lineupPlayers = useMemo(() => {
    const ids = new Set(lineup.map((r) => r.player_id));
    return players.filter((p) => ids.has(p.id)).sort((a, b) => a.name.localeCompare(b.name, "da"));
  }, [lineup, players]);

  const assign = async (slot: number, position: string, isSub: boolean, playerId: string | null) => {
    if (!user) return openLoginDialog();
    const existing = lineupBySlot.get(slot);
    if (!playerId) {
      if (existing) {
        const { error } = await supabase.from("fixture_lineups").delete().eq("id", existing.id);
        if (error) return toast.error(error.message);
      }
    } else {
      const dup = lineup.find((r) => r.player_id === playerId && r.slot !== slot);
      if (dup) await supabase.from("fixture_lineups").delete().eq("id", dup.id);
      if (existing) {
        const { error } = await supabase.from("fixture_lineups").update({ player_id: playerId, position, is_sub: isSub }).eq("id", existing.id);
        if (error) return toast.error(error.message);
      } else {
        const { error } = await supabase.from("fixture_lineups").insert({ fixture_id: fixtureId, player_id: playerId, position, slot, is_sub: isSub });
        if (error) return toast.error(error.message);
      }
    }
    load();
  };

  const addEvent = async (playerId: string, eventType: EventType) => {
    if (!user) return openLoginDialog();
    const { error } = await supabase.from("fixture_events").insert({ fixture_id: fixtureId, player_id: playerId, event_type: eventType });
    if (error) return toast.error(error.message);
    load();
  };

  const removeEvent = async (eventId: string) => {
    if (!user) return openLoginDialog();
    const { error } = await supabase.from("fixture_events").delete().eq("id", eventId);
    if (error) return toast.error(error.message);
    load();
  };

  const saveDetails = async () => {
    if (!user) return openLoginDialog();
    const updates: Partial<Fixture> = {
      opponent: opponent.trim() || "TBD",
      played_at: playedAt,
      formation,
      our_score: ourScore === "" ? null : Math.max(0, Number(ourScore)),
      their_score: theirScore === "" ? null : Math.max(0, Number(theirScore)),
      kickoff_time: kickoff || null,
      meeting_time: meeting || null,
      place: place.trim() || null,
    };
    const { error } = await supabase.from("fixtures").update(updates).eq("id", fixtureId);
    if (error) { toast.error(error.message); return; }
    toast.success("Gemt");
    await load();
    setEditing(false);
  };

  const changeFormation = async (newFormation: string) => {
    if (!user) return openLoginDialog();
    if (newFormation === formation) return;
    if (lineup.some((r) => !r.is_sub)) {
      if (!confirm("Skift af formation rydder startopstillingen. Fortsæt?")) return;
      await supabase.from("fixture_lineups").delete().eq("fixture_id", fixtureId).eq("is_sub", false);
    }
    setFormation(newFormation);
    await supabase.from("fixtures").update({ formation: newFormation }).eq("id", fixtureId);
    load();
  };

  const applyCustomFormation = (e: React.FormEvent) => {
    e.preventDefault();
    const pattern = customFormation.trim();
    if (!parseFormationPattern(pattern)) {
      toast.error("Ugyldig formation — tallene skal give 10 i alt (fx 4-4-1-1).");
      return;
    }
    changeFormation(pattern);
  };

  if (!fixture) return <p className="text-muted-foreground">Indlæser…</p>;

  const dateLabel = new Date(fixture.played_at).toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" });
  const isPlayed = fixture.our_score !== null && fixture.their_score !== null;
  const startersFilled = lineup.filter((r) => !r.is_sub).length;
  const subsFilled = lineup.filter((r) => r.is_sub).length;
  const pitchFormation = parseFormation(fixture.formation);

  const goalEvents = events.filter((e) => e.event_type === "goal");
  const assistEvents = events.filter((e) => e.event_type === "assist");
  const yellowEvents = events.filter((e) => e.event_type === "yellow_card");
  const redEvents = events.filter((e) => e.event_type === "red_card");

  // ── VIEW MODE ──────────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Link to="/fixtures" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Alle kampe
          </Link>
          <Button onClick={() => { if (!user) { openLoginDialog(); return; } setEditing(true); }} variant="outline" className="gap-2">
            <Pencil className="h-4 w-4" /> Rediger
          </Button>
        </div>

        <section className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Kamp</p>
          {isPlayed ? (
            <>
              <h1 className="font-display text-3xl sm:text-5xl">FC Sabbatår</h1>
              <p className="font-display text-3xl sm:text-5xl text-primary mt-1">{fixture.our_score} – {fixture.their_score}</p>
              <p className="font-display text-2xl text-muted-foreground">{fixture.opponent}</p>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl sm:text-5xl">FC Sabbatår</h1>
              <p className="font-display text-xl text-muted-foreground mt-1">vs</p>
              <h2 className="font-display text-3xl sm:text-5xl">{fixture.opponent}</h2>
            </>
          )}
        </section>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <InfoCard icon={<CalendarDays className="h-5 w-5" />} label="Dato" value={dateLabel} />
          <InfoCard icon={<MapPin className="h-5 w-5" />} label="Sted" value={fixture.place ?? "—"} />
          <InfoCard icon={<Users className="h-5 w-5" />} label="Mødetid" value={fixture.meeting_time?.slice(0, 5) ?? "—"} />
          <InfoCard icon={<Clock className="h-5 w-5" />} label="Kampstart" value={fixture.kickoff_time?.slice(0, 5) ?? "—"} highlight />
        </div>

        {/* Events summary */}
        {events.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="font-display text-lg">Hændelser</h3>
            <div className="space-y-2">
              <EventViewRow icon="⚽" label="Mål" evts={goalEvents} playerName={playerName} />
              <EventViewRow icon="🎯" label="Assists" evts={assistEvents} playerName={playerName} />
              <EventViewRow icon="🟨" label="Gule kort" evts={yellowEvents} playerName={playerName} />
              <EventViewRow icon="🟥" label="Røde kort" evts={redEvents} playerName={playerName} />
            </div>
          </div>
        )}

        <section>
          <h3 className="font-display text-xl mb-3">
            Opstilling <span className="text-muted-foreground text-sm ml-1">{fixture.formation}</span>
          </h3>

          <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 p-3 sm:p-5 min-h-[460px] sm:min-h-[560px]" style={{
            background: "repeating-linear-gradient(0deg, oklch(0.32 0.08 145) 0 60px, oklch(0.28 0.07 145) 60px 120px)",
          }}>
            <div className="absolute inset-3 border-2 border-white/30 rounded-xl pointer-events-none" />
            <div className="absolute left-3 right-3 top-1/2 h-px bg-white/30 pointer-events-none" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full border-2 border-white/30 pointer-events-none" />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-40 h-16 border-2 border-b-0 border-white/30 rounded-t-md pointer-events-none" />
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-40 h-16 border-2 border-t-0 border-white/30 rounded-b-md pointer-events-none" />

            <div className="relative flex flex-col-reverse items-stretch justify-between gap-1 h-full min-h-[430px] sm:min-h-[520px] py-1">
              <div className="flex justify-center">
                <PitchPlayer position="GK" name={lineupBySlot.get(0) ? playerName(lineupBySlot.get(0)!.player_id) : null} events={events} playerId={lineupBySlot.get(0)?.player_id} />
              </div>
              {pitchFormation.rows.map((row, ri) => {
                const offset = 1 + pitchFormation.rows.slice(0, ri).reduce((s, r) => s + r.length, 0);
                return (
                  <div key={ri} className="flex flex-row justify-evenly flex-1 gap-2">
                    {row.map((pos, pi) => {
                      const slot = offset + pi;
                      const r = lineupBySlot.get(slot);
                      return <PitchPlayer key={slot} position={pos} name={r ? playerName(r.player_id) : null} events={events} playerId={r?.player_id} />;
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-2">Bænken</h3>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: SUB_COUNT }).map((_, i) => {
                const r = lineupBySlot.get(100 + i);
                return (
                  <div key={i} className="rounded-xl border border-border bg-card px-3 py-2.5 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-display text-xs shrink-0">
                      {r ? playerName(r.player_id).slice(0, 2).toUpperCase() : "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Skifter {i + 1}</div>
                      <div className={`text-sm font-semibold truncate ${r ? "" : "text-muted-foreground"}`}>
                        {r ? playerName(r.player_id) : "Ikke valgt"}
                      </div>
                      {r && (
                        <div className="flex gap-1 mt-0.5">
                          {events.filter(e => e.player_id === r.player_id).map(e => (
                            <span key={e.id} className="text-xs">{EVENT_ICONS[e.event_type]}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── EDIT MODE ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={() => setEditing(false)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Tilbage
        </button>
        <Button onClick={saveDetails} className="gap-2">
          <Save className="h-4 w-4" /> Gem
        </Button>
      </div>

      <section>
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Rediger kamp</p>
        <h1 className="font-display text-3xl sm:text-5xl">FC Sabbatår vs {fixture.opponent}</h1>
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
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Sted</label>
          <Input value={place} onChange={(e) => setPlace(e.target.value)} maxLength={80} placeholder="fx Ryparken" className="bg-input border-border mt-1" />
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
      </div>

      {/* Events editor */}
      {lineupPlayers.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="font-display text-2xl">Hændelser</h2>
            <p className="text-xs text-muted-foreground mt-1">Tryk på en knap for at tilføje en hændelse. Tryk på en hændelse for at fjerne den.</p>
          </div>
          <div className="rounded-xl border border-border bg-card divide-y divide-border/60">
            {lineupPlayers.map((p) => {
              const playerEvents = events.filter((e) => e.player_id === p.id);
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-[130px]">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-display text-xs shrink-0">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap flex-1">
                    {/* Add buttons */}
                    <div className="flex gap-1.5">
                      {(["goal", "assist", "yellow_card", "red_card"] as EventType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => addEvent(p.id, type)}
                          title={EVENT_LABELS[type]}
                          className="h-8 w-8 rounded-lg border border-border bg-background/60 hover:bg-secondary flex items-center justify-center text-base transition-colors"
                        >
                          {EVENT_ICONS[type]}
                        </button>
                      ))}
                    </div>
                    {/* Recorded events */}
                    {playerEvents.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {playerEvents.map((e) => (
                          <button
                            key={e.id}
                            onClick={() => removeEvent(e.id)}
                            title="Fjern hændelse"
                            className="h-7 px-2 rounded-md bg-secondary hover:bg-destructive/20 border border-border flex items-center gap-1 text-xs transition-colors group"
                          >
                            <span>{EVENT_ICONS[e.event_type]}</span>
                            <X className="h-2.5 w-2.5 text-muted-foreground group-hover:text-destructive" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-2xl">Opstilling</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {startersFilled}/{positions.length} startere · {subsFilled}/{SUB_COUNT} skiftere · i alt {startersFilled + subsFilled}/{totalSlots}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase text-muted-foreground tracking-wider">Formation</span>
              <Select value={FORMATIONS[formation] ? formation : undefined} onValueChange={changeFormation}>
                <SelectTrigger className="w-32 bg-card border-border"><SelectValue placeholder="Egen" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(FORMATIONS).map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <form onSubmit={applyCustomFormation} className="flex items-center gap-2">
              <Input
                value={customFormation}
                onChange={(e) => setCustomFormation(e.target.value)}
                placeholder="Egen, fx 4-4-1-1"
                className="w-32 h-9 bg-card border-border"
              />
              <Button type="submit" variant="outline" size="sm">Brug</Button>
            </form>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 p-3 sm:p-8" style={{
          background: "repeating-linear-gradient(180deg, oklch(0.32 0.08 145) 0 60px, oklch(0.28 0.07 145) 60px 120px)",
        }}>
          <div className="absolute inset-3 border-2 border-white/30 rounded-xl pointer-events-none" />
          <div className="absolute left-1/2 top-3 bottom-3 w-px bg-white/30 pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full border-2 border-white/30 pointer-events-none" />

          <div className="relative space-y-3 sm:space-y-6">
            {[...editFormation.rows].reverse().map((row, ri) => {
              const rows = editFormation.rows;
              const reversedIndex = rows.length - 1 - ri;
              const offset = 1 + rows.slice(0, reversedIndex).reduce((s, r) => s + r.length, 0);
              return (
                <div key={ri} className="flex justify-evenly gap-1 sm:gap-3">
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
            <div className="flex justify-center">
              <SlotCard slot={0} position="GK" isSub={false} current={lineupBySlot.get(0)} players={players} usedPlayerIds={usedPlayerIds} onAssign={assign} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-display text-lg mb-3 text-muted-foreground uppercase tracking-wider text-sm">Bænken</h3>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: SUB_COUNT }).map((_, i) => {
              const slot = 100 + i;
              return (
                <SlotCard key={slot} slot={slot} position={`SUB ${i + 1}`} isSub current={lineupBySlot.get(slot)} players={players} usedPlayerIds={usedPlayerIds} onAssign={assign} bench />
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────

const EVENT_ICONS: Record<EventType, string> = {
  goal: "⚽",
  assist: "🎯",
  yellow_card: "🟨",
  red_card: "🟥",
};

const EVENT_LABELS: Record<EventType, string> = {
  goal: "Mål",
  assist: "Assist",
  yellow_card: "Gult kort",
  red_card: "Rødt kort",
};

// ── Sub-components ──────────────────────────────────────────────────────────

// @uxid src/routes/fixtures.$fixtureId::EventViewRow
function EventViewRow({ icon, label, evts, playerName }: { icon: string; label: string; evts: FixtureEvent[]; playerName: (id: string) => string }) {
  if (evts.length === 0) return null;
  // Group by player for multi-goal display
  const grouped = new Map<string, number>();
  evts.forEach((e) => grouped.set(e.player_id, (grouped.get(e.player_id) ?? 0) + 1));

  return (
    <div className="flex items-start gap-3">
      <span className="text-lg leading-none mt-0.5">{icon}</span>
      <div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-2">{label}</span>
        <span className="text-sm">
          {Array.from(grouped.entries()).map(([pid, count], i) => (
            <span key={pid}>
              {i > 0 && <span className="text-muted-foreground">, </span>}
              {playerName(pid)}{count > 1 && <span className="text-muted-foreground text-xs"> ×{count}</span>}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

// @uxid src/routes/fixtures.$fixtureId::InfoCard
function InfoCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border ${highlight ? "border-primary/50 shadow-[var(--shadow-glow)]" : "border-border"} bg-card p-3 text-center`}>
      <div className="flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className={`font-display text-lg sm:text-2xl mt-0.5 leading-tight ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

// @uxid src/routes/fixtures.$fixtureId::PitchPlayer
function PitchPlayer({ position, name, events, playerId }: { position: string; name: string | null; events: FixtureEvent[]; playerId?: string }) {
  const playerEvents = playerId ? events.filter((e) => e.player_id === playerId) : [];
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[52px] sm:min-w-[72px]">
      <div className={`h-9 w-9 sm:h-11 sm:w-11 rounded-full flex items-center justify-center font-display text-sm sm:text-base shadow-lg ${name ? "bg-primary text-primary-foreground" : "bg-background/60 text-muted-foreground border-2 border-dashed border-white/40"}`}>
        {name ? name.slice(0, 2).toUpperCase() : "?"}
      </div>
      {playerEvents.length > 0 && (
        <div className="flex gap-0.5 flex-wrap justify-center">
          {playerEvents.map((e) => (
            <span key={e.id} className="text-[10px] leading-none">{EVENT_ICONS[e.event_type]}</span>
          ))}
        </div>
      )}
      <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/80 font-semibold">{position}</div>
      <div className={`text-[10px] sm:text-xs font-semibold text-center max-w-[68px] sm:max-w-[90px] truncate ${name ? "text-white" : "text-white/50"}`}>
        {name ?? "—"}
      </div>
    </div>
  );
}

// @uxid src/routes/fixtures.$fixtureId::SlotCard
function SlotCard({
  slot, position, isSub, current, players, usedPlayerIds, onAssign, bench,
}: {
  slot: number; position: string; isSub: boolean; current: LineupRow | undefined;
  players: Player[]; usedPlayerIds: Set<string>;
  onAssign: (slot: number, position: string, isSub: boolean, playerId: string | null) => void;
  bench?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const currentPlayer = current ? players.find((p) => p.id === current.player_id) : undefined;
  const available = players.filter((p) => !usedPlayerIds.has(p.id) || p.id === current?.player_id);

  return (
    <div className={`relative rounded-xl border ${bench ? "border-border bg-card" : "border-white/30 bg-background/85 backdrop-blur-sm"} p-1.5 sm:p-2 min-w-[76px] sm:min-w-[105px] max-w-[130px] shadow-[var(--shadow-card)]`}>
      <div className={`text-[9px] sm:text-[10px] uppercase tracking-wider mb-1 ${bench ? "text-muted-foreground" : "text-primary"}`}>{position}</div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="h-8 text-xs bg-input border border-border rounded-md w-full px-2 flex items-center justify-between gap-1 hover:bg-accent truncate">
            <span className="truncate">{currentPlayer?.name ?? <span className="text-muted-foreground">Vælg…</span>}</span>
            <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-48" align="start">
          <Command>
            <CommandInput placeholder="Søg spiller…" className="h-8 text-xs" />
            <CommandEmpty className="py-2 text-xs text-center text-muted-foreground">Ingen fundet</CommandEmpty>
            <CommandGroup className="max-h-48 overflow-y-auto">
              {available.map((p) => (
                <CommandItem key={p.id} value={p.name} onSelect={() => { onAssign(slot, position, isSub, p.id); setOpen(false); }} className="text-xs">
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {current && (
        <button onClick={() => onAssign(slot, position, isSub, null)} className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-90" aria-label="Fjern">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
