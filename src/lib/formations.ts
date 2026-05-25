// Formation definitions: rows of position labels (excluding GK row which is implicit)
// All formations have exactly 11 starters (GK + 10 outfield)
export type Formation = {
  name: string;
  // rows from defense -> attack (after GK)
  rows: string[][];
};

export const FORMATIONS: Record<string, Formation> = {
  "4-3-3": {
    name: "4-3-3",
    rows: [
      ["LB", "LCB", "RCB", "RB"],
      ["CM", "CM"],
      ["COM"],
      ["LW", "ST", "RW"],
    ],
  },
  "4-4-2": {
    name: "4-4-2",
    rows: [
      ["LB", "LCB", "RCB", "RB"],
      ["LM", "LCM", "RCM", "RM"],
      ["LST", "RST"],
    ],
  },
  "4-2-3-1": {
    name: "4-2-3-1",
    rows: [
      ["LB", "LCB", "RCB", "RB"],
      ["LDM", "RDM"],
      ["LAM", "CAM", "RAM"],
      ["ST"],
    ],
  },
  "3-5-2": {
    name: "3-5-2",
    rows: [
      ["LCB", "CB", "RCB"],
      ["LWB", "LCM", "CM", "RCM", "RWB"],
      ["LST", "RST"],
    ],
  },
  "3-4-3": {
    name: "3-4-3",
    rows: [
      ["LCB", "CB", "RCB"],
      ["LM", "LCM", "RCM", "RM"],
      ["LW", "ST", "RW"],
    ],
  },
  "5-3-2": {
    name: "5-3-2",
    rows: [
      ["LWB", "LCB", "CB", "RCB", "RWB"],
      ["LCM", "CM", "RCM"],
      ["LST", "RST"],
    ],
  },
};

const OUTFIELD = 10; // players on the pitch excluding the keeper

// Parses a dash-separated pattern like "4-4-1-1" into per-row counts.
// Returns null when the string isn't a valid formation (must be 2+ rows,
// each row 1-6 players, and the outfield total must equal 10).
export function parseFormationPattern(input: string): number[] | null {
  const trimmed = input.trim();
  if (!/^\d+(\s*-\s*\d+)+$/.test(trimmed)) return null;
  const counts = trimmed.split("-").map((n) => Number(n.trim()));
  if (counts.length < 2) return null;
  if (counts.some((n) => !Number.isInteger(n) || n < 1 || n > 6)) return null;
  if (counts.reduce((a, b) => a + b, 0) !== OUTFIELD) return null;
  return counts;
}

// Symmetric left->right spread markers for a row of n players.
function spread(n: number): string[] {
  switch (n) {
    case 1: return ["C"];
    case 2: return ["L", "R"];
    case 3: return ["L", "C", "R"];
    case 4: return ["L", "LC", "RC", "R"];
    case 5: return ["L", "LC", "C", "RC", "R"];
    default: return ["L", ...Array(Math.max(0, n - 2)).fill("C"), "R"];
  }
}

function defenderLabels(n: number): string[] {
  switch (n) {
    case 1: return ["CB"];
    case 2: return ["LCB", "RCB"];
    case 3: return ["LCB", "CB", "RCB"];
    case 4: return ["LB", "LCB", "RCB", "RB"];
    case 5: return ["LWB", "LCB", "CB", "RCB", "RWB"];
    default: return spread(n).map((m) => ({ L: "LB", R: "RB", C: "CB", LC: "LCB", RC: "RCB" }[m] ?? "CB"));
  }
}

function forwardLabels(n: number): string[] {
  switch (n) {
    case 1: return ["ST"];
    case 2: return ["LST", "RST"];
    case 3: return ["LW", "ST", "RW"];
    default: return spread(n).map((m) => ({ L: "LF", R: "RF", C: "CF", LC: "LCF", RC: "RCF" }[m] ?? "CF"));
  }
}

// Central / defensive / attacking midfield labels via the L/R/C spread markers.
function midfieldLabels(n: number, role: "defensive" | "central" | "attacking"): string[] {
  const suffix = role === "defensive" ? "DM" : role === "attacking" ? "AM" : "M";
  const center = role === "central" ? "CM" : `C${suffix}`;
  return spread(n).map((m) => {
    switch (m) {
      case "C": return center;
      case "L": return `L${suffix}`;
      case "R": return `R${suffix}`;
      case "LC": return `LC${suffix}`;
      case "RC": return `RC${suffix}`;
      default: return center;
    }
  });
}

// Builds a Formation from arbitrary row counts, picking a vertical role for
// each midfield band: a flat band (4+) stays central, the lone holding band
// sits deep, and the band just behind the attack pushes up.
function buildFormation(name: string, counts: number[]): Formation {
  const last = counts.length - 1;
  const rows = counts.map((n, i) => {
    if (i === 0) return defenderLabels(n);
    if (i === last) return forwardLabels(n);
    const isFirstMiddle = i === 1;
    const isLastMiddle = i === last - 1;
    let role: "defensive" | "central" | "attacking" = "central";
    if (n >= 4) role = "central";
    else if (isFirstMiddle && !isLastMiddle) role = "defensive";
    else if (isLastMiddle && !isFirstMiddle) role = "attacking";
    return midfieldLabels(n, role);
  });
  return { name, rows };
}

// Resolves a formation name to a Formation: known presets first, then any
// valid custom pattern (e.g. "4-4-1-1"), falling back to 4-3-3.
export function parseFormation(name: string): Formation {
  if (FORMATIONS[name]) return FORMATIONS[name];
  const counts = parseFormationPattern(name);
  if (counts) return buildFormation(name, counts);
  return FORMATIONS["4-3-3"];
}

// Returns ordered list of position labels for a formation (GK first, then rows defense->attack)
export function formationPositions(name: string): string[] {
  const f = parseFormation(name);
  return ["GK", ...f.rows.flat()];
}
