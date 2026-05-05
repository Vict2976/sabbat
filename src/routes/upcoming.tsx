import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Clock, Users, Pencil } from "lucide-react";
import { FORMATIONS } from "@/lib/formations";

export const Route = createFileRoute("/upcoming")({
  component: UpcomingPage,
  head: () => ({ meta: [{ title: "Kommende kamp — FC Sabbatår" }] }),
});

type Fixture = {
  id: string;
  opponent: string;
  played_at: string;
  formation: string;
  kickoff_time: string | null;
  meeting_time: string | null;
  our_score: number | null;
  their_score: number | null;
};
type Player = { id: string; name: string };
type LineupRow = { player_id: string; position: string; slot: number; is_sub: boolean };

function UpcomingPage() {
  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [lineup, setLineup] = useState<LineupRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("fixtures")
        .select("*")
        .gte("played_at", today)
        .is("our_score", null)
        .order("played_at", { ascending: true })
        .order("kickoff_time", { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setFixture(data as Fixture);
        const [{ data: ps }, { data: l }] = await Promise.all([
          supabase.from("players").select("id,name"),
          supabase.from("fixture_lineups").select("player_id,position,slot,is_sub").eq("fixture_id", data.id),
        ]);
        setPlayers(ps ?? []);
        setLineup((l ?? []) as LineupRow[]);
      }
      setLoading(false);
    })();
  }, []);

  const playerName = (id: string) => players.find((p) => p.id === id)?.name ?? "—";

  const lineupBySlot = useMemo(() => {
    const m = new Map<number, LineupRow>();
    lineup.forEach((r) => m.set(r.slot, r));
    return m;
  }, [lineup]);

  const subs = lineup.filter((r) => r.is_sub).sort((a, b) => a.slot - b.slot);

  if (loading) return <p className="text-muted-foreground">Indlæser…</p>;

  if (!fixture) {
    return (
      <div className="text-center py-20">
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Næste kamp</p>
        <h1 className="font-display text-5xl">Ingen kommende kampe</h1>
        <p className="text-muted-foreground mt-3">Tilføj en kamp i fanen <Link to="/fixtures" className="text-primary underline">Kampe</Link>.</p>
      </div>
    );
  }

  const dateLabel = new Date(fixture.played_at).toLocaleDateString("da-DK", {
    weekday: "long", day: "numeric", month: "long",
  });
  const formation = FORMATIONS[fixture.formation] ?? FORMATIONS["4-3-3"];

  return (
    <div className="space-y-8">
      <section className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Næste kamp</p>
        <h1 className="font-display text-5xl md:text-7xl">FC Sabbatår</h1>
        <p className="font-display text-2xl text-muted-foreground mt-1">vs</p>
        <h2 className="font-display text-4xl md:text-6xl">{fixture.opponent}</h2>
      </section>

      <div className="grid sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
        <InfoCard icon={<CalendarDays className="h-5 w-5" />} label="Dato" value={dateLabel} />
        <InfoCard icon={<Users className="h-5 w-5" />} label="Mødetid" value={fixture.meeting_time?.slice(0, 5) ?? "—"} />
        <InfoCard icon={<Clock className="h-5 w-5" />} label="Kampstart" value={fixture.kickoff_time?.slice(0, 5) ?? "—"} highlight />
      </div>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-display text-2xl">Opstilling <span className="text-muted-foreground text-base ml-2">{fixture.formation}</span></h3>
          <Link
            to="/fixtures/$fixtureId"
            params={{ fixtureId: fixture.id }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary uppercase tracking-wider"
          >
            <Pencil className="h-3 w-3" /> Redigér
          </Link>
        </div>

        <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 p-6 md:p-10" style={{
          background: "repeating-linear-gradient(180deg, oklch(0.32 0.08 145) 0 60px, oklch(0.28 0.07 145) 60px 120px)",
        }}>
          <div className="absolute inset-3 border-2 border-white/30 rounded-xl pointer-events-none" />
          <div className="absolute left-1/2 top-3 bottom-3 w-px bg-white/30 pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full border-2 border-white/30 pointer-events-none" />

          <div className="relative space-y-6">
            {[...formation.rows].reverse().map((row, ri) => {
              const reversedIndex = formation.rows.length - 1 - ri;
              const offset = 1 + formation.rows.slice(0, reversedIndex).reduce((s, r) => s + r.length, 0);
              return (
                <div key={ri} className="flex justify-evenly gap-3 flex-wrap">
                  {row.map((pos, pi) => {
                    const slot = offset + pi;
                    const r = lineupBySlot.get(slot);
                    return <PitchPlayer key={slot} position={pos} name={r ? playerName(r.player_id) : null} />;
                  })}
                </div>
              );
            })}
            <div className="flex justify-center">
              <PitchPlayer position="GK" name={lineupBySlot.get(0) ? playerName(lineupBySlot.get(0)!.player_id) : null} />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-display text-xl mb-3 uppercase tracking-wider text-muted-foreground text-sm">Bænken</h3>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => {
              const slot = 100 + i;
              const r = lineupBySlot.get(slot);
              return (
                <div key={slot} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center font-display text-sm shrink-0">
                    {r ? playerName(r.player_id).slice(0, 2).toUpperCase() : "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Skifter {i + 1}</div>
                    <div className={`font-semibold truncate ${r ? "" : "text-muted-foreground"}`}>{r ? playerName(r.player_id) : "Ikke valgt"}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {subs.length === 0 && (
            <p className="text-muted-foreground text-sm mt-2">Ingen skiftere valgt endnu.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border ${highlight ? "border-primary/50 shadow-[var(--shadow-glow)]" : "border-border"} bg-card p-4 text-center`}>
      <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className={`font-display text-2xl mt-1 ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

function PitchPlayer({ position, name }: { position: string; name: string | null }) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
      <div className={`h-12 w-12 rounded-full flex items-center justify-center font-display text-lg shadow-lg ${name ? "bg-primary text-primary-foreground" : "bg-background/80 text-muted-foreground border-2 border-dashed border-white/40"}`}>
        {name ? name.slice(0, 2).toUpperCase() : "?"}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-white/80 font-semibold">{position}</div>
      <div className={`text-xs font-semibold text-center max-w-[110px] truncate ${name ? "text-white" : "text-white/50"}`}>
        {name ?? "Ikke valgt"}
      </div>
    </div>
  );
}
