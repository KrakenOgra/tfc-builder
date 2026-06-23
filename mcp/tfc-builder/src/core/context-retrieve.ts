// src/core/context-retrieve.ts
// CCE v2 Wave 1 (V1 RETRIEVE-THE-BODY, V5 RANK-TO-TASK) — the deterministic ONLINE read path.
//
// get(skill, task) reads a skill's context/*.md bodies, ranks (file × section) against the task
// string, and assembles the top-K within a token budget — returning the BODY plus per-section
// `source:` provenance, not a list of paths (the v1 crux: compose returned {file,fromSkill} only).
//
// INV-4 (online determinism): NO model, NO network, NO clock, NO Math.random. Two identical
// requests return byte-identical output. Tie-breaks are lexical (file, header) so ordering is
// total and stable. An empty corpus returns an explicit { coverage: 0, healthy: false } verdict —
// never a silent [] (DELETE-LIST 14). Section parsing here is the single source reused by the
// W2 depth audit.

import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { exists, listFiles, readText } from "./fs.js";
import { findSkillDir } from "./context.js";

// ── Parsed shapes ────────────────────────────────────────────────────────────

export interface ParsedSection {
  header: string; // the "## Heading" text, heading only (no ##)
  body: string; // prose under the heading, source-line stripped, trimmed
  source: string | null; // per-section source, else file-level frontmatter source, else null
  isEmpty: boolean; // true when body has no non-whitespace content
}

export interface ParsedContextFile {
  file: string; // e.g. hooks.md
  frontmatterSource: string | null;
  sections: ParsedSection[];
}

export interface RetrievedSection {
  file: string;
  header: string;
  body: string;
  source: string | null;
  score: number;
}

export interface RetrieveResult {
  skill: string; // resolved skill dir name
  domain: string | null; // echoed; selects the angle manifest in W4/W5
  task: string;
  sections: RetrievedSection[]; // ranked, budget-bounded
  coverage: number; // non-empty sections / total declared sections, 0..1
  sectionsTotal: number;
  sectionsNonEmpty: number;
  tokensReturned: number;
  truncated: boolean; // true when the budget cut off lower-ranked sourced sections
  healthy: boolean; // coverage > 0 AND at least one returned section carries a source
}

const DEFAULT_TOKEN_BUDGET = 2000;
const DEFAULT_TOP_K = 8;

// ── Parsing (deterministic) ──────────────────────────────────────────────────

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const SECTION_SOURCE_LINE_RE = /^\s*source:\s*(.+?)\s*$/im;
const SECTION_SOURCE_COMMENT_RE = /<!--\s*source:\s*(.+?)\s*-->/i;

function frontmatterSourceOf(frontmatter: string): string | null {
  const m = /^source:\s*(.+)$/m.exec(frontmatter);
  return m?.[1] ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

// Estimate tokens deterministically (chars/4, the common rule of thumb). No tokenizer dependency.
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function parseContextFile(file: string, content: string): ParsedContextFile {
  const fm = FRONTMATTER_RE.exec(content);
  const frontmatterSource = fm?.[1] ? frontmatterSourceOf(fm[1]) : null;
  const bodyText = fm?.[2] ?? content;

  const sections: ParsedSection[] = [];
  const lines = bodyText.split(/\r?\n/);
  let header: string | null = null;
  let buf: string[] = [];

  const flush = (): void => {
    if (header === null) return;
    const raw = buf.join("\n");
    const commentSrc = SECTION_SOURCE_COMMENT_RE.exec(raw)?.[1]?.trim() ?? null;
    const lineSrc = SECTION_SOURCE_LINE_RE.exec(raw)?.[1]?.trim() ?? null;
    const body = raw
      .replace(SECTION_SOURCE_COMMENT_RE, "")
      .replace(SECTION_SOURCE_LINE_RE, "")
      .trim();
    sections.push({
      header,
      body,
      source: commentSrc ?? lineSrc ?? frontmatterSource,
      isEmpty: body.length === 0,
    });
  };

  for (const line of lines) {
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h?.[1]) {
      flush();
      header = h[1];
      buf = [];
    } else if (header !== null) {
      buf.push(line);
    }
  }
  flush();

  return { file, frontmatterSource, sections };
}

// ── Scoring (deterministic lexical relevance to the task) ─────────────────────

function taskTokens(task: string): string[] {
  const seen = new Set<string>();
  for (const w of task.toLowerCase().split(/[^a-z0-9]+/)) {
    if (w.length >= 3) seen.add(w);
  }
  return [...seen];
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    n += 1;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return n;
}

// Header hits weigh 3×, file-name hits 2×, body hits 1×. Empty bodies can still match on header,
// so they never crowd out a filled section unless the task literally targets only the heading word.
function scoreSection(
  file: string,
  section: ParsedSection,
  tokens: string[],
): number {
  const fileL = file.toLowerCase();
  const headerL = section.header.toLowerCase();
  const bodyL = section.body.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    score += countOccurrences(headerL, t) * 3;
    score += countOccurrences(fileL, t) * 2;
    score += countOccurrences(bodyL, t) * 1;
  }
  return score;
}

// ── get — the public read entry ──────────────────────────────────────────────

export async function getContext(input: {
  name: string;
  task: string;
  domain?: string;
  tokenBudget?: number;
  topK?: number;
}): Promise<Result<RetrieveResult>> {
  const dir = await findSkillDir(input.name);
  if (!dir) {
    return fail(
      "NOT_FOUND",
      `Skill not found by name: ${input.name}`,
      "Run tfc_new first, or check the skill name",
    );
  }

  const skill = nodePath.basename(dir);
  const domain = input.domain ?? null;
  const task = input.task;
  const budget = input.tokenBudget ?? DEFAULT_TOKEN_BUDGET;
  const topK = input.topK ?? DEFAULT_TOP_K;

  const empty: RetrieveResult = {
    skill,
    domain,
    task,
    sections: [],
    coverage: 0,
    sectionsTotal: 0,
    sectionsNonEmpty: 0,
    tokensReturned: 0,
    truncated: false,
    healthy: false,
  };

  const contextDir = nodePath.join(dir, "context");
  if (!(await exists(contextDir))) return ok(empty);

  const filesR = await listFiles(contextDir);
  if (!filesR.ok) return ok(empty);
  const mdFiles = filesR.data.filter((f) => f.endsWith(".md")).sort();
  if (mdFiles.length === 0) return ok(empty);

  const parsed: ParsedContextFile[] = [];
  for (const file of mdFiles) {
    const r = await readText(nodePath.join(contextDir, file));
    if (!r.ok) continue; // surface nothing fabricated; a missing read just contributes no sections
    parsed.push(parseContextFile(file, r.data));
  }

  // Flatten to scorable candidates with a stable lexical identity for tie-breaking.
  const tokens = taskTokens(task);
  type Candidate = RetrievedSection & { isEmpty: boolean };
  const candidates: Candidate[] = [];
  let sectionsTotal = 0;
  let sectionsNonEmpty = 0;
  for (const pf of parsed) {
    for (const s of pf.sections) {
      sectionsTotal += 1;
      if (!s.isEmpty) sectionsNonEmpty += 1;
      candidates.push({
        file: pf.file,
        header: s.header,
        body: s.body,
        source: s.source,
        score: scoreSection(pf.file, s, tokens),
        isEmpty: s.isEmpty,
      });
    }
  }

  if (sectionsTotal === 0) return ok(empty);

  // Rank: score desc, then non-empty before empty, then lexical (file, header) for total order.
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.isEmpty !== b.isEmpty) return a.isEmpty ? 1 : -1;
    if (a.file !== b.file) return a.file < b.file ? -1 : 1;
    return a.header < b.header ? -1 : a.header > b.header ? 1 : 0;
  });

  // Assemble top-K within the token budget. Always include the top candidate even if it alone
  // exceeds the budget (so a real body is never withheld); mark truncation when lower ranks drop.
  const picked: RetrievedSection[] = [];
  let tokensReturned = 0;
  let truncated = false;
  for (let i = 0; i < candidates.length && picked.length < topK; i++) {
    const c = candidates[i]!;
    const cost = estimateTokens(`${c.header}\n${c.body}`);
    if (picked.length > 0 && tokensReturned + cost > budget) {
      truncated = true;
      break;
    }
    picked.push({
      file: c.file,
      header: c.header,
      body: c.body,
      source: c.source,
      score: c.score,
    });
    tokensReturned += cost;
  }
  if (picked.length < candidates.length) truncated = true;

  const coverage = sectionsNonEmpty / sectionsTotal;
  const healthy = coverage > 0 && picked.some((p) => p.source !== null);

  return ok({
    skill,
    domain,
    task,
    sections: picked,
    coverage,
    sectionsTotal,
    sectionsNonEmpty,
    tokensReturned,
    truncated,
    healthy,
  });
}
