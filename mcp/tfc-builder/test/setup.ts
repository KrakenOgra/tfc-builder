/**
 * vitest globalSetup — runs once in the MAIN process before any worker forks.
 *
 * Creates an isolated tmp HOME for the entire test suite, copies the real
 * _template into it, then sets TFC_ROOT / CLAUDE_SKILLS_DIR / SPAWNER_SKILLS_DIR
 * env vars.  Worker processes inherit these env vars at fork time, so
 * src/core/paths.ts evaluates against the tmp HOME instead of the real one.
 *
 * Safety guarantee: no test can write to the real ~/.future-code, ~/.claude,
 * or ~/.spawner because those paths are never computed during the test run.
 */

import * as fs from "node:fs";
import * as nodePath from "node:path";
import * as os from "node:os";
import { fileURLToPath } from "node:url";

let tmpHome = "";

export async function setup(): Promise<void> {
  tmpHome = fs.mkdtempSync(nodePath.join(os.tmpdir(), "tfc-test-"));

  // Derived from the repo root — never depends on ~/.future-code existing
  const realTemplate = nodePath.resolve(
    nodePath.dirname(fileURLToPath(import.meta.url)),
    "../../..",
    "skills",
    "_template",
  );
  const tmpSkills = nodePath.join(tmpHome, ".future-code", "skills");

  // Create directory skeleton
  fs.mkdirSync(tmpSkills, { recursive: true });
  fs.mkdirSync(nodePath.join(tmpHome, ".claude", "skills"), { recursive: true });
  fs.mkdirSync(nodePath.join(tmpHome, ".spawner", "skills"), { recursive: true });

  // Copy the real _template so scaffold / validate can find it
  fs.cpSync(realTemplate, nodePath.join(tmpSkills, "_template"), {
    recursive: true,
  });

  // Redirect paths.ts roots
  process.env["TFC_ROOT"] = nodePath.join(tmpHome, ".future-code");
  process.env["CLAUDE_SKILLS_DIR"] = nodePath.join(tmpHome, ".claude", "skills");
  process.env["SPAWNER_SKILLS_DIR"] = nodePath.join(tmpHome, ".spawner", "skills");
}

export async function teardown(): Promise<void> {
  if (tmpHome) {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
  delete process.env["TFC_ROOT"];
  delete process.env["CLAUDE_SKILLS_DIR"];
  delete process.env["SPAWNER_SKILLS_DIR"];
}
