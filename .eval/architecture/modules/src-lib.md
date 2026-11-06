# Module: src/lib

Framework-agnostic utility library for a football club app (FC Sabbatår): soccer formation presets and custom-pattern parsing for 11- and 7-a-side teams, an RFC 5545 iCalendar feed builder for season fixtures (Europe/Copenhagen timezone, Danish labels), and a Tailwind class-merging helper.

## Key files
- `src/lib/formations.ts`: Defines FORMATIONS (11-a-side) and FORMATIONS_7 (7-a-side) presets, parses custom dash-separated patterns (e.g. "4-4-1-1") into labelled rows, and resolves a formation name into an ordered list of position labels (GK first).
- `src/lib/ics.ts`: Pure string builder producing a VCALENDAR feed (with VTIMEZONE, line folding, text escaping) from season fixtures, emitting timed events when kickoff_time is set or all-day events otherwise.
- `src/lib/utils.ts`: cn() helper combining clsx and tailwind-merge for conditional Tailwind class names.

## Public interface
- formations.ts: type Formation { name; rows: string[][] }
- formations.ts: FORMATIONS: Record<string, Formation>
- formations.ts: FORMATIONS_7: Record<string, Formation>
- formations.ts: formationsFor(teamSize: number): Record<string, Formation>
- formations.ts: defaultFormation(teamSize: number): string
- formations.ts: parseFormationPattern(input: string, teamSize = 11): number[] | null
- formations.ts: parseFormation(name: string, teamSize?: number): Formation
- formations.ts: formationPositions(name: string, teamSize?: number): string[]
- ics.ts: type IcsFixture { id; opponent; played_at; kickoff_time; meeting_time; place; our_score; their_score }
- ics.ts: buildSeasonCalendar(opts: { calendarName; fixtures: IcsFixture[]; matchMinutes; fixtureUrl(id) }): string
- utils.ts: cn(...inputs: ClassValue[]): string

## Dependencies
- clsx
- tailwind-merge

## Open questions
- Which route serves the output of buildSeasonCalendar as a calendar feed (and sets the text/calendar content type) is not visible in this module.
- ics.ts hardcodes the PRODID, UID domain (@fc-sabbatar), Europe/Copenhagen timezone and Danish strings; is this intentionally single-tenant?
- formations.ts comments reference seasons.team_size, implying a database schema not present here; where is that defined?
- parseFormation silently falls back to the default formation for invalid names rather than signalling an error—is that the intended behaviour for stored/custom formations?
- ics.ts fold() re-instantiates TextEncoder per character; minor performance concern for large feeds.
