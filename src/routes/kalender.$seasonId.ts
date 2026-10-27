import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { buildSeasonCalendar } from "@/lib/ics";

// Subscribable calendar feed of a season's matches (webcal:// for Apple, "add by URL" for Google).
export const Route = createFileRoute("/kalender/$seasonId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { data: season } = await supabase
          .from("seasons")
          .select("id,name,team_size")
          .eq("id", params.seasonId)
          .maybeSingle();
        if (!season) return new Response("Sæsonen findes ikke", { status: 404 });

        const { data: fixtures, error } = await supabase
          .from("fixtures")
          .select("id,opponent,played_at,kickoff_time,meeting_time,place,our_score,their_score")
          .eq("season_id", season.id)
          .order("played_at", { ascending: true });
        if (error) return new Response(error.message, { status: 500 });

        const origin = new URL(request.url).origin;
        const body = buildSeasonCalendar({
          calendarName: `FC Sabbatår ${season.name}`,
          fixtures: fixtures ?? [],
          // 11-a-side is 2×45 plus the break; the 7-a-side Vinterbold matches are short.
          matchMinutes: (season.team_size ?? 11) >= 11 ? 105 : 60,
          fixtureUrl: (id) => `${origin}/fixtures/${id}`,
        });

        const download = new URL(request.url).searchParams.has("download");
        return new Response(body, {
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `${download ? "attachment" : "inline"}; filename="fc-sabbatar.ics"`,
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});
