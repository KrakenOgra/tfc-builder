import * as nodePath from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { fail, ok, type Result } from "./result.js";
import { exists, readText } from "./fs.js";
import { skillDir, MCP_CONFIG } from "./paths.js";
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

function gateSpecificity(skill: LoadedSkill): CheckOutcome {
  return { passed: skill.skillMdText.includes("Specificity:") };
}

function gateBonding(skill: LoadedSkill): CheckOutcome {
  return { passed: skill.skillMdText.includes("Bonding:") };
}

function gateOpenLoop(skill: LoadedSkill): CheckOutcome {
  return { passed: skill.skillMdText.includes("Open loop:") };
}

function gateRhythm(skill: LoadedSkill): CheckOutcome {
  const md = skill.skillMdText;
  return { passed: md.includes("Rhythm:") && md.includes("fixed epithet") };
}

function gateMemeticShare(skill: LoadedSkill): CheckOutcome {
  const md = skill.skillMdText;
  return { passed: md.includes("Memetic share:") && md.includes("STEPPS") };
}

function gateGenericityStrip(skill: LoadedSkill): CheckOutcome {
  return { passed: skill.skillMdText.includes("Genericity strip:") };
}

function noBlendGate(skill: LoadedSkill): CheckOutcome {
  const md = skill.skillMdText;
  return { passed: md.includes("One voice only") || md.includes("never blended") };
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
  ["gate-specificity", gateSpecificity],
  ["gate-bonding", gateBonding],
  ["gate-open-loop", gateOpenLoop],
  ["gate-rhythm", gateRhythm],
  ["gate-memetic-share", gateMemeticShare],
  ["gate-genericity-strip", gateGenericityStrip],
  ["no-blend-gate", noBlendGate],
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
