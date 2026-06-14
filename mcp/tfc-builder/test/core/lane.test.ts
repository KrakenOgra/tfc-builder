import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { recomputeLane } from "../../src/core/lane.js";
import { listSkills } from "../../src/core/install.js";
import { scaffoldSkill } from "../../src/core/scaffold.js";
import { TFC_SKILLS } from "../../src/core/paths.js";
import { readYaml, writeYaml } from "../../src/core/yamlio.js";
import type { SpecYaml } from "../../src/core/types.js";

// All fixtures live under one dedicated category, cleaned up in afterAll.
// Real files on disk under the tmp TFC_ROOT — no fs mocking (matches install.test).
const CAT = "test-lane-fixture";
const AUTHORED = "authored-fixture";
const EVAL = "eval-fixture";
const EVOLVE = "evolve-fixture";
const THIN = "thin-eval-fixture";
const MALFORMED = "malformed-eval-fixture";

function dir(name: string): string {
  return nodePath.join(TFC_SKILLS, CAT, name);
}

async function setSpec(name: string, patch: Partial<SpecYaml>): Promise<void> {
  const specPath = nodePath.join(dir(name), "spec.yaml");
  const r = await readYaml<SpecYaml>(specPath);
  if (!r.ok) throw new Error(`setSpec ${name}: ${r.error.message}`);
  await writeYaml(specPath, { ...r.data, id: name, ...patch });
}

function writeJson(name: string, file: string, obj: unknown): Promise<void> {
  return fsPromises.writeFile(nodePath.join(dir(name), file), JSON.stringify(obj));
}

const PASSING_REPORT = {
  skill_version: "1.0.0",
  ts: "2026-06-14T00:00:00Z",
  pass_threshold: 0.8,
  behavioral_score: 0.86,
  per_task: [
    { id: "t1", pass: true },
    { id: "t2", pass: true },
    { id: "t3", pass: true },
  ],
};

async function clean(): Promise<void> {
  await fsPromises
    .rm(nodePath.join(TFC_SKILLS, CAT), { recursive: true, force: true })
    .catch(() => undefined);
}

beforeAll(async () => {
  await clean();
  for (const n of [AUTHORED, EVAL, EVOLVE, THIN, MALFORMED]) {
    await scaffoldSkill({ category: CAT, name: n, dryRun: false });
    await setSpec(n, { version: "1.0.0" });
  }

  // eval_proven: fresh passing report
  await writeJson(EVAL, "eval-report.json", PASSING_REPORT);

  // evolution_proven: passing report + qualifying CHANGELOG row
  await writeJson(EVOLVE, "eval-report.json", { ...PASSING_REPORT, behavioral_score: 0.9 });
  await fsPromises.writeFile(
    nodePath.join(dir(EVOLVE), "CHANGELOG.jsonl"),
    JSON.stringify({
      ts: "2026-06-14T01:00:00Z",
      from_version: "1.0.0",
      to_version: "1.1.0",
      learnings_consumed: ["h1", "h2", "h3"],
      pre_eval_score: 0.8,
      post_eval_score: 0.9,
      delta: 0.1,
      sections_touched: ["Patterns"],
    }) + "\n",
  );

  // thin: fresh report but only 2 tasks → must NOT promote
  await writeJson(THIN, "eval-report.json", {
    ...PASSING_REPORT,
    per_task: [
      { id: "t1", pass: true },
      { id: "t2", pass: true },
    ],
  });

  // malformed: not valid JSON → must NOT promote, must not throw
  await fsPromises.writeFile(nodePath.join(dir(MALFORMED), "eval-report.json"), "{ not json");
});

afterAll(clean);

describe("recomputeLane — authored floor (V1)", () => {
  it("a scaffolded skill recomputes to authored", async () => {
    const r = await recomputeLane(CAT, AUTHORED);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.lane).toBe("authored");
    expect(r.data.inputs.hasEvalReport).toBe(false);
  });

  it("missing spec.yaml → NOT_FOUND (never silently authored)", async () => {
    const r = await recomputeLane(CAT, "does-not-exist");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("NOT_FOUND");
  });

  it("unsafe name (path traversal) → BAD_INPUT", async () => {
    const r = await recomputeLane(CAT, "../escape");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("BAD_INPUT");
  });
});

describe("recomputeLane — determinism (V4 / no restart-amnesia)", () => {
  it("two consecutive recomputes are deep-equal", async () => {
    const a = await recomputeLane(CAT, EVOLVE);
    const b = await recomputeLane(CAT, EVOLVE);
    expect(a).toEqual(b);
  });
});

describe("recomputeLane — eval_proven (V3)", () => {
  it("fresh passing report on ≥3 tasks → eval_proven", async () => {
    const r = await recomputeLane(CAT, EVAL);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.lane).toBe("eval_proven");
    expect(r.data.inputs.evalFresh).toBe(true);
    expect(r.data.inputs.evalPasses).toBe(true);
  });

  it("a report with <3 tasks does NOT promote → authored", async () => {
    const r = await recomputeLane(CAT, THIN);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.lane).toBe("authored");
    expect(r.data.inputs.evalPasses).toBe(false);
  });

  it("a malformed report does NOT promote and does NOT throw → authored", async () => {
    const r = await recomputeLane(CAT, MALFORMED);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.lane).toBe("authored");
    expect(r.data.inputs.hasEvalReport).toBe(false);
  });

  it("stale demotion: bumping spec.version invalidates the report → authored", async () => {
    await setSpec(EVAL, { version: "1.0.1" });
    const r = await recomputeLane(CAT, EVAL);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.lane).toBe("authored");
    expect(r.data.inputs.evalFresh).toBe(false);
    await setSpec(EVAL, { version: "1.0.0" }); // restore
  });
});

describe("recomputeLane — evolution_proven (V2/V4)", () => {
  it("eval_proven + qualifying CHANGELOG (≥3 learnings, Δ≥0.05) → evolution_proven", async () => {
    const r = await recomputeLane(CAT, EVOLVE);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.lane).toBe("evolution_proven");
    expect(r.data.inputs.qualifyingEvolution).toBe(true);
  });
});

describe("recomputeLane — cache drift", () => {
  it("flags drift when spec lane.state disagrees with the recomputation", async () => {
    await setSpec(AUTHORED, { lane: { state: "evolution_proven" } });
    const r = await recomputeLane(CAT, AUTHORED);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.lane).toBe("authored");
    expect(r.data.cacheDrift).toBe(true);
    await setSpec(AUTHORED, { lane: { state: "authored" } }); // restore
  });
});

describe("listSkills — lane in each row (V5 surface)", () => {
  it("includes the recomputed lane for fixture skills", async () => {
    const r = await listSkills({ brokenOnly: false });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const entry = r.data.skills.find((s) => s.category === CAT && s.name === AUTHORED);
    expect(entry).toBeDefined();
    expect(entry?.lane).toBe("authored");
  });
});
