import { describe, expect, it } from "vitest";
import { buildModeDeclareSection } from "../../src/core/mode-declare.js";
import { buildSelectorSection } from "../../src/core/selector.js";
import { buildEvidenceGateSection } from "../../src/core/evidence-gate.js";
import { buildContextRouterSection } from "../../src/core/context-router.js";
import {
  buildCapabilityInventory,
  buildInputParser,
  buildScopeGuard,
  buildDependencyGraph,
  buildRecoveryProtocol,
  buildQualityRubric,
  buildEscalationLadder,
  buildToolAvailabilityCheck,
  buildCrossSkillProtocol,
  buildMemoryProtocol,
  buildSelfImprovementHook,
} from "../../src/core/v2-sections.js";
import {
  assembleSkillMd,
  validateLayers,
  LAYER_SECTIONS,
} from "../../src/core/assemble.js";
import type {
  Capability,
  ContextRoute,
  EvidenceGate,
  SpecYaml,
} from "../../src/core/types.js";

// ── A complete Remotion v2 spec fixture (mirrors skills/ai-video/remotion-reel) ──
const CAPS: Capability[] = [
  {
    name: "viral-short",
    triggers: { keywords: ["viral", "hook", "tiktok", "trending"], mode: "any" },
    preset: "viral-9to16",
    description: "fast-cut, hook-first vertical reel tuned for reach",
  },
  {
    name: "talking-head",
    triggers: { keywords: ["talking head", "explainer"], mode: "any" },
    preset: "clean-talking-head",
    description: "single-speaker explainer with captions",
  },
  {
    name: "default-reel",
    triggers: { keywords: ["reel", "short", "video"], mode: "any" },
    preset: null,
    description: "general-purpose vertical reel",
  },
];

const PHASES = ["ingest", "stitch", "transcribe", "analyse", "script", "hook-gate", "render"];

const GATES: EvidenceGate[] = [
  {
    phase: "script",
    artifact: "script.json",
    check: "script.json EXISTS AND hooks.length >= 3",
    block_if: "script.json absent OR hooks.length < 3",
  },
  {
    phase: "render",
    artifact: "reel.mp4",
    check: "reel.mp4 EXISTS AND duration_s <= 90",
    block_if: "reel.mp4 absent OR duration_s > 90",
  },
];

const ROUTES: ContextRoute[] = Array.from({ length: 6 }, (_, i) => ({
  file: `ctx${i}.md`,
  load_when: { keywords: [`k${i}`], phases: ["render"], mode: "any" },
}));

function fullSpec(): SpecYaml {
  return {
    id: "remotion-reel",
    name: "Remotion Reel",
    version: "1.0.0",
    category: "ai-video",
    archetype: "workflow",
    description: "Turn raw clips into a finished vertical reel.",
    triggers: ["make a viral reel about"],
    model_tier: "sonnet",
    priority: 55,
    owns: ["reel-pipeline-orchestration"],
    does_not_own: ["idea-validation-pmf", "thumbnail-graphic-design"],
    pairs_with: [],
    requires: [],
    sharp_edges: [],
    skill_chain: [],
    required_sections: ["## EVIDENCE GATES"],
    scaffold_template: "## EVIDENCE GATES\n",
    can_execute_without_mcp: true,
    tags: ["video"],
    layer: 2,
    complexity: "high",
    phases: PHASES.map((name) => ({ name, artifact: `${name}.json`, acceptance: "EXISTS" })),
    inputs: [
      { name: "topic", type: "string", constraint: "non-empty", description: "subject of the reel" },
      { name: "platform", type: "enum", constraint: "tiktok|reels|shorts", description: "default tiktok" },
    ],
    capabilities: CAPS,
    mode_check: { required_tools: ["bash", "ffmpeg"], fallback: "prompt", detection_order: ["bash", "ffmpeg"] },
    evidence_gates: GATES,
    phase_dependencies: [
      { phase: "render", depends_on: ["hook-gate", "script"], required_artifacts: ["script.json"] },
    ],
    context_routing: ROUTES,
    context_max_load: 3,
    cross_skill_invocations: [
      {
        skill: "idearalph",
        trigger: { keywords: ["validate", "concept", "idea"], phase: null },
        handoff_contract: "topic + platform",
        return_contract: "scored hook concepts",
      },
    ],
    quality_rubric: [
      {
        phase: "script",
        checks: [{ criterion: "hook in first 3s", observable: "hooks[0].t_start <= 3", severity: "fail" }],
      },
    ],
    escalation_rules: { inference_threshold: 0.6, escalation_order: ["infer", "downgrade", "ask", "abort"], max_escalations: 2 },
    memory_protocol: {
      store_on: ["phase_complete", "gate_block"],
      retrieve_at: ["session_start"],
      store_tool: "mind_remember",
      retrieve_tool: "mind_retrieve",
      store_salience: 0.5,
    },
    self_improvement: { learning_triggers: ["gate_block", "selector_miss"], eval_focus: ["selector_accuracy", "gate_pass_rate"] },
    recovery_protocol: [
      { phase: "render", on_failure: { step_1: "retry", max_retries: 2, step_2: "downgrade", step_3: "escalate", step_4: "abort" } },
    ],
  };
}

// ── Wave 1 VERIFY — Mode Declaration + Capability Inventory + Selector Logic ─────
describe("Wave 1 — mode declaration + selector (no structural questions)", () => {
  it("MODE DECLARATION emits one CHECK per tool, named states, never-block fallback", () => {
    const { section } = buildModeDeclareSection({
      modeCheck: { required_tools: ["bash", "ffmpeg"], fallback: "prompt", detection_order: ["bash", "ffmpeg"] },
    });
    expect(section).toContain("## MODE DECLARATION");
    expect(section).toContain("CHECK: bash callable?");
    expect(section).toContain("CHECK: ffmpeg callable?");
    expect(section).toMatch(/MODE: \[tool\|prompt\]/);
    expect(section).toMatch(/NEVER: abort because a tool is unavailable/);
  });

  it("SELECTOR LOGIC is an IF/ELIF/ELSE tree with a mandatory PRESET STATE line", () => {
    const { section } = buildSelectorSection({ capabilities: CAPS });
    expect(section).toContain("## SELECTOR LOGIC");
    expect(section).toContain("DECISION TREE:");
    expect(section).toMatch(/\bIF\b/);
    expect(section).toMatch(/\bELIF\b/);
    expect(section).toMatch(/\bELSE\b/);
    expect(section).toMatch(/STATE: "PRESET: .+ — .+"/);
    // anti-pattern guard: the skill must never ask which preset
    expect(section).toMatch(/NEVER: emit "which preset/);
  });

  it("SELECTOR orders branches most-specific-first and uses null-preset cap as default", () => {
    const { section } = buildSelectorSection({ capabilities: CAPS });
    const viralIdx = section.indexOf("viral-9to16");
    const defaultIdx = section.indexOf("default-reel (default)");
    // viral-short (4 keywords) appears before the default ELSE branch
    expect(viralIdx).toBeGreaterThan(-1);
    expect(defaultIdx).toBeGreaterThan(viralIdx);
  });

  it("CAPABILITY INVENTORY renders one table row per capability", () => {
    const section = buildCapabilityInventory(CAPS);
    expect(section).toContain("## CAPABILITY INVENTORY");
    expect(section).toContain("| viral-short |");
    expect(section).toContain("| talking-head |");
    expect(section).toContain('DEFAULT: If no trigger matches, activate "default-reel"');
  });
});

// ── Wave 2 VERIFY — Input Parser + Evidence Gates ───────────────────────────────
describe("Wave 2 — input parser + evidence gates", () => {
  it("INPUT PARSER emits detect/infer/escalate per input + an INPUTS RESOLVED block", () => {
    const section = buildInputParser(fullSpec().inputs, fullSpec().escalation_rules);
    expect(section).toContain("## INPUT PARSER");
    expect(section).toContain("INPUT: topic");
    expect(section).toContain("DETECT:");
    expect(section).toMatch(/INFER using:/);
    expect(section).toContain("INPUTS RESOLVED:");
    expect(section).toContain("MAX ESCALATIONS: 2");
  });

  it("EVIDENCE GATES emit ARTIFACT+CHECK+PASS+BLOCK-IF+ON-BLOCK with next-phase lookup", () => {
    const { section } = buildEvidenceGateSection({ evidenceGates: GATES, phases: PHASES });
    expect(section).toContain("## EVIDENCE GATES");
    expect(section).toContain("PHASE script GATE:");
    expect(section).toContain("ARTIFACT: script.json");
    expect(section).toContain("CHECK: script.json EXISTS AND hooks.length >= 3");
    // the corrupted-artifact scenario from the spec: hooks.length < 3 blocks
    expect(section).toContain("BLOCK-IF: script.json absent OR hooks.length < 3");
    expect(section).toMatch(/STATE-ON-PASS: "Phase script PASS/);
    // next phase after "script" is "hook-gate"
    expect(section).toContain("DO NOT begin hook-gate");
    expect(section).toContain("PIPELINE RULE: Phase N+1 MUST NOT begin until Phase N GATE result = PASS.");
  });
});

// ── Wave 3 VERIFY — Context File Router + Tool Availability ──────────────────────
describe("Wave 3 — context router + tool availability", () => {
  it("CONTEXT ROUTER caps at max_load and emits a verifiable CONTEXT LOADED line", () => {
    const { section } = buildContextRouterSection({ contextRouting: ROUTES, maxLoad: 3 });
    expect(section).toContain("## CONTEXT FILE ROUTER");
    expect(section).toContain("max 3 per run");
    expect(section).toContain("Load top 3 files by keyword match count");
    expect(section).toMatch(/CONTEXT LOADED: .+ matched \[N\] of 6 triggers/);
    expect(section).toMatch(/ANTI-PATTERN: loading all context files/);
  });

  it("max_load 0 renders the kill-switch (load ALL) for debugging", () => {
    const { section } = buildContextRouterSection({ contextRouting: ROUTES, maxLoad: 0 });
    expect(section).toContain("kill-switch");
  });

  it("TOOL AVAILABILITY CHECK lists each required tool with a degrade path", () => {
    const section = buildToolAvailabilityCheck(fullSpec().mode_check);
    expect(section).toContain("## TOOL AVAILABILITY CHECK");
    expect(section).toContain("bash: callable?");
    expect(section).toContain("ffmpeg: callable?");
    expect(section).toMatch(/DEGRADE RULE:/);
  });
});

// ── Wave 4 VERIFY — Recovery + Escalation + State Tracker ────────────────────────
describe("Wave 4 — recovery + escalation + state tracker", () => {
  it("RECOVERY PROTOCOL emits retry→downgrade→escalate→abort in order", () => {
    const section = buildRecoveryProtocol(fullSpec().recovery_protocol);
    expect(section).toContain("## RECOVERY PROTOCOL");
    expect(section).toContain("PHASE render:");
    expect(section).toMatch(/STEP 1 — RETRY:.*max 2 times/);
    expect(section).toContain("STEP 2 — DOWNGRADE:");
    expect(section).toContain("STEP 3 — ESCALATE:");
    expect(section).toContain("STEP 4 — ABORT:");
    expect(section).toContain("Never jump from STEP 1 to STEP 3");
  });

  it("ESCALATION LADDER is a single inference-first authority", () => {
    const section = buildEscalationLadder(fullSpec().escalation_rules);
    expect(section).toContain("## ESCALATION LADDER");
    expect(section).toContain("LEVEL 1 — INFER: if confidence >= 0.6");
    expect(section).toContain("max 2 total");
    expect(section).toMatch(/REPLACES: all "NEVER ASK"/);
  });
});

// ── Wave 5 VERIFY — Cross-Skill + Memory + Self-Improvement ──────────────────────
describe("Wave 5 — cross-skill + memory + self-improvement", () => {
  it("CROSS-SKILL PROTOCOL auto-invokes idearalph pre-Phase-1 on validate/concept keywords", () => {
    const section = buildCrossSkillProtocol(fullSpec().cross_skill_invocations);
    expect(section).toContain("## CROSS-SKILL INVOCATION PROTOCOL");
    expect(section).toContain("SKILL: idearalph");
    expect(section).toContain("{validate, concept, idea}");
    expect(section).toContain("before Phase 1 (pre-pipeline)");
    expect(section).toMatch(/no user prompt required/);
  });

  it("MEMORY PROTOCOL routes to mind tools with retrieve-then-store", () => {
    const section = buildMemoryProtocol(fullSpec().memory_protocol);
    expect(section).toContain("## MEMORY PROTOCOL");
    expect(section).toContain("mind_retrieve");
    expect(section).toContain("mind_remember");
    expect(section).toContain("salience=0.5");
  });

  it("SELF-IMPROVEMENT HOOK names the learning triggers + eval focus", () => {
    const section = buildSelfImprovementHook(fullSpec().self_improvement);
    expect(section).toContain("## SELF-IMPROVEMENT HOOK");
    expect(section).toContain("LEARNING TRIGGERS: gate_block, selector_miss");
    expect(section).toContain("EVAL FOCUS: selector_accuracy, gate_pass_rate");
  });
});

// ── Wave 6 VERIFY — Dependency Graph + Quality Rubric + Scope Guard ──────────────
describe("Wave 6 — dependency graph + quality rubric + scope guard", () => {
  it("DEPENDENCY GRAPH emits REQUIRES + artifacts per dependent phase", () => {
    const section = buildDependencyGraph(fullSpec().phase_dependencies);
    expect(section).toContain("## DEPENDENCY GRAPH");
    expect(section).toContain("render — REQUIRES: hook-gate, script — artifacts: script.json");
    expect(section).toMatch(/BLOCKED — dependency \[phase\] not complete/);
  });

  it("QUALITY RUBRIC emits observable checks with severities", () => {
    const section = buildQualityRubric(fullSpec().quality_rubric);
    expect(section).toContain("## QUALITY RUBRIC");
    expect(section).toContain("PHASE script:");
    expect(section).toContain("severity: fail");
  });

  it("SCOPE GUARD lists does_not_own handoff conditions", () => {
    const section = buildScopeGuard(fullSpec().does_not_own);
    expect(section).toContain("## SCOPE GUARD");
    expect(section).toContain("idea-validation-pmf");
    expect(section).toContain("thumbnail-graphic-design");
  });
});

// ── Wave 7 VERIFY — full 22-layer assembly + validateLayers ──────────────────────
describe("Wave 7 — 22-layer assembly (the §0 measurable success test, structural)", () => {
  it("a fully-populated spec assembles to 22/22 layers present", () => {
    const { markdown } = assembleSkillMd({ spec: fullSpec() });
    const report = validateLayers(markdown);
    expect(report.summary).toBe("22/22 layers present");
    expect(report.missing).toHaveLength(0);
  });

  it("emits the 4 section groups in order: Identity → Capability → Execution → Integration", () => {
    const { markdown } = assembleSkillMd({ spec: fullSpec() });
    const persona = markdown.indexOf("## EXPERT PERSONA"); // Identity
    const mode = markdown.indexOf("## MODE DECLARATION"); // Capability
    const gates = markdown.indexOf("## EVIDENCE GATES"); // Execution
    const router = markdown.indexOf("## CONTEXT FILE ROUTER"); // Integration
    expect(persona).toBeGreaterThan(-1);
    expect(mode).toBeGreaterThan(persona);
    expect(gates).toBeGreaterThan(mode);
    expect(router).toBeGreaterThan(gates);
  });

  it("the assembled doc carries the §0 pre-Phase-1 execution markers", () => {
    const { markdown } = assembleSkillMd({ spec: fullSpec() });
    expect(markdown).toMatch(/MODE: \[tool\|prompt\]/); // check 1
    expect(markdown).toMatch(/STATE: "PRESET:/); // check 2
    expect(markdown).toContain("INPUTS RESOLVED:"); // check 3
    expect(markdown).toMatch(/NEVER: emit "which preset/); // check 4 (no structural question)
    expect(markdown).toMatch(/STATE-ON-PASS: "Phase .+ PASS/); // check 5
  });

  it("a v1 spec (no v2 fields) reports a partial layer count — the upgrade signal", () => {
    const v1: SpecYaml = {
      ...fullSpec(),
      phases: undefined,
      inputs: undefined,
      capabilities: undefined,
      mode_check: undefined,
      evidence_gates: undefined,
      phase_dependencies: undefined,
      context_routing: undefined,
      cross_skill_invocations: undefined,
      quality_rubric: undefined,
      escalation_rules: undefined,
      memory_protocol: undefined,
      self_improvement: undefined,
      recovery_protocol: undefined,
    };
    const { markdown } = assembleSkillMd({ spec: v1 });
    const report = validateLayers(markdown);
    // identity stub (1-6) + scope guard (does_not_own present) = 7 layers; the rest absent
    expect(report.present).toBeLessThan(22);
    expect(report.present).toBeGreaterThanOrEqual(6);
  });

  it("LAYER_SECTIONS declares exactly 22 canonical layers across 4 groups", () => {
    expect(LAYER_SECTIONS).toHaveLength(22);
    const groups = new Set(LAYER_SECTIONS.map((l) => l.group));
    expect(groups).toEqual(new Set(["Identity", "Capability", "Execution", "Integration"]));
  });
});
