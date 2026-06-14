import { fail, ok, type Result } from "./result.js";
import { readYaml } from "./yamlio.js";
import { exists } from "./fs.js";
import { listSkills } from "./install.js";
import { KRAKEN_PACKS } from "./paths.js";
import type { Lane } from "./types.js";

/**
 * Wave 5 (V5 — one currency across the ecosystem): export the earned lane as the
 * single quality currency a Kraken pack can require.
 *
 * A pack in `packs.yaml` may declare:
 *   pairs_skill: <tfc-skill-name>   # the TFC skill it leans on
 *   min_lane: eval_proven           # the evidence floor that skill must clear
 *
 * This is a READ-ONLY report — it recomputes the paired skill's lane from disk
 * (never the cache) and flags any pairing below its declared floor. It NEVER
 * edits packs.yaml (INV-6: no second store, no write-back into another system).
 */

const LANE_RANK: Record<Lane, number> = {
  authored: 0,
  eval_proven: 1,
  evolution_proven: 2,
};

function isLane(v: unknown): v is Lane {
  return v === "authored" || v === "eval_proven" || v === "evolution_proven";
}

export interface PackBridgeRow {
  /** pack id, e.g. "P16" */
  pack: string;
  title: string;
  /** the skill name the pack declares it pairs with */
  pairs_skill: string;
  /** the declared evidence floor, or null if the pack named a skill but no floor */
  min_lane: Lane | null;
  /** did pairs_skill resolve to an installed TFC skill? */
  resolved: boolean;
  category: string | null;
  /** recomputed lane of the paired skill (null when unresolved) */
  lane: Lane | "unknown" | null;
  /** declared a floor AND the recomputed lane sits below it */
  below_floor: boolean;
  note: string;
}

export interface PackBridgeReport {
  packsFile: string;
  /** self-documenting so a grep proves the dimensions even with zero rows */
  legend: string;
  rows: PackBridgeRow[];
  summary: {
    packs_with_pairing: number;
    resolved: number;
    below_floor: number;
  };
}

interface PackEntryShape {
  id?: unknown;
  title?: unknown;
  pairs_skill?: unknown;
  min_lane?: unknown;
}

interface PacksFileShape {
  packs?: unknown;
}

export async function buildPackBridgeReport(input?: {
  packsFile?: string;
}): Promise<Result<PackBridgeReport>> {
  const packsFile =
    input?.packsFile ?? process.env["KRAKEN_PACKS_FILE"] ?? KRAKEN_PACKS;

  if (!(await exists(packsFile)))
    return fail(
      "NOT_FOUND",
      `packs.yaml not found at ${packsFile}`,
      "set KRAKEN_PACKS_FILE or install the kraken-packs skill",
    );

  const packsR = await readYaml<PacksFileShape>(packsFile);
  if (!packsR.ok) return fail(packsR.error.code, packsR.error.message);
  const packsList = Array.isArray(packsR.data.packs)
    ? (packsR.data.packs as PackEntryShape[])
    : [];

  // Resolve installed TFC skills by name → entry (the lane is already recomputed).
  const skillsR = await listSkills({ brokenOnly: false });
  if (!skillsR.ok) return fail(skillsR.error.code, skillsR.error.message);
  const byName = new Map(skillsR.data.skills.map((s) => [s.name, s]));

  const rows: PackBridgeRow[] = [];
  for (const pack of packsList) {
    const pairsSkill =
      typeof pack.pairs_skill === "string" ? pack.pairs_skill : null;
    const minLane = isLane(pack.min_lane) ? pack.min_lane : null;
    // Only packs that declare a pairing intent are part of the report.
    if (pairsSkill === null && minLane === null) continue;

    const packId = typeof pack.id === "string" ? pack.id : "?";
    const title = typeof pack.title === "string" ? pack.title : "";

    if (pairsSkill === null) {
      rows.push({
        pack: packId,
        title,
        pairs_skill: "",
        min_lane: minLane,
        resolved: false,
        category: null,
        lane: null,
        below_floor: false,
        note: "declares min_lane but no pairs_skill — floor has nothing to gate",
      });
      continue;
    }

    const entry = byName.get(pairsSkill);
    if (!entry) {
      rows.push({
        pack: packId,
        title,
        pairs_skill: pairsSkill,
        min_lane: minLane,
        resolved: false,
        category: null,
        lane: null,
        below_floor: false,
        note: `'${pairsSkill}' is not an installed TFC skill — cannot recompute its lane`,
      });
      continue;
    }

    const lane = entry.lane;
    let belowFloor = false;
    let note: string;
    if (minLane === null) {
      note = `lane ${lane}; pack declares no min_lane floor`;
    } else if (lane === "unknown") {
      note = `lane could not be recomputed; floor ${minLane} not evaluable`;
    } else {
      belowFloor = LANE_RANK[lane] < LANE_RANK[minLane];
      note = belowFloor
        ? `BELOW FLOOR: ${lane} < required ${minLane}`
        : `meets floor: ${lane} >= ${minLane}`;
    }

    rows.push({
      pack: packId,
      title,
      pairs_skill: pairsSkill,
      min_lane: minLane,
      resolved: true,
      category: entry.category,
      lane,
      below_floor: belowFloor,
      note,
    });
  }

  rows.sort((a, b) => a.pack.localeCompare(b.pack));

  return ok({
    packsFile,
    legend:
      "min_lane = pack-declared evidence floor; below_floor = recomputed lane is under that floor",
    rows,
    summary: {
      packs_with_pairing: rows.length,
      resolved: rows.filter((r) => r.resolved).length,
      below_floor: rows.filter((r) => r.below_floor).length,
    },
  });
}
