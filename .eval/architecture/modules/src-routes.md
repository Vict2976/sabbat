# Module: src/routes

File-based TanStack Router route tree for the FC Sabbatår football team app (Danish UI): a root layout with navigation, auth and season context, plus pages for the upcoming match (home), per-season stats, squad management, fixtures list/detail with lineup and event editing, a fines ledger (bødekasse), and a server-rendered iCalendar feed per season. All data is read/written directly from the browser against Supabase tables (players, seasons, season_players, fixtures, fixture_lineups, fixture_events, fines), with writes gated behind an auth check that opens a login dialog.

## Key files
- `src/routes/__root.tsx`: Root route: HTML shell, head meta/stylesheet, desktop header + mobile bottom tab navigation, wraps the tree in AuthProvider and SeasonProvider, renders SeasonPicker, auth button, Toaster and a 404 component.
- `src/routes/index.tsx`: Home ('/'): loads the next unplayed fixture for the selected season and renders match info cards and a pitch-style lineup view (read-only) with a link to edit.
- `src/routes/fixtures.index.tsx`: '/fixtures/': lists fixtures for the selected season (list or calendar view), W/D/L and goals record cards, add/delete fixture, calendar export entry point.
- `src/routes/fixtures.$fixtureId.tsx`: '/fixtures/$fixtureId': fixture detail/editor — edit match details, change formation, assign players to lineup slots (incl. subs), add/remove goal/assist/card events, attendance panel; squad eligibility derived from season_players.
- `src/routes/stats.tsx`: '/stats': aggregates fixture_events per player for the selected season (goals, assists, cards), team scored/conceded totals, sorted and searchable leaderboard.
- `src/routes/squad.tsx`: '/squad': per-season roster management via season_players; create players, add existing players from other seasons, remove from season.
- `src/routes/bodekasse.tsx`: '/bodekasse': fines ledger — add fines, toggle/mark paid, delete, per-player owed/paid totals.
- `src/routes/kalender.$seasonId.ts`: '/kalender/$seasonId': server-only GET handler returning a text/calendar (.ics) feed of a season's fixtures built via buildSeasonCalendar; supports ?download and 5-minute cache header.

## Public interface
- Route (createRootRoute) from src/routes/__root.tsx
- Route '/' from src/routes/index.tsx
- Route '/stats' from src/routes/stats.tsx
- Route '/squad' from src/routes/squad.tsx
- Route '/fixtures/' from src/routes/fixtures.index.tsx
- Route '/fixtures/$fixtureId' from src/routes/fixtures.$fixtureId.tsx
- Route '/bodekasse' from src/routes/bodekasse.tsx
- Route '/kalender/$seasonId' with server.handlers.GET (ICS feed) from src/routes/kalender.$seasonId.ts

## Dependencies
- @tanstack/react-router
- react
- lucide-react
- sonner
- @/integrations/supabase/client
- @/contexts/AuthContext
- @/contexts/SeasonContext
- @/components/SeasonPicker
- @/components/AttendancePanel
- @/components/FixtureCalendar
- @/components/ui/sonner
- @/components/ui/input
- @/components/ui/button
- @/components/ui/select
- @/components/ui/checkbox
- @/components/ui/popover
- @/components/ui/command
- @/components/ui/toggle-group
- @/components/ui/dropdown-menu
- @/lib/formations
- @/lib/ics
- ../styles.css

## Open questions
- Several files are truncated (bodekasse.tsx, fixtures.$fixtureId.tsx, fixtures.index.tsx, index.tsx, stats.tsx); components such as CalendarExport, RecordCard, InfoCard, PitchPlayer, TotalCard, Stat, EmptyState are referenced but their definitions were not visible.
- Authorization is only enforced client-side (user check before writes); whether Supabase RLS policies actually protect the tables is not visible here.
- The server handler in kalender.$seasonId.ts imports the same @/integrations/supabase/client as the browser code — unclear whether that client is safe/appropriate for server execution (anon key vs service role, env handling).
- index.tsx computes 'today' with toISOString (UTC) while fixtures.index.tsx uses toLocaleDateString('sv-SE') (local) — possible off-by-one-day inconsistency near midnight.
- No loaders are used; all data fetching happens in useEffect on the client, so SSR renders loading/empty states first.
