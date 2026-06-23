// src/core/context-forge.ts
// tfc_context_forge — derive a domain context/ scaffold FROM SKILL.md, for ANY domain.
//
// THE GAP IT FILLS (grounded in the live subsystem, not a stale premise):
//   - tfc_context (context.ts) scaffolds stubs, but ONLY for a hand-authored taxonomy domain.
//   - tfc_context_fill (context-fill.ts) emits a grounded OFFLINE prompt, but is taxonomy-GATED:
//     it fails "Unknown context domain" unless the skill maps to a curated context-taxonomy.yaml
//     domain OR already carries a hand-written context/_angles.yaml manifest.
//   - discover / coverage all key off that _angles.yaml manifest.
//   Nothing DERIVES the manifest from SKILL.md. So a skill on an arbitrary domain (football, pizza)
//   with no taxonomy entry is stuck: fill + coverage both dead-end.
//
// forge is the missing derivation front-door. It reads SKILL.md (the domain oracle, INV-2),
// derives domain_name + domain_primitives[] + an artifact plan, writes context/_angles.yaml plus
// DV2-frontmatter stubs (synthesized: true), and emits a primitive-injected, GROUNDED generation
// prompt that Claude executes OFFLINE (model-free core, INV-4 — exactly like context-fill). The
// existing discover -> fill -> coverage pipeline then operates on the freshly-unlocked domain.
//
// Model-free + clock-free core (INV-4 / INV-7): deterministic string extraction; the clock is
// injected at the handler boundary (today). Deposit WRITES the manifest + empty stubs (a writer,
// like tfc_context); it never writes BODIES — those come from the offline prompt.

import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { exists, readText, writeText, ensureDir } from "./fs.js";
import { findSkillDir } from "./context.js";
import { parseContextFile } from "./context-retrieve.js";
import type { AngleManifest, AngleManifestEntry } from "./context-discover.js";

const MAX_EXCERPT_CHARS = 2400;
const DEFAULT_DEPTH_TARGET = 12;
const DEEP_DEPTH_TARGET = 20;
const DEFAULT_PRIMITIVE_LIMIT = 12;
const DEEP_PRIMITIVE_LIMIT = 20;
const MIN_PRIMITIVES = 2; // below this, SKILL.md is too thin to derive a domain (NEEDS_SKILL_DESCRIPTION)

// ── Domain signal (W1) ────────────────────────────────────────────────────────

export interface DomainSignal {
  domainName: string; // human label, e.g. "prompt compilation"
  domainSlug: string; // manifest domain key, e.g. "autovibe" / "football-analyst"
  primitives: string[]; // distinctive, domain-specific terms (the adversarial allow-list)
  qualitySignal: string; // a sentence describing what "good" looks like, "" if none found
}

// Single-word terms that are NOT domain-specific even when capitalised or hyphenated. Multi-word
// and ALLCAPS-acronym candidates survive on their own distinctiveness; this list only sinks the
// generic singletons that otherwise masquerade as primitives.
const GENERIC_TERMS = new Set(
  [
    "the", "and", "for", "with", "this", "that", "your", "you", "use", "used", "using",
    "good", "bad", "best", "great", "output", "quality", "high", "low", "skill", "skills",
    "tool", "tools", "claude", "prompt", "prompts", "model", "models", "system", "systems",
    "read-only", "model-free", "clock-free", "out-of-band", "fails-closed", "fail-closed",
    "world-class", "step-by-step", "end-to-end", "real-world", "first-class", "up-to-date",
    "follow-up", "trade-off", "well-defined", "self-contained", "non-empty",
    "todo", "note", "yaml", "json", "markdown", "input", "inputs", "result", "results",
  ].map((s) => s.toLowerCase()),
);

// Common English function/emphasis words that authors write in ALLCAPS for stress ("do this BEFORE
// shipping", "BOTH backends"). They masquerade as acronyms but are never domain primitives in ANY
// domain. Deliberately excludes real domain acronyms (GROUND, TRANSCEND, CATCQ, ULTRA, DECOMPOSE) —
// only unambiguous function words live here, so the filter never sinks a genuine domain term.
const EMPHASIS_WORDS = new Set([
  "before", "after", "both", "always", "never", "only", "every", "each", "not", "and", "the",
  "this", "that", "these", "those", "when", "where", "what", "why", "how", "must", "should",
  "would", "could", "first", "then", "next", "also", "here", "there", "your", "you", "into",
  "with", "from", "but", "for", "are", "was", "will", "dont", "does", "did", "has", "had", "all",
  "any", "now", "new", "old", "more", "less", "yes", "very", "just", "even", "than",
]);

function leadsWithEmphasis(term: string): boolean {
  const first = term.split(/[\s-]/)[0]?.toLowerCase() ?? "";
  return EMPHASIS_WORDS.has(first);
}

function stripNoise(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks (bash/ts noise: TFC_HOME, tfc_learn …)
    .replace(/`[^`]*`/g, (m) => m) // keep inline backticks for candidate extraction below
    .replace(/<!--[\s\S]*?-->/g, " "); // HTML comments (managed hook markers)
}

interface Candidate {
  term: string;
  score: number; // max distinctiveness score across this term's matches
  count: number; // occurrences — a real domain primitive RECURS; one-off emphasis does not
}

// Deterministic extraction. Several candidate kinds, ranked by distinctiveness AND recurrence. The
// recurrence tiebreak matters: among equal-distinctiveness ALLCAPS bigrams, alphabetical ordering
// alone let early-alphabet one-off emphasis ("ACTION verb") crowd out recurring domain terms
// ("TRANSCEND charter"). No model, no network, no clock (INV-4).
export function extractPrimitives(text: string, limit: number): string[] {
  const cleaned = stripNoise(text);
  const byKey = new Map<string, Candidate>();

  const add = (raw: string, score: number): void => {
    const term = raw.trim().replace(/[.,;:!?]+$/, "");
    if (term.length < 2 || term.length > 48) return;
    const key = term.toLowerCase();
    if (GENERIC_TERMS.has(key)) return;
    // ALLCAPS emphasis ("BEFORE ship", "BOTH backends") and bare emphasis words are not primitives.
    if (leadsWithEmphasis(term)) return;
    // single generic-looking lowercase word with no hyphen/caps → reject
    if (!/[A-Z]/.test(term) && !term.includes("-") && !term.includes(" ")) return;
    const prev = byKey.get(key);
    if (prev) {
      prev.count += 1;
      if (score > prev.score) prev.score = score;
    } else {
      byKey.set(key, { term, score, count: 1 });
    }
  };

  // a. backtick-quoted spans — authored emphasis, usually a domain term or API token.
  for (const m of cleaned.matchAll(/`([^`\n]{2,40})`/g)) {
    const t = m[1]!.trim();
    if (/^[a-zA-Z][\w .\-/]*$/.test(t)) add(t, 3 + (t.includes(" ") ? 1 : 0));
  }
  // b. ALLCAPS acronym + following lowercase word → the most specific (e.g. "ULTRA prompt").
  for (const m of cleaned.matchAll(/\b([A-Z][A-Z0-9]{1,})\s+([a-z][a-z]{2,})\b/g)) {
    add(`${m[1]} ${m[2]}`, 5);
  }
  // c. bare ALLCAPS acronyms (e.g. CATCQ, GROUND, TRANSCEND).
  for (const m of cleaned.matchAll(/\b([A-Z][A-Z0-9]{2,})\b/g)) add(m[1]!, 4);
  // d. Pn-pattern (e.g. "P0 reconnaissance", "P13").
  for (const m of cleaned.matchAll(/\b(P\d+(?:\s+[a-z][a-z]+)?)\b/g)) add(m[1]!, 4);
  // e. hyphenated lowercase compounds (e.g. via-negativa, pressing-trigger, loss-aversion).
  for (const m of cleaned.matchAll(/\b([a-z]+-[a-z]+(?:-[a-z]+)?)\b/g)) add(m[1]!, 2);
  // f. Title-Case bigrams (e.g. "Knowledge Arbitrage", "Pressing Trigger").
  for (const m of cleaned.matchAll(/\b([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})\b/g)) add(m[1]!, 3);
  // g. bold-emphasised spans (**term**) — authored domain emphasis.
  for (const m of cleaned.matchAll(/\*\*([^*\n]{2,40})\*\*/g)) {
    const t = m[1]!.trim();
    if (/^[a-zA-Z][\w .\-/]*$/.test(t)) add(t, 3 + (t.includes(" ") ? 1 : 0));
  }
  // h. mid-sentence Capitalised single words (proper-noun-ish domain terms, e.g. "Gegenpressing",
  //    "Transitions") — preceded by a lowercase letter or comma so sentence-initial words are excluded.
  for (const m of cleaned.matchAll(/(?<=[a-z,]\s)([A-Z][a-z]{3,})\b/g)) add(m[1]!, 2);

  // Final rank = distinctiveness + recurrence bonus (capped), then raw count, then alphabetical.
  const rankOf = (c: Candidate): number => c.score + Math.min(c.count - 1, 5);
  return [...byKey.values()]
    .sort(
      (a, b) =>
        rankOf(b) - rankOf(a) || b.count - a.count || (a.term < b.term ? -1 : 1),
    )
    .slice(0, limit)
    .map((c) => c.term);
}

function frontmatterField(skillMd: string, field: string): string | null {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(skillMd);
  const block = fm?.[1] ?? skillMd;
  // support `field: value` and folded `field: >` blocks
  const inline = new RegExp(`^${field}:\\s*(.+)$`, "m").exec(block);
  if (inline?.[1] && inline[1].trim() !== ">" && inline[1].trim() !== "|") {
    return inline[1].trim().replace(/^["']|["']$/g, "");
  }
  const folded = new RegExp(`^${field}:\\s*[>|]\\s*\\n([\\s\\S]*?)(?:\\n\\S|$)`, "m").exec(block);
  if (folded?.[1]) return folded[1].replace(/\s+/g, " ").trim();
  return null;
}

function findQualitySignal(text: string): string {
  const cleaned = stripNoise(text);
  const sentences = cleaned.split(/(?<=[.!?])\s+|\n+/);
  for (const s of sentences) {
    if (/\b(world-class|excellent|great|good|quality|correct|wrong|fails?|mistake)\b/i.test(s)) {
      const t = s.replace(/\s+/g, " ").trim();
      if (t.length >= 12 && t.length <= 240) return t;
    }
  }
  return "";
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

// W1: derive the domain signal from SKILL.md text alone (INV-2: SKILL.md is the only domain input).
export function deriveDomain(input: {
  name: string;
  skillMd: string;
  deep?: boolean;
}): DomainSignal {
  const limit = input.deep ? DEEP_PRIMITIVE_LIMIT : DEFAULT_PRIMITIVE_LIMIT;
  const description = frontmatterField(input.skillMd, "description") ?? "";
  const nameField = frontmatterField(input.skillMd, "name") ?? input.name;
  // weight the description twice — it is the densest domain signal — then the whole body.
  const primitives = extractPrimitives(
    `${description}\n${description}\n${input.skillMd}`,
    limit,
  );
  const domainName = description
    ? description.split(/[.!?]/)[0]!.trim().slice(0, 60) || nameField.replace(/-/g, " ")
    : nameField.replace(/-/g, " ");
  return {
    domainName,
    domainSlug: slugify(nameField),
    primitives,
    qualitySignal: findQualitySignal(input.skillMd),
  };
}

// ── Artifact plan (W2) ─────────────────────────────────────────────────────────

export interface PlannedArtifact {
  file: string;
  type: string;
  sections: string[];
  fillHint: string;
}

// The artifact STRUCTURE is universal (INV-3). Content is domain-derived (lives in the prompt +
// the offline fill). `taxonomy` first — it indexes every other artifact (THINKING PROTOCOL §4).
const CORE_PLAN: PlannedArtifact[] = [
  {
    file: "taxonomy.md",
    type: "taxonomy",
    sections: ["## Categories", "## When To Use"],
    fillHint:
      "List the 5-8 fundamental categories/types in this domain; each: name, definition, and a 'when to use' condition.",
  },
  {
    file: "few-shots.md",
    type: "few-shot",
    sections: ["## Example 1", "## Example 2", "## Example 3"],
    fillHint:
      "3 worked examples (input task -> good output -> annotation that explains WHY via a domain MECHANISM, using the word 'because').",
  },
  {
    file: "anti-patterns.md",
    type: "anti-pattern",
    sections: ["## Failure Modes"],
    fillHint:
      "The 5-8 most common domain failures; each: the failure pattern -> why it fails -> the corrected version.",
  },
  {
    file: "principles.md",
    type: "principle",
    sections: ["## Principles"],
    fillHint:
      "5 grounded principles; each cites a reason it is true (not 'best practice'), is falsifiable on a new case, and produces a concrete change when applied.",
  },
  {
    file: "META.md",
    type: "meta",
    sections: ["## Glossary", "## Reading Order", "## Bootstrap Recipe"],
    fillHint:
      "10-term domain glossary, recommended reading order of the artifacts, and a DOMAIN-AGNOSTIC 5-step bootstrap recipe.",
  },
];

// --deep adds depth angles; --type filters to named types.
const DEEP_EXTRA: PlannedArtifact[] = [
  {
    file: "mechanisms.md",
    type: "mechanism",
    sections: ["## Core Mechanisms"],
    fillHint: "The cause->effect mechanisms an expert reasons with; each: trigger, mechanism, observable result.",
  },
  {
    file: "edge-cases.md",
    type: "edge-case",
    sections: ["## Edge Cases"],
    fillHint: "Boundary situations where the default principles break; each: the case, why default fails, the adjustment.",
  },
];

export function planArtifacts(input: { deep?: boolean; types?: string[] }): PlannedArtifact[] {
  let plan = input.deep ? [...CORE_PLAN, ...DEEP_EXTRA] : [...CORE_PLAN];
  if (input.types && input.types.length > 0) {
    const wanted = new Set(input.types.map((t) => t.toLowerCase()));
    plan = plan.filter((p) => wanted.has(p.type) || wanted.has(p.file.replace(/\.md$/, "")));
  }
  return plan;
}

// ── Forge prompt + scaffold (W2 + W4) ─────────────────────────────────────────

export interface HarvestedSource {
  label: string;
  path: string;
  excerpt: string;
}

export interface ForgeResult {
  skill: string;
  domain: DomainSignal;
  contextDir: string;
  manifest: AngleManifest;
  plan: PlannedArtifact[];
  sources: HarvestedSource[];
  written: string[]; // files written by deposit ([] on preview)
  prompt: string; // OFFLINE generation prompt — Claude executes; this fn never calls a model
}

function truncate(text: string): string {
  const t = text.trim();
  return t.length <= MAX_EXCERPT_CHARS ? t : `${t.slice(0, MAX_EXCERPT_CHARS)}\n…[truncated]`;
}

async function harvestFrom(label: string, path: string): Promise<HarvestedSource | null> {
  if (!(await exists(path))) return null;
  const r = await readText(path);
  if (!r.ok || r.data.trim().length === 0) return null;
  return { label, path, excerpt: truncate(r.data) };
}

function stubFrontmatter(a: PlannedArtifact, domain: DomainSignal, today: string): string {
  // DV2 provenance schema (context.ts stubContent) — NOT an invented `basis:` field. synthesized:true
  // (forge-derived) names a source_basis, and confidence 0.5 marks it un-promoted until real signals
  // (tfc_context_receipt) earn it up.
  const body = a.sections.map((s) => `${s}\n`).join("\n");
  return (
    `---\n` +
    `last_verified: ${today}\n` +
    `freshness_clock: ${today}\n` +
    `synthesized: true\n` +
    `source_basis: "SKILL.md (tfc_context_forge)"\n` +
    `confidence: "0.5"\n` +
    `forge_domain: ${JSON.stringify(domain.domainSlug)}\n` +
    `fill_hint: ${JSON.stringify(a.fillHint)}\n` +
    `---\n\n${body}`
  );
}

function renderManifest(manifest: AngleManifest): string {
  const lines = [
    `# Generated by tfc_context_forge — domain derived from SKILL.md (synthetic starter; expand to depth_target).`,
    `domain: ${JSON.stringify(manifest.domain)}`,
    `depth_target: ${manifest.depth_target ?? DEFAULT_DEPTH_TARGET}`,
    `angles:`,
  ];
  for (const a of manifest.angles) {
    lines.push(`  - file: ${a.file}`);
    if (a.sections && a.sections.length > 0) {
      lines.push(`    sections: ${JSON.stringify(a.sections)}`);
    }
    if (a.source_hint) lines.push(`    source_hint: ${JSON.stringify(a.source_hint)}`);
  }
  return lines.join("\n") + "\n";
}

export async function buildForge(input: {
  name: string;
  today: string; // boundary-injected (INV-7)
  deep?: boolean;
  types?: string[];
  preview?: boolean;
  dirOverride?: string;
}): Promise<Result<ForgeResult>> {
  const dir = input.dirOverride ?? (await findSkillDir(input.name));
  if (!dir) {
    return fail("NOT_FOUND", `Skill not found by name: ${input.name}`, "Run tfc_new first, or check the skill name");
  }
  const skill = nodePath.basename(dir);

  // SKILL.md is the domain oracle — REQUIRED. No SKILL.md, no domain signal.
  const skillMdPath = nodePath.join(dir, "SKILL.md");
  const skillMdR = await readText(skillMdPath);
  if (!skillMdR.ok || skillMdR.data.trim().length === 0) {
    return fail(
      "NEEDS_SKILL_DESCRIPTION",
      `No readable SKILL.md for ${skill}`,
      "Author SKILL.md with a 2-sentence description of what this skill does and what excellent output looks like",
    );
  }

  const domain = deriveDomain({ name: skill, skillMd: skillMdR.data, ...(input.deep !== undefined ? { deep: input.deep } : {}) });
  if (domain.primitives.length < MIN_PRIMITIVES) {
    return fail(
      "NEEDS_SKILL_DESCRIPTION",
      `SKILL.md for ${skill} is too thin to derive a domain (found ${domain.primitives.length} primitive(s))`,
      "Add a 2-sentence description naming the domain's specific concepts (formations, margins, style modifiers, …) and what excellent output looks like",
    );
  }

  const plan = planArtifacts({ ...(input.deep !== undefined ? { deep: input.deep } : {}), ...(input.types ? { types: input.types } : {}) });
  if (plan.length === 0) {
    return fail("BAD_INPUT", `No artifact types matched`, `Known types: ${CORE_PLAN.concat(DEEP_EXTRA).map((p) => p.type).join(", ")}`);
  }

  const angles: AngleManifestEntry[] = plan.map((p) => ({
    file: p.file,
    sections: p.sections,
    source_hint: p.fillHint,
  }));
  const manifest: AngleManifest = {
    domain: domain.domainSlug,
    angles,
    depth_target: input.deep ? DEEP_DEPTH_TARGET : DEFAULT_DEPTH_TARGET,
  };

  // Harvest grounded sources (SKILL.md guaranteed present; spec/eval optional).
  const sources: HarvestedSource[] = [];
  const sk = await harvestFrom(`${skill}/SKILL.md`, skillMdPath);
  if (sk) sources.push(sk);
  const spec = await harvestFrom(`${skill}/spec.yaml`, nodePath.join(dir, "spec.yaml"));
  if (spec) sources.push(spec);
  const ev = await harvestFrom(`${skill}/eval-report.json`, nodePath.join(dir, "eval-report.json"));
  if (ev) sources.push(ev);

  const contextDir = nodePath.join(dir, "context");

  // DEPOSIT (model-free writer — like tfc_context). Writes the manifest + EMPTY stubs only; the
  // offline prompt fills the bodies. preview=true skips all writes.
  const written: string[] = [];
  if (!input.preview) {
    const mk = await ensureDir(contextDir);
    if (!mk.ok) return mk;
    const manifestPath = nodePath.join(contextDir, "_angles.yaml");
    if (!(await exists(manifestPath))) {
      const w = await writeText(manifestPath, renderManifest(manifest));
      if (!w.ok) return w;
      written.push(manifestPath);
    }
    for (const a of plan) {
      const p = nodePath.join(contextDir, a.file);
      if (await exists(p)) continue; // never clobber a filled artifact
      const w = await writeText(p, stubFrontmatter(a, domain, input.today));
      if (!w.ok) return w;
      written.push(p);
    }
  }

  const prompt = renderForgePrompt({ skill, domain, contextDir, plan, sources });
  return ok({ skill, domain, contextDir, manifest, plan, sources, written, prompt });
}

function renderForgePrompt(input: {
  skill: string;
  domain: DomainSignal;
  contextDir: string;
  plan: PlannedArtifact[];
  sources: HarvestedSource[];
}): string {
  const { skill, domain, contextDir, plan, sources } = input;
  const renderedPlan = plan
    .map((a) => `### ${a.file}  (${a.type})\nsections:\n${a.sections.map((s) => `  ${s}`).join("\n")}\n  fill_hint: ${a.fillHint}`)
    .join("\n\n");
  const renderedSources =
    sources.length > 0
      ? sources.map((s) => `### source: \`${s.label}\`  (${s.path})\n\n\`\`\`\n${s.excerpt}\n\`\`\``).join("\n\n")
      : "(none harvested — ground everything in the domain knowledge SKILL.md implies)";
  const primitiveList = domain.primitives.map((p) => `\`${p}\``).join(", ");

  return `# tfc_context_forge — OFFLINE domain context generation for ${skill}

Domain (derived from SKILL.md): **${domain.domainName}**  (slug: ${domain.domainSlug})
Domain primitives (the adversarial allow-list): ${primitiveList}
${domain.qualitySignal ? `What good looks like: ${domain.qualitySignal}` : ""}

You are generating this skill's exported domain knowledge. This runs OFFLINE (out of the
deterministic read path) so it may use your judgement — but it is GROUNDED + ADVERSARIAL.

## HARD RULES (tfc_context_forge's validator + the depth audit fail-closed on violations)
1. ADVERSARIAL DEFAULT: every artifact must contain at least 2 of the domain primitives above,
   used in a SPECIFIC sentence — not merely appended to a generic one ("good ${domain.domainSlug}
   analysis" does NOT count). An artifact that could belong to any domain is REJECTED.
2. Draw claims from the HARVESTED SOURCES; do not fabricate facts the sources do not support.
3. Each \`##\` section carries a provenance line directly under its header, exactly:
   \`source: <one of the source labels above, optionally #anchor>\`
4. Few-shot annotations must explain a MECHANISM, not a result: the word "because" followed by a
   domain-specific mechanism (why it works in domain terms), never just "this is good".
5. Principles + anti-patterns must be FALSIFIABLE: each yields a yes/no verdict when applied to a
   new case. If a section cannot be grounded, write \`TODO(unsourced): <what is missing>\` and add
   NO source line — let it fail the audit honestly. Never fabricate to pass.
6. META.md's bootstrap recipe must be DOMAIN-AGNOSTIC ("list the fundamental categories of this
   domain", not "list football formations").

## ARTIFACTS TO GENERATE (write each as ${contextDir}/<file>)

${renderedPlan}

## HARVESTED SOURCES (your permitted ground truth)

${renderedSources}

## OUTPUT CONTRACT
The stub files + context/_angles.yaml already exist (forge wrote them, synthesized: true). Fill each
\`##\` section with a \`source:\` line and a grounded, primitive-bearing body. Then verify:
\`\`\`bash
node dist/cli.js context-coverage ${skill}    # angles must start clearing the depth bar (coverage > 0)
node dist/cli.js context-get ${skill} ${domain.domainSlug} "<a real ${domain.domainSlug} task>"
\`\`\`
A shallow/uncovered angle means it is empty, unsourced, generic, or too thin — fix the draft, never the gate.`;
}

// ── Adversarial validator (W3) ─────────────────────────────────────────────────

export interface ArtifactVerdict {
  file: string;
  primitivesHit: string[]; // distinct primitives found in non-empty bodies
  domainFitness: boolean; // >= 2 distinct primitives → pass (the hard gate, INV-4)
  specificityFlags: string[]; // sentences with generic hedges and no domain qualifier (WARN)
  falsifiabilityWarn: string[]; // principle/anti-pattern sections lacking a causal marker (WARN)
  pass: boolean; // domainFitness — the only fail condition; flags are advisory
  reasons: string[]; // why NOT pass; empty iff pass (fails-closed evidence)
}

const HEDGE_RE = /\b(in general|typically|usually|generally|often|sometimes)\b/i;
const CAUSAL_RE = /\b(because|since|when|if|so that|in order to|which means)\b/i;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Model-free: string + regex over parsed sections. No model call (INV-4); the offline prompt owns
// the deeper falsifiability judgement — here it is a heuristic WARN only.
export function validateArtifact(
  file: string,
  content: string,
  primitives: string[],
): ArtifactVerdict {
  const parsed = parseContextFile(file, content);
  const bodies = parsed.sections.filter((s) => !s.isEmpty).map((s) => ({ header: s.header, body: s.body }));
  const allBody = bodies.map((b) => b.body).join("\n");

  const hit: string[] = [];
  for (const p of primitives) {
    const re = new RegExp(`(^|[^\\w])${escapeRegExp(p)}([^\\w]|$)`, "i");
    if (re.test(allBody)) hit.push(p);
  }
  const domainFitness = hit.length >= MIN_PRIMITIVES;

  const specificityFlags: string[] = [];
  for (const b of bodies) {
    for (const sentence of b.body.split(/(?<=[.!?])\s+|\n+/)) {
      if (HEDGE_RE.test(sentence)) {
        const hasPrimitive = primitives.some((p) =>
          new RegExp(`(^|[^\\w])${escapeRegExp(p)}([^\\w]|$)`, "i").test(sentence),
        );
        if (!hasPrimitive) specificityFlags.push(sentence.replace(/\s+/g, " ").trim().slice(0, 120));
      }
    }
  }

  const falsifiabilityWarn: string[] = [];
  if (/anti-pattern|principle/i.test(file)) {
    for (const b of bodies) {
      if (!CAUSAL_RE.test(b.body)) falsifiabilityWarn.push(b.header);
    }
  }

  const reasons: string[] = [];
  if (!domainFitness) {
    reasons.push(
      `domain-fitness: ${hit.length} primitive(s) found (need >= ${MIN_PRIMITIVES}). This artifact is generic.`,
    );
  }

  return {
    file,
    primitivesHit: hit,
    domainFitness,
    specificityFlags,
    falsifiabilityWarn,
    pass: domainFitness,
    reasons,
  };
}
