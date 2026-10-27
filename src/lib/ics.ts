// Builds an iCalendar (RFC 5545) feed of a season's fixtures, so Apple and
// Google Calendar can subscribe to it and pick up changes on their own.

export type IcsFixture = {
  id: string;
  opponent: string;
  played_at: string; // YYYY-MM-DD
  kickoff_time: string | null; // HH:MM:SS, Danish local time
  meeting_time: string | null;
  place: string | null;
  our_score: number | null;
  their_score: number | null;
};

const TZID = "Europe/Copenhagen";

// Calendars need the zone's rules to place TZID times correctly.
const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${TZID}`,
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

function escapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// Lines longer than 75 octets are folded onto continuation lines starting with a space.
function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const ch of line) {
    const len = new TextEncoder().encode(ch).length;
    if (size + len > (parts.length === 0 ? 75 : 74)) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += ch;
    size += len;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

const compactDate = (date: string) => date.replace(/-/g, "");

function localDateTime(date: string, time: string) {
  return `${compactDate(date)}T${time.slice(0, 5).replace(":", "")}00`;
}

function addMinutes(date: string, time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCMinutes(h * 60 + m + minutes);
  return `${compactDate(d.toISOString().slice(0, 10))}T${d.toISOString().slice(11, 16).replace(":", "")}00`;
}

function nextDay(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return compactDate(d.toISOString().slice(0, 10));
}

export function buildSeasonCalendar(opts: {
  calendarName: string;
  fixtures: IcsFixture[];
  matchMinutes: number;
  fixtureUrl: (id: string) => string;
}) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FC Sabbatar//Kampe//DA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(opts.calendarName)}`,
    `X-WR-TIMEZONE:${TZID}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
    ...VTIMEZONE,
  ];

  for (const f of opts.fixtures) {
    const played = f.our_score != null && f.their_score != null;
    const summary = `FC Sabbatår – ${f.opponent}${played ? ` (${f.our_score}–${f.their_score})` : ""}`;
    const description = [
      f.meeting_time ? `Mødetid: ${f.meeting_time.slice(0, 5)}` : null,
      f.kickoff_time ? `Kampstart: ${f.kickoff_time.slice(0, 5)}` : null,
      opts.fixtureUrl(f.id),
    ].filter(Boolean).join("\n");

    lines.push("BEGIN:VEVENT", `UID:${f.id}@fc-sabbatar`, `DTSTAMP:${stamp}`);
    if (f.kickoff_time) {
      lines.push(
        `DTSTART;TZID=${TZID}:${localDateTime(f.played_at, f.kickoff_time)}`,
        `DTEND;TZID=${TZID}:${addMinutes(f.played_at, f.kickoff_time, opts.matchMinutes)}`,
      );
    } else {
      lines.push(
        `DTSTART;VALUE=DATE:${compactDate(f.played_at)}`,
        `DTEND;VALUE=DATE:${nextDay(f.played_at)}`,
      );
    }
    lines.push(`SUMMARY:${escapeText(summary)}`, `DESCRIPTION:${escapeText(description)}`);
    if (f.place) lines.push(`LOCATION:${escapeText(f.place)}`);
    lines.push(`URL:${opts.fixtureUrl(f.id)}`, "END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
