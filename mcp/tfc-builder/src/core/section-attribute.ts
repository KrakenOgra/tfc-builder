import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { fail, ok, type Result } from "./result.js";
import { readText, exists } from "./fs.js";
import { skillDir } from "./paths.js";

/**
 * TFC 1000x — Wave 1: section-level execution attribution (Path A).
 *
 * The REASON plan assumed a transcript sink to match SKILL.md headers against.
 * GROUND FINDING: no transcript is stored anywhere — learnings.jsonl holds DERIVED
 * insights only ({ts, skill, type, key, insight, ...}). But those insights NAME the
 * section they came from ("REFLECT declaring stable on iter1 ..." -> ## ... REFLECT).
 * So we attribute section credit from the learnings we already have: 0 API calls,
 * 0 transcripts, 0 new sink format, fully retroactive on every existing skill (INV-1).
 */

export interface SectionCredit {
  /** slug of the header — stable id across runs */
  id: string;
  /** raw header text (without the leading ##) */
  header: string;
  /** did the learnings reference this section above threshold this run */
  credited: boolean;
  /** 0..1 — fraction of the section's DISTINCTIVE keywords found in the learnings */
  confidence: number;
}

export interface SectionReceipt {
  ts: string;
  run_id: string;
  /** category/name */
  domain: string;
  /** Path A substrate marker — credit derived from learnings.jsonl, not a transcript */
  source: "learnings";
  sections_credited: SectionCredit[];
}

interface LearningRow {
  key?: string;
  insight?: string;
}

const HEADER_RE = /^#{2,3}\s+(.+?)\s*$/;
// The managed runtime-hook block is generated boilerplate, never an authored section.
const IGNORE_HEADERS = ["tfc runtime hook"];
const STOP = new Set([
  "the", "and", "for", "run", "first", "with", "via", "per", "this", "that",
  "step", "phase", "wave", "part", "section", "your", "you", "are",
]);

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Distinctive-ish tokens of a header (drops generic scaffolding words + stopwords). */
export function headerKeywords(header: string): string[] {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/** Parse `## ` / `### ` headers from a SKILL.md into ordered, de-duped sections. */
export function extractSections(skillMd: string): { id: string; header: string }[] {
  const out: { id: string; header: string }[] = [];
  const seen = new Set<string>();
  for (const line of skillMd.split("\n")) {
    const m = HEADER_RE.exec(line);
    if (!m) continue;
    const header = (m[1] ?? "").trim();
    if (!header) continue;
    if (IGNORE_HEADERS.some((h) => header.toLowerCase().startsWith(h))) continue;
    const id = slug(header);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, header });
  }
  return out;
}

/**
 * Credit each section from a set of learning texts. A section is credited when its
 * DISTINCTIVE keywords (those unique to its header among the skill's sections) appear
 * in the learnings — so "Phase 6 -- REFLECT" is credited by the word "reflect" even
 * though the generic "phase" appears in many headers. Pure string work, 0 API calls.
 */
export function attributeSections(
  sections: { id: string; header: string }[],
  texts: string[],
): SectionCredit[] {
  const secKws = sections.map((s) => headerKeywords(s.header));
  const df = new Map<string, number>();
  for (const kws of secKws) {
    for (const k of new Set(kws)) df.set(k, (df.get(k) ?? 0) + 1);
  }
  const blob = texts.map((t) => t.toLowerCase()).join("\n");
  return sections.map((s, i) => {
    const kws = secKws[i] ?? [];
    if (kws.length === 0) {
      return { id: s.id, header: s.header, credited: false, confidence: 0 };
    }
    const distinctive = kws.filter((k) => (df.get(k) ?? 0) === 1);
    const pool = distinctive.length > 0 ? distinctive : kws;
    const hits = pool.filter((k) => blob.includes(k)).length;
    const confidence = round2(hits / pool.length);
    return { id: s.id, header: s.header, credited: confidence >= 0.5, confidence };
  });
}

async function readLearnings(p: string): Promise<LearningRow[]> {
  if (!(await exists(p))) return [];
  const txt = await readText(p);
  if (!txt.ok) return [];
  const out: LearningRow[] = [];
  for (const line of txt.data.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      out.push(JSON.parse(t) as LearningRow);
    } catch {
      /* skip malformed row — never throws on a dirty sink */
    }
  }
  return out;
}

async function appendLine(p: string, line: string): Promise<Result<undefined>> {
  try {
    await fsPromises.appendFile(p, `${line}\n`, "utf-8");
    return ok(undefined);
  } catch (e) {
    return fail("WRITE_ERROR", `Failed to append ${p}: ${String(e)}`);
  }
}

export interface RunAttributionInput {
  category: string;
  name: string;
  ts: string;
  runId?: string;
}

/**
 * Run attribution for one skill and APPEND a SectionReceipt to section-receipts.jsonl
 * (a 5th, additive file next to learnings.jsonl — INV-2, the 4-file format is untouched).
 */
export async function runAttribution(
  args: RunAttributionInput,
): Promise<Result<SectionReceipt>> {
  const dirR = skillDir(args.category, args.name);
  if (!dirR.ok) return fail(dirR.error.code, dirR.error.message);
  const dir = dirR.path;

  const skillMd = await readText(nodePath.join(dir, "SKILL.md"));
  if (!skillMd.ok) return skillMd;

  const sections = extractSections(skillMd.data);
  if (sections.length === 0) {
    return fail("NO_SECTIONS", `SKILL.md for ${args.category}/${args.name} has no ## headers`);
  }

  const learnings = await readLearnings(nodePath.join(dir, "learnings.jsonl"));
  const texts = learnings.map((l) => `${l.key ?? ""} ${l.insight ?? ""}`);
  const credits = attributeSections(sections, texts);

  const receipt: SectionReceipt = {
    ts: args.ts,
    run_id: args.runId ?? `attr-${args.ts}`,
    domain: `${args.category}/${args.name}`,
    source: "learnings",
    sections_credited: credits,
  };

  const sink = nodePath.join(dir, "section-receipts.jsonl");
  const appended = await appendLine(sink, JSON.stringify(receipt));
  if (!appended.ok) return appended;

  return ok(receipt);
}
