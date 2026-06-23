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
  withContext: z.boolean().optional(),
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
  live: z.boolean().optional(),
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

// v4 W1: portable context layer — model-free stub scaffolding + audit + re-stamp. category is
// the taxonomy DOMAIN (e.g. content/social); name locates the skill by its directory name.
export const tfcContextInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  files: z.array(z.string().min(1)).optional(),
  dryRun: z.boolean().optional(),
});

export const tfcContextAuditInput = z
  .object({
    asOf: z.string().min(1).optional(),
    staleDays: z.number().int().min(1).optional(),
  })
  .optional();

export const tfcContextUpdateInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  file: z.string().min(1),
});

// v4 W2: resolve a skill's imports_context inheritance chain (depth ≤ 3, fails closed on cycle).
export const tfcComposeInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
});

// CCE v2 W1: deterministic ONLINE read — rank a skill's context/*.md bodies against a task and
// assemble the top-K within a token budget. Model-free (INV-4). name locates the skill by dir;
// domain is echoed (selects the angle manifest in later waves); task drives ranking.
export const tfcContextGetInput = z.object({
  name: z.string().min(1),
  task: z.string().min(1),
  domain: z.string().min(1).optional(),
  tokenBudget: z.number().int().min(1).optional(),
  topK: z.number().int().min(1).optional(),
});

// CCE v2 W3: OFFLINE grounded fill — harvest a skill's grounded sources + emit a fill prompt that
// Claude executes out-of-band. The tool itself is model-free (disk reads + string assembly, INV-4).
export const tfcContextFillInput = z.object({
  name: z.string().min(1),
  domain: z.string().min(1),
});

// CCE v2 W4: read-only domain discovery — taxonomy domains ∪ per-skill _angles.yaml manifests.
export const tfcContextDiscoverInput = z.object({}).optional();

// CCE v2 W5: angle-completeness coverage for one skill (answered angles / declared angles).
export const tfcContextCoverageInput = z.object({
  name: z.string().min(1),
});

// Forge: derive a domain context/ scaffold FROM SKILL.md for ANY domain (no taxonomy entry needed).
// Writes context/_angles.yaml + DV2 stubs (synthesized:true) + emits an OFFLINE grounded generation
// prompt. Model-free core (INV-4); the prompt fills bodies out-of-band.
export const tfcContextForgeInput = z.object({
  name: z.string().min(1),
  deep: z.boolean().optional(),
  types: z.array(z.string().min(1)).optional(),
  preview: z.boolean().optional(),
});

// Foundry W-A: record a section receipt — a real build retrieved this angle's file and passed/failed.
export const tfcContextReceiptInput = z.object({
  name: z.string().min(1),
  file: z.string().min(1),
  task: z.string().min(1),
  passed: z.boolean(),
});

// Foundry W-A: promote angles by receipt — required iff >= minReceipts passing receipts, else provisional.
export const tfcContextPromoteInput = z.object({
  name: z.string().min(1),
  minReceipts: z.number().int().positive().optional(),
});

// v4 W5: read-only discovery graph + recommendations (model-free).
export const tfcGraphInput = z.object({}).optional();

export const tfcRecommendInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
});
