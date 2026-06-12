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
