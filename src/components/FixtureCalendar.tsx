import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type CalendarFixture = {
  id: string;
  opponent: string;
  our_score: number | null;
  their_score: number | null;
  played_at: string;
  kickoff_time: string | null;
};

const WEEKDAYS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

// Local YYYY-MM-DD, the same shape as fixtures.played_at.
const dayKey = (d: Date) => d.toLocaleDateString("sv-SE");

function resultTone(f: CalendarFixture) {
  if (f.our_score == null || f.their_score == null) return "border-primary/50 bg-primary/10 text-foreground";
  if (f.our_score > f.their_score) return "border-primary bg-primary text-primary-foreground";
  if (f.our_score < f.their_score) return "border-destructive bg-destructive text-destructive-foreground";
  return "border-border bg-muted text-foreground";
}

// Month grid (Monday first) with match days marked. Opens on the month of `fixtures[0]`, the nearest match.
export function FixtureCalendar({ fixtures }: { fixtures: CalendarFixture[] }) {
  const [month, setMonth] = useState(() => {
    const [y, m] = (fixtures[0]?.played_at ?? dayKey(new Date())).split("-").map(Number);
    return new Date(y, m - 1, 1);
  });

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarFixture[]>();
    fixtures.forEach((f) => m.set(f.played_at, [...(m.get(f.played_at) ?? []), f]));
    return m;
  }, [fixtures]);

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // Monday = 0
    const inMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells = Math.ceil((lead + inMonth) / 7) * 7;
    return Array.from({ length: cells }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i - lead + 1));
  }, [month]);

  const today = dayKey(new Date());
  const shift = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  const label = month.toLocaleDateString("da-DK", { month: "long", year: "numeric" });
  const matchesThisMonth = fixtures.filter((f) => f.played_at.startsWith(dayKey(month).slice(0, 7))).length;

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" onClick={() => shift(-1)} aria-label="Forrige måned">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <div className="font-display text-xl capitalize">{label}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {matchesThisMonth} {matchesThisMonth === 1 ? "kamp" : "kampe"}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => shift(1)} aria-label="Næste måned">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground py-1">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const key = dayKey(d);
          const outside = d.getMonth() !== month.getMonth();
          const matches = byDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={`min-h-[56px] sm:min-h-[92px] rounded-lg border p-1 sm:p-1.5 flex flex-col gap-1 ${
                outside ? "border-transparent opacity-40" : "border-border/60 bg-background/40"
              } ${key === today ? "ring-1 ring-primary" : ""}`}
            >
              <span className={`text-[10px] sm:text-xs leading-none ${key === today ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {d.getDate()}
              </span>
              {matches.map((f) => (
                <Link
                  key={f.id}
                  to="/fixtures/$fixtureId"
                  params={{ fixtureId: f.id }}
                  title={`${f.opponent}${f.kickoff_time ? ` · ${f.kickoff_time.slice(0, 5)}` : ""}`}
                  className={`rounded-md border px-1 py-0.5 sm:px-1.5 sm:py-1 leading-tight hover:opacity-90 transition-opacity ${resultTone(f)}`}
                >
                  <div className="text-[9px] sm:text-[11px] font-semibold tabular-nums">
                    {f.our_score != null && f.their_score != null
                      ? `${f.our_score}–${f.their_score}`
                      : f.kickoff_time?.slice(0, 5) ?? "Kamp"}
                  </div>
                  <div className="hidden sm:block text-[10px] truncate">{f.opponent}</div>
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
