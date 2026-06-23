// src/core/context.ts
// v4 Wave 1 — the portable context layer.
//
// A skill carries its domain knowledge in-repo (context/<file>.md) instead of re-deriving it
// per run or reading a machine-specific absolute path (the reel-forge retrieval-map.yaml fossil).
// All three tools are MODEL-FREE (INV-3): they scaffold empty stubs, audit presence/staleness,
// and re-stamp freshness. A HUMAN fills the knowledge — tfc_context only writes section headers
// plus a fill_hint. Clock access lives at the tool boundary (handlers); this core stays
// deterministic given its inputs (today / asOfMs), mirroring core/decay.ts (INV-7 posture).

import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import {
  exists,
  readText,
  writeText,
  ensureDir,
  listDirs,
  listFiles,
} from "./fs.js";
import { readYaml } from "./yamlio.js";
import { TFC_SKILLS, TFC_CONTEXT_TAXONOMY } from "./paths.js";
import type { SpecYaml } from "./types.js";
import { scoreDepthOf } from "./context-depth.js";

// ── Taxonomy types ──────────────────────────────────────────────────────────

export interface TaxonomyFile {
  name: string;
  sections: string[];
  description?: string;
  fill_hint: string;
}

interface TaxonomyDomain {
  required_files: TaxonomyFile[];
}

export interface ContextTaxonomy {
  version: string;
  domains: Record<string, TaxonomyDomain>;
}

async function loadTaxonomy(): Promise<Result<ContextTaxonomy>> {
  if (!(await exists(TFC_CONTEXT_TAXONOMY))) {
    return fail(
      "NOT_FOUND",
      `context-taxonomy.yaml not found at ${TFC_CONTEXT_TAXONOMY}`,
      "Copy context-taxonomy.yaml to the TFC home root (v4 W1)",
    );
  }
  const r = await readYaml<ContextTaxonomy>(TFC_CONTEXT_TAXONOMY);
  if (!r.ok) return r;
  if (!r.data || typeof r.data.domains !== "object") {
    return fail("PARSE_ERROR", "context-taxonomy.yaml: missing 'domains' map");
  }
  return ok(r.data);
}

// Skills live at TFC_SKILLS/<fs-category>/<name>; the taxonomy "domain" (e.g. content/social)
// is a SEPARATE axis from the filesystem category (e.g. pattern). So resolve the skill dir by
// NAME across categories, never by joining the domain.
export async function findSkillDir(name: string): Promise<string | null> {
  const catsR = await listDirs(TFC_SKILLS);
  if (!catsR.ok) return null;
  for (const cat of catsR.data) {
    if (cat.startsWith("_")) continue; // _template, _fragments
    const candidate = nodePath.join(TFC_SKILLS, cat, name);
    if (await exists(candidate)) return candidate;
  }
  return null;
}

function stubContent(file: TaxonomyFile, today: string): string {
  const body = file.sections.map((s) => `${s}\n`).join("\n");
  // DV2 provenance (Foundry W-B): source_basis/synthesized/freshness_clock/confidence ride alongside
  // last_verified. synthesized defaults false (human-filled) so the synthesis-earned gate is a no-op
  // until an author opts into synthesized:true and must then name a source_basis. Empty source_basis/
  // confidence are author-fill slots, mirroring fill_hint — never auto-populated (INV-3 model-free).
  return (
    `---\n` +
    `last_verified: ${today}\n` +
    `freshness_clock: ${today}\n` +
    `synthesized: false\n` +
    `source_basis: ""\n` +
    `confidence: ""\n` +
    `fill_hint: ${JSON.stringify(file.fill_hint)}\n` +
    `---\n\n${body}`
  );
}

function parseLastVerified(content: string): number | null {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (!m?.[1]) return null;
  const lv = /^last_verified:\s*(.+)$/m.exec(m[1]);
  if (!lv?.[1]) return null;
  const raw = lv[1].trim().replace(/^["']|["']$/g, "");
  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? null : ms;
}

// ── tfc_context — scaffold stubs ────────────────────────────────────────────

export interface ContextStubResult {
  dir: string;
  created: string[];
  skipped: string[];
  dryRun: boolean;
}

export async function tfcContext(input: {
  category: string; // taxonomy DOMAIN key (e.g. content/social)
  name: string;
  today: string; // YYYY-MM-DD, injected at the boundary (INV-7: core stays clock-free)
  files?: string[];
  dryRun?: boolean;
  dirOverride?: string; // scaffold passes the freshly-created skill dir
}): Promise<Result<ContextStubResult>> {
  const taxR = await loadTaxonomy();
  if (!taxR.ok) return taxR;

  const domain = taxR.data.domains[input.category];
  if (!domain) {
    const known = Object.keys(taxR.data.domains).join(", ");
    return fail(
      "BAD_INPUT",
      `Unknown context domain: ${input.category}`,
      `Known domains: ${known}`,
    );
  }

  let selected = domain.required_files ?? [];
  if (input.files && input.files.length > 0) {
    const wanted = new Set(input.files);
    selected = selected.filter((f) => wanted.has(f.name));
    if (selected.length === 0) {
      return fail(
        "BAD_INPUT",
        `None of the requested files exist in domain ${input.category}`,
        `Available: ${(domain.required_files ?? []).map((f) => f.name).join(", ")}`,
      );
    }
  }

  const dir = input.dirOverride ?? (await findSkillDir(input.name));
  if (!dir) {
    return fail(
      "NOT_FOUND",
      `Skill not found by name: ${input.name}`,
      "Run tfc_new first, or check the skill name",
    );
  }

  const contextDir = nodePath.join(dir, "context");
  const created: string[] = [];
  const skipped: string[] = [];

  if (input.dryRun) {
    for (const f of selected) created.push(nodePath.join(contextDir, f.name));
    return ok({ dir: contextDir, created, skipped, dryRun: true });
  }

  const mk = await ensureDir(contextDir);
  if (!mk.ok) return mk;

  for (const f of selected) {
    const p = nodePath.join(contextDir, f.name);
    if (await exists(p)) {
      skipped.push(p); // never clobber a filled stub
      continue;
    }
    const w = await writeText(p, stubContent(f, input.today));
    if (!w.ok) return w;
    created.push(p);
  }

  return ok({ dir: contextDir, created, skipped, dryRun: false });
}

// Called by core/scaffold.ts when tfc_new --with-context fires. Returns null (a no-op) when no
// taxonomy exists yet or the skill's fs category is not a taxonomy domain — scaffolding a new
// skill must never fail just because its category has no curated context block.
export async function scaffoldContextIfRecognized(input: {
  dir: string;
  category: string;
  name: string;
  today: string;
}): Promise<Result<ContextStubResult | null>> {
  const taxR = await loadTaxonomy();
  if (!taxR.ok) return ok(null);
  if (!taxR.data.domains[input.category]) return ok(null);
  const r = await tfcContext({
    category: input.category,
    name: input.name,
    today: input.today,
    dirOverride: input.dir,
  });
  if (!r.ok) return r;
  return ok(r.data);
}

// ── tfc_context_audit — fleet scan ──────────────────────────────────────────

export interface ContextAuditEntry {
  skill: string; // category/name
  missing: string[];
  stale: string[];
  undeclared: string[]; // context/*.md present but not declared in requires_context
  // CCE v2 W2 (V3): present + declared files that fail the depth bar (empty/unsourced/thin).
  // A frontmatter-only stub now reports here instead of passing silently.
  shallow: { file: string; reasons: string[] }[];
}

export async function auditContext(input: {
  asOfMs: number; // boundary-injected (Date.now at handler); core compares deterministically
  staleDays?: number;
}): Promise<Result<ContextAuditEntry[]>> {
  const staleMs = (input.staleDays ?? 90) * 24 * 60 * 60 * 1000;
  const catsR = await listDirs(TFC_SKILLS);
  if (!catsR.ok) return catsR;

  const out: ContextAuditEntry[] = [];
  for (const cat of catsR.data) {
    if (cat.startsWith("_")) continue;
    const skillsR = await listDirs(nodePath.join(TFC_SKILLS, cat));
    if (!skillsR.ok) continue;

    for (const name of skillsR.data) {
      const dir = nodePath.join(TFC_SKILLS, cat, name);
      const specPath = nodePath.join(dir, "spec.yaml");
      if (!(await exists(specPath))) continue;
      const specR = await readYaml<SpecYaml>(specPath);
      if (!specR.ok) continue;

      const required = specR.data.requires_context ?? [];
      const contextDir = nodePath.join(dir, "context");
      const missing: string[] = [];
      const stale: string[] = [];
      const undeclared: string[] = [];
      const shallow: { file: string; reasons: string[] }[] = [];

      for (const f of required) {
        const rr = await readText(nodePath.join(contextDir, f));
        if (!rr.ok) {
          missing.push(f);
          continue;
        }
        const lv = parseLastVerified(rr.data);
        if (lv !== null && input.asOfMs - lv > staleMs) stale.push(f);
        // V3: recency is not health — a present, fresh-stamped file still fails if it is empty,
        // unsourced, or too thin. fails-closed via the depth bar.
        const depth = scoreDepthOf(f, rr.data);
        if (!depth.deep) shallow.push({ file: f, reasons: depth.reasons });
      }

      if (await exists(contextDir)) {
        const filesR = await listFiles(contextDir);
        if (filesR.ok) {
          for (const fname of filesR.data) {
            if (fname.endsWith(".md") && !required.includes(fname)) {
              undeclared.push(fname);
            }
          }
        }
      }

      if (missing.length || stale.length || undeclared.length || shallow.length) {
        out.push({ skill: `${cat}/${name}`, missing, stale, undeclared, shallow });
      }
    }
  }
  return ok(out);
}

// ── tfc_context_update — re-stamp freshness ─────────────────────────────────

export async function updateContext(input: {
  name: string;
  file: string;
  today: string; // YYYY-MM-DD, injected at the boundary
  dirOverride?: string;
}): Promise<Result<{ path: string; last_verified: string }>> {
  const dir = input.dirOverride ?? (await findSkillDir(input.name));
  if (!dir) {
    return fail("NOT_FOUND", `Skill not found by name: ${input.name}`);
  }
  const p = nodePath.join(dir, "context", input.file);
  const r = await readText(p);
  if (!r.ok) return r;

  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(r.data);
  if (!m) {
    return fail(
      "BAD_FORMAT",
      `No frontmatter in ${p}`,
      "context stubs carry a last_verified frontmatter line",
    );
  }
  const content = /^last_verified:\s*.*$/m.test(m[1] ?? "")
    ? r.data.replace(/^last_verified:\s*.*$/m, `last_verified: ${input.today}`)
    : r.data.replace(/^---\r?\n/, `---\nlast_verified: ${input.today}\n`);

  const w = await writeText(p, content);
  if (!w.ok) return w;
  return ok({ path: p, last_verified: input.today });
}
