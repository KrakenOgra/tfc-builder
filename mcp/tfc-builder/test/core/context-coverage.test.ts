import * as fsPromises from "node:fs/promises";
import * as nodePath from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { TFC_SKILLS } from "../../src/core/paths.js";
import { scoreCoverage } from "../../src/core/context-coverage.js";

const TEST_CATEGORY = "test-cce-cov";
const TEST_DIR = nodePath.join(TFC_SKILLS, TEST_CATEGORY);

afterAll(async () => {
  await fsPromises.rm(TEST_DIR, { recursive: true, force: true }).catch(() => undefined);
});

const deepBody = (header: string) =>
  [
    "---",
    "last_verified: 2026-06-22",
    "---",
    "",
    `## ${header}`,
    "source: demo/SKILL.md",
    "Loss-aversion openers beat curiosity openers on save rate because the viewer feels the stake " +
      "before the payoff, so the thumb stops on the first frame. A second proven formula is the " +
      "contrarian flip: state the consensus, negate it in three words, and the open loop holds attention. " +
      "A third is the cost-of-inaction line, naming exactly what the viewer loses by scrolling past, " +
      "which converts a passive scroll into an active decision to stay for the resolution.",
    "",
  ].join("\n");

async function makeSkillWithManifest(
  name: string,
  manifest: string,
  files: Record<string, string>,
): Promise<void> {
  const ctx = nodePath.join(TEST_DIR, name, "context");
  await fsPromises.mkdir(ctx, { recursive: true });
  await fsPromises.writeFile(nodePath.join(ctx, "_angles.yaml"), manifest, "utf-8");
  for (const [f, content] of Object.entries(files)) {
    const p = nodePath.join(ctx, f);
    await fsPromises.mkdir(nodePath.dirname(p), { recursive: true });
    await fsPromises.writeFile(p, content, "utf-8");
  }
}

function manifestOf(depthTarget: number, files: string[]): string {
  const angles = files.map((f) => `  - file: ${f}\n    sections: ["## A"]`).join("\n");
  return `domain: content/social\ndepth_target: ${depthTarget}\nangles:\n${angles}\n`;
}

describe("scoreCoverage", () => {
  it("1 answered angle of 12 declared ⇒ uncovered FAIL (V6: files-present ≠ covered)", async () => {
    const twelve = Array.from({ length: 12 }, (_, i) => `a${i}.md`);
    await makeSkillWithManifest("partial", manifestOf(12, twelve), {
      "a0.md": deepBody("A"), // only one answered; the other 11 missing
    });
    const r = await scoreCoverage({ name: "partial" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.declaredAngles).toBe(12);
    expect(r.data.answeredAngles).toBe(1);
    expect(r.data.coverage).toBeCloseTo(1 / 12, 5);
    expect(r.data.covered).toBe(false);
    expect(r.data.depthTargetMet).toBe(true); // 12 declared meets target 12
    expect(r.data.reasons.some((x) => x.includes("unanswered"))).toBe(true);
  });

  it("all angles answered AND depth_target met ⇒ covered", async () => {
    const files = ["x0.md", "x1.md"];
    await makeSkillWithManifest("full", manifestOf(2, files), {
      "x0.md": deepBody("A"),
      "x1.md": deepBody("A"),
    });
    const r = await scoreCoverage({ name: "full" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.covered).toBe(true);
    expect(r.data.coverage).toBe(1);
    expect(r.data.reasons).toHaveLength(0);
  });

  it("enough files but below depth_target ⇒ uncovered (V6 angle floor)", async () => {
    await makeSkillWithManifest("thin", manifestOf(12, ["y0.md"]), {
      "y0.md": deepBody("A"),
    });
    const r = await scoreCoverage({ name: "thin" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.covered).toBe(false);
    expect(r.data.depthTargetMet).toBe(false);
    expect(r.data.reasons.some((x) => x.includes("declared"))).toBe(true);
  });

  it("no manifest ⇒ fails closed (coverage cannot be faked from file presence)", async () => {
    await fsPromises.mkdir(nodePath.join(TEST_DIR, "nomani", "context"), { recursive: true });
    const r = await scoreCoverage({ name: "nomani" });
    expect(r.ok).toBe(false);
  });
});
