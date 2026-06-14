import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runDoctor, type SkillLaneStatus } from "../../src/core/doctor.js";
import { scaffoldSkill } from "../../src/core/scaffold.js";
import { TFC_SKILLS } from "../../src/core/paths.js";
import { readYaml, writeYaml } from "../../src/core/yamlio.js";
import type { SpecYaml } from "../../src/core/types.js";

const CAT = "test-doctor-fixture";
const DRIFT = "drift-skill";
const STRAY = "stray-skill";
const STALE = "stale-skill";
const EVOLVE_READY = "evolve-ready-skill";

function dir(name: string): string {
  return nodePath.join(TFC_SKILLS, CAT, name);
}

async function setSpec(name: string, patch: Partial<SpecYaml>): Promise<void> {
  const specPath = nodePath.join(dir(name), "spec.yaml");
  const r = await readYaml<SpecYaml>(specPath);
  if (!r.ok) throw new Error(`setSpec ${name}: ${r.error.message}`);
  await writeYaml(specPath, { ...r.data, id: name, version: "1.0.0", ...patch });
}

const PASSING_REPORT = {
  skill_version: "1.0.0",
  ts: "2026-06-14T00:00:00Z",
  pass_threshold: 0.8,
  behavioral_score: 0.9,
  per_task: [
    { id: "t1", pass: true },
    { id: "t2", pass: true },
    { id: "t3", pass: true },
  ],
};

function find(skills: SkillLaneStatus[], name: string): SkillLaneStatus | undefined {
  return skills.find((s) => s.category === CAT && s.name === name);
}

beforeAll(async () => {
  await fsPromises
    .rm(nodePath.join(TFC_SKILLS, CAT), { recursive: true, force: true })
    .catch(() => undefined);

  for (const n of [DRIFT, STRAY, STALE, EVOLVE_READY]) {
    await scaffoldSkill({ category: CAT, name: n, dryRun: false });
    await setSpec(n, {});
  }

  // DRIFT: cache claims eval_proven but no report exists → recomputes authored.
  await setSpec(DRIFT, { lane: { state: "eval_proven" } });

  // STRAY: a non-contract file in the skill dir (INV-6 violation).
  await fsPromises.writeFile(nodePath.join(dir(STRAY), "scratch.db"), "x");

  // STALE: eval-report exists but its version no longer matches spec.
  await fsPromises.writeFile(
    nodePath.join(dir(STALE), "eval-report.json"),
    JSON.stringify({ ...PASSING_REPORT, skill_version: "0.9.0" }),
  );

  // EVOLVE_READY: eval_proven + 3 unconsumed learnings → evolvePending.
  await fsPromises.writeFile(
    nodePath.join(dir(EVOLVE_READY), "eval-report.json"),
    JSON.stringify(PASSING_REPORT),
  );
  await fsPromises.writeFile(
    nodePath.join(dir(EVOLVE_READY), "learnings.jsonl"),
    [
      '{"ts":"2026-06-14T00:00:00Z","type":"routing","note":"a","consumed_in":null}',
      '{"ts":"2026-06-14T00:01:00Z","type":"timing","note":"b","consumed_in":null}',
      '{"ts":"2026-06-14T00:02:00Z","type":"operational","note":"c","consumed_in":null}',
    ].join("\n"),
  );
});

afterAll(async () => {
  await fsPromises
    .rm(nodePath.join(TFC_SKILLS, CAT), { recursive: true, force: true })
    .catch(() => undefined);
});

describe("runDoctor — lane aggregation (Wave 5)", () => {
  it("recomputes a lane per skill and detects cache drift", async () => {
    const r = await runDoctor();
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const d = find(r.data.skills, DRIFT);
    expect(d?.lane).toBe("authored");
    expect(d?.cacheDrift).toBe(true);

    const driftCheck = r.data.checks.find((c) => c.id === "lane-cache-drift");
    expect(driftCheck?.passed).toBe(false);
    expect(driftCheck?.detail).toMatch(new RegExp(DRIFT));
  });

  it("flags stray state files outside the contract (INV-6)", async () => {
    const r = await runDoctor();
    if (!r.ok) throw new Error(r.error.message);

    const s = find(r.data.skills, STRAY);
    expect(s?.strayFiles).toContain("scratch.db");

    const stateCheck = r.data.checks.find((c) => c.id === "state-contract");
    expect(stateCheck?.passed).toBe(false);
    expect(stateCheck?.detail).toMatch(/scratch\.db/);
  });

  it("marks an eval-report stale when its version drifts from spec", async () => {
    const r = await runDoctor();
    if (!r.ok) throw new Error(r.error.message);

    const s = find(r.data.skills, STALE);
    expect(s?.evalStale).toBe(true);
    expect(s?.lane).toBe("authored"); // stale report cannot promote
  });

  it("marks evolvePending when eval_proven with >=3 unconsumed learnings", async () => {
    const r = await runDoctor();
    if (!r.ok) throw new Error(r.error.message);

    const s = find(r.data.skills, EVOLVE_READY);
    expect(s?.lane).toBe("eval_proven");
    expect(s?.evolvePending).toBe(true);
  });
});
