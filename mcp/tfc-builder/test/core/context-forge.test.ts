import * as fsPromises from "node:fs/promises";
import * as nodePath from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { TFC_SKILLS } from "../../src/core/paths.js";
import {
  extractPrimitives,
  deriveDomain,
  planArtifacts,
  buildForge,
  validateArtifact,
} from "../../src/core/context-forge.js";
import { scoreCoverage } from "../../src/core/context-coverage.js";

const TEST_CATEGORY = "test-forge";
const TEST_DIR = nodePath.join(TFC_SKILLS, TEST_CATEGORY);
const TODAY = "2026-06-23";

afterAll(async () => {
  await fsPromises.rm(TEST_DIR, { recursive: true, force: true }).catch(() => undefined);
});

async function makeSkill(name: string, skillMd: string): Promise<void> {
  const dir = nodePath.join(TEST_DIR, name);
  await fsPromises.mkdir(dir, { recursive: true });
  await fsPromises.writeFile(nodePath.join(dir, "SKILL.md"), skillMd, "utf-8");
}

// Realistic domain SKILL.md stubs (authored the way real skills are — capitalised/backticked terms).
const AUTOVIBE_MD = `---
name: autovibe
description: >
  Vibe-coding compiler. Emits a CATCQ prompt-pack or one self-contained ULTRA prompt.
  Dual-backend on one IR (GROUND crux, DECOMPOSE lists, TRANSCEND charter). It uses a
  via-negativa pass and P0 reconnaissance before compiling.
---
# AUTOVIBE
A good pack passes the GROUND gate. The TRANSCEND charter sets the ambition floor.`;

const FOOTBALL_MD = `---
name: football-analyst
description: >
  Tactical football analysis. Reads Formations, Pressing triggers, and Transitions to
  diagnose why a team concedes. Uses Gegenpressing and defensive-shape principles.
---
# FOOTBALL ANALYST
Good analysis isolates the **pressing trigger**: the moment the opponent fullback receives.
A 4-3-3 collapses in central Transitions when the **double pivot** is bypassed.`;

const PIZZA_MD = `---
name: pizza-business
description: >
  Pizza shop business advisor. Reasons about Margins, unit economics, Throughput, and
  customer LTV to decide location and pricing. Tracks COGS and the **dough-cost** ratio.
---
# PIZZA BUSINESS
A good decision proves demand before a second Location. Watch Throughput at peak covers.`;

const IMAGE_MD = `---
name: image-prompt-engineer
description: >
  Photography prompt engineering. Composes Lighting, style modifiers, and Composition rules
  with anchor nouns and negative-prompt terms to produce gallery-grade renders.
---
# IMAGE PROMPT ENGINEER
A good prompt anchors a subject Noun before stacking Lighting and Composition modifiers.`;

describe("W1 — extractPrimitives / deriveDomain", () => {
  it("returns domain-specific (not generic) primitives for autovibe", () => {
    const prims = extractPrimitives(AUTOVIBE_MD, 12);
    // domain-specific terms an expert recognises — the dense ALLCAPS cluster ranks highest, and the
    // bigram forms (more specific than bare acronyms) are captured too.
    expect(prims.some((p) => /CATCQ/i.test(p))).toBe(true);
    expect(prims.some((p) => /ULTRA/i.test(p))).toBe(true);
    expect(prims.some((p) => /TRANSCEND/i.test(p))).toBe(true);
    expect(prims.some((p) => /GROUND/i.test(p))).toBe(true);
    expect(prims.some((p) => /\bP0 reconnaissance\b/i.test(p))).toBe(true);
    // NOT generic noise
    expect(prims.map((p) => p.toLowerCase())).not.toContain("good");
    expect(prims.map((p) => p.toLowerCase())).not.toContain("output");
    expect(prims.map((p) => p.toLowerCase())).not.toContain("prompt");
    // via-negativa is a lower-signal hyphenated term: below the acronym cluster at default depth,
    // but caught by --deep (limit 20). Ranking favours the higher-signal terms — by design.
    expect(extractPrimitives(AUTOVIBE_MD, 12).some((p) => /via-negativa/i.test(p))).toBe(false);
    expect(extractPrimitives(AUTOVIBE_MD, 20).some((p) => /via-negativa/i.test(p))).toBe(true);
  });

  it("derives a slug + primitives for a non-software domain (football)", () => {
    const d = deriveDomain({ name: "football-analyst", skillMd: FOOTBALL_MD });
    expect(d.domainSlug).toBe("football-analyst");
    expect(d.primitives.length).toBeGreaterThanOrEqual(2);
    expect(d.primitives.some((p) => /Formations|Pressing|Transitions|Gegenpressing|pivot/i.test(p))).toBe(true);
  });
});

describe("W3 — adversarial validator", () => {
  const PRIMS = ["Gegenpressing", "pressing trigger", "Transitions", "double pivot"];

  it("REJECTS a generic artifact (sports clichés, < 2 primitives)", () => {
    const generic = `---\nsource_basis: x\n---\n## Failure Modes\nsource: skill\nGood analysis is important. Typically you should give it your best effort and stay focused.`;
    const v = validateArtifact("anti-patterns.md", generic, PRIMS);
    expect(v.domainFitness).toBe(false);
    expect(v.pass).toBe(false);
    expect(v.reasons[0]).toMatch(/domain-fitness/);
    expect(v.specificityFlags.length).toBeGreaterThan(0); // "Typically …" with no domain qualifier
  });

  it("PASSES a domain-specific artifact (>= 2 primitives in real sentences)", () => {
    const good = `---\nsource_basis: x\n---\n## Failure Modes\nsource: football-analyst/SKILL.md\nOver-indexing possession ignores Transitions: a side that wins the ball but loses the Gegenpressing window concedes because the double pivot is already bypassed.`;
    const v = validateArtifact("anti-patterns.md", good, PRIMS);
    expect(v.domainFitness).toBe(true);
    expect(v.pass).toBe(true);
    expect(v.primitivesHit.length).toBeGreaterThanOrEqual(2);
    expect(v.falsifiabilityWarn.length).toBe(0); // contains "because"
  });
});

describe("W2/W4 — deposit + coverage", () => {
  it("preview writes nothing but returns a plan + prompt", async () => {
    await makeSkill("prev", FOOTBALL_MD);
    const r = await buildForge({ name: "prev", today: TODAY, preview: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.written.length).toBe(0);
    expect(r.data.prompt).toMatch(/ADVERSARIAL DEFAULT/);
    const contextDir = nodePath.join(TEST_DIR, "prev", "context");
    const made = await fsPromises.access(contextDir).then(() => true).catch(() => false);
    expect(made).toBe(false); // INV: preview is a true dry-run
  });

  it("deposits _angles.yaml + DV2 stubs, and coverage then sees the angles", async () => {
    await makeSkill("depo", FOOTBALL_MD);
    const r = await buildForge({ name: "depo", today: TODAY });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const contextDir = nodePath.join(TEST_DIR, "depo", "context");

    const manifest = await fsPromises.readFile(nodePath.join(contextDir, "_angles.yaml"), "utf-8");
    expect(manifest).toMatch(/domain: "football-analyst"/);
    expect(manifest).toMatch(/file: taxonomy\.md/);

    const stub = await fsPromises.readFile(nodePath.join(contextDir, "taxonomy.md"), "utf-8");
    expect(stub).toMatch(/synthesized: true/); // DV2 schema, not an invented basis: field
    expect(stub).toMatch(/source_basis: "SKILL\.md \(tfc_context_forge\)"/);

    // before any fill, coverage sees the manifest (no longer dead-ends) but reports 0 answered.
    const cov0 = await scoreCoverage({ name: "depo" });
    expect(cov0.ok).toBe(true);
    if (!cov0.ok) return;
    expect(cov0.data.declaredAngles).toBe(planArtifacts({}).length);
    expect(cov0.data.answeredAngles).toBe(0);

    // act as the OFFLINE pass: fill taxonomy.md with a grounded, primitive-bearing body.
    const filled = `---\nlast_verified: ${TODAY}\nsynthesized: true\nsource_basis: "SKILL.md (tfc_context_forge)"\n---\n## Categories\nsource: football-analyst/SKILL.md\nFormations index every read: a 4-3-3 presses with its front three while the double pivot screens central Transitions. Pressing triggers fire when the opponent fullback receives, because that isolates the Gegenpressing window before the team can settle.\n## When To Use\nsource: football-analyst/SKILL.md\nApply the Pressing trigger taxonomy when diagnosing why a side concedes in Transitions: the double pivot's position tells you whether the Gegenpressing collapsed because the central lane was open.`;
    await fsPromises.writeFile(nodePath.join(contextDir, "taxonomy.md"), filled, "utf-8");

    const cov1 = await scoreCoverage({ name: "depo" });
    expect(cov1.ok).toBe(true);
    if (!cov1.ok) return;
    expect(cov1.data.answeredAngles).toBeGreaterThanOrEqual(1);
    expect(cov1.data.coverage).toBeGreaterThan(0); // W4 ship criterion
  });

  it("NEEDS_SKILL_DESCRIPTION when SKILL.md is too thin to derive a domain", async () => {
    await makeSkill("thin", "# x\nhello world this is a tool");
    const r = await buildForge({ name: "thin", today: TODAY });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("NEEDS_SKILL_DESCRIPTION");
  });
});

describe("W5 — generalization (different domains produce disjoint primitives)", () => {
  it("pizza and image-prompt derive completely different primitive sets", () => {
    const pizza = deriveDomain({ name: "pizza-business", skillMd: PIZZA_MD });
    const image = deriveDomain({ name: "image-prompt-engineer", skillMd: IMAGE_MD });
    const p = new Set(pizza.primitives.map((x) => x.toLowerCase()));
    const overlap = image.primitives.map((x) => x.toLowerCase()).filter((x) => p.has(x));
    expect(overlap).toEqual([]); // no artifact could plausibly belong to either domain (§10.7)
    // and each set is recognisably its own domain
    expect(pizza.primitives.some((x) => /Margins|Throughput|COGS|dough|Location|LTV/i.test(x))).toBe(true);
    expect(image.primitives.some((x) => /Lighting|Composition|modifiers|Noun|negative/i.test(x))).toBe(true);
  });

  it("football and pizza taxonomies are planned identically in STRUCTURE but the domains differ", () => {
    // structure is universal (INV-3): same artifact files regardless of domain
    expect(planArtifacts({}).map((a) => a.file)).toEqual([
      "taxonomy.md",
      "few-shots.md",
      "anti-patterns.md",
      "principles.md",
      "META.md",
    ]);
    // --deep adds depth angles
    expect(planArtifacts({ deep: true }).length).toBeGreaterThan(planArtifacts({}).length);
    // --types filters
    expect(planArtifacts({ types: ["taxonomy"] }).map((a) => a.file)).toEqual(["taxonomy.md"]);
  });
});
