import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { exists, readText } from "./fs.js";
import { skillDir } from "./paths.js";
import { readYaml } from "./yamlio.js";
import type { SpecYaml } from "./types.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LoadedSkill {
  dirName: string;
  specYaml: SpecYaml;
  skillMdText: string;
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
  const marker = `## ${heading}`;
  const start = text.indexOf(marker);
  if (start === -1) return "";
  const afterNewline = text.indexOf("\n", start) + 1;
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

function modelTierDeclared(skill: LoadedSkill): CheckOutcome {
  const tier = skill.specYaml.model_tier;
  const passed = tier === "opus" || tier === "sonnet" || tier === "haiku";
  return { passed };
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
  ["model-tier-declared", modelTierDeclared],
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
