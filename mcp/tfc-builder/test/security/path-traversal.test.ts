/**
 * Security test: all four threat cases from 10-ship-gate.md.
 *
 * 1. tfc_new name="../../etc/cron.d/x" -> BAD_INPUT, nothing written outside skills root
 * 2. tfc_install where skill dir is a planted symlink resolving outside allowed roots -> PATH_ESCAPE
 * 3. tfc_migrate {sourcePath: "/etc/passwd"} -> PATH_ESCAPE (source outside HOME)
 * 4. skill name with null byte or unicode path chars -> BAD_INPUT (slug + zod layers)
 */

import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { afterAll, describe, expect, it } from "vitest";
import { scaffoldSkill } from "../../src/core/scaffold.js";
import { installSkill } from "../../src/core/install.js";
import { migrateSkill } from "../../src/core/migrate.js";
import { TFC_SKILLS } from "../../src/core/paths.js";

const SEC_CAT = "test-security";

afterAll(async () => {
  await fsPromises.rm(nodePath.join(TFC_SKILLS, SEC_CAT), { recursive: true, force: true }).catch(() => undefined);
  await fsPromises.rm("/tmp/tfc-sec-outside", { recursive: true, force: true }).catch(() => undefined);
});

// ── Threat 1: path traversal in name ─────────────────────────────────────────

describe("threat 1 — tfc_new path traversal in name", () => {
  it('"../../etc/cron.d/x" -> BAD_INPUT, nothing written', async () => {
    const r = await scaffoldSkill({
      category: "valid-cat",
      name: "../../etc/cron.d/x",
      dryRun: false,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("BAD_INPUT");

    // Verify nothing was written to /etc
    const etcDirExists = await fsPromises
      .access("/etc/cron.d/x")
      .then(() => true)
      .catch(() => false);
    expect(etcDirExists).toBe(false);
  });

  it("path traversal in category -> BAD_INPUT", async () => {
    const r = await scaffoldSkill({
      category: "../../etc",
      name: "valid-name",
      dryRun: false,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("BAD_INPUT");
  });

  it("absolute path as name -> BAD_INPUT", async () => {
    const r = await scaffoldSkill({
      category: "valid-cat",
      name: "/etc/passwd",
      dryRun: false,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("BAD_INPUT");
  });
});

// ── Threat 2: planted-symlink escape in tfc_install ────────────────────────────

describe("threat 2 — tfc_install planted-symlink escape", () => {
  it("skill dir is symlink resolving outside allowed roots -> PATH_ESCAPE", async () => {
    // Set up an external dir with valid skill files (mimicking the real template)
    const outsideDir = "/tmp/tfc-sec-outside";
    await fsPromises.mkdir(outsideDir, { recursive: true });

    // Copy template files to the outside dir
    const templateFiles = ["SKILL.md", "spec.yaml", "validations.yaml"];
    for (const f of templateFiles) {
      const src = nodePath.join(TFC_SKILLS, "_template", f);
      const dst = nodePath.join(outsideDir, f);
      await fsPromises.copyFile(src, dst).catch(() => undefined);
    }

    // Plant a symlink inside TFC_SKILLS pointing to the outside dir
    const plantedCat = nodePath.join(TFC_SKILLS, SEC_CAT);
    await fsPromises.mkdir(plantedCat, { recursive: true });
    const plantedLink = nodePath.join(plantedCat, "planted-symlink");
    // Remove if exists from a prior run
    await fsPromises.rm(plantedLink, { recursive: true, force: true }).catch(() => undefined);
    await fsPromises.symlink(outsideDir, plantedLink);

    // Attempting to install the "skill" (which is actually a symlink to outside) must be refused
    const r = await installSkill({
      category: SEC_CAT,
      name: "planted-symlink",
      dryRun: false,
    });

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("PATH_ESCAPE");

    // Cleanup
    await fsPromises.rm(plantedLink, { force: true }).catch(() => undefined);
  });
});

// ── Threat 3: tfc_migrate with system-file sourcePath ────────────────────────

describe("threat 3 — tfc_migrate system-file sourcePath", () => {
  it('sourcePath "/etc/passwd" -> PATH_ESCAPE', async () => {
    const r = await migrateSkill({
      sourcePath: "/etc/passwd",
      sourceType: "spawner",
      category: SEC_CAT,
      name: "sec-migrate",
      dryRun: true,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("PATH_ESCAPE");
  });

  it('sourcePath "/etc/hosts" -> PATH_ESCAPE', async () => {
    const r = await migrateSkill({
      sourcePath: "/etc/hosts",
      sourceType: "gstack",
      category: SEC_CAT,
      name: "sec-migrate-2",
      dryRun: true,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("PATH_ESCAPE");
  });
});

// ── Threat 4: null byte and unicode path in name ──────────────────────────────

describe("threat 4 — null byte and unicode dot-dot in name", () => {
  it("null byte in name -> BAD_INPUT", async () => {
    const r = await scaffoldSkill({
      category: "valid-cat",
      name: "skill\x00name",
      dryRun: false,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("BAD_INPUT");
  });

  it("unicode dot-dot (U+002E U+002E) in name -> BAD_INPUT", async () => {
    // . is the standard ASCII dot — "skill..name" = "skill..name"
    const r = await scaffoldSkill({
      category: "valid-cat",
      name: "skill..name",
      dryRun: false,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("BAD_INPUT");
  });

  it("name with spaces -> BAD_INPUT", async () => {
    const r = await scaffoldSkill({
      category: "valid-cat",
      name: "my skill name",
      dryRun: false,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("BAD_INPUT");
  });

  it("name with uppercase -> BAD_INPUT (kebab constraint)", async () => {
    const r = await scaffoldSkill({
      category: "valid-cat",
      name: "MySkill",
      dryRun: false,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("BAD_INPUT");
  });
});
