import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Clock, Users, Pencil, MapPin } from "lucide-react";
import { parseFormation } from "@/lib/formations";

export const Route = createFileRoute("/")({
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
  place: string | null;
  our_score: number | null;
  their_score: number | null;
};
type Player = { id: string; name: string };
type LineupRow = { player_id: string; position: string; slot: number; is_sub: boolean };

// @uxid src/routes/index::UpcomingPage
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
      <div className="space-y-6">
        <section className="relative rounded-2xl overflow-hidden -mx-4 md:mx-0">
          <img src="/cover.jpg" alt="FC Sabbatår cover" className="w-full h-44 sm:h-64 object-cover" />
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center px-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Næste kamp</p>
            <h1 className="font-display text-3xl sm:text-5xl text-white">Ingen kommende kampe</h1>
          </div>
        </section>
        <p className="text-muted-foreground text-center text-sm">
          Tilføj en kamp i fanen <Link to="/fixtures" className="text-primary underline">Kampe</Link>.
        </p>
      </div>
    );
  }

  const dateLabel = new Date(fixture.played_at).toLocaleDateString("da-DK", {
    weekday: "long", day: "numeric", month: "long",
  });
  const formation = parseFormation(fixture.formation);

  return (
    <div className="space-y-5">
      <section className="relative rounded-2xl overflow-hidden -mx-4 md:mx-0">
        <img src="/cover.jpg" alt="FC Sabbatår cover" className="w-full h-44 sm:h-64 object-cover" />
        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center text-center px-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary mb-1">Næste kamp</p>
          <h1 className="font-display text-3xl sm:text-5xl text-white leading-tight">FC Sabbatår</h1>
          <p className="font-display text-lg text-white/70 mt-0.5">vs</p>
          <h2 className="font-display text-2xl sm:text-4xl text-white leading-tight">{fixture.opponent}</h2>
        </div>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <InfoCard icon={<CalendarDays className="h-4 w-4" />} label="Dato" value={dateLabel} />
        <InfoCard icon={<MapPin className="h-4 w-4" />} label="Sted" value={fixture.place ?? "—"} />
        <InfoCard icon={<Users className="h-4 w-4" />} label="Mødetid" value={fixture.meeting_time?.slice(0, 5) ?? "—"} />
        <InfoCard icon={<Clock className="h-4 w-4" />} label="Kampstart" value={fixture.kickoff_time?.slice(0, 5) ?? "—"} highlight />
      </div>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-display text-xl">
            Opstilling <span className="text-muted-foreground text-sm ml-1">{fixture.formation}</span>
          </h3>
          <Link
            to="/fixtures/$fixtureId"
            params={{ fixtureId: fixture.id }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary uppercase tracking-wider"
          >
            <Pencil className="h-3 w-3" /> Redigér
          </Link>
        </div>

        <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 p-3 sm:p-5 min-h-[480px] sm:min-h-[580px]" style={{
          background: "repeating-linear-gradient(0deg, oklch(0.32 0.08 145) 0 50px, oklch(0.28 0.07 145) 50px 100px)",
        }}>
          <div className="absolute inset-2 border-2 border-white/25 rounded-xl pointer-events-none" />
          <div className="absolute left-2 right-2 top-1/2 h-px bg-white/25 pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full border-2 border-white/25 pointer-events-none" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-12 border-2 border-b-0 border-white/25 rounded-t-md pointer-events-none" />
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-12 border-2 border-t-0 border-white/25 rounded-b-md pointer-events-none" />

          <div className="relative flex flex-col-reverse items-stretch justify-between gap-1 h-full min-h-[450px] sm:min-h-[540px] py-1">
            <div className="flex justify-center">
              <PitchPlayer position="GK" name={lineupBySlot.get(0) ? playerName(lineupBySlot.get(0)!.player_id) : null} />
            </div>
            {formation.rows.map((row, ri) => {
              const offset = 1 + formation.rows.slice(0, ri).reduce((s, r) => s + r.length, 0);
              return (
                <div key={ri} className="flex flex-row justify-evenly flex-1 gap-1">
                  {row.map((pos, pi) => {
                    const slot = offset + pi;
                    const r = lineupBySlot.get(slot);
                    return <PitchPlayer key={slot} position={pos} name={r ? playerName(r.player_id) : null} />;
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Bænken</h3>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => {
              const slot = 100 + i;
              const r = lineupBySlot.get(slot);
              return (
                <div key={slot} className="rounded-xl border border-border bg-card px-3 py-2.5 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-display text-xs shrink-0">
                    {r ? playerName(r.player_id).slice(0, 2).toUpperCase() : "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Sub {i + 1}</div>
                    <div className={`text-xs font-semibold truncate ${r ? "" : "text-muted-foreground"}`}>
                      {r ? playerName(r.player_id) : "—"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {subs.length === 0 && <p className="text-muted-foreground text-xs mt-2">Ingen skiftere valgt.</p>}
        </div>
      </section>
    </div>
  );
}

// @uxid src/routes/index::InfoCard
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

// @uxid src/routes/index::PitchPlayer
function PitchPlayer({ position, name }: { position: string; name: string | null }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[54px] sm:min-w-[80px]">
      <div className={`h-9 w-9 sm:h-11 sm:w-11 rounded-full flex items-center justify-center font-display text-sm shadow-md ${name ? "bg-primary text-primary-foreground" : "bg-background/70 text-muted-foreground border-2 border-dashed border-white/30"}`}>
        {name ? name.slice(0, 2).toUpperCase() : "?"}
      </div>
      <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/75 font-semibold">{position}</div>
      <div className={`text-[10px] sm:text-xs font-semibold text-center max-w-[72px] truncate ${name ? "text-white" : "text-white/40"}`}>
        {name ?? "—"}
      </div>
    </div>
  );
}
