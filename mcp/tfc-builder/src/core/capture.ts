// Wave 1 (v3, W-V1): wire + verify CONTINUOUS learnings capture.
//
// The v2 loop's input side is effectively dead: runs.jsonl is absent and 6/7 skills have an
// empty learnings.jsonl. The runtime hook (runtime/preamble.sh) already records a run row and
// exposes `tfc_learn` — but it is only present in the 3 skills that were ever installed/eval'd.
// This module makes the hook present in EVERY skill (wireCapture) and reports which skills have
// never actually run (auditCapture), so `learnings.jsonl` grows because skills RUN — never
// because a builder seeded it.
//
// INV-8 (HARD LINE): this module NEVER writes a learnings.jsonl line. It wires the PATH (the
// SKILL.md hook block) and reads counts. Empty stays empty — the dead-loop truth must show.
// INV-1: no API. INV-2: Result<T> + skillDir/safeJoin everywhere.

import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { exists, readText, writeText } from "./fs.js";
import { listSkills } from "./install.js";
import { skillDir, TFC_HOME } from "./paths.js";
import { injectPreambleHook, PREAMBLE_HOOK_START } from "./preamble.js";

// runs.jsonl as written by runtime/preamble.sh: {"ts","skill":"cat/name","event":"invoked"}.
// One shared append-only telemetry file under analytics/ (NOT a per-skill store — INV-6).
const ANALYTICS_DIR = nodePath.join(TFC_HOME, "analytics");
const RUNS_PATH = nodePath.join(ANALYTICS_DIR, "runs.jsonl");

interface RunRowShape {
  skill?: unknown;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WireCaptureEntry {
  skill: string;
  /** the hook block was missing/stale and was (re)written into SKILL.md */
  injected: boolean;
  /** absolute path of the SKILL.md that carries the managed hook block */
  hookPath: string;
}

export interface WireCaptureResult {
  wired: WireCaptureEntry[];
  dryRun: boolean;
}

export interface CaptureAuditEntry {
  skill: string;
  /** non-empty lines in the skill's learnings.jsonl */
  learningsCount: number;
  /** rows in analytics/runs.jsonl whose `skill` is this skill */
  runsCount: number;
  /** the SKILL.md carries the preamble hook block */
  hookWired: boolean;
  /** empty learnings.jsonl AND zero runs rows — the loop has never run for this skill */
  neverInvoked: boolean;
}

export interface CaptureAuditResult {
  skills: CaptureAuditEntry[];
  /** how many skills are wired (hook present) but have never been invoked */
  wiredButNeverInvoked: number;
}

// ── Shared readers (read-only; honest about absence) ───────────────────────────

/** Count runs.jsonl rows per "category/name". Absent file ⇒ empty map (honest zero). */
export async function loadRunCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const txtR = await readText(RUNS_PATH);
  if (!txtR.ok) return counts; // NOT_FOUND ⇒ no runs yet; that is the truth, not an error
  for (const line of txtR.data.split("\n")) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as RunRowShape;
      if (typeof row.skill === "string") {
        counts.set(row.skill, (counts.get(row.skill) ?? 0) + 1);
      }
    } catch {
      // a malformed telemetry row never counts — append-only files tolerate junk lines
    }
  }
  return counts;
}

async function countLearnings(dir: string): Promise<number> {
  const p = nodePath.join(dir, "learnings.jsonl");
  const txtR = await readText(p);
  if (!txtR.ok) return 0;
  let n = 0;
  for (const line of txtR.data.split("\n")) if (line.trim()) n++;
  return n;
}

async function hookPresent(dir: string): Promise<boolean> {
  const p = nodePath.join(dir, "SKILL.md");
  const txtR = await readText(p);
  if (!txtR.ok) return false;
  return txtR.data.includes(PREAMBLE_HOOK_START);
}

// ── auditCapture — read-only portfolio view of the loop's input side ───────────

export async function auditCapture(): Promise<Result<CaptureAuditResult>> {
  const listR = await listSkills({ brokenOnly: false });
  if (!listR.ok) return listR;

  const runCounts = await loadRunCounts();
  const skills: CaptureAuditEntry[] = [];

  for (const s of listR.data.skills) {
    const key = `${s.category}/${s.name}`;
    const learningsCount = await countLearnings(s.dir);
    const runsCount = runCounts.get(key) ?? 0;
    const hookWired = await hookPresent(s.dir);
    skills.push({
      skill: key,
      learningsCount,
      runsCount,
      hookWired,
      neverInvoked: learningsCount === 0 && runsCount === 0,
    });
  }

  skills.sort((a, b) => a.skill.localeCompare(b.skill));
  const wiredButNeverInvoked = skills.filter(
    (s) => s.hookWired && s.neverInvoked,
  ).length;
  return ok({ skills, wiredButNeverInvoked });
}

// ── wireCapture — ensure the hook block is in SKILL.md (never writes a learning) ─

async function wireOne(
  category: string,
  name: string,
  dryRun: boolean,
): Promise<Result<WireCaptureEntry>> {
  const dirR = skillDir(category, name);
  if (!dirR.ok) return fail("BAD_INPUT", dirR.error.message);
  const skillMd = nodePath.join(dirR.path, "SKILL.md");
  if (!(await exists(skillMd)))
    return fail("NOT_FOUND", `no SKILL.md for ${category}/${name}`);

  const mdR = await readText(skillMd);
  if (!mdR.ok) return fail(mdR.error.code, mdR.error.message);

  const injected = injectPreambleHook(mdR.data, category, name);
  if (injected.changed && !dryRun) {
    const wR = await writeText(skillMd, injected.text);
    if (!wR.ok) return fail(wR.error.code, wR.error.message);
  }
  return ok({
    skill: `${category}/${name}`,
    injected: injected.changed,
    hookPath: skillMd,
  });
}

/**
 * Ensure the runtime capture hook is present in a skill's SKILL.md.
 * - both category & name → wire that one skill
 * - neither             → wire every installed skill (bulk repair)
 * Idempotent (a present, current hook reports injected:false). NEVER touches learnings.jsonl.
 */
export async function wireCapture(input: {
  category?: string;
  name?: string;
  dryRun?: boolean;
}): Promise<Result<WireCaptureResult>> {
  const dryRun = input.dryRun ?? false;

  if (input.category && input.name) {
    const oneR = await wireOne(input.category, input.name, dryRun);
    if (!oneR.ok) return oneR;
    return ok({ wired: [oneR.data], dryRun });
  }
  if (input.category || input.name) {
    return fail(
      "BAD_INPUT",
      "provide BOTH category and name to wire one skill, or NEITHER to wire all",
    );
  }

  const listR = await listSkills({ brokenOnly: false });
  if (!listR.ok) return listR;
  const wired: WireCaptureEntry[] = [];
  for (const s of listR.data.skills) {
    const oneR = await wireOne(s.category, s.name, dryRun);
    if (!oneR.ok) return oneR;
    wired.push(oneR.data);
  }
  wired.sort((a, b) => a.skill.localeCompare(b.skill));
  return ok({ wired, dryRun });
}
