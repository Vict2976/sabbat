import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Builds the knowledge the chat assistant answers from: a plain-text dump of the team's data
// plus a short guide to the app. The team is small, so everything fits in one prompt.

const EVENT_LABELS: Record<string, string> = {
  goal: "mål",
  assist: "assist",
  yellow_card: "gult kort",
  red_card: "rødt kort",
};

const APP_GUIDE = `
Om appen "FC Sabbatår – Holdets HQ":
- Kamp (forsiden): viser næste kamp med modstander, dato, mødetid, kickoff og sted, samt tilmelding når sæsonen bruger det.
- Stats ("Tallene"): topscorerliste og holdets samlede tal (mål, assists, kort) for den valgte sæson.
- Trup: spillerne i den valgte sæsons trup. Spillere kan tilføjes/fjernes (kræver login).
- Kampe: alle sæsonens kampe som liste eller kalender. Kampe kan tilføjes/slettes (kræver login). Man kan abonnere på sæsonens kampe i sin kalender (Apple via webcal-link, Google via "tilføj via URL") med knappen på Kampe-siden.
- Kampsiden (klik på en kamp): resultat, hændelser (mål, assists, kort), opstilling på en bane med formation, og tilmelding. Redigering kræver login.
- Tilmelding: åben for alle spillere uden login. Den lukker 48 timer før kickoff, fordi holdet sættes der. Efter fristen kan kun en indlogget admin ændre tilmeldinger.
- Bøder (Bødekasse): bøder pr. spiller med beløb og grund, markering af betalt/ubetalt og hvad hver spiller skylder. Ændringer kræver login.
- Sæsonvælgeren i toppen skifter mellem sæsoner (fx 11-mands og Vinterbold, der er 7-mands). Indloggede kan oprette nye sæsoner.
`.trim();

export async function buildAssistantContext(db: SupabaseClient<Database>): Promise<string> {
  const [seasons, players, seasonPlayers, fixtures, events, lineups, attendance, fines] = await Promise.all([
    db.from("seasons").select("*").order("sort_order", { ascending: true }),
    db.from("players").select("id,name"),
    db.from("season_players").select("season_id,player_id"),
    db.from("fixtures").select("*").order("played_at", { ascending: true }),
    db.from("fixture_events").select("fixture_id,player_id,event_type"),
    db.from("fixture_lineups").select("fixture_id,player_id,position,slot,is_sub"),
    db.from("fixture_attendance").select("fixture_id,player_id,status"),
    db.from("fines").select("player_id,amount,reason,paid,created_at").order("created_at", { ascending: true }),
  ]);

  const name = new Map((players.data ?? []).map((p) => [p.id, p.name]));
  const who = (id: string) => name.get(id) ?? "ukendt spiller";
  const byFixture = <T extends { fixture_id: string }>(rows: T[] | null) => {
    const m = new Map<string, T[]>();
    for (const r of rows ?? []) m.set(r.fixture_id, [...(m.get(r.fixture_id) ?? []), r]);
    return m;
  };
  const eventsBy = byFixture(events.data);
  const lineupsBy = byFixture(lineups.data);
  const attendanceBy = byFixture(attendance.data);

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Copenhagen" });
  const out: string[] = [`Dags dato: ${today} (dansk tid).`, "", APP_GUIDE, ""];

  // Worked out here rather than left to the model, which otherwise tends to pick the
  // "active" season's last fixture even when it lies in the past.
  const seasonName = new Map((seasons.data ?? []).map((s) => [s.id, s.name]));
  const upcoming = (fixtures.data ?? []).filter((f) => f.played_at >= today).slice(0, 3);
  out.push(
    "Kommende kampe på tværs af alle sæsoner (den første er NÆSTE KAMP):",
    ...(upcoming.length
      ? upcoming.map((f) =>
          `- ${f.played_at}${f.kickoff_time ? ` kl. ${f.kickoff_time.slice(0, 5)}` : ""}` +
          `${f.meeting_time ? ` (mødetid ${f.meeting_time.slice(0, 5)})` : ""} vs ${f.opponent}` +
          `${f.place ? `, ${f.place}` : ""} – sæson ${seasonName.get(f.season_id) ?? "?"}`)
      : ["- ingen kommende kampe"]),
    "",
  );

  for (const s of seasons.data ?? []) {
    const squad = (seasonPlayers.data ?? []).filter((sp) => sp.season_id === s.id).map((sp) => who(sp.player_id));
    out.push(
      `## Sæson: ${s.name}${s.is_active ? " (aktiv sæson)" : ""} – ${s.team_size ?? 11}-mands` +
        `${s.attendance_enabled ? ", med tilmelding" : ""}`,
      `Trup (${squad.length}): ${squad.sort((a, b) => a.localeCompare(b, "da")).join(", ") || "ingen"}`,
    );

    const seasonFixtures = (fixtures.data ?? []).filter((f) => f.season_id === s.id);
    const stats = new Map<string, Record<string, number>>();
    let won = 0, drawn = 0, lost = 0, scored = 0, conceded = 0;

    out.push("Kampe:");
    for (const f of seasonFixtures) {
      const played = f.our_score !== null && f.their_score !== null;
      const parts = [
        `- ${f.played_at}`,
        f.kickoff_time ? `kickoff ${f.kickoff_time.slice(0, 5)}` : null,
        f.meeting_time ? `mødetid ${f.meeting_time.slice(0, 5)}` : null,
        `vs ${f.opponent}`,
        f.place ? `sted: ${f.place}` : null,
        played
          ? `resultat ${f.our_score}-${f.their_score} (FC Sabbatår først)`
          : f.played_at >= today ? "kommende kamp" : "spillet, men intet resultat registreret",
        f.formation ? `formation ${f.formation}` : null,
      ];
      out.push(parts.filter(Boolean).join(", "));

      if (played) {
        scored += f.our_score!;
        conceded += f.their_score!;
        if (f.our_score! > f.their_score!) won++;
        else if (f.our_score! < f.their_score!) lost++;
        else drawn++;
      }

      const evs = eventsBy.get(f.id) ?? [];
      if (evs.length) {
        out.push(`  Hændelser: ${evs.map((e) => `${EVENT_LABELS[e.event_type] ?? e.event_type}: ${who(e.player_id)}`).join("; ")}`);
      }
      for (const e of evs) {
        const st = stats.get(e.player_id) ?? {};
        st[e.event_type] = (st[e.event_type] ?? 0) + 1;
        stats.set(e.player_id, st);
      }

      const lu = (lineupsBy.get(f.id) ?? []).sort((a, b) => a.slot - b.slot);
      const starters = lu.filter((l) => !l.is_sub);
      const subs = lu.filter((l) => l.is_sub);
      if (starters.length) out.push(`  Startopstilling: ${starters.map((l) => `${l.position} ${who(l.player_id)}`).join(", ")}`);
      if (subs.length) out.push(`  Udskiftere: ${subs.map((l) => who(l.player_id)).join(", ")}`);

      const att = attendanceBy.get(f.id) ?? [];
      if (att.length) {
        const yes = att.filter((a) => a.status === "yes").map((a) => who(a.player_id));
        const no = att.filter((a) => a.status === "no").map((a) => who(a.player_id));
        out.push(`  Tilmeldt (${yes.length}): ${yes.join(", ") || "ingen"}. Afbud (${no.length}): ${no.join(", ") || "ingen"}`);
      }
    }
    if (!seasonFixtures.length) out.push("- ingen kampe");

    out.push(`Sæsonens record: ${won} sejre, ${drawn} uafgjorte, ${lost} nederlag, målscore ${scored}-${conceded}.`);
    const statLines = [...stats.entries()]
      .map(([pid, st]) => ({ n: who(pid), g: st.goal ?? 0, a: st.assist ?? 0, y: st.yellow_card ?? 0, r: st.red_card ?? 0 }))
      .sort((a, b) => b.g - a.g || b.a - a.a);
    out.push(
      "Spillerstatistik (mål/assists/gule/røde):",
      ...(statLines.length ? statLines.map((x) => `- ${x.n}: ${x.g}/${x.a}/${x.y}/${x.r}`) : ["- ingen registreret"]),
      "",
    );
  }

  const fineRows = fines.data ?? [];
  out.push("## Bødekasse (på tværs af sæsoner)");
  if (fineRows.length) {
    for (const f of fineRows) {
      out.push(`- ${f.created_at.slice(0, 10)}: ${who(f.player_id)}, ${f.amount} kr, "${f.reason}", ${f.paid ? "betalt" : "ubetalt"}`);
    }
    const owed = new Map<string, number>();
    for (const f of fineRows) if (!f.paid) owed.set(f.player_id, (owed.get(f.player_id) ?? 0) + f.amount);
    const total = [...owed.values()].reduce((a, b) => a + b, 0);
    out.push(
      `Skyldigt i alt: ${total} kr.`,
      ...[...owed.entries()].sort((a, b) => b[1] - a[1]).map(([pid, amt]) => `- ${who(pid)} skylder ${amt} kr`),
    );
  } else {
    out.push("- ingen bøder");
  }

  return out.join("\n");
}

export function systemPrompt(context: string): string {
  return `Du er holdassistenten for amatørfodboldholdet FC Sabbatår. Du svarer altid på dansk, kort og venligt, gerne med lidt omklædningsrums-humor, men altid korrekt.

Svar kun ud fra dataene og app-guiden nedenfor. Hvis svaret ikke står der, så sig ærligt at du ikke ved det i stedet for at gætte. Du kan ikke ændre noget i appen; forklar i stedet hvor brugeren selv gør det. Brug almindelig tekst og korte punktlister; ingen tabeller. Datoer skrives på dansk (fx "lørdag 14. november").

=== DATA ===
${context}
=== SLUT PÅ DATA ===`;
}
