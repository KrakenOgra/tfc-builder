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
  direction?: "before" | "after";
  reason?: string;
}

export interface SpecYaml {
  id: string;
  name: string;
  version: string;
  category: string;
  // Absent in v1 specs — scoring defaults to "domain-expert" for back-compat
  archetype?: Archetype;
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
