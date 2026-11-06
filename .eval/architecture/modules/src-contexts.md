# Module: src/contexts

Client-side React context providers for the app's global state: authentication (Supabase email/password session tracking with an embedded login dialog) and season selection (loads seasons from the Supabase `seasons` table, persists the chosen season in localStorage, and embeds a 'new season' creation dialog). UI copy is in Danish.

## Key files
- `src/contexts/AuthContext.tsx`: AuthProvider: subscribes to Supabase auth session/state changes, exposes current user, signOut, and openLoginDialog; renders an inline email/password login Dialog. useAuth hook throws outside the provider.
- `src/contexts/SeasonContext.tsx`: SeasonProvider: fetches seasons ordered by sort_order desc, backfills attendance_enabled/team_size defaults, resolves the selected season (preferred → current → localStorage 'sabbat.season_id' → active → first), and renders an inline 'Ny sæson' creation Dialog that inserts into the seasons table. useSeason hook throws outside the provider.

## Public interface
- AuthProvider({ children }) — React provider component (src/contexts/AuthContext.tsx)
- useAuth(): { user: User | null; signOut(): Promise<void>; openLoginDialog(): void } (src/contexts/AuthContext.tsx)
- SeasonProvider({ children }) — React provider component (src/contexts/SeasonContext.tsx)
- useSeason(): { seasons: Season[]; season: Season | null; seasonId: string | null; setSeasonId(id): void; loading: boolean; openNewSeasonDialog(): void } (src/contexts/SeasonContext.tsx)
- type Season = { id; name; sort_order; is_active; attendance_enabled; team_size } (src/contexts/SeasonContext.tsx)

## Dependencies
- react
- @supabase/supabase-js (type User)
- @/integrations/supabase/client (supabase)
- @/components/ui/dialog
- @/components/ui/input
- @/components/ui/button
- @/components/ui/checkbox (SeasonContext only)
- sonner (toast)
- browser localStorage (key 'sabbat.season_id', guarded by typeof window check)

## Open questions
- Both providers talk to Supabase directly from the client (auth and `seasons` table reads/inserts); it is unclear whether row-level security governs who may create seasons, since no auth check gates createSeason in this module.
- SeasonContext comments note that attendance_enabled/team_size columns may be missing until later migrations run — which migrations, and is this defensive defaulting still needed?
- The sort_order for new seasons is computed client-side (max+1), which can race if two clients create seasons concurrently.
- SeasonProvider loads data in a useEffect and reads localStorage with typeof window guards, implying SSR-awareness; the initial render will always have loading=true on the server — is a server-side loader intended instead?
