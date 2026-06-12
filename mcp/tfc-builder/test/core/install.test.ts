import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { installSkill, listSkills, registerSkill } from "../../src/core/install.js";
import { scaffoldSkill } from "../../src/core/scaffold.js";
import { TFC_SKILLS, CLAUDE_SKILLS, SPAWNER_SKILLS } from "../../src/core/paths.js";
import { readYaml, writeYaml } from "../../src/core/yamlio.js";
import type { SpecYaml } from "../../src/core/types.js";

// ── Test category ─────────────────────────────────────────────────────────────
// All test artifacts land under a single dedicated category that's cleaned up
// fully in afterAll. Tests use real symlinks — no fs mocking.

const CAT = "test-install-fixture";
const VALID = "valid-fixture";
const FAIL = "fail-fixture";
const BROKEN = "broken-link-fixture";
const REG = "register-fixture";

// Full cleanup of all test artifacts in claude/spawner/tfc dirs
async function cleanAll() {
  const dirs = [
    nodePath.join(TFC_SKILLS, CAT),
    nodePath.join(CLAUDE_SKILLS, VALID),
    nodePath.join(CLAUDE_SKILLS, FAIL),
    nodePath.join(CLAUDE_SKILLS, BROKEN),
    nodePath.join(CLAUDE_SKILLS, REG),
    nodePath.join(SPAWNER_SKILLS, CAT),
  ];
  for (const d of dirs) {
    await fsPromises.rm(d, { recursive: true, force: true }).catch(() => undefined);
  }
}

// Patch spec.yaml so all blocking gates pass:
//   - id must match dirName (specIdMatchesDir gate)
//   - required_sections: [] (requiredSectionsPresent gate)
async function patchSpec(category: string, name: string) {
  const specPath = nodePath.join(TFC_SKILLS, category, name, "spec.yaml");
  const r = await readYaml<SpecYaml>(specPath);
  if (!r.ok) throw new Error(`patchSpec: could not read ${specPath}: ${r.error.message}`);
  await writeYaml(specPath, { ...r.data, id: name, required_sections: [] });
}

beforeAll(async () => {
  await cleanAll();

  // Scaffold VALID (will be patched to pass all blocking gates)
  await scaffoldSkill({ category: CAT, name: VALID, dryRun: false });
  await patchSpec(CAT, VALID);

  // Scaffold FAIL — leave spec.yaml unchanged (id: skill-name-here ≠ dir name → blocking)
  await scaffoldSkill({ category: CAT, name: FAIL, dryRun: false });

  // Scaffold BROKEN for list tests
  await scaffoldSkill({ category: CAT, name: BROKEN, dryRun: false });

  // Scaffold REG for register tests
  await scaffoldSkill({ category: CAT, name: REG, dryRun: false });
});

afterAll(cleanAll);

// ── installSkill ──────────────────────────────────────────────────────────────

describe("installSkill — blocking validation failure", () => {
  it("freshly scaffolded (id mismatch) -> VALIDATION_FAILED, zero symlinks", async () => {
    const r = await installSkill({ category: CAT, name: FAIL, dryRun: false });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("VALIDATION_FAILED");

    const claudePath = nodePath.join(CLAUDE_SKILLS, FAIL, "SKILL.md");
    const spawnPath = nodePath.join(SPAWNER_SKILLS, CAT, `${FAIL}-tfc`);
    const c = await fsPromises.access(claudePath).then(() => true).catch(() => false);
    const s = await fsPromises.access(spawnPath).then(() => true).catch(() => false);
    expect(c).toBe(false);
    expect(s).toBe(false);
  });
});

describe("installSkill — valid skill", () => {
  it("first install -> both links created, validated=true", async () => {
    const r1 = await installSkill({ category: CAT, name: VALID, dryRun: false });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    expect(r1.data.claudeLink).toBe("created");
    expect(r1.data.spawnerLink).toBe("created");
    expect(r1.data.validated).toBe(true);

    // Verify real symlinks on disk
    const claudeTarget = nodePath.join(TFC_SKILLS, CAT, VALID, "SKILL.md");
    const spawnTarget = nodePath.join(TFC_SKILLS, CAT, VALID);
    expect(
      await fsPromises.readlink(nodePath.join(CLAUDE_SKILLS, VALID, "SKILL.md")),
    ).toBe(claudeTarget);
    expect(
      await fsPromises.readlink(nodePath.join(SPAWNER_SKILLS, CAT, `${VALID}-tfc`)),
    ).toBe(spawnTarget);
  });

  it("second install (idempotent) -> both 'exists'", async () => {
    const r2 = await installSkill({ category: CAT, name: VALID, dryRun: false });
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(r2.data.claudeLink).toBe("exists");
    expect(r2.data.spawnerLink).toBe("exists");
  });

  it("dryRun -> both 'planned', no new symlinks on disk", async () => {
    // Remove existing links first to test dryRun from scratch
    await fsPromises.unlink(nodePath.join(CLAUDE_SKILLS, VALID, "SKILL.md")).catch(() => undefined);
    await fsPromises.rmdir(nodePath.join(CLAUDE_SKILLS, VALID)).catch(() => undefined);
    await fsPromises.unlink(nodePath.join(SPAWNER_SKILLS, CAT, `${VALID}-tfc`)).catch(() => undefined);

    const r = await installSkill({ category: CAT, name: VALID, dryRun: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.claudeLink).toBe("planned");
    expect(r.data.spawnerLink).toBe("planned");

    const c = await fsPromises
      .access(nodePath.join(CLAUDE_SKILLS, VALID, "SKILL.md"))
      .then(() => true)
      .catch(() => false);
    expect(c).toBe(false);
  });
});

describe("installSkill — link conflict", () => {
  it("conflicting symlink -> LINK_CONFLICT, existing link untouched", async () => {
    // Ensure any leftover correct link is cleared
    const claudeDir = nodePath.join(CLAUDE_SKILLS, VALID);
    const claudeFile = nodePath.join(claudeDir, "SKILL.md");
    await fsPromises.mkdir(claudeDir, { recursive: true });
    await fsPromises.unlink(claudeFile).catch(() => undefined);

    // Plant a symlink pointing to the wrong target
    const wrongTarget = nodePath.join(TFC_SKILLS, CAT, FAIL, "SKILL.md");
    await fsPromises.symlink(wrongTarget, claudeFile);

    // patch spec so validation passes (otherwise we'd get VALIDATION_FAILED first)
    const r = await installSkill({ category: CAT, name: VALID, dryRun: false });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("LINK_CONFLICT");

    // Wrong-target link must be untouched
    expect(await fsPromises.readlink(claudeFile)).toBe(wrongTarget);

    // Cleanup
    await fsPromises.unlink(claudeFile).catch(() => undefined);
  });
});

// ── listSkills ────────────────────────────────────────────────────────────────

describe("listSkills", () => {
  it("dangling claude link appears in brokenOnly output", async () => {
    // Create a dangling claude link for BROKEN skill
    const clDir = nodePath.join(CLAUDE_SKILLS, BROKEN);
    await fsPromises.mkdir(clDir, { recursive: true });
    const clFile = nodePath.join(clDir, "SKILL.md");
    // Point to a path that does not exist → dangling
    await fsPromises.symlink(
      nodePath.join(TFC_SKILLS, CAT, BROKEN, "NONEXISTENT.md"),
      clFile,
    ).catch(() => undefined);

    const r = await listSkills({ brokenOnly: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const entry = r.data.skills.find((s) => s.name === BROKEN && s.category === CAT);
    expect(entry).toBeDefined();
    if (!entry) return;
    expect(entry.claudeLinkState).toBe("dangling");
  });

  it("lists all skills with correct shape when brokenOnly=false", async () => {
    const r = await listSkills({ brokenOnly: false });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const fixtureCatSkills = r.data.skills.filter((s) => s.category === CAT);
    expect(fixtureCatSkills.length).toBeGreaterThan(0);

    for (const skill of r.data.skills) {
      expect(typeof skill.name).toBe("string");
      expect(typeof skill.category).toBe("string");
      expect(["ok", "missing", "dangling", "conflict"]).toContain(skill.claudeLinkState);
      expect(["ok", "missing", "dangling", "conflict"]).toContain(skill.spawnerLinkState);
    }
  });
});

// ── registerSkill ─────────────────────────────────────────────────────────────

describe("registerSkill", () => {
  it("creates spawner -tfc symlink and returns hint", async () => {
    const r = await registerSkill({ category: CAT, name: REG });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const expectedLink = nodePath.join(SPAWNER_SKILLS, CAT, `${REG}-tfc`);
    expect(r.data.spawnerLink).toBe(expectedLink);
    expect(r.data.hint).toContain(REG);

    const st = await fsPromises.lstat(expectedLink).catch(() => null);
    expect(st?.isSymbolicLink()).toBe(true);
  });

  it("idempotent — second register returns ok with same link", async () => {
    const r = await registerSkill({ category: CAT, name: REG });
    expect(r.ok).toBe(true);
  });

  it("returns NOT_FOUND for non-existent skill", async () => {
    const r = await registerSkill({ category: "no-such-cat", name: "no-such-skill" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("NOT_FOUND");
  });
});
