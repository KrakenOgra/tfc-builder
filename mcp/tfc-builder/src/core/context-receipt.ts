// src/core/context-receipt.ts
// Context Foundry W-A (RECEIPT-EARNED MANIFEST) — the relocated write-only crux.
//
// CCE v2 closed the file-level write-only crack (context-retrieve reads bodies, context-depth
// fails-closed on stubs, context-coverage scores answered/declared). But coverage divides by
// `declaredAngles` — an AUTHOR-asserted manifest. That is last_verified one level up: the corpus
// is graded against the author's own claim of completeness, never against a real build.
//
// This module makes the manifest receipt-EARNED. A section receipt records that
// context-retrieve.get returned an angle's file for a task AND the build that used it passed.
// An angle is `required` only after >= minReceipts passing receipts; otherwise it is `provisional`.
// promoteAngles is the read side; recordSectionReceipt is the append side.
//
// INV-4 (online determinism): NO model, NO network, NO Math.random. The clock lives at the tool
// boundary (handlers pass `ts`); this core is deterministic given its inputs. Receipts persist as
// JSONL at <skill>/context/_receipts.jsonl — append-only, parsed line by line, bad lines skipped.

import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { exists, readText, writeText } from "./fs.js";
import { findSkillDir } from "./context.js";
import { loadAngleManifest } from "./context-discover.js";

const RECEIPTS_FILE = "_receipts.jsonl";
const DEFAULT_MIN_RECEIPTS = 1;

// ── Shapes ────────────────────────────────────────────────────────────────────

export interface SectionReceipt {
  file: string; // the context/<file>.md the build retrieved
  task: string; // the task string passed to context-retrieve.get
  passed: boolean; // did the build that used this section pass?
  ts: string; // ISO timestamp — injected at the tool boundary (INV-7)
}

export interface AnglePromotion {
  file: string;
  receiptsTotal: number;
  receiptsPass: number;
  earned: boolean; // receiptsPass >= minReceipts
  lane: "required" | "provisional"; // required iff earned
}

export interface PromotionVerdict {
  skill: string;
  domain: string;
  minReceipts: number;
  declaredAngles: number;
  earnedAngles: number; // # angles promoted by real passing receipts
  angles: AnglePromotion[];
  // Coverage is honest only over earned angles: an unearned angle cannot count toward `required`.
  earnedCoverage: number; // earnedAngles / declaredAngles (0 when none declared)
}

// ── Parse (deterministic, fails-soft per line) ──────────────────────────────────

export function parseReceipts(text: string): SectionReceipt[] {
  const out: SectionReceipt[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.length === 0) continue;
    try {
      const o = JSON.parse(line) as Partial<SectionReceipt>;
      if (
        typeof o.file === "string" &&
        typeof o.task === "string" &&
        typeof o.passed === "boolean" &&
        typeof o.ts === "string"
      ) {
        out.push({ file: o.file, task: o.task, passed: o.passed, ts: o.ts });
      }
    } catch {
      // skip malformed line — append-only ledgers tolerate partial corruption
    }
  }
  return out;
}

export async function loadSectionReceipts(contextDir: string): Promise<SectionReceipt[]> {
  const p = nodePath.join(contextDir, RECEIPTS_FILE);
  if (!(await exists(p))) return [];
  const r = await readText(p);
  if (!r.ok) return [];
  return parseReceipts(r.data);
}

// ── Append side ─────────────────────────────────────────────────────────────────

export async function recordSectionReceipt(input: {
  name: string;
  file: string;
  task: string;
  passed: boolean;
  ts: string; // boundary-injected clock (INV-7)
}): Promise<Result<{ path: string; total: number }>> {
  const dir = await findSkillDir(input.name);
  if (!dir) return fail("NOT_FOUND", `Skill not found by name: ${input.name}`);
  const contextDir = nodePath.join(dir, "context");
  const p = nodePath.join(contextDir, RECEIPTS_FILE);

  const existing = (await exists(p)) ? (await readText(p)) : ok("");
  const prior = existing.ok ? existing.data : "";

  const receipt: SectionReceipt = {
    file: input.file,
    task: input.task,
    passed: input.passed,
    ts: input.ts,
  };
  const next = `${prior.replace(/\s*$/, "")}${prior.trim() ? "\n" : ""}${JSON.stringify(receipt)}\n`;
  const w = await writeText(p, next);
  if (!w.ok) return fail(w.error.code, w.error.message);

  const total = parseReceipts(next).length;
  return ok({ path: p, total });
}

// ── Read side — promotion ────────────────────────────────────────────────────────

export async function promoteAngles(input: {
  name: string;
  minReceipts?: number;
}): Promise<Result<PromotionVerdict>> {
  const minReceipts = input.minReceipts ?? DEFAULT_MIN_RECEIPTS;
  const dir = await findSkillDir(input.name);
  if (!dir) return fail("NOT_FOUND", `Skill not found by name: ${input.name}`);
  const skill = nodePath.basename(dir);
  const contextDir = nodePath.join(dir, "context");

  const manifest = await loadAngleManifest(contextDir);
  if (!manifest) {
    return fail(
      "NOT_FOUND",
      `No context/_angles.yaml manifest for ${skill}`,
      "Author a manifest (domain + angles[]) so angles can be receipt-promoted",
    );
  }

  const receipts = await loadSectionReceipts(contextDir);
  const passByFile = new Map<string, number>();
  const totalByFile = new Map<string, number>();
  for (const r of receipts) {
    totalByFile.set(r.file, (totalByFile.get(r.file) ?? 0) + 1);
    if (r.passed) passByFile.set(r.file, (passByFile.get(r.file) ?? 0) + 1);
  }

  const angles: AnglePromotion[] = manifest.angles.map((a) => {
    const receiptsPass = passByFile.get(a.file) ?? 0;
    const earned = receiptsPass >= minReceipts;
    return {
      file: a.file,
      receiptsTotal: totalByFile.get(a.file) ?? 0,
      receiptsPass,
      earned,
      lane: earned ? "required" : "provisional",
    };
  });

  const declaredAngles = angles.length;
  const earnedAngles = angles.filter((a) => a.earned).length;
  const earnedCoverage = declaredAngles === 0 ? 0 : earnedAngles / declaredAngles;

  return ok({
    skill,
    domain: manifest.domain,
    minReceipts,
    declaredAngles,
    earnedAngles,
    angles,
    earnedCoverage,
  });
}
