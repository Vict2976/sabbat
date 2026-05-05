// Formation definitions: rows of position labels (excluding GK row which is implicit)
// All formations have exactly 11 starters
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
      ["LCM", "CM", "RCM"],
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

// Returns ordered list of position labels for a formation (GK first, then rows defense->attack)
export function formationPositions(name: string): string[] {
  const f = FORMATIONS[name] ?? FORMATIONS["4-3-3"];
  return ["GK", ...f.rows.flat()];
}
