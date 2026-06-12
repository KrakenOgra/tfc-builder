import * as fs from "node:fs";
import * as os from "node:os";
import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { afterAll, describe, expect, it } from "vitest";
import { scoreFromLoaded, scoreSkillFromDir } from "../../src/core/score.js";
import { scaffoldSkill } from "../../src/core/scaffold.js";
import { TFC_SKILLS } from "../../src/core/paths.js";
import { loadSkillFromDir } from "../../src/core/checks.js";
import { readYaml } from "../../src/core/yamlio.js";
import type { SpecYaml } from "../../src/core/types.js";

const FIXTURES = nodePath.join(
  nodePath.dirname(new URL(import.meta.url).pathname),
  "../fixtures/archetypes",
);

const TEST_CATEGORY = "test-archetypes";
const TEST_DIR = nodePath.join(TFC_SKILLS, TEST_CATEGORY);

afterAll(async () => {
  await fsPromises.rm(TEST_DIR, { recursive: true, force: true }).catch(() => undefined);
});

// ── Workflow rubric ───────────────────────────────────────────────────────────

describe("workflow archetype", () => {
  it("scores the full-structure fixture 100 with workflow breakdown keys", async () => {
    const r = await scoreSkillFromDir(nodePath.join(FIXTURES, "workflow-pass"));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.archetype).toBe("workflow");
    expect(r.data.score).toBe(100);
    expect(r.data.breakdown).toEqual({
      phases: 20,
      stopPoints: 15,
      preamble: 10,
      completionProtocol: 10,
      evidenceRules: 15,
      failurePaths: 10,
      handoffs: 10,
      voiceClean: 10,
    });
    expect(r.data.gaps).toEqual([]);
  });

  it("score equals sum of breakdown and never exceeds 100", async () => {
    const r = await scoreSkillFromDir(nodePath.join(FIXTURES, "workflow-pass"));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const sum = Object.values(r.data.breakdown).reduce((a, b) => a + b, 0);
    expect(r.data.score).toBe(sum);
    expect(r.data.score).toBeLessThanOrEqual(100);
  });

  it("is deterministic", async () => {
    const skillR = await loadSkillFromDir(nodePath.join(FIXTURES, "workflow-pass"));
    expect(skillR.ok).toBe(true);
    if (!skillR.ok) return;
    const r1 = scoreFromLoaded(skillR.data);
    const r2 = scoreFromLoaded(skillR.data);
    expect(r1.score).toBe(r2.score);
    expect(r1.breakdown).toEqual(r2.breakdown);
  });

  it("docks phases and stop points when structure is missing", async () => {
    const skillR = await loadSkillFromDir(nodePath.join(FIXTURES, "reference-pass"));
    expect(skillR.ok).toBe(true);
    if (!skillR.ok) return;
    // Reference content scored as workflow: no phases, no stops, no preamble
    const forced = {
      ...skillR.data,
      specYaml: { ...skillR.data.specYaml, archetype: "workflow" } as SpecYaml,
    };
    const r = scoreFromLoaded(forced);
    expect(r.breakdown["phases"]).toBe(0);
    expect(r.breakdown["stopPoints"]).toBe(0);
    expect(r.gaps.join(" ")).toMatch(/phase/i);
  });
});

// ── Reference rubric ──────────────────────────────────────────────────────────

describe("reference archetype", () => {
  it("scores the lookup fixture 100 with reference breakdown keys", async () => {
    const r = await scoreSkillFromDir(nodePath.join(FIXTURES, "reference-pass"));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.archetype).toBe("reference");
    expect(r.data.score).toBe(100);
    expect(r.data.breakdown).toEqual({
      coverage: 40,
      freshness: 20,
      retrievalShape: 30,
      voiceClean: 10,
    });
  });

  it("flags missing tables and version stamps", async () => {
    const skillR = await loadSkillFromDir(nodePath.join(FIXTURES, "workflow-pass"));
    expect(skillR.ok).toBe(true);
    if (!skillR.ok) return;
    const forced = {
      ...skillR.data,
      specYaml: { ...skillR.data.specYaml, archetype: "reference" } as SpecYaml,
    };
    const r = scoreFromLoaded(forced);
    expect(r.breakdown["retrievalShape"]).toBe(0);
    expect(r.gaps.join(" ")).toMatch(/table/i);
  });
});

// ── Hybrid rubric ─────────────────────────────────────────────────────────────

describe("hybrid archetype", () => {
  it("scores both-halves fixture 100 as halved sums", async () => {
    const r = await scoreSkillFromDir(nodePath.join(FIXTURES, "hybrid-pass"));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.archetype).toBe("hybrid");
    expect(r.data.breakdown).toEqual({ domainHalf: 50, workflowHalf: 50 });
    expect(r.data.score).toBe(100);
    expect(r.data.halves?.domain.score).toBe(100);
    expect(r.data.halves?.workflow.score).toBe(100);
  });

  it("score equals sum of breakdown (halved invariant holds)", async () => {
    const r = await scoreSkillFromDir(nodePath.join(FIXTURES, "hybrid-pass"));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const sum = Object.values(r.data.breakdown).reduce((a, b) => a + b, 0);
    expect(r.data.score).toBe(sum);
    expect(r.data.score).toBeLessThanOrEqual(100);
  });

  it("flags a half below 60 (must clear both halves)", async () => {
    const skillR = await loadSkillFromDir(nodePath.join(FIXTURES, "workflow-pass"));
    expect(skillR.ok).toBe(true);
    if (!skillR.ok) return;
    // Pure workflow content as hybrid: domain half collapses
    const forced = {
      ...skillR.data,
      specYaml: { ...skillR.data.specYaml, archetype: "hybrid" } as SpecYaml,
    };
    const r = scoreFromLoaded(forced);
    expect(r.gaps.join(" ")).toMatch(/domain half scored \d+\/100/);
    expect(r.halves?.workflow.score).toBe(100);
    expect(r.halves?.domain.score).toBeLessThan(60);
  });
});

// ── Back-compat dispatch ──────────────────────────────────────────────────────

describe("archetype dispatch back-compat", () => {
  it("spec without archetype scores as domain-expert (v1 behavior)", async () => {
    const skillR = await loadSkillFromDir(nodePath.join(FIXTURES, "hybrid-pass"));
    expect(skillR.ok).toBe(true);
    if (!skillR.ok) return;
    const spec = { ...skillR.data.specYaml };
    delete (spec as Partial<SpecYaml>).archetype;
    const r = scoreFromLoaded({ ...skillR.data, specYaml: spec });
    expect(r.archetype).toBe("domain-expert");
    expect(Object.keys(r.breakdown)).toContain("identity");
    expect(Object.keys(r.breakdown)).toContain("antiPatterns");
  });

  it("unknown archetype value falls back to domain-expert with a gap", async () => {
    const skillR = await loadSkillFromDir(nodePath.join(FIXTURES, "hybrid-pass"));
    expect(skillR.ok).toBe(true);
    if (!skillR.ok) return;
    const forced = {
      ...skillR.data,
      specYaml: { ...skillR.data.specYaml, archetype: "wizard" } as unknown as SpecYaml,
    };
    const r = scoreFromLoaded(forced);
    expect(r.archetype).toBe("domain-expert");
    expect(r.gaps.join(" ")).toMatch(/unknown value "wizard"/);
  });
});

// ── Scaffold integration ──────────────────────────────────────────────────────

describe("tfc_new archetype stamping", () => {
  it("writes the requested archetype into spec.yaml", async () => {
    const r = await scaffoldSkill({
      category: TEST_CATEGORY,
      name: "wf-skill",
      dryRun: false,
      archetype: "workflow",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const spec = await readYaml<SpecYaml>(nodePath.join(r.data.dir, "spec.yaml"));
    expect(spec.ok).toBe(true);
    if (!spec.ok) return;
    expect(spec.data.archetype).toBe("workflow");
  });

  it("defaults to domain-expert from the template when omitted", async () => {
    const r = await scaffoldSkill({
      category: TEST_CATEGORY,
      name: "default-skill",
      dryRun: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const spec = await readYaml<SpecYaml>(nodePath.join(r.data.dir, "spec.yaml"));
    expect(spec.ok).toBe(true);
    if (!spec.ok) return;
    expect(spec.data.archetype).toBe("domain-expert");
  });
});

// ── THE ACCEPTANCE TEST (06-ROADMAP Wave 1 exit gate) ────────────────────────
// vague-to-system re-scored as workflow must reach ≥70 with ZERO content edits.
// Runs against the real install; skipped on machines without it.

const REAL_V2S = nodePath.join(
  os.homedir(),
  ".future-code",
  "skills",
  "pattern",
  "vague-to-system",
);
const REAL_ACG = nodePath.join(
  os.homedir(),
  ".future-code",
  "skills",
  "ai",
  "ai-code-generation",
);

describe.skipIf(!fs.existsSync(REAL_V2S))("acceptance: wave 1 exit gate", () => {
  it("vague-to-system scores ≥70 as workflow with zero content edits", async () => {
    const r = await scoreSkillFromDir(REAL_V2S);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.archetype).toBe("workflow");
    expect(r.data.score).toBeGreaterThanOrEqual(70);
  });

  it.skipIf(!fs.existsSync(REAL_ACG))(
    "ai-code-generation (no archetype field) keeps its v1 domain score",
    async () => {
      const r = await scoreSkillFromDir(REAL_ACG);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.archetype).toBe("domain-expert");
      expect(r.data.score).toBe(90);
    },
  );
});
