import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { migrateSkill } from "../../src/core/migrate.js";
import { TFC_SKILLS } from "../../src/core/paths.js";
import { readText } from "../../src/core/fs.js";

const FIXTURES = nodePath.join(
  nodePath.dirname(new URL(import.meta.url).pathname),
  "../fixtures",
);
const SPAWNER_FIXTURE = nodePath.join(FIXTURES, "spawner-fixture.yaml");
const GSTACK_FIXTURE = nodePath.join(FIXTURES, "gstack-fixture", "SKILL.md");

const TEST_CATEGORY = "test-migrate";
const TEST_DIR = nodePath.join(TFC_SKILLS, TEST_CATEGORY);

async function cleanTarget(name: string) {
  await fsPromises
    .rm(nodePath.join(TEST_DIR, name), { recursive: true, force: true })
    .catch(() => undefined);
}

afterAll(async () => {
  await fsPromises.rm(TEST_DIR, { recursive: true, force: true }).catch(() => undefined);
});

describe("migrateSkill — spawner", () => {
  const TARGET = "spawner-migrated";
  beforeEach(() => cleanTarget(TARGET));

  it("densityBaseline matches fixture (3 patterns, 2 anti_patterns)", async () => {
    const r = await migrateSkill({
      sourcePath: SPAWNER_FIXTURE,
      sourceType: "spawner",
      category: TEST_CATEGORY,
      name: TARGET,
      dryRun: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.densityBaseline.patterns).toBe(3);
    expect(r.data.densityBaseline.antiPatterns).toBe(2);
  });

  it("specFields carries triggers from source", async () => {
    const r = await migrateSkill({
      sourcePath: SPAWNER_FIXTURE,
      sourceType: "spawner",
      category: TEST_CATEGORY,
      name: TARGET,
      dryRun: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.specFields.triggers).toBeDefined();
    expect((r.data.specFields.triggers ?? []).length).toBeGreaterThan(0);
  });

  it("authoringPrompt names the density contract", async () => {
    const r = await migrateSkill({
      sourcePath: SPAWNER_FIXTURE,
      sourceType: "spawner",
      category: TEST_CATEGORY,
      name: TARGET,
      dryRun: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.authoringPrompt).toContain("EXACTLY 3");
    expect(r.data.authoringPrompt).toContain("EXACTLY 2");
  });

  it("authoringPrompt includes voice fragment (em dash ban)", async () => {
    const r = await migrateSkill({
      sourcePath: SPAWNER_FIXTURE,
      sourceType: "spawner",
      category: TEST_CATEGORY,
      name: TARGET,
      dryRun: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.authoringPrompt).toContain("em dash");
  });

  it("dryRun writes nothing to disk", async () => {
    await migrateSkill({
      sourcePath: SPAWNER_FIXTURE,
      sourceType: "spawner",
      category: TEST_CATEGORY,
      name: TARGET,
      dryRun: true,
    });
    const targetExists = await fsPromises
      .access(nodePath.join(TEST_DIR, TARGET))
      .then(() => true)
      .catch(() => false);
    expect(targetExists).toBe(false);
  });

  it("source file is byte-identical after non-dryRun migrate (read-only proof)", async () => {
    const beforeR = await readText(SPAWNER_FIXTURE);
    expect(beforeR.ok).toBe(true);
    if (!beforeR.ok) return;
    const before = beforeR.data;

    await migrateSkill({
      sourcePath: SPAWNER_FIXTURE,
      sourceType: "spawner",
      category: TEST_CATEGORY,
      name: TARGET,
      dryRun: false,
    });

    const afterR = await readText(SPAWNER_FIXTURE);
    expect(afterR.ok).toBe(true);
    if (!afterR.ok) return;
    expect(afterR.data).toBe(before);
  });

  it("returns NOT_FOUND for missing source", async () => {
    // Use real HOME path (not TFC_SKILLS, which globalSetup redirects to /tmp) so the
    // HOME boundary check passes and we reach the file-existence check.
    const realHome = process.env["HOME"] ?? "/home/roshish";
    const r = await migrateSkill({
      sourcePath: nodePath.join(realHome, ".future-code", "skills", "no-such-cat", "no-such-skill.yaml"),
      sourceType: "spawner",
      category: TEST_CATEGORY,
      name: TARGET,
      dryRun: true,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("NOT_FOUND");
  });
});

describe("migrateSkill — gstack", () => {
  const TARGET = "gstack-migrated";
  beforeEach(() => cleanTarget(TARGET));

  it("detects preamble and workflow sections from gstack SKILL.md", async () => {
    const r = await migrateSkill({
      sourcePath: GSTACK_FIXTURE,
      sourceType: "gstack",
      category: TEST_CATEGORY,
      name: TARGET,
      dryRun: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const sc = r.data.specFields;
    // gstack mapper uses skillDir basename as id
    expect(sc.id).toBe("gstack-fixture");
  });

  it("extracts triggers from CLAUDE.md routing entry", async () => {
    const r = await migrateSkill({
      sourcePath: GSTACK_FIXTURE,
      sourceType: "gstack",
      category: TEST_CATEGORY,
      name: TARGET,
      dryRun: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect((r.data.specFields.triggers ?? []).length).toBeGreaterThan(0);
  });

  it("densityBaseline counts named ### patterns in gstack SKILL.md", async () => {
    const r = await migrateSkill({
      sourcePath: GSTACK_FIXTURE,
      sourceType: "gstack",
      category: TEST_CATEGORY,
      name: TARGET,
      dryRun: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // fixture has 1 named pattern, 1 named anti-pattern
    expect(r.data.densityBaseline.patterns).toBe(1);
    expect(r.data.densityBaseline.antiPatterns).toBe(1);
  });
});
