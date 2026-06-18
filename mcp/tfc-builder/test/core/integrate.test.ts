import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs/promises";
import * as nodePath from "node:path";
import { scaffoldSkill } from "../../src/core/scaffold.js";
import { integrateSkill } from "../../src/core/integrate.js";
import { readYaml } from "../../src/core/yamlio.js";
import { TFC_SKILLS } from "../../src/core/paths.js";
import type { SpecYaml } from "../../src/core/types.js";

const CAT = "test-integrate";

beforeAll(async () => {
  await scaffoldSkill({ category: CAT, name: "target", dryRun: false });
});

afterAll(async () => {
  await fs.rm(nodePath.join(TFC_SKILLS, CAT), { recursive: true, force: true });
});

async function readSpec(): Promise<SpecYaml> {
  const r = await readYaml<SpecYaml>(
    nodePath.join(TFC_SKILLS, CAT, "target", "spec.yaml"),
  );
  if (!r.ok) throw new Error("spec unreadable");
  return r.data;
}

describe("integrateSkill (v3 W5 — validated integration contracts)", () => {
  it("adds an MCP id ending in -mcp to requires", async () => {
    const r = await integrateSkill({ category: CAT, name: "target", system: "scanner-mcp" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.kind).toBe("requires");
    expect((await readSpec()).requires).toContain("scanner-mcp");
  });

  it("rejects a skill pairing missing direction/reason (no aspirational pairs)", async () => {
    const r = await integrateSkill({ category: CAT, name: "target", system: "some-skill" });
    expect(r.ok).toBe(false);
  });

  it("adds a complete skill pairing to pairs_with and re-validates", async () => {
    const r = await integrateSkill({
      category: CAT,
      name: "target",
      system: "scanner",
      direction: "before",
      reason: "scan before ship",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.kind).toBe("pairs_with");
    expect(r.data.validation).toBeDefined();
    const pairs = (await readSpec()).pairs_with;
    expect(pairs.some((p) => p.skill === "scanner" && p.direction === "before")).toBe(true);
  });
});
