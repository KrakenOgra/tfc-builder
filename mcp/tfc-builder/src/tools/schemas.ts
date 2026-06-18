import { z } from "zod";

export const archetypeEnum = z.enum([
  "domain-expert",
  "workflow",
  "hybrid",
  "reference",
]);

export const tfcNewInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  archetype: archetypeEnum.optional(),
  dryRun: z.boolean().optional(),
});

export const tfcBrainstormInput = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  intent: z.string().min(1),
});

export const tfcGenerateInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  layers: z.array(z.string().min(1)).min(1),
});

export const tfcValidateInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
});

export const tfcScoreInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
});

export const tfcMigrateInput = z.object({
  sourcePath: z.string().min(1),
  sourceType: z.enum(["spawner", "gstack"]),
  category: z.string().min(1),
  name: z.string().min(1),
  dryRun: z.boolean().optional(),
});

export const tfcInstallInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  dryRun: z.boolean().optional(),
});

export const tfcRegisterInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
});

export const tfcListInput = z.object({
  brokenOnly: z.boolean().optional(),
});

export const tfcLaneInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
});

export const tfcEvalInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  taskIds: z.array(z.string().min(1)).optional(),
});

export const tfcEvolveInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  force: z.boolean().optional(),
  dryRun: z.boolean().optional(),
});

export const tfcPackBridgeInput = z.object({
  packsFile: z.string().min(1).optional(),
});

export const tfcCompileInput = z.object({
  intent: z.string().min(1),
  context: z.string().min(1).optional(),
});

export const tfcDoctorInput = z.object({}).optional();

// Wave 1 (v3): wire/verify continuous capture. audit ⇒ read-only portfolio of the loop's
// input side; otherwise wire the preamble hook (one skill if category+name, else all).
export const tfcCaptureInput = z.object({
  audit: z.boolean().optional(),
  category: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  dryRun: z.boolean().optional(),
});

// Wave 2 (v3): repair route integrity. One skill if category+name, else all. dryRun renders
// the plan. Recreates missing/dangling links + de-dups identical copies; reports real conflicts.
export const tfcRelinkInput = z.object({
  category: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  dryRun: z.boolean().optional(),
});

// Wave 3 (v3): perishable-proof read overlay. asOf is the explicit reference instant (the tool
// boundary defaults it to now — never the verdict, INV-7). Reports stale + dropped effectiveLane.
export const tfcDecayInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  asOf: z.string().min(1).optional(),
});

// Wave 4 (v3): N-sample eval stability quorum. samples defaults to 3 at the boundary.
export const tfcReplayInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  samples: z.number().int().min(2).optional(),
});

// Wave 5 (v3): one-currency portfolio rollup. asOf (for decay pressure) defaults to now.
export const tfcPortfolioInput = z
  .object({ asOf: z.string().min(1).optional() })
  .optional();

// v3 Cognitive Protocol W3: behavioral QA — deterministic, no model call.
export const tfcBehavioralInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
});

// v3 Cognitive Protocol W5: write a validated integration contract (pairs_with OR requires).
export const tfcIntegrateInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  system: z.string().min(1),
  direction: z.enum(["before", "after", "parallel"]).optional(),
  reason: z.string().min(1).optional(),
  dryRun: z.boolean().optional(),
});
