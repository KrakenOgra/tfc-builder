import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { validateSkill } from "../../src/core/validate.js";
import { scaffoldSkill } from "../../src/core/scaffold.js";
import { TFC_SKILLS } from "../../src/core/paths.js";
import { readYaml } from "../../src/core/yamlio.js";
import { writeYaml } from "../../src/core/yamlio.js";
import type { SpecYaml } from "../../src/core/types.js";

const TEST_CATEGORY = "test-validate";
const TEST_DIR = nodePath.join(TFC_SKILLS, TEST_CATEGORY);

beforeAll(async () => {
  // Scaffold a clean fixture (template content — will have voice violations + section mismatches)
  await scaffoldSkill({ category: TEST_CATEGORY, name: "clean-fixture", dryRun: false });
  // Scaffold fixture for spec-id mismatch test
  await scaffoldSkill({ category: TEST_CATEGORY, name: "id-mismatch", dryRun: false });
  // Mutate spec.yaml id to create a mismatch
  const specPath = nodePath.join(TEST_DIR, "id-mismatch", "spec.yaml");
  const specR = await readYaml<SpecYaml>(specPath);
  if (specR.ok) {
    await writeYaml(specPath, { ...specR.data, id: "wrong-id" });
  }
});

afterAll(async () => {
  await fsPromises.rm(TEST_DIR, { recursive: true, force: true }).catch(() => undefined);
});

describe("validateSkill", () => {
  it("returns NOT_FOUND for non-existent skill", async () => {
    const r = await validateSkill({ category: "nonexistent", name: "no-skill" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("NOT_FOUND");
  });

  it("freshly scaffolded skill fails on blocking required-sections-present", async () => {
    // Template spec.yaml required_sections has PHASE 1 etc. which SKILL.md lacks
    const r = await validateSkill({ category: TEST_CATEGORY, name: "clean-fixture" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // passed = false because blocking gates failed
    expect(r.data.passed).toBe(false);
    const blockingIds = r.data.blocking.map((g) => g.id);
    expect(blockingIds).toContain("required-sections-present");
  });

  it("freshly scaffolded skill has voice-em-dash in warnings", async () => {
    // Template SKILL.md has em dashes in prose
    const r = await validateSkill({ category: TEST_CATEGORY, name: "clean-fixture" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const warningIds = r.data.warnings.map((g) => g.id);
    expect(warningIds).toContain("voice-em-dash");
  });

  it("freshly scaffolded skill has voice-ai-vocabulary in warnings", async () => {
    // Template SKILL.md Voice section lists the banned words
    const r = await validateSkill({ category: TEST_CATEGORY, name: "clean-fixture" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const warningIds = r.data.warnings.map((g) => g.id);
    expect(warningIds).toContain("voice-ai-vocabulary");
  });

  it("spec.id mismatch -> blocking includes spec-id-matches-directory, passed=false", async () => {
    const r = await validateSkill({ category: TEST_CATEGORY, name: "id-mismatch" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.passed).toBe(false);
    const blockingIds = r.data.blocking.map((g) => g.id);
    expect(blockingIds).toContain("spec-id-matches-directory");
    // The failing gate should carry a useful message
    const gate = r.data.blocking.find((g) => g.id === "spec-id-matches-directory");
    expect(gate?.message).toContain("wrong-id");
  });

  it("validation report structure: passed + blocking + warnings + info arrays", async () => {
    const r = await validateSkill({ category: TEST_CATEGORY, name: "clean-fixture" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(typeof r.data.passed).toBe("boolean");
    expect(Array.isArray(r.data.blocking)).toBe(true);
    expect(Array.isArray(r.data.warnings)).toBe(true);
    expect(Array.isArray(r.data.info)).toBe(true);
  });

  it("each GateResult has id, severity, passed, message fields", async () => {
    const r = await validateSkill({ category: TEST_CATEGORY, name: "clean-fixture" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const allGates = [
      ...r.data.blocking,
      ...r.data.warnings,
      ...r.data.info,
    ];
    expect(allGates.length).toBeGreaterThan(0);
    for (const gate of allGates) {
      expect(typeof gate.id).toBe("string");
      expect(typeof gate.severity).toBe("string");
      expect(typeof gate.passed).toBe("boolean");
      expect(typeof gate.message).toBe("string");
    }
  });
});
