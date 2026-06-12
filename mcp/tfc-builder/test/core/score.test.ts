import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { scoreSkill, scoreSkillFromDir, scoreFromLoaded } from "../../src/core/score.js";
import { scaffoldSkill } from "../../src/core/scaffold.js";
import { TFC_SKILLS, TFC_TEMPLATE } from "../../src/core/paths.js";
import { loadSkillFromDir } from "../../src/core/checks.js";

const TEST_CATEGORY = "test-score";
const TEST_DIR = nodePath.join(TFC_SKILLS, TEST_CATEGORY);

beforeAll(async () => {
  await scaffoldSkill({ category: TEST_CATEGORY, name: "score-fixture", dryRun: false });
});

afterAll(async () => {
  await fsPromises.rm(TEST_DIR, { recursive: true, force: true }).catch(() => undefined);
});

describe("scoreSkill", () => {
  it("returns NOT_FOUND for non-existent skill", async () => {
    const r = await scoreSkill({ category: "nonexistent", name: "no-skill" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("NOT_FOUND");
  });

  it("freshly scaffolded skill scores in low band (template placeholders)", async () => {
    const r = await scoreSkill({ category: TEST_CATEGORY, name: "score-fixture" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Template has voice violations, placeholder sections — should score low
    expect(r.data.score).toBeGreaterThanOrEqual(0);
    expect(r.data.score).toBeLessThanOrEqual(25);
  });

  it("freshly scaffolded skill has concrete gaps for each unfilled section", async () => {
    const r = await scoreSkill({ category: TEST_CATEGORY, name: "score-fixture" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Should have gaps for identity, principles, patterns, anti-patterns at minimum
    expect(r.data.gaps.length).toBeGreaterThanOrEqual(4);
    const gapsJoined = r.data.gaps.join(" ");
    expect(gapsJoined).toMatch(/identity|principles|patterns/i);
  });

  it("score breakdown is a Record<string,number> with expected keys", async () => {
    const r = await scoreSkill({ category: TEST_CATEGORY, name: "score-fixture" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const keys = Object.keys(r.data.breakdown);
    expect(keys).toContain("identity");
    expect(keys).toContain("principles");
    expect(keys).toContain("patterns");
    expect(keys).toContain("antiPatterns");
    expect(keys).toContain("quickWins");
    expect(keys).toContain("handoffs");
    expect(keys).toContain("voiceClean");
  });

  it("score.score equals sum of breakdown values (monotonic invariant)", async () => {
    const r = await scoreSkill({ category: TEST_CATEGORY, name: "score-fixture" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const sum = Object.values(r.data.breakdown).reduce((a, b) => a + b, 0);
    expect(r.data.score).toBe(sum);
  });

  it("score never exceeds 100", async () => {
    const r = await scoreSkill({ category: TEST_CATEGORY, name: "score-fixture" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.score).toBeLessThanOrEqual(100);
  });
});

describe("scoreSkillFromDir (template band test)", () => {
  it("_template scores in known low band and lists placeholder gaps", async () => {
    // Template has placeholder content — verifies the scorer sees it correctly
    const r = await scoreSkillFromDir(TFC_TEMPLATE);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Template with unfilled placeholder sections should score <= 25
    expect(r.data.score).toBeLessThanOrEqual(25);
    // Template's own Voice section lists banned words → voiceClean = 0
    expect(r.data.breakdown["voiceClean"]).toBe(0);
    // Should have placeholder gaps
    expect(r.data.gaps.length).toBeGreaterThanOrEqual(3);
  });
});

describe("scoreFromLoaded (determinism + monotonic)", () => {
  it("same input always produces same score (deterministic)", async () => {
    const skillR = await loadSkillFromDir(nodePath.join(TEST_DIR, "score-fixture"));
    expect(skillR.ok).toBe(true);
    if (!skillR.ok) return;
    const r1 = scoreFromLoaded(skillR.data);
    const r2 = scoreFromLoaded(skillR.data);
    expect(r1.score).toBe(r2.score);
    expect(r1.breakdown).toEqual(r2.breakdown);
  });
});
