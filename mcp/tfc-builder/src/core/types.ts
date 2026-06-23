export type ModelTier = "opus" | "sonnet" | "haiku";
export type SkillLayer = 1 | 2 | 3;
export type Complexity = "L1" | "L2" | "L3" | "L4";
export type Archetype = "domain-expert" | "workflow" | "hybrid" | "reference";

export const ARCHETYPES: readonly Archetype[] = [
  "domain-expert",
  "workflow",
  "hybrid",
  "reference",
];

export const DEFAULT_ARCHETYPE: Archetype = "domain-expert";

// ── Evidence lanes ──────────────────────────────────────────────────────────────
// An EARNED state, recomputed from disk by core/lane.ts — never asserted by hand.
// authored → eval_proven → evolution_proven. The spec.yaml `lane.state` field is a
// CACHE; the contract files (eval-report.json, CHANGELOG.jsonl, spec.version) are truth.
export type Lane = "authored" | "eval_proven" | "evolution_proven";

export const LANES: readonly Lane[] = [
  "authored",
  "eval_proven",
  "evolution_proven",
];

export interface SharpEdge {
  id: string;
  summary: string;
  severity: "critical" | "high" | "medium";
  situation: string;
  why: string;
  solution: string;
  symptoms: string[];
  red_flags: string[];
}

export interface SkillChainEntry {
  skill: string;
  min_level: Complexity;
}

export interface PairsWith {
  skill?: string;
  direction?: "before" | "after" | "parallel";
  reason?: string;
}

// v3 W2 (Artifact-Declaration Contract): a workflow phase declares its output artifact
// and a MACHINE-SHAPED acceptance criterion. behavioral.ts + the phase-artifacts gate
// reject prose acceptance ("looks good") so phases are checkable without running an agent.
export interface PhaseSpec {
  name?: string;
  artifact: string;
  acceptance: string;
}

export interface SpecYaml {
  id: string;
  name: string;
  version: string;
  category: string;
  // Absent in v1 specs — scoring defaults to "domain-expert" for back-compat
  archetype?: Archetype;
  // CACHE of the earned evidence lane — recomputed from disk by core/lane.ts.
  // Absent in v1 specs; doctor flags drift between this and the recomputation.
  lane?: { state: Lane };
  // v3 W3: perishability horizon. Optional + back-compat: ABSENT ⇒ no decay pressure
  // (the proof never goes stale). When present, core/decay.ts compares the recorded proof
  // timestamp against an explicit as-of and drops the EFFECTIVE lane one rung if older.
  freshness_horizon?: { eval_days?: number; evolution_days?: number };
  description: string;
  triggers: string[];
  model_tier: ModelTier;
  priority: number;
  owns: string[];
  does_not_own: string[];
  pairs_with: PairsWith[];
  requires: string[];
  sharp_edges: SharpEdge[];
  skill_chain: SkillChainEntry[];
  required_sections: string[];
  scaffold_template: string;
  // v3 W2: per-phase artifact + acceptance contract. Absent ⇒ phase-artifacts gate passes
  // (back-compat, like archetype). When present, each entry must be well-formed.
  phases?: PhaseSpec[];
  // v3 W4: reasoning fragments inherited from skills/_fragments/. Absent ⇒ no inheritance;
  // every id present must resolve to a fragment.md or the imports-resolve gate fails-closed.
  imports?: string[];
  // v4 W1: domain-knowledge files that MUST exist in this skill's context/ dir. The
  // context-files-present gate (blocking) enforces it; absent ⇒ gate passes (back-compat). INV-9.
  requires_context?: string[];
  // v4 W2: inherit context from another skill (tfc_compose resolves the chain, depth ≤ 3). INV-10.
  imports_context?: { from: string; files?: string[] };
  // v4 W3: declares what this skill produces; output-schema-declared warns if absent on eval_proven+.
  output_schema?: { type: "sections" | "files" | "json"; required: string[] };
  // v4 W5: the skill id that replaces this one after decay (rendered by tfc_portfolio).
  succeeded_by?: string;
  can_execute_without_mcp: boolean;
  tags: string[];
  layer: SkillLayer;
  complexity: Complexity;
}

export interface TfcSkill {
  category: string;
  name: string;
  id: string;
  dir: string;
  spec: SpecYaml;
}

// ── Validation ────────────────────────────────────────────────────────────────

export interface ValidationCheck {
  id: string;
  description: string;
  passed: boolean;
  message?: string;
}

export interface ValidationResult {
  passed: boolean;
  blocking: ValidationCheck[];
  warnings: ValidationCheck[];
}

// v4 W3: a data-authored check — a presence assertion written in validations.yaml instead of a
// compiled function. The interpreter (core/checks.ts runDataCheck) resolves it with no new TS and
// no model call (INV-3/INV-4). params: { text } | { all: "a||b" } | { any: "a||b" } | { header } | { path }.
export type DataCheckKind = "contains" | "section" | "file-exists";

export interface DataCheck {
  id: string;
  kind: DataCheckKind;
  params: Record<string, string>;
  severity: "error" | "warning";
}

// ── Scoring ───────────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  identity: number;
  principles: number;
  patterns: number;
  antiPatterns: number;
  quickWins: number;
  handoffs: number;
  total: number;
}

export interface ScoreResult {
  score: number;
  breakdown: ScoreBreakdown;
  gaps: string[];
}

// ── Migration ─────────────────────────────────────────────────────────────────

export type SourceType = "spawner" | "gstack";

export interface LayerMapping {
  sourceField: string;
  targetSection: string;
  content?: string;
}

export interface MigrationPlan {
  sourcePath: string;
  sourceType: SourceType;
  targetCategory: string;
  targetName: string;
  layerMappings: LayerMapping[];
  promptTemplate: string;
}
