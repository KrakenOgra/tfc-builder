import * as nodePath from "node:path";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fail, ok, type Result } from "./result.js";
import { exists, readText } from "./fs.js";
import { skillDir, MCP_CONFIG, TFC_SKILLS } from "./paths.js";
import { readYaml } from "./yamlio.js";
import { fragmentExists } from "./fragments.js";
import { ACCEPTANCE_SHAPE_RE } from "./behavioral.js";
import type { SpecYaml } from "./types.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LoadedSkill {
  dirName: string;
  specYaml: SpecYaml;
  skillMdText: string;
  // Full skill directory path. Optional for back-compat with fixtures that build
  // LoadedSkill by hand; the real loader always sets it. Used by file-existence checks.
  dir?: string;
}

export interface CheckOutcome {
  passed: boolean;
  message?: string;
}

export interface GateResult {
  id: string;
  severity: "blocking" | "warning" | "info";
  passed: boolean;
  message: string;
}

// ── Text helpers ──────────────────────────────────────────────────────────────

function stripCodeFences(text: string): string {
  return text.replace(/```[\s\S]*?```/g, "");
}

export function extractSection(text: string, heading: string): string {
  // Anchor to line start/end so '## Patterns' never matches inside '### Patterns'
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const markerRe = new RegExp(`^## ${escaped}\\s*$`, "m");
  const match = markerRe.exec(text);
  if (!match) return "";
  const afterNewline = text.indexOf("\n", match.index) + 1;
  const nextH2 = text.indexOf("\n## ", afterNewline);
  return nextH2 === -1 ? text.slice(afterNewline) : text.slice(afterNewline, nextH2);
}

export function countRealNamedItems(sectionContent: string): number {
  // Only count ### headings whose title has no placeholder bracket
  const lines = sectionContent.split("\n");
  return lines.filter((l) => l.startsWith("### ") && !l.includes("[")).length;
}

export function countNumberedItems(sectionContent: string): number {
  return (sectionContent.match(/^\d+\.\s/gm) ?? []).length;
}

export function countBulletItems(sectionContent: string): number {
  return (sectionContent.match(/^[-*]\s/gm) ?? []).length;
}

export function isFilledContent(sectionContent: string): boolean {
  // Has content and no unfilled bracket placeholders
  const trimmed = sectionContent.trim();
  if (trimmed.length === 0) return false;
  return !/\[role|Pattern Name|Anti-Pattern Name|\[Principle as|\[Verb \+/i.test(trimmed);
}

// ── Archetype structure extractors (workflow / reference rubrics) ────────────
// All operate on fence-stripped prose so output-contract examples inside
// ``` blocks never count as real structure.

const PHASE_HEADING_RE = /^#{2,3}\s+(?:Phase|Step|Stage)\s+(\d+)/gim;

export function countPhases(text: string): number {
  const prose = stripCodeFences(text);
  return [...prose.matchAll(PHASE_HEADING_RE)].length;
}

export function phasesAscending(text: string): boolean {
  const prose = stripCodeFences(text);
  const nums = [...prose.matchAll(PHASE_HEADING_RE)].map((m) =>
    Number(m[1] ?? "0"),
  );
  return nums.every((n, i) => i === 0 || n > (nums[i - 1] ?? 0));
}

export function countStopPoints(text: string): number {
  const prose = stripCodeFences(text);
  const bold = prose.match(/\*\*STOP\b/g) ?? [];
  const lineStart = prose.match(/^STOP\b[.:]?/gm) ?? [];
  return bold.length + lineStart.length;
}

export function hasCompletionProtocol(text: string): boolean {
  return (
    /^#{2,3}\s+Completion/im.test(text) &&
    text.includes("DONE") &&
    text.includes("BLOCKED")
  );
}

export function hasEvidenceRules(text: string): boolean {
  const prose = stripCodeFences(text);
  return /\bevidence\s*:|screenshot|output this block/i.test(prose);
}

export function countH2Sections(text: string): number {
  const prose = stripCodeFences(text);
  return (prose.match(/^##\s+/gm) ?? []).length;
}

export function countTables(text: string): number {
  // One header-separator row (|---|---|) per table
  const prose = stripCodeFences(text);
  return (prose.match(/^\|[\s:|-]+\|\s*$/gm) ?? []).length;
}

export function hasVersionStamp(text: string): boolean {
  return /\bas of\s+\d{4}|\b20\d{2}-\d{2}(-\d{2})?\b|\bv\d+\.\d+|\bversion\s+\d/i.test(
    text,
  );
}

// ── Check functions (pure) ────────────────────────────────────────────────────

const AI_VOCAB_RE = /\b(delve|crucial|robust|comprehensive|nuanced|multifaceted)\b/i;

function preamblePresent(skill: LoadedSkill): CheckOutcome {
  const passed = skill.skillMdText.includes("## Preamble (run first)");
  return { passed };
}

function requiredSectionsPresent(skill: LoadedSkill): CheckOutcome {
  const sections = skill.specYaml.required_sections ?? [];
  if (sections.length === 0) return { passed: true };
  const missing = sections.filter((s) => !skill.skillMdText.includes(s));
  if (missing.length === 0) return { passed: true };
  return { passed: false, message: `Missing required sections: ${missing.join(", ")}` };
}

function specIdMatchesDir(skill: LoadedSkill): CheckOutcome {
  if (skill.specYaml.id === skill.dirName) return { passed: true };
  return {
    passed: false,
    message: `spec.id="${skill.specYaml.id}" but directory name="${skill.dirName}"`,
  };
}

function telemetryBlockPresent(skill: LoadedSkill): CheckOutcome {
  const passed = skill.skillMdText.includes("## Telemetry (run last)");
  return { passed };
}

function learningsWriteback(skill: LoadedSkill): CheckOutcome {
  const passed = skill.skillMdText.includes("learnings.jsonl");
  return { passed };
}

function completionStatusPresent(skill: LoadedSkill): CheckOutcome {
  const md = skill.skillMdText;
  const passed =
    md.includes("DONE") && md.includes("BLOCKED") && md.includes("NEEDS_CONTEXT");
  return { passed };
}

function voiceEmDash(skill: LoadedSkill): CheckOutcome {
  const prose = stripCodeFences(skill.skillMdText);
  if (!prose.includes(" — ")) return { passed: true };
  return { passed: false, message: "Em dash found in prose — use ': ' or split into two sentences" };
}

function voiceAiVocab(skill: LoadedSkill): CheckOutcome {
  const prose = stripCodeFences(skill.skillMdText);
  const match = AI_VOCAB_RE.exec(prose);
  if (match === null) return { passed: true };
  return { passed: false, message: `AI vocabulary found: "${match[0]}"` };
}

function triggersSpecific(skill: LoadedSkill): CheckOutcome {
  const triggers = skill.specYaml.triggers ?? [];
  const short = triggers.filter((t) => t.trim().split(/\s+/).length < 4);
  if (short.length === 0) return { passed: true };
  return { passed: false, message: `Short triggers (< 4 words): ${short.join("; ")}` };
}

function sharpEdgesHaveSolutions(skill: LoadedSkill): CheckOutcome {
  const edges = skill.specYaml.sharp_edges ?? [];
  const missing = edges.filter((e) => !e.solution || e.solution.trim().length === 0);
  if (missing.length === 0) return { passed: true };
  return { passed: false, message: `Sharp edges without solution: ${missing.map((e) => e.id).join(", ")}` };
}

function pairsWithPopulated(skill: LoadedSkill): CheckOutcome {
  const pairs = skill.specYaml.pairs_with ?? [];
  const passed = pairs.length > 0;
  return { passed };
}

const VALID_PAIR_DIRECTIONS = new Set(["before", "after", "parallel"]);

function pairsWithDirectionValid(skill: LoadedSkill): CheckOutcome {
  const pairs = skill.specYaml.pairs_with ?? [];
  const invalid = pairs.filter(
    (p) => p.direction !== undefined && !VALID_PAIR_DIRECTIONS.has(p.direction),
  );
  if (invalid.length === 0) return { passed: true };
  return {
    passed: false,
    message: `Invalid pairs_with.direction: ${invalid.map((p) => `"${p.direction}"`).join(", ")} — must be "before", "after", or "parallel"`,
  };
}

function modelTierDeclared(skill: LoadedSkill): CheckOutcome {
  const tier = skill.specYaml.model_tier;
  const passed = tier === "opus" || tier === "sonnet" || tier === "haiku";
  return { passed };
}

// ── v3 gates (W1 protocol-first · W2 artifacts · W4 inheritance · W5 integration) ─

// W1 (V1): the template ships a FILLED protocol, never meta-instructions about being
// concrete. These phrases are the v3 crack — banned everywhere, including code fences.
const PLACEHOLDER_META_RE =
  /Replace this section|What to do in phase|Replace with real commands|Be concrete\. Name the file/i;

function templateNoPlaceholder(skill: LoadedSkill): CheckOutcome {
  const m = PLACEHOLDER_META_RE.exec(skill.skillMdText);
  if (m === null) return { passed: true };
  return {
    passed: false,
    message: `Placeholder meta-instruction found: "${m[0]}" — replace with a concrete GROUND-gated step`,
  };
}

// W2 (V2): a declared phase is structurally incomplete without an artifact AND a
// machine-shaped acceptance criterion. Absent phases[] ⇒ pass (opt-in, back-compat).
function phaseArtifacts(skill: LoadedSkill): CheckOutcome {
  const phases = skill.specYaml.phases ?? [];
  if (phases.length === 0) return { passed: true };
  const bad = phases.filter(
    (p) =>
      !p.artifact ||
      p.artifact.trim().length === 0 ||
      !p.acceptance ||
      !ACCEPTANCE_SHAPE_RE.test(p.acceptance),
  );
  if (bad.length === 0) return { passed: true };
  return {
    passed: false,
    message: `phases missing artifact or machine-shaped acceptance: ${bad
      .map((p, i) => p.name ?? `#${i + 1}`)
      .join(", ")}`,
  };
}

// W4 (V4): every imported reasoning fragment must resolve on disk. Fails-closed (INV-5):
// a dropped import is a silently-missing gate, the exact reinvention V4 exists to prevent.
function importsResolve(skill: LoadedSkill): CheckOutcome {
  const imports = skill.specYaml.imports ?? [];
  if (imports.length === 0) return { passed: true };
  const missing = imports.filter((id) => !fragmentExists(id));
  if (missing.length === 0) return { passed: true };
  return {
    passed: false,
    message: `imported fragments not found in skills/_fragments/: ${missing.join(", ")}`,
  };
}

// W5 (V5): each declared MCP requirement must be present in the MCP registry. Warning
// severity (transient/unreadable config must not fail a skill); doctor/integrate enforce.
function requiresReachable(skill: LoadedSkill): CheckOutcome {
  const requires = skill.specYaml.requires ?? [];
  if (requires.length === 0) return { passed: true };
  let servers: Set<string>;
  try {
    const cfg = JSON.parse(readFileSync(MCP_CONFIG, "utf8")) as {
      mcpServers?: Record<string, unknown>;
    };
    servers = new Set(Object.keys(cfg.mcpServers ?? {}));
  } catch {
    // config unreadable — cannot prove unreachability, do not punish.
    return { passed: true };
  }
  const unreachable = requires.filter(
    (r) => !servers.has(r.replace(/-mcp$/, "")) && !servers.has(r),
  );
  if (unreachable.length === 0) return { passed: true };
  return {
    passed: false,
    message: `requires not found in MCP config: ${unreachable.join(", ")}`,
  };
}

// W5 (V5): a skill pairing must declare BOTH direction and reason — no aspirational pairs.
function pairsWithComplete(skill: LoadedSkill): CheckOutcome {
  const pairs = skill.specYaml.pairs_with ?? [];
  const incomplete = pairs.filter(
    (p) =>
      p.skill &&
      (!p.direction || !p.reason || p.reason.trim().length === 0),
  );
  if (incomplete.length === 0) return { passed: true };
  return {
    passed: false,
    message: `pairs_with entries missing direction/reason: ${incomplete
      .map((p) => p.skill)
      .join(", ")}`,
  };
}

// ── Foundation checks (v2.0 retrieval skills: the run reads its foundation) ─────
// A skill that writes from a frozen kernel and reads nothing at runtime is generic
// by construction. These assert the run drives off retrieval-map.yaml and that the
// ship gate names each foundation check. All are sync text/file checks.

function retrievalMapPresent(skill: LoadedSkill): CheckOutcome {
  const passed = skill.dir
    ? existsSync(nodePath.join(skill.dir, "retrieval-map.yaml"))
    : false;
  if (passed) return { passed: true };
  return { passed: false, message: "retrieval-map.yaml missing: run falls back to the frozen kernel" };
}

function runReadsFoundation(skill: LoadedSkill): CheckOutcome {
  return { passed: skill.skillMdText.includes("retrieval-map.yaml") };
}

// ── v4 W3 — data-authored checks + output contract ──────────────────────────────
// reel-forge's seven foundation presence checks USED to be compiled functions here. They now live
// as `kind: contains` data in reel-forge/validations.yaml, resolved by runDataCheck below — a new
// presence check for a new domain is 10 lines of YAML, not a TypeScript redeploy (Vector V2).

function splitList(v: string): string[] {
  return v
    .split("||")
    .map((s) => s.trim())
    .filter(Boolean);
}

// The data-check interpreter. validate.ts dispatches here when a gate id has no entry in
// CHECK_REGISTRY but carries a `kind`. No compiled function, no model (INV-3/INV-4).
export function runDataCheck(
  gate: { id: string; kind?: string; params?: Record<string, string> },
  skill: LoadedSkill,
): CheckOutcome {
  const params = gate.params ?? {};
  switch (gate.kind) {
    case "file-exists": {
      if (!skill.dir) return { passed: false, message: "no skill dir for file-exists check" };
      return { passed: existsSync(nodePath.join(skill.dir, params.path ?? "")) };
    }
    case "contains": {
      const md = skill.skillMdText;
      if (params.all) return { passed: splitList(params.all).every((t) => md.includes(t)) };
      if (params.any) return { passed: splitList(params.any).some((t) => md.includes(t)) };
      return { passed: md.includes(params.text ?? "") };
    }
    case "section":
      return { passed: skill.skillMdText.includes(`## ${params.header ?? ""}`) };
    default:
      return { passed: false, message: `unknown data-check kind: ${String(gate.kind)}` };
  }
}

// Once a skill is (cached) eval_proven+ AND has golden tasks, it should declare output_schema so
// what it produces is checkable. Advisory warning; reads the lane cache (this is not a lane verdict).
function outputSchemaDeclared(skill: LoadedSkill): CheckOutcome {
  const lane = skill.specYaml.lane?.state;
  if (lane !== "eval_proven" && lane !== "evolution_proven") return { passed: true };
  if (skill.specYaml.output_schema) return { passed: true };
  const dir = skill.dir;
  if (!dir) return { passed: true };
  const evalsPath = nodePath.join(dir, "evals.yaml");
  if (!existsSync(evalsPath)) return { passed: true };
  let hasGolden = false;
  try {
    hasGolden = /golden_tasks\s*:/.test(readFileSync(evalsPath, "utf-8"));
  } catch {
    hasGolden = false;
  }
  if (!hasGolden) return { passed: true };
  return {
    passed: false,
    message: "eval_proven skill has golden_tasks but no output_schema (v4 W3) — declare what it produces",
  };
}

// ── v4 W1 — portable context layer ─────────────────────────────────────────────

// Fires only when spec.yaml declares requires_context. Each named file must exist in the
// skill's context/ dir. Absent requires_context ⇒ passes (back-compat). INV-9.
function contextFilesPresent(skill: LoadedSkill): CheckOutcome {
  const required = skill.specYaml.requires_context;
  if (!required || required.length === 0) return { passed: true };
  const dir = skill.dir;
  if (!dir) return { passed: true }; // hand-built fixtures without a dir
  const missing = required.filter(
    (f) => !existsSync(nodePath.join(dir, "context", f)),
  );
  if (missing.length === 0) return { passed: true };
  return {
    passed: false,
    message: `Missing context files in context/: ${missing.join(", ")} — run tfc_context`,
  };
}

// ── Foundry W-B — synthesis-over-data gate ──────────────────────────────────────
// A section that CLAIMS synthesis (frontmatter `synthesized: true`) must carry a non-empty
// `source_basis`. Synthesis without a named basis is confident hallucination — the failure mode
// §8 names. Human-authored context (synthesized:false or absent) is exempt: this gate polices the
// claim, not the corpus. Fails-closed: an unparseable synthesized file is unearned. Model-free.
export function synthesisEarned(skill: LoadedSkill): CheckOutcome {
  const dir = skill.dir;
  if (!dir) return { passed: true }; // hand-built fixtures without a dir
  const contextDir = nodePath.join(dir, "context");
  if (!existsSync(contextDir)) return { passed: true };
  let files: string[];
  try {
    files = readdirSync(contextDir).filter((f) => f.endsWith(".md"));
  } catch {
    return { passed: true };
  }
  const unearned: string[] = [];
  for (const f of files) {
    let raw: string;
    try {
      raw = readFileSync(nodePath.join(contextDir, f), "utf8");
    } catch {
      continue;
    }
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
    if (!fm) continue;
    const block = fm[1] ?? "";
    if (!/^\s*synthesized:\s*true\s*$/m.test(block)) continue; // only synthesized files are policed
    const basis = /^\s*source_basis:\s*(.*)$/m.exec(block);
    const val = basis?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "";
    if (val.length === 0) unearned.push(f);
  }
  if (unearned.length === 0) return { passed: true };
  return {
    passed: false,
    message: `synthesis-unearned: ${unearned.join(", ")} declare synthesized:true but carry no source_basis — name the basis or set synthesized:false`,
  };
}

// INV-11: no machine-specific absolute path in a COMMITTED source file. Earned/runtime logs
// (*.json, *.jsonl) legitimately carry abs paths and are not part of the portable surface, so
// the scan is scoped to .md / .yaml / .yml.
const ABS_PATH_SCAN_EXT = new Set([".md", ".yaml", ".yml"]);
const ABS_PATH_RE = /\/home\/|\$HOME/;

function noAbsolutePaths(skill: LoadedSkill): CheckOutcome {
  const root = skill.dir;
  if (!root) return { passed: true };
  const offenders: string[] = [];
  const walk = (d: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const name of entries) {
      const p = nodePath.join(d, name);
      let isDir = false;
      try {
        isDir = statSync(p).isDirectory();
      } catch {
        continue;
      }
      if (isDir) {
        walk(p);
        continue;
      }
      if (!ABS_PATH_SCAN_EXT.has(nodePath.extname(name))) continue;
      try {
        if (ABS_PATH_RE.test(readFileSync(p, "utf-8"))) {
          offenders.push(nodePath.relative(root, p));
        }
      } catch {
        // unreadable file → skip
      }
    }
  };
  walk(root);
  if (offenders.length === 0) return { passed: true };
  return {
    passed: false,
    message: `Machine-specific absolute path in: ${offenders.join(", ")} (INV-11) — move it to in-skill context/`,
  };
}

// ── v4 W2 — context composition reachability ────────────────────────────────────

// Sync skill-dir resolution by name (checks are synchronous). Skills live at
// TFC_SKILLS/<fs-category>/<name>; the import chain references names, not categories.
function findSkillDirSync(name: string): string | null {
  let cats: string[];
  try {
    cats = readdirSync(TFC_SKILLS);
  } catch {
    return null;
  }
  for (const cat of cats) {
    if (cat.startsWith("_")) continue;
    const p = nodePath.join(TFC_SKILLS, cat, name);
    try {
      if (statSync(p).isDirectory()) return p;
    } catch {
      // not a dir / unreadable → skip
    }
  }
  return null;
}

// For each imports_context.files entry, the SOURCE skill's context/<file>.md must exist.
// Warning in tfc_validate; tfc_integrate promotes it to a blocking precondition. Absent
// imports_context ⇒ passes (back-compat). INV-10's companion at the file level.
export function importedContextReachable(skill: LoadedSkill): CheckOutcome {
  const imp = skill.specYaml.imports_context;
  if (!imp || !imp.from) return { passed: true };
  const fromDir = findSkillDirSync(imp.from);
  if (!fromDir) {
    return { passed: false, message: `imports_context.from skill not found: ${imp.from}` };
  }
  const files = imp.files ?? [];
  if (files.length === 0) {
    return existsSync(nodePath.join(fromDir, "context"))
      ? { passed: true }
      : { passed: false, message: `${imp.from} has no context/ dir to inherit` };
  }
  const missing = files.filter(
    (f) => !existsSync(nodePath.join(fromDir, "context", f)),
  );
  if (missing.length === 0) return { passed: true };
  return {
    passed: false,
    message: `Unreachable imported context from ${imp.from}: ${missing.join(", ")}`,
  };
}

// v4 W5: every pairs_with[].skill should resolve to a skill dir in the TFC tree. Warning in
// tfc_validate (a cross-system pair may live in spawner/gstack); tfc_integrate refuses to CREATE a
// pairing to a non-existent skill. Absent/empty pairs_with ⇒ passes.
export function pairsWithResolve(skill: LoadedSkill): CheckOutcome {
  const pairs = skill.specYaml.pairs_with;
  if (!Array.isArray(pairs) || pairs.length === 0) return { passed: true };
  const missing = pairs
    .map((p) => p.skill)
    .filter((id): id is string => typeof id === "string" && !findSkillDirSync(id));
  if (missing.length === 0) return { passed: true };
  return {
    passed: false,
    message: `pairs_with references skills not in the TFC tree: ${missing.join(", ")}`,
  };
}

// ── Registry ──────────────────────────────────────────────────────────────────

export const CHECK_REGISTRY = new Map<string, (skill: LoadedSkill) => CheckOutcome>([
  ["preamble-present", preamblePresent],
  ["required-sections-present", requiredSectionsPresent],
  ["spec-id-matches-directory", specIdMatchesDir],
  ["telemetry-block-present", telemetryBlockPresent],
  ["learnings-writeback", learningsWriteback],
  ["completion-status-present", completionStatusPresent],
  ["voice-em-dash", voiceEmDash],
  ["voice-ai-vocabulary", voiceAiVocab],
  ["triggers-specific", triggersSpecific],
  ["sharp-edges-have-solutions", sharpEdgesHaveSolutions],
  ["pairs-with-populated", pairsWithPopulated],
  ["pairs-with-direction-valid", pairsWithDirectionValid],
  ["model-tier-declared", modelTierDeclared],
  ["template-no-placeholder", templateNoPlaceholder],
  ["phase-artifacts", phaseArtifacts],
  ["imports-resolve", importsResolve],
  ["requires-reachable", requiresReachable],
  ["pairs-with-complete", pairsWithComplete],
  ["retrieval-map-present", retrievalMapPresent],
  ["run-reads-foundation", runReadsFoundation],
  ["context-files-present", contextFilesPresent],
  ["synthesis-earned", synthesisEarned],
  ["no-absolute-paths", noAbsolutePaths],
  ["imported-context-reachable", importedContextReachable],
  ["output-schema-declared", outputSchemaDeclared],
  ["pairs-with-resolve", pairsWithResolve],
]);

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadSkillFromDir(
  dir: string,
): Promise<Result<LoadedSkill>> {
  if (!(await exists(dir))) {
    return fail("NOT_FOUND", `Skill directory not found: ${dir}`, "run tfc_new first");
  }
  const specR = await readYaml<SpecYaml>(nodePath.join(dir, "spec.yaml"));
  if (!specR.ok) return specR;
  const mdR = await readText(nodePath.join(dir, "SKILL.md"));
  if (!mdR.ok) return mdR;
  return ok({
    dirName: nodePath.basename(dir),
    specYaml: specR.data,
    skillMdText: mdR.data,
    dir,
  });
}

export async function loadSkill(
  category: string,
  name: string,
): Promise<Result<LoadedSkill>> {
  const dirR = skillDir(category, name);
  if (!dirR.ok) return fail("BAD_INPUT", dirR.error.message);
  return loadSkillFromDir(dirR.path);
}
