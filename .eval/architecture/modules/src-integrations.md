# Module: src/integrations

Supabase integration layer for a football/5-a-side team management app. Holds the generated Postgres schema types (seasons, players, fixtures, lineups, attendance, events, fines) plus browser/server Supabase client factories and an auth middleware. Only src/integrations/supabase/types.ts was actually readable; the three other files are marked as generated and were not read, so their contents are unverified.

## Key files
- `src/integrations/supabase/types.ts`: Supabase-generated `Database` type: tables fines, fixture_attendance, fixture_events, fixture_lineups, fixtures, players, season_players, seasons (Row/Insert/Update + FK relationships); also the `Json` helper type. Pins PostgrestVersion 14.5. File is truncated after the seasons table.
- `src/integrations/supabase/client.ts`: Generated, not read. By name: client-side Supabase client factory.
- `src/integrations/supabase/client.server.ts`: Generated, not read. By name: server-only Supabase client factory (likely using the `.server` convention so it is excluded from client bundles).
- `src/integrations/supabase/auth-middleware.ts`: Generated, not read. By name: auth middleware that resolves the Supabase session for server requests/functions.

## Public interface
- type Json (src/integrations/supabase/types.ts)
- type Database (src/integrations/supabase/types.ts) — Database['public']['Tables'][...]['Row' | 'Insert' | 'Update'] for fines, fixture_attendance, fixture_events, fixture_lineups, fixtures, players, season_players, seasons
- Exports of client.ts, client.server.ts and auth-middleware.ts are unknown (files not read)

## Dependencies
- Supabase (Postgres via PostgREST 14.5, per __InternalSupabase in types.ts); types.ts itself has no imports
- Runtime SDK dependencies of the three generated client/middleware files could not be verified

## Open questions
- What do client.ts, client.server.ts and auth-middleware.ts actually export, and what generated them (Supabase CLI, a TanStack add-on, or custom scaffolding)?
- Is auth-middleware.ts a TanStack Start server/function middleware, and where is it registered?
- types.ts is truncated after the seasons table — are there Views, Functions, Enums or CompositeTypes beyond the eight tables seen?
- Which env vars do the client factories read (URL / anon key / service-role key), and is the server client using a privileged key?
- Several columns are untyped strings that look like enums (fixture_attendance.status, fixture_events.event_type, fixture_lineups.position, fixtures.formation) — are their allowed values enforced anywhere?
