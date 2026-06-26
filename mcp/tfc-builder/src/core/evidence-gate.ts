// TFC v2 Layer 13 — EVIDENCE GATES generator (tfc_evidence_gate).
//
// The highest-value Execution-Group section. Reads spec.evidence_gates and emits one
// GATE block per phase: ARTIFACT + CHECK + STATE-ON-PASS + BLOCK-IF + STATE-ON-BLOCK +
// ON-BLOCK. next_phase is derived from the phases[] array by index so a blocked phase
// names the phase it must not begin.
//
// INV-1: pure function. No model call, no file write.

import type { EvidenceGate } from "./types.js";

export interface EvidenceGateInput {
  evidenceGates: EvidenceGate[];
  phases: string[]; // ordered phase names — for next-phase lookup in ON-BLOCK lines
}

export interface EvidenceGateResult {
  section: string;
}

/**
 * Generates the EVIDENCE GATES section, one GATE block per evidence_gates entry.
 * The "do not begin [next]" target is the next phase in phases[] after this gate's phase,
 * falling back to "the next phase" when this is the last/unknown phase.
 */
export function buildEvidenceGateSection(
  input: EvidenceGateInput,
): EvidenceGateResult {
  const gates = input.evidenceGates ?? [];
  const phases = input.phases ?? [];

  const blocks = gates.map((g) => {
    const next = nextPhase(phases, g.phase);
    return `PHASE ${g.phase} GATE:
  ARTIFACT: ${g.artifact}
  CHECK: ${g.check}
  STATE-ON-PASS: "Phase ${g.phase} PASS — artifact: ${g.artifact}, ${g.check}"
  BLOCK-IF: ${g.block_if}
  STATE-ON-BLOCK: "Phase ${g.phase} BLOCKED — ${g.artifact}: ${g.block_if}. Invoking recovery."
  ON-BLOCK: execute Recovery Protocol for Phase ${g.phase}; DO NOT begin ${next}`;
  });

  const body =
    blocks.length > 0
      ? blocks.join("\n\n")
      : "(no evidence_gates declared — add gates: per phase to make the pipeline observable)";

  const section = `## EVIDENCE GATES
<!-- tfc_evidence_gate generated — one GATE block per phase -->

${body}

PIPELINE RULE: Phase N+1 MUST NOT begin until Phase N GATE result = PASS.
ANTI-PATTERN: "Phase N complete" without emitting GATE PASS = automatic BLOCK on Phase N+1.`;

  return { section };
}

function nextPhase(phases: string[], current: string): string {
  const idx = phases.indexOf(current);
  if (idx === -1 || idx + 1 >= phases.length) return "the next phase";
  return phases[idx + 1] as string;
}
