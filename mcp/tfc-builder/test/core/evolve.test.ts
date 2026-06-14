import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildEvolvePrompt, bumpMinor, lineHash } from "../../src/core/evolve.js";
import { scaffoldSkill } from "../../src/core/scaffold.js";
import { TFC_SKILLS } from "../../src/core/paths.js";
import { readYaml, writeYaml } from "../../src/core/yamlio.js";
import type { SpecYaml } from "../../src/core/types.js";

const CAT = "test-evolve-fixture";
const READY = "ready"; // eval-report + 3 unconsumed learnings
const THIN = "thin"; // eval-report + 1 learning (NOT_READY)
const NO_EVAL = "no-eval"; // no eval-report (NOT_READY)

function dir(name: string): string {
  return nodePath.join(TFC_SKILLS, CAT, name);
}

const REPORT = {
  skill_version: "1.0.0",
  pass_threshold: 0.8,
  behavioral_score: 0.8,
  per_task: [
    { id: "a", pass: true },
    { id: "b", pass: true },
    { id: "c", pass: false, delta_note: "loaded missed MARKER_C" },
  ],
};

function learning(note: string): string {
  return JSON.stringify({ ts: "2026-06-14T00:00:00Z", type: "routing", note, consumed_in: null });
}

async function setVersion(name: string, v: string): Promise<void> {
  const p = nodePath.join(dir(name), "spec.yaml");
  const r = await readYaml<SpecYaml>(p);
  if (!r.ok) throw new Error(r.error.message);
  await writeYaml(p, { ...r.data, id: name, version: v });
}

async function clean(): Promise<void> {
  await fsPromises.rm(nodePath.join(TFC_SKILLS, CAT), { recursive: true, force: true }).catch(() => undefined);
}

beforeAll(async () => {
  await clean();
  for (const n of [READY, THIN, NO_EVAL]) {
    await scaffoldSkill({ category: CAT, name: n, dryRun: false });
    await setVersion(n, "1.0.0");
  }
  await fsPromises.writeFile(nodePath.join(dir(READY), "eval-report.json"), JSON.stringify(REPORT));
  await fsPromises.writeFile(
    nodePath.join(dir(READY), "learnings.jsonl"),
    [learning("L1"), learning("L2"), learning("L3")].join("\n") + "\n",
  );
  await fsPromises.writeFile(nodePath.join(dir(THIN), "eval-report.json"), JSON.stringify(REPORT));
  await fsPromises.writeFile(nodePath.join(dir(THIN), "learnings.jsonl"), learning("only-one") + "\n");
});

afterAll(clean);

describe("bumpMinor + lineHash (pure)", () => {
  it("bumps the minor and zeroes patch", () => {
    expect(bumpMinor("1.0.0")).toBe("1.1.0");
    expect(bumpMinor("2.3.5")).toBe("2.4.0");
  });
  it("lineHash is stable + 12 hex chars", () => {
    const h = lineHash("x");
    expect(h).toMatch(/^[0-9a-f]{12}$/);
    expect(lineHash("x")).toBe(h);
  });
});

describe("buildEvolvePrompt — loop closer (V2/V4)", () => {
  it("ready skill: builds a prompt, consumes 3 learnings, targets the failing task", async () => {
    const r = await buildEvolvePrompt({ category: CAT, name: READY });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.learningsConsumed).toHaveLength(3);
    expect(r.data.fromVersion).toBe("1.0.0");
    expect(r.data.toVersion).toBe("1.1.0");
    expect(r.data.preEvalScore).toBe(0.8);
    expect(r.data.failingTaskIds).toEqual(["c"]);
    expect(r.data.prompt).toContain("evolution_proven");
    expect(r.data.prompt).toContain("0.05");
    expect(r.data.prompt).not.toMatch(/api\.(anthropic|openai)/i);
  });

  it("refuses under 3 unconsumed learnings → NOT_READY", async () => {
    const r = await buildEvolvePrompt({ category: CAT, name: THIN });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("NOT_READY");
  });

  it("force overrides the learnings guard", async () => {
    const r = await buildEvolvePrompt({ category: CAT, name: THIN, force: true });
    expect(r.ok).toBe(true);
  });

  it("refuses when there is no eval-report → NOT_READY", async () => {
    const r = await buildEvolvePrompt({ category: CAT, name: NO_EVAL });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("NOT_READY");
  });

  it("unsafe name → BAD_INPUT", async () => {
    const r = await buildEvolvePrompt({ category: CAT, name: "../escape" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("BAD_INPUT");
  });
});
