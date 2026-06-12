import * as fsPromises from "node:fs/promises";
import * as nodePath from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { exists, readText } from "../../src/core/fs.js";
import { SPAWNER_SKILLS, TFC_SKILLS } from "../../src/core/paths.js";
import { scaffoldSkill } from "../../src/core/scaffold.js";
import { readYaml } from "../../src/core/yamlio.js";
import type { SpecYaml } from "../../src/core/types.js";

const TEST_CATEGORY = "test-scaffold";
const TEST_DIR = nodePath.join(TFC_SKILLS, TEST_CATEGORY);

afterAll(async () => {
  await fsPromises.rm(TEST_DIR, { recursive: true, force: true }).catch(() => undefined);
});

describe("scaffoldSkill", () => {
  it("creates dir + 3 files, zero placeholders, spec.id === name", async () => {
    const r = await scaffoldSkill({ category: TEST_CATEGORY, name: "foo", dryRun: false });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const dir = r.data.dir;
    expect(await exists(dir)).toBe(true);
    expect(await exists(nodePath.join(dir, "SKILL.md"))).toBe(true);
    expect(await exists(nodePath.join(dir, "spec.yaml"))).toBe(true);
    expect(await exists(nodePath.join(dir, "validations.yaml"))).toBe(true);

    for (const f of ["SKILL.md", "spec.yaml", "validations.yaml"]) {
      const cr = await readText(nodePath.join(dir, f));
      expect(cr.ok, `readText ${f}`).toBe(true);
      if (!cr.ok) continue;
      expect(cr.data, `${f} must have no _PLACEHOLDER`).not.toMatch(/_PLACEHOLDER/);
    }

    const specR = await readYaml<SpecYaml>(nodePath.join(dir, "spec.yaml"));
    expect(specR.ok).toBe(true);
    if (!specR.ok) return;
    expect(specR.data.id).toBe("foo");
    expect(specR.data.category).toBe(TEST_CATEGORY);
  });

  it("returns EXISTS for an already-existing dir, no mutation", async () => {
    // "foo" was created above; scaffold again must fail
    const r = await scaffoldSkill({ category: TEST_CATEGORY, name: "foo", dryRun: false });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("EXISTS");
  });

  it("dryRun returns planned paths, no dir created", async () => {
    const r = await scaffoldSkill({ category: TEST_CATEGORY, name: "dry-test", dryRun: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.dryRun).toBe(true);
    expect(r.data.files).toHaveLength(3);
    expect(await exists(r.data.dir)).toBe(false);
    expect(r.data.tokenMap).toBeDefined();
  });

  it("name '../evil' returns BAD_INPUT, no fs touched", async () => {
    const r = await scaffoldSkill({ category: "data", name: "../evil", dryRun: false });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("BAD_INPUT");
  });

  it("category with slash returns BAD_INPUT", async () => {
    const r = await scaffoldSkill({ category: "bad/cat", name: "my-skill", dryRun: false });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("BAD_INPUT");
  });
});
