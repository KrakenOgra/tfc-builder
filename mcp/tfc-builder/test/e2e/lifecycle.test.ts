/**
 * End-to-end lifecycle test.
 *
 * Exercises the full skill lifecycle against the isolated tmp HOME set up by
 * test/setup.ts (globalSetup).  No network, no real home dir writes.
 *
 * Chain:
 *   tfc_new  ->  tfc_brainstorm  ->  [test authors skill content]
 *   ->  tfc_validate  ->  tfc_score  ->  tfc_install  ->  tfc_list
 *
 * Second chain:
 *   tfc_migrate (spawner fixture)  ->  density + source-unchanged checks
 *   tfc_migrate (gstack fixture)   ->  density + source-unchanged checks
 */

import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { execSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";

import { scaffoldSkill } from "../../src/core/scaffold.js";
import { buildBrainstormPrompt } from "../../src/core/authoring.js";
import { validateSkill } from "../../src/core/validate.js";
import { scoreSkill } from "../../src/core/score.js";
import { installSkill, listSkills } from "../../src/core/install.js";
import { migrateSkill } from "../../src/core/migrate.js";
import { TFC_SKILLS, CLAUDE_SKILLS, SPAWNER_SKILLS } from "../../src/core/paths.js";
import { writeText } from "../../src/core/fs.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const CAT = "e2e-lifecycle";
const NAME = "auth-flow";

const FIXTURES = nodePath.join(
  nodePath.dirname(new URL(import.meta.url).pathname),
  "../fixtures",
);
const SPAWNER_FIXTURE = nodePath.join(FIXTURES, "spawner-fixture.yaml");
const GSTACK_FIXTURE = nodePath.join(FIXTURES, "gstack-fixture", "SKILL.md");

// ── Authored SKILL.md — stands in for Claude's output ─────────────────────────
// No em dashes, no AI vocab, real named items (no brackets).
const AUTHORED_SKILL_MD = `# Auth Flow Skill

<!-- TFC skill: auth-flow -->

## Identity

Handles authentication and session management patterns for web applications.
Covers: JWT validation, session rotation, token refresh flows.

## Principles

### Validate Before Trust
Check tokens at every entry point, not just at login.
When: handling any authenticated request.
Why: tokens can be forged or replayed; re-validation is the only safe path.

### Rotate on Privilege Change
Issue a new session token whenever permissions escalate or de-escalate.
When: role change, sudo entry, password reset.
Why: stale tokens carry old privilege scope into new contexts.

## Patterns

### Middleware-First Validation
Run auth middleware before any route handler executes.
When: any route that requires an authenticated caller.
Why: keeps auth logic in one place instead of scattered across handlers.
Example: Express middleware calling verifyJWT(req.headers.authorization).
Key rule: short-circuit with 401 on failure; never call next() with bad state.

### Silent Token Refresh
Return a fresh access token in the response header when the current one is near expiry.
When: access token is within the refresh window (e.g., last 5 minutes of a 1-hour TTL).
Why: avoids mid-session logouts without requiring user interaction.
Example: Set X-Refreshed-Token header on 200 responses when ttl < 300.
Key rule: refresh window must be shorter than the refresh token TTL.

## Anti-Patterns

### Storing Secrets in localStorage
Why this is bad: XSS can read localStorage; session hijacking is trivial.
Bad example: localStorage.setItem("access_token", token)
Good example: use HttpOnly cookies for access tokens.

### Logging JWT Payloads
Why this is bad: log aggregators often have weaker access controls than the app; PII leaks.
Bad example: console.log("Auth success", decodedToken)
Good example: log only token.sub (user id), never the full payload.

## Quick Wins

### One-Line Expiry Check
Check token.exp > Date.now() / 1000 before any async call to reduce latency.

## Handoffs

### Passes to rate-limiting skill
After auth validation, pass the verified user id to the rate limiter.

## Preamble (run first)

Load learnings.jsonl. Note any prior incidents around token handling.

## Telemetry (run last)

Append to learnings.jsonl: { "timestamp": "<ISO>", "status": "DONE", "notes": "" }

## Stack Reference

- Language: TypeScript / Node.js
- Libraries: jsonwebtoken, express, cookie-parser
`;

// ── Cleanup ───────────────────────────────────────────────────────────────────

afterAll(async () => {
  const dirs = [
    nodePath.join(TFC_SKILLS, CAT),
    nodePath.join(CLAUDE_SKILLS, NAME),
    nodePath.join(SPAWNER_SKILLS, CAT),
    nodePath.join(TFC_SKILLS, "e2e-migrate-spawner"),
    nodePath.join(TFC_SKILLS, "e2e-migrate-gstack"),
  ];
  for (const d of dirs) {
    await fsPromises.rm(d, { recursive: true, force: true }).catch(() => undefined);
  }
});

// ── Lifecycle chain ───────────────────────────────────────────────────────────

describe("e2e lifecycle — main chain", () => {
  it("tfc_new: scaffolds skill dir with 3 files", async () => {
    const r = await scaffoldSkill({ category: CAT, name: NAME, dryRun: false });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.dir).toContain(NAME);
    expect(r.data.files).toHaveLength(3);
  });

  it("tfc_brainstorm: returns a prompt naming correct write targets", async () => {
    const r = await buildBrainstormPrompt({
      category: CAT,
      name: NAME,
      intent: "JWT auth + session rotation",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Output contract delimiters present
    expect(r.data.prompt).toContain("---START-IDENTITY---");
    // Write targets include spec fields and Identity
    const targets = r.data.writeTargets.map((t) => t.section);
    expect(targets.some((t) => t.includes("Identity"))).toBe(true);
  });

  it("[author step]: writes plausible content to SKILL.md", async () => {
    // This step stands in for Claude executing the brainstorm prompt.
    const skillMdPath = nodePath.join(TFC_SKILLS, CAT, NAME, "SKILL.md");
    const writeR = await writeText(skillMdPath, AUTHORED_SKILL_MD);
    expect(writeR.ok).toBe(true);

    // Also patch spec.yaml: correct id + empty required_sections
    const { readYaml, writeYaml } = await import("../../src/core/yamlio.js");
    const specPath = nodePath.join(TFC_SKILLS, CAT, NAME, "spec.yaml");
    const specR = await readYaml(specPath);
    expect(specR.ok).toBe(true);
    if (!specR.ok) return;
    const patched = { ...specR.data as object, id: NAME, required_sections: [] };
    const patchWrite = await writeYaml(specPath, patched);
    expect(patchWrite.ok).toBe(true);
  });

  it("tfc_validate: all blocking gates pass after authoring", async () => {
    const r = await validateSkill({ category: CAT, name: NAME });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.passed).toBe(true);
    const failedBlocking = r.data.blocking.filter((g) => !g.passed);
    expect(failedBlocking).toHaveLength(0);
  });

  it("tfc_score: rises above un-authored baseline", async () => {
    const r = await scoreSkill({ category: CAT, name: NAME });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Template baseline ~0; authored skill should score > 40
    expect(r.data.score).toBeGreaterThan(40);
    expect(r.data.breakdown["identity"]).toBeGreaterThan(0);
    expect(r.data.breakdown["patterns"]).toBeGreaterThan(0);
    expect(r.data.breakdown["antiPatterns"]).toBeGreaterThan(0);
  });

  it("tfc_install: creates both symlinks and marks validated=true", async () => {
    const r = await installSkill({ category: CAT, name: NAME, dryRun: false });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.claudeLink).toBe("created");
    expect(r.data.spawnerLink).toBe("created");
    expect(r.data.validated).toBe(true);

    // Verify real symlinks on disk
    const claudeTarget = nodePath.join(TFC_SKILLS, CAT, NAME, "SKILL.md");
    const spawnTarget = nodePath.join(TFC_SKILLS, CAT, NAME);
    expect(
      await fsPromises.readlink(nodePath.join(CLAUDE_SKILLS, NAME, "SKILL.md")),
    ).toBe(claudeTarget);
    expect(
      await fsPromises.readlink(nodePath.join(SPAWNER_SKILLS, CAT, `${NAME}-tfc`)),
    ).toBe(spawnTarget);
  });

  it("tfc_list: skill appears as healthy in list output", async () => {
    const r = await listSkills({ brokenOnly: false });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const entry = r.data.skills.find((s) => s.category === CAT && s.name === NAME);
    expect(entry).toBeDefined();
    expect(entry?.claudeLinkState).toBe("ok");
    expect(entry?.spawnerLinkState).toBe("ok");
  });

  it("tfc_list --broken-only: healthy skill does NOT appear", async () => {
    const r = await listSkills({ brokenOnly: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const entry = r.data.skills.find((s) => s.category === CAT && s.name === NAME);
    expect(entry).toBeUndefined();
  });
});

// ── Migrate chain ─────────────────────────────────────────────────────────────

describe("e2e lifecycle — migrate spawner fixture", () => {
  it("densityBaseline matches fixture (3 patterns, 2 anti_patterns)", async () => {
    const r = await migrateSkill({
      sourcePath: SPAWNER_FIXTURE,
      sourceType: "spawner",
      category: "e2e-migrate-spawner",
      name: "spawner-migrated",
      dryRun: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.densityBaseline.patterns).toBe(3);
    expect(r.data.densityBaseline.antiPatterns).toBe(2);
  });

  it("source file is byte-identical after migrate (read-only proof)", async () => {
    const before = await fsPromises.readFile(SPAWNER_FIXTURE, "utf8");
    await migrateSkill({
      sourcePath: SPAWNER_FIXTURE,
      sourceType: "spawner",
      category: "e2e-migrate-spawner",
      name: "spawner-migrated-rw",
      dryRun: false,
    });
    const after = await fsPromises.readFile(SPAWNER_FIXTURE, "utf8");
    expect(after).toBe(before);
  });
});

describe("e2e lifecycle — migrate gstack fixture", () => {
  it("densityBaseline counts named patterns from gstack SKILL.md", async () => {
    const r = await migrateSkill({
      sourcePath: GSTACK_FIXTURE,
      sourceType: "gstack",
      category: "e2e-migrate-gstack",
      name: "gstack-migrated",
      dryRun: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.densityBaseline.patterns).toBe(1);
    expect(r.data.densityBaseline.antiPatterns).toBe(1);
  });

  it("source file is byte-identical after migrate (read-only proof)", async () => {
    const before = await fsPromises.readFile(GSTACK_FIXTURE, "utf8");
    await migrateSkill({
      sourcePath: GSTACK_FIXTURE,
      sourceType: "gstack",
      category: "e2e-migrate-gstack",
      name: "gstack-migrated-rw",
      dryRun: false,
    });
    const after = await fsPromises.readFile(GSTACK_FIXTURE, "utf8");
    expect(after).toBe(before);
  });
});

// ── No-API-key invariant ──────────────────────────────────────────────────────

describe("no-API-key invariant", () => {
  it("built bundle (or src/) contains no fetch/anthropic/openai references", () => {
    const srcDir = nodePath.join(
      nodePath.dirname(new URL(import.meta.url).pathname),
      "../../src",
    );
    // grep exits 1 if nothing found — that's the success case
    let found = false;
    try {
      execSync(`grep -r --include="*.ts" "fetch(\\|anthropic\\|openai" "${srcDir}"`, {
        stdio: "pipe",
      });
      found = true;
    } catch {
      found = false;
    }
    expect(found).toBe(false);
  });
});
