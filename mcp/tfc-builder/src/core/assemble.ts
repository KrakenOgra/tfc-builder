// TFC v2 "Executable Skills OS" — the 22-layer SKILL.md assembler (tfc_assemble).
//
// This is the deterministic counterpart to the prompt-based tfc_generate. Where tfc_generate
// returns a prompt for Claude to fill identity sections, tfc_assemble reads a spec.yaml and
// emits a complete SKILL.md whose 16 decision-structure layers (7–22) are GENERATED, not
// prose — so a fresh LLM can EXECUTE the skill as a decision graph without clarification.
//
// Group order (spec §SKILL.MD TEMPLATE): Runtime Hook → Identity → Capability → Execution →
// Integration. assembleSkillMd is a pure string builder; the tfc_assemble handler is the only
// writer (it persists the result to SKILL.md, like tfc_install / tfc_new).

import { buildPreambleHook } from "./preamble.js";
import { buildModeDeclareSection } from "./mode-declare.js";
import { buildSelectorSection } from "./selector.js";
import { buildEvidenceGateSection } from "./evidence-gate.js";
import { buildContextRouterSection } from "./context-router.js";
import {
  buildCapabilityInventory,
  buildCrossSkillProtocol,
  buildDependencyGraph,
  buildEscalationLadder,
  buildInputParser,
  buildMemoryProtocol,
  buildQualityRubric,
  buildRecoveryProtocol,
  buildScopeGuard,
  buildSelfImprovementHook,
  buildStateTracker,
  buildToolAvailabilityCheck,
} from "./v2-sections.js";
import type { SpecYaml } from "./types.js";

const DEFAULT_MAX_LOAD = 3;

// The 22 canonical layer markers, in spec group order. validateLayers counts presence by header.
export const LAYER_SECTIONS: ReadonlyArray<{ layer: number; header: string; group: string }> = [
  { layer: 1, header: "## EXPERT PERSONA", group: "Identity" },
  { layer: 2, header: "## BEHAVIORAL CONSTRAINTS", group: "Identity" },
  { layer: 3, header: "## KNOWN-GOOD RECIPES", group: "Identity" },
  { layer: 4, header: "## BATTLE SCARS", group: "Identity" },
  { layer: 5, header: "## BOUNDARY CONTRACTS", group: "Identity" },
  { layer: 6, header: "## IMMEDIATE ACTIONS", group: "Identity" },
  { layer: 9, header: "## MODE DECLARATION", group: "Capability" },
  { layer: 7, header: "## CAPABILITY INVENTORY", group: "Capability" },
  { layer: 8, header: "## SELECTOR LOGIC", group: "Capability" },
  { layer: 10, header: "## INPUT PARSER", group: "Capability" },
  { layer: 11, header: "## SCOPE GUARD", group: "Capability" },
  { layer: 13, header: "## EVIDENCE GATES", group: "Execution" },
  { layer: 12, header: "## DEPENDENCY GRAPH", group: "Execution" },
  { layer: 14, header: "## RECOVERY PROTOCOL", group: "Execution" },
  { layer: 15, header: "## STATE TRACKER", group: "Execution" },
  { layer: 16, header: "## QUALITY RUBRIC", group: "Execution" },
  { layer: 17, header: "## ESCALATION LADDER", group: "Execution" },
  { layer: 18, header: "## CONTEXT FILE ROUTER", group: "Integration" },
  { layer: 19, header: "## TOOL AVAILABILITY CHECK", group: "Integration" },
  { layer: 20, header: "## CROSS-SKILL INVOCATION PROTOCOL", group: "Integration" },
  { layer: 21, header: "## MEMORY PROTOCOL", group: "Integration" },
  { layer: 22, header: "## SELF-IMPROVEMENT HOOK", group: "Integration" },
];

export interface AssembleInput {
  spec: SpecYaml;
  /** existing authored Identity-group markdown to preserve verbatim; absent ⇒ spec-derived stub. */
  identityMarkdown?: string;
}

export interface AssembleResult {
  markdown: string;
}

/** Ordered phase names for next-phase lookup: prefer phases[], fall back to evidence_gates order. */
function phaseNames(spec: SpecYaml): string[] {
  const fromPhases = (spec.phases ?? [])
    .map((p) => p.name)
    .filter((n): n is string => Boolean(n));
  if (fromPhases.length > 0) return fromPhases;
  return (spec.evidence_gates ?? []).map((g) => g.phase);
}

/** Layer 1–6 identity stub compiled from spec fields when no authored identity is supplied. */
function buildIdentityStub(spec: SpecYaml): string {
  const owns = (spec.owns ?? []).join(", ") || "(declare owns: in spec.yaml)";
  const notOwns = (spec.does_not_own ?? []).join(", ") || "(declare does_not_own:)";
  const scars =
    (spec.sharp_edges ?? [])
      .map((e) => `- **${e.summary}** — ${e.why} → ${e.solution}`)
      .join("\n") || "- (no sharp_edges declared)";

  return `## EXPERT PERSONA
${spec.description?.trim() || `You are the ${spec.name} expert.`}

## BEHAVIORAL CONSTRAINTS
ALWAYS: stay within owns — ${owns}.
NEVER: act on does_not_own — ${notOwns}.

## KNOWN-GOOD RECIPES
Use the CAPABILITY INVENTORY + SELECTOR LOGIC below to pick the recipe (preset) for the request.

## BATTLE SCARS
${scars}

## BOUNDARY CONTRACTS
Owns: ${owns}
Does not own: ${notOwns} (see SCOPE GUARD for handoff conditions).

## IMMEDIATE ACTIONS
1. Run MODE DECLARATION → STATE "MODE: ...".
2. Run SELECTOR LOGIC → STATE "PRESET: ...".
3. Run INPUT PARSER → emit "INPUTS RESOLVED:".`;
}

/**
 * Assemble the full 22-layer SKILL.md from a spec. Sections whose source field is absent
 * are omitted (their layer reports absent in validateLayers) — that is the v1→v2 upgrade signal.
 */
export function assembleSkillMd(input: AssembleInput): AssembleResult {
  const { spec } = input;
  const phases = phaseNames(spec);
  const sections: string[] = [];

  // 1. Runtime Hook (existing preamble) — unchanged.
  sections.push(buildPreambleHook(spec.category, spec.id));

  // 2. IDENTITY GROUP (layers 1–6).
  sections.push(input.identityMarkdown?.trim() || buildIdentityStub(spec));

  // 3. CAPABILITY GROUP (Mode Declaration first).
  if (spec.mode_check)
    sections.push(buildModeDeclareSection({ modeCheck: spec.mode_check }).section);
  pushIf(sections, buildCapabilityInventory(spec.capabilities));
  if (spec.capabilities && spec.capabilities.length > 0)
    sections.push(buildSelectorSection({ capabilities: spec.capabilities }).section);
  pushIf(sections, buildInputParser(spec.inputs, spec.escalation_rules));
  pushIf(sections, buildScopeGuard(spec.does_not_own));

  // 4. EXECUTION GROUP.
  if (spec.evidence_gates && spec.evidence_gates.length > 0)
    sections.push(
      buildEvidenceGateSection({ evidenceGates: spec.evidence_gates, phases }).section,
    );
  pushIf(sections, buildDependencyGraph(spec.phase_dependencies));
  pushIf(sections, buildRecoveryProtocol(spec.recovery_protocol));
  // State Tracker is a static template — only emit it when the skill has phases to track.
  if (phases.length > 0) sections.push(buildStateTracker());
  pushIf(sections, buildQualityRubric(spec.quality_rubric));
  pushIf(sections, buildEscalationLadder(spec.escalation_rules));

  // 5. INTEGRATION GROUP.
  if (spec.context_routing && spec.context_routing.length > 0)
    sections.push(
      buildContextRouterSection({
        contextRouting: spec.context_routing,
        maxLoad: spec.context_max_load ?? DEFAULT_MAX_LOAD,
      }).section,
    );
  pushIf(sections, buildToolAvailabilityCheck(spec.mode_check));
  pushIf(sections, buildCrossSkillProtocol(spec.cross_skill_invocations));
  pushIf(sections, buildMemoryProtocol(spec.memory_protocol));
  pushIf(sections, buildSelfImprovementHook(spec.self_improvement));

  return { markdown: sections.join("\n\n---\n\n") + "\n" };
}

function pushIf(sections: string[], section: string): void {
  if (section.trim().length > 0) sections.push(section);
}

export interface LayerReport {
  present: number;
  total: number;
  missing: Array<{ layer: number; header: string; group: string }>;
  summary: string; // e.g. "22/22 layers present"
}

/** Count how many of the 22 canonical layer sections appear in an assembled SKILL.md. */
export function validateLayers(markdown: string): LayerReport {
  const total = LAYER_SECTIONS.length;
  const missing = LAYER_SECTIONS.filter(
    (l) => !markdown.includes(l.header),
  );
  const present = total - missing.length;
  return {
    present,
    total,
    missing,
    summary: `${present}/${total} layers present`,
  };
}
