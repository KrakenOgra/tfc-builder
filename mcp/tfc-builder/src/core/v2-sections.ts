// TFC v2 "Executable Skills OS" — the compiled-from-spec sections.
//
// These layers have no dedicated generator tool; tfc_assemble compiles each directly from
// a spec.yaml field. Every function is a pure string emitter (INV-1: no model call, no file
// write) and returns "" when its source field is absent, so the assembler simply omits the
// section for v1 specs (back-compat).
//
// Covered: Layer 7 (Capability Inventory), 10 (Input Parser), 11 (Scope Guard),
// 12 (Dependency Graph), 14 (Recovery Protocol), 15 (State Tracker), 16 (Quality Rubric),
// 17 (Escalation Ladder), 19 (Tool Availability Check), 20 (Cross-Skill Invocation),
// 21 (Memory Protocol), 22 (Self-Improvement Hook).

import type {
  Capability,
  CrossSkillInvocation,
  EscalationRules,
  MemoryProtocol,
  ModeCheck,
  PhaseDependency,
  QualityRubricEntry,
  RecoveryProtocolEntry,
  SelfImprovement,
  SkillInput,
} from "./types.js";

// ── Layer 7 — CAPABILITY INVENTORY ──────────────────────────────────────────────
export function buildCapabilityInventory(capabilities?: Capability[]): string {
  const caps = capabilities ?? [];
  if (caps.length === 0) return "";

  const rows = caps.map((c) => {
    const kw = (c.triggers?.keywords ?? []).join(", ");
    const mode = c.triggers?.mode ?? "any";
    const preset = c.preset ?? "(always)";
    return `| ${c.name} | ${kw} | ${mode} | ${preset} |`;
  });
  const defaultCap = caps.find((c) => c.preset === null) ?? caps[caps.length - 1];

  return `## CAPABILITY INVENTORY
<!-- tfc_assemble compiled from capabilities: spec -->

Each capability lists what activates it. Select the matching capability; use its preset.

| Capability | Triggers (keywords) | Mode Required | Preset |
|---|---|---|---|
${rows.join("\n")}

RULE: If user_request contains a trigger keyword, activate that capability.
DEFAULT: If no trigger matches, activate "${defaultCap?.name ?? "default"}".`;
}

// ── Layer 10 — INPUT PARSER ─────────────────────────────────────────────────────
export function buildInputParser(
  inputs?: SkillInput[],
  escalation?: EscalationRules,
): string {
  const ins = inputs ?? [];
  if (ins.length === 0) return "";

  const blocks = ins.map((inp) => {
    const constraint = inp.constraint ? ` — ${inp.constraint}` : "";
    return `  INPUT: ${inp.name} (${inp.type}${constraint})
    DETECT: Is ${inp.name} explicitly stated in user message?
      YES → EXTRACT ${inp.name} = [extracted_value]
      NO  → INFER using: ${inp.description}
        IF inferable → SET ${inp.name} = [inferred_value]
                       STATE: "Inferred ${inp.name}: [value] — [one-line reason]"
        IF NOT inferable → ESCALATE: "What ${inp.name}? (${inp.description})"`;
  });

  const resolved = ins
    .map((inp) => `    ${inp.name}: [value] ([extracted|inferred] — [basis])`)
    .join("\n");

  const maxEsc = escalation?.max_escalations ?? 3;

  return `## INPUT PARSER
<!-- tfc_assemble compiled from inputs: spec — EXECUTE AFTER SELECTOR LOGIC -->

FOR EACH required input (in order below):

${blocks.join("\n\n")}

BEFORE PHASE 1 — emit INPUTS RESOLVED block:
  INPUTS RESOLVED:
${resolved}

RULE: Attempt inference before escalating. Escalate ONLY inputs with no inference path.
MAX ESCALATIONS: ${maxEsc} total (from escalation_rules.max_escalations).
ANTI-PATTERN: "What [input_name] do you want?" without inference attempt first = failure.`;
}

// ── Layer 11 — SCOPE GUARD ──────────────────────────────────────────────────────
export function buildScopeGuard(doesNotOwn?: string[]): string {
  const items = doesNotOwn ?? [];
  if (items.length === 0) return "";

  const lines = items.map(
    (c) => `  ${c} → hand off to: the skill/tool that owns it`,
  );

  return `## SCOPE GUARD
<!-- tfc_assemble compiled from does_not_own: spec -->

This skill hands off when:
${lines.join("\n")}

RULE: On handoff trigger, STATE "SCOPE: out of bounds — [condition]; routing to [target]" before stopping.
NEVER: attempt in-scope emulation of an out-of-bounds task.`;
}

// ── Layer 12 — DEPENDENCY GRAPH ─────────────────────────────────────────────────
// In the deterministic doc the assembler emits one REQUIRES line per dependent phase
// (the spec's per-phase header prefix, collected into one section so the doc is self-contained).
export function buildDependencyGraph(deps?: PhaseDependency[]): string {
  const ds = deps ?? [];
  if (ds.length === 0) return "";

  const lines = ds.map((d) => {
    const on = (d.depends_on ?? []).join(", ") || "(none)";
    const arts = (d.required_artifacts ?? []).join(", ") || "(none)";
    return `  ${d.phase} — REQUIRES: ${on} — artifacts: ${arts}`;
  });

  return `## DEPENDENCY GRAPH
<!-- tfc_assemble compiled from phase_dependencies: spec -->

Each phase declares the phases that must GATE PASS first and the artifacts it consumes:

${lines.join("\n")}

RULE: A dependent phase emits "BLOCKED — dependency [phase] not complete; required artifact: [name]"
and does NOT execute until every depends_on phase has GATE PASS.`;
}

// ── Layer 14 — RECOVERY PROTOCOL ────────────────────────────────────────────────
export function buildRecoveryProtocol(recovery?: RecoveryProtocolEntry[]): string {
  const rs = recovery ?? [];
  if (rs.length === 0) return "";

  const blocks = rs.map((r) => {
    const f = r.on_failure ?? { max_retries: 1 };
    const retry = f.step_1 ?? "retry";
    const downgrade = f.step_2 ?? "reduce scope";
    const escalate = f.step_3 ?? "ask the user one question";
    const abort = f.step_4 ?? "stop the pipeline";
    return `PHASE ${r.phase}:
  STEP 1 — RETRY: ${retry} — re-run Phase ${r.phase} with same inputs (max ${f.max_retries ?? 1} times)
  STEP 2 — DOWNGRADE: ${downgrade}
  STEP 3 — ESCALATE: ${escalate} (only after STEP 2 fails)
  STEP 4 — ABORT: ${abort}; STATE "Phase ${r.phase} unrecoverable — [reason]"`;
  });

  return `## RECOVERY PROTOCOL
<!-- tfc_assemble compiled from recovery_protocol: spec -->

ON PHASE FAILURE — execute in order, do not skip levels:

${blocks.join("\n\n")}

RULE: Never jump from STEP 1 to STEP 3. Downgrade before asking.`;
}

// ── Layer 15 — STATE TRACKER (static template) ──────────────────────────────────
export function buildStateTracker(): string {
  return `## STATE TRACKER
<!-- append this compact block after each GATE PASS in the pipeline -->

STATE SNAPSHOT (replace previous; do not append):
  mode: [tool|prompt]
  preset: [selected_preset]
  phase_current: [phase_name]
  phases_passed: [list]
  inputs: {[input_name]: [value], ...}
  last_artifact: [artifact_name]
  escalations_used: [n] of [max]`;
}

// ── Layer 16 — QUALITY RUBRIC ───────────────────────────────────────────────────
export function buildQualityRubric(rubric?: QualityRubricEntry[]): string {
  const rs = rubric ?? [];
  if (rs.length === 0) return "";

  const blocks = rs.map((r) => {
    const checks = (r.checks ?? []).map(
      (c) =>
        `  CHECK: ${c.criterion} → observable: ${c.observable} → severity: ${c.severity}`,
    );
    return `PHASE ${r.phase}:
${checks.join("\n")}
  ON FAIL: BLOCK next phase; invoke Recovery Protocol
  ON WARN: STATE "[criterion]: warning — [observation]"; continue`;
  });

  return `## QUALITY RUBRIC
<!-- tfc_assemble compiled from quality_rubric: spec -->

After each phase, check the phase artifact against these criteria:

${blocks.join("\n\n")}`;
}

// ── Layer 17 — ESCALATION LADDER ────────────────────────────────────────────────
export function buildEscalationLadder(escalation?: EscalationRules): string {
  if (!escalation) return "";
  const threshold = escalation.inference_threshold ?? 0.6;
  const maxEsc = escalation.max_escalations ?? 3;

  return `## ESCALATION LADDER
<!-- tfc_assemble compiled from escalation_rules: spec -->

Inference-first policy. Execute in order. NEVER skip levels.

LEVEL 1 — INFER: if confidence >= ${threshold}, infer and STATE the inference
LEVEL 2 — DOWNGRADE: if inference below threshold, reduce scope and try again
LEVEL 3 — ASK: if downgrade fails, ask exactly one question (max ${maxEsc} total)
LEVEL 4 — ABORT: if ask fails or max_escalations reached, STATE reason and stop

APPLIES TO: all inputs, all phase decisions, all preset selections.
REPLACES: all "NEVER ASK" and "DO NOT ask" directives elsewhere in this skill.`;
}

// ── Layer 19 — TOOL AVAILABILITY CHECK ──────────────────────────────────────────
export function buildToolAvailabilityCheck(modeCheck?: ModeCheck): string {
  const tools = modeCheck?.required_tools ?? [];
  if (tools.length === 0) return "";

  const lines = tools.map(
    (t) => `  ${t}: callable? → YES: available | NO: degrade (see MODE STATES)`,
  );

  return `## TOOL AVAILABILITY CHECK
<!-- execute after MODE DECLARATION, before Phase 1 -->

CHECK EACH REQUIRED TOOL:
${lines.join("\n")}

DEGRADE RULE: if a required tool is unavailable, SET mode = "prompt" for phases that need it;
continue with remaining phases in available mode.
STATE: "TOOLS: [tool_1] available | [tool_2] unavailable — degrading affected phases to prompt mode"`;
}

// ── Layer 20 — CROSS-SKILL INVOCATION PROTOCOL ──────────────────────────────────
export function buildCrossSkillProtocol(
  invocations?: CrossSkillInvocation[],
): string {
  const is = invocations ?? [];
  if (is.length === 0) return "";

  const blocks = is.map((inv) => {
    const kw = `{${(inv.trigger?.keywords ?? []).join(", ")}}`;
    const phase = inv.trigger?.phase ?? null;
    const when = phase ? `before Phase ${phase}` : "before Phase 1 (pre-pipeline)";
    return `  SKILL: ${inv.skill}
    TRIGGER: user_request keywords ∩ ${kw} → invoke ${when}
    HANDOFF: pass ${inv.handoff_contract} from INPUTS RESOLVED block
    RETURN: receive ${inv.return_contract}; use it as execution input
    ON UNAVAILABLE: STATE "SKIP: ${inv.skill} unavailable — continuing without it"; continue`;
  });

  return `## CROSS-SKILL INVOCATION PROTOCOL
<!-- tfc_assemble compiled from cross_skill_invocations: spec -->

Invoke these skills automatically when trigger conditions are met — no user prompt required.

${blocks.join("\n\n")}

RULE: Check triggers after INPUTS RESOLVED. Invoke matching skills before Phase 1 begins.
NEVER: bury cross-skill calls in phase prose. This section is the single authority.`;
}

// ── Layer 21 — MEMORY PROTOCOL ──────────────────────────────────────────────────
export function buildMemoryProtocol(memory?: MemoryProtocol): string {
  if (!memory) return "";
  const retrieveAt = (memory.retrieve_at ?? []).join(", ") || "session_start";
  const storeOn = (memory.store_on ?? []).join(", ") || "phase_complete";

  return `## MEMORY PROTOCOL
<!-- tfc_assemble compiled from memory_protocol: spec -->

RETRIEVE at: ${retrieveAt}
  CALL: ${memory.retrieve_tool ?? "mind_retrieve"}(query="[skill] [domain] prior runs")
  USE: retrieved context to inform INPUTS RESOLVED inferences

STORE on: ${storeOn}
  CALL: ${memory.store_tool ?? "mind_remember"}(content=[event_summary], salience=${memory.store_salience ?? 0.5})
  STORE: phase outcomes, gate blocks, user corrections, escalations

RULE: Retrieve before Phase 1 begins. Store after each meaningful event.`;
}

// ── Layer 22 — SELF-IMPROVEMENT HOOK ────────────────────────────────────────────
export function buildSelfImprovementHook(si?: SelfImprovement): string {
  if (!si) return "";
  const triggers = (si.learning_triggers ?? []).join(", ") || "gate_block";
  const focus = (si.eval_focus ?? []).join(", ") || "gate_pass_rate";

  return `## SELF-IMPROVEMENT HOOK
<!-- tfc_eval reads learning_triggers to target learnings.jsonl writes -->

This skill teaches tfc_eval which events to capture:

LEARNING TRIGGERS: ${triggers}
  gate_block → capture: which phase blocked, artifact state, check condition
  selector_miss → capture: input that triggered wrong preset, correct preset
  mode_fallback → capture: which tool was absent, fallback path taken

EVAL FOCUS: ${focus}
  selector_accuracy → measure: preset selected matches expected for input type
  gate_pass_rate → measure: phases that PASS gate on first attempt / total attempts

NOTE: tfc_evolve writes ONLY to sections matched by learning_triggers. Other sections unchanged.`;
}
