// Wave 3 (v3, W-V3): perishable proof. Good-once is not good-now.
//
// eval_proven and evolution_proven carry a freshness horizon (declared in spec.yaml). A proof
// older than its horizon is `stale` and the EFFECTIVE lane drops one rung toward authored —
// until re-proven. The earned lane on disk is NEVER touched.
//
// INV-7 (HARD LINE): this is a SEPARATE, as-of computation. `core/lane.ts::recomputeLane`
// stays a pure function of disk with NO Date.now(); ALL time-dependence lives HERE and takes
// an EXPLICIT `asOf` passed by the caller (the tool boundary may default it to now — never
// the verdict). Date.parse of the *input* asOf/proof-ts is not a clock read.

import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { skillDir } from "./paths.js";
import { exists, readText } from "./fs.js";
import { readYaml } from "./yamlio.js";
import { recomputeLane } from "./lane.js";
import type { Lane, SpecYaml } from "./types.js";

const DEFAULT_EVAL_DAYS = 30;
const DEFAULT_EVOLUTION_DAYS = 60;
const MS_PER_DAY = 86_400_000;

export interface DecayVerdict {
  /** earned lane (recomputed; untouched on disk) */
  lane: Lane;
  /** consumer-facing lane after the decay overlay — dropped one rung if stale */
  effectiveLane: Lane;
  stale: boolean;
  /** age of the relevant proof at `asOf`, in whole days (null when no perishable proof) */
  ageDays: number | null;
  /** the horizon that applied (null when none declared / not applicable) */
  horizonDays: number | null;
  /** the explicit as-of the caller passed */
  asOf: string;
  /** the recorded proof timestamp the age was measured from */
  proofTs: string | null;
  reason: string;
}

function dropOneRung(lane: Lane): Lane {
  if (lane === "evolution_proven") return "eval_proven";
  return "authored"; // eval_proven → authored; authored stays authored
}

async function evalReportTs(dir: string): Promise<string | null> {
  const p = nodePath.join(dir, "eval-report.json");
  if (!(await exists(p))) return null;
  const r = await readText(p);
  if (!r.ok) return null;
  try {
    const o = JSON.parse(r.data) as { ts?: unknown };
    return typeof o.ts === "string" ? o.ts : null;
  } catch {
    return null;
  }
}

async function latestChangelogTs(dir: string): Promise<string | null> {
  const p = nodePath.join(dir, "CHANGELOG.jsonl");
  if (!(await exists(p))) return null;
  const r = await readText(p);
  if (!r.ok) return null;
  let latest: string | null = null;
  for (const line of r.data.split("\n")) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line) as { ts?: unknown };
      if (typeof o.ts === "string" && (latest === null || o.ts.localeCompare(latest) > 0))
        latest = o.ts;
    } catch {
      // a malformed row never counts as a proof timestamp
    }
  }
  return latest;
}

export async function laneAsOf(input: {
  category: string;
  name: string;
  asOf: string;
}): Promise<Result<DecayVerdict>> {
  const { category, name, asOf } = input;
  const asOfMs = Date.parse(asOf);
  if (Number.isNaN(asOfMs))
    return fail("BAD_INPUT", `asOf is not a parseable date: ${asOf}`);

  const dirR = skillDir(category, name);
  if (!dirR.ok) return fail("BAD_INPUT", dirR.error.message);
  const dir = dirR.path;

  // Earned lane via the PURE recompute (no decay inside it — INV-7).
  const laneR = await recomputeLane(category, name);
  if (!laneR.ok) return fail(laneR.error.code, laneR.error.message);
  const lane = laneR.data.lane;

  const base = { lane, asOf };

  // authored has no perishable proof.
  if (lane === "authored")
    return ok({
      ...base,
      effectiveLane: "authored",
      stale: false,
      ageDays: null,
      horizonDays: null,
      proofTs: null,
      reason: "authored has no perishable proof",
    });

  // Horizon comes from spec.yaml. ABSENT ⇒ no decay pressure (back-compat, markdown-as-code).
  const specR = await readYaml<SpecYaml>(nodePath.join(dir, "spec.yaml"));
  const horizon =
    specR.ok && specR.data && typeof specR.data === "object"
      ? specR.data.freshness_horizon
      : undefined;
  if (!horizon)
    return ok({
      ...base,
      effectiveLane: lane,
      stale: false,
      ageDays: null,
      horizonDays: null,
      proofTs: null,
      reason: "no freshness_horizon declared → no decay pressure (back-compat)",
    });

  const horizonDays =
    lane === "evolution_proven"
      ? horizon.evolution_days ?? DEFAULT_EVOLUTION_DAYS
      : horizon.eval_days ?? DEFAULT_EVAL_DAYS;
  const proofTs =
    lane === "evolution_proven"
      ? await latestChangelogTs(dir)
      : await evalReportTs(dir);

  if (proofTs === null)
    return ok({
      ...base,
      effectiveLane: lane,
      stale: false,
      ageDays: null,
      horizonDays,
      proofTs: null,
      reason: "no recorded proof timestamp → decay not computable (reported fresh)",
    });

  const proofMs = Date.parse(proofTs);
  if (Number.isNaN(proofMs))
    return ok({
      ...base,
      effectiveLane: lane,
      stale: false,
      ageDays: null,
      horizonDays,
      proofTs,
      reason: `proof timestamp unparseable (${proofTs}) → reported fresh`,
    });

  const ageDays = Math.floor((asOfMs - proofMs) / MS_PER_DAY);
  const stale = ageDays > horizonDays;
  const effectiveLane = stale ? dropOneRung(lane) : lane;
  const reason = stale
    ? `${lane} proof is ${ageDays}d old > ${horizonDays}d horizon → stale; effectiveLane ${effectiveLane} (earned lane unchanged on disk)`
    : `${lane} proof is ${ageDays}d old ≤ ${horizonDays}d horizon → fresh`;

  return ok({
    ...base,
    effectiveLane,
    stale,
    ageDays,
    horizonDays,
    proofTs,
    reason,
  });
}
