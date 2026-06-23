// Wave 5 (v3, W-V4): portfolio currency — ONE disk-recomputed health surface for the whole
// skill portfolio, so the ecosystem reads a verdict instead of eyeballing tfc_list.
//
//   histogram     — earned-lane counts (matches tfc_list)
//   decayPressure — how many proofs are stale as-of a date (composes core/decay.ts)
//   evolveReady   — eval_proven skills with >=3 unconsumed learnings (the loop is ready to close)
//   belowFloor    — pack pairings under their declared min_lane (composes core/packbridge.ts)
//   unreachable   — skills not invokable (W2 reachability), folded in for completeness
//
// INV-6: reads ONLY existing contract files + packs.yaml — introduces NO new state store.
// INV-1: no model API. The whole surface is recomputable from disk by a stranger after a restart.

import * as nodePath from "node:path";
import { ok, type Result } from "./result.js";
import { readText } from "./fs.js";
import { readYaml } from "./yamlio.js";
import { listSkills } from "./install.js";
import { laneAsOf } from "./decay.js";
import { buildPackBridgeReport } from "./packbridge.js";
import type { Lane, SpecYaml } from "./types.js";

export interface DecayDetail {
  skill: string;
  lane: Lane;
  effectiveLane: Lane;
  ageDays: number | null;
  horizonDays: number | null;
  // v4 W5: the successor skill id (spec.yaml succeeded_by), rendered only for a decayed skill.
  succeededBy?: string;
}

export interface BelowFloorDetail {
  pack: string;
  pairs_skill: string;
  lane: Lane | "unknown" | null;
  min_lane: Lane | null;
}

export interface PortfolioRollup {
  asOf: string;
  skills: number;
  histogram: Record<string, number>;
  decayPressure: { stale: number; details: DecayDetail[] };
  evolveReady: { count: number; skills: string[] };
  belowFloor: { count: number; pairings: BelowFloorDetail[] };
  unreachable: { count: number; skills: string[] };
}

async function unconsumedLearnings(dir: string): Promise<number> {
  const r = await readText(nodePath.join(dir, "learnings.jsonl"));
  if (!r.ok) return 0;
  let n = 0;
  for (const line of r.data.split("\n")) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line) as { consumed_in?: unknown };
      if (o.consumed_in == null) n++;
    } catch {
      // malformed line never counts as input
    }
  }
  return n;
}

export async function rollup(input?: {
  asOf?: string;
}): Promise<Result<PortfolioRollup>> {
  const asOf = input?.asOf ?? new Date().toISOString();

  const listR = await listSkills({ brokenOnly: false });
  if (!listR.ok) return listR;
  const skills = listR.data.skills;

  // histogram of EARNED lanes (matches tfc_list).
  const histogram: Record<string, number> = {
    authored: 0,
    eval_proven: 0,
    evolution_proven: 0,
    unknown: 0,
  };
  for (const s of skills) histogram[s.lane] = (histogram[s.lane] ?? 0) + 1;

  // decay pressure: how many proofs are stale as-of `asOf` (composes core/decay.ts).
  const decayDetails: DecayDetail[] = [];
  for (const s of skills) {
    const dR = await laneAsOf({ category: s.category, name: s.name, asOf });
    if (!dR.ok) continue; // a broken skill (no SKILL.md) has no perishable proof to assess
    if (dR.data.stale) {
      // v4 W5: surface the successor for a decayed skill (→ succeeded by: <id>).
      const specR = await readYaml<SpecYaml>(nodePath.join(s.dir, "spec.yaml"));
      const succeededBy = specR.ok ? specR.data.succeeded_by : undefined;
      decayDetails.push({
        skill: `${s.category}/${s.name}`,
        lane: dR.data.lane,
        effectiveLane: dR.data.effectiveLane,
        ageDays: dR.data.ageDays,
        horizonDays: dR.data.horizonDays,
        ...(succeededBy ? { succeededBy } : {}),
      });
    }
  }

  // evolve-ready: eval_proven with >=3 unconsumed learnings (the loop can close).
  const evolveReadySkills: string[] = [];
  for (const s of skills) {
    if (s.lane !== "eval_proven") continue;
    if ((await unconsumedLearnings(s.dir)) >= 3)
      evolveReadySkills.push(`${s.category}/${s.name}`);
  }

  // below-floor pack pairings (composes the read-only packbridge; tolerate a missing packs.yaml).
  const pairings: BelowFloorDetail[] = [];
  const pbR = await buildPackBridgeReport({});
  if (pbR.ok) {
    for (const row of pbR.data.rows) {
      if (row.below_floor)
        pairings.push({
          pack: row.pack,
          pairs_skill: row.pairs_skill,
          lane: row.lane,
          min_lane: row.min_lane,
        });
    }
  }

  // reachability rollup (W2): which skills are not invokable.
  const unreachableSkills = skills
    .filter((s) => !s.reachable)
    .map((s) => `${s.category}/${s.name}`);

  return ok({
    asOf,
    skills: skills.length,
    histogram,
    decayPressure: { stale: decayDetails.length, details: decayDetails },
    evolveReady: { count: evolveReadySkills.length, skills: evolveReadySkills },
    belowFloor: { count: pairings.length, pairings },
    unreachable: { count: unreachableSkills.length, skills: unreachableSkills },
  });
}
