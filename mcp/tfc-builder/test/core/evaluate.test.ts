import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildEvalPrompt } from "../../src/core/evaluate.js";
import { scaffoldSkill } from "../../src/core/scaffold.js";
import { TFC_SKILLS } from "../../src/core/paths.js";

// Real files under the tmp TFC_ROOT (matches lane.test / install.test — no fs mocking).
const CAT = "test-eval-fixture";
const WITH_EVALS = "with-evals";
const NO_EVALS = "no-evals";

function dir(name: string): string {
  return nodePath.join(TFC_SKILLS, CAT, name);
}

const EVALS_YAML = `pass_threshold: 0.9
golden_tasks:
  - id: alpha
    prompt: "first scenario"
    must:
      - "MARKER_A"
    must_not:
      - "BAD_A"
  - id: beta
    prompt: "second scenario"
    must:
      - "MARKER_B"
  - id: gamma
    prompt: "third scenario"
    must:
      - "MARKER_C"
`;

async function clean(): Promise<void> {
  await fsPromises
    .rm(nodePath.join(TFC_SKILLS, CAT), { recursive: true, force: true })
    .catch(() => undefined);
}

beforeAll(async () => {
  await clean();
  for (const n of [WITH_EVALS, NO_EVALS]) {
    await scaffoldSkill({ category: CAT, name: n, dryRun: false });
  }
  await fsPromises.writeFile(nodePath.join(dir(WITH_EVALS), "evals.yaml"), EVALS_YAML);
  // scaffold now seeds evals.yaml from _template (INV-4); remove it to test the missing case.
  await fsPromises.rm(nodePath.join(dir(NO_EVALS), "evals.yaml"), { force: true });
});

afterAll(clean);

describe("buildEvalPrompt — local prompt assembly (V2/V3)", () => {
  it("builds a prompt that embeds the skill, the judge protocol, and every golden task", async () => {
    const r = await buildEvalPrompt({ category: CAT, name: WITH_EVALS });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.taskIds).toEqual(["alpha", "beta", "gamma"]);
    expect(r.data.passThreshold).toBe(0.9);
    expect(r.data.reportPath).toBe(nodePath.join(dir(WITH_EVALS), "eval-report.json"));
    // judge protocol present (observable-strings firewall) + tasks rendered
    expect(r.data.prompt).toContain("HOW TO JUDGE");
    expect(r.data.prompt).toContain("MARKER_A");
    expect(r.data.prompt).toContain("MARKER_B");
    expect(r.data.prompt).toContain("MARKER_C");
    expect(r.data.prompt).toContain("BAD_A");
    // local-first: the prompt must never reach for a model API (INV-1)
    expect(r.data.prompt).not.toMatch(/api\.(anthropic|openai)/i);
  });

  it("taskIds filters to a subset for partial re-eval", async () => {
    const r = await buildEvalPrompt({ category: CAT, name: WITH_EVALS, taskIds: ["beta"] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.taskIds).toEqual(["beta"]);
    expect(r.data.prompt).toContain("MARKER_B");
    expect(r.data.prompt).not.toContain("MARKER_A");
  });

  it("an unknown task id fails loudly (never silently empty)", async () => {
    const r = await buildEvalPrompt({ category: CAT, name: WITH_EVALS, taskIds: ["nope"] });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("BAD_INPUT");
  });

  it("missing evals.yaml → NOT_FOUND with a seed hint", async () => {
    const r = await buildEvalPrompt({ category: CAT, name: NO_EVALS });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("NOT_FOUND");
    expect(r.error.hint).toContain("evals.yaml");
  });

  it("unsafe name (path traversal) → BAD_INPUT", async () => {
    const r = await buildEvalPrompt({ category: CAT, name: "../escape" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("BAD_INPUT");
  });
});
