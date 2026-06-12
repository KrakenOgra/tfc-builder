import { fail, type Result } from "../core/result.js";
import {
  buildBrainstormPrompt,
  buildGeneratePrompt,
  type AuthoringResult,
} from "../core/authoring.js";
import { scaffoldSkill, type CreatedPaths } from "../core/scaffold.js";
import { validateSkill, type ValidationReport } from "../core/validate.js";
import { scoreSkill, type ScoreReport } from "../core/score.js";
import { migrateSkill, type MigrationPlan } from "../core/migrate.js";
import {
  installSkill,
  registerSkill,
  listSkills,
  type InstallResult,
  type ListResult,
} from "../core/install.js";
import {
  tfcBrainstormInput,
  tfcGenerateInput,
  tfcInstallInput,
  tfcListInput,
  tfcMigrateInput,
  tfcNewInput,
  tfcRegisterInput,
  tfcScoreInput,
  tfcValidateInput,
} from "./schemas.js";

// Re-export schemas for consumers (registry, tests)
export {
  tfcBrainstormInput,
  tfcGenerateInput,
  tfcInstallInput,
  tfcListInput,
  tfcMigrateInput,
  tfcNewInput,
  tfcRegisterInput,
  tfcScoreInput,
  tfcValidateInput,
};

// ── tfc_new — IMPLEMENTED ─────────────────────────────────────────────────────

export async function tfcNewHandler(
  input: unknown,
): Promise<Result<CreatedPaths>> {
  const parsed = tfcNewInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name, archetype } = parsed.data;
  const dryRun = parsed.data.dryRun ?? false;
  return scaffoldSkill({
    category,
    name,
    dryRun,
    ...(archetype ? { archetype } : {}),
  });
}

// ── Stubs (land in later files) ───────────────────────────────────────────────

// ── tfc_brainstorm — IMPLEMENTED ─────────────────────────────────────────────

export async function tfcBrainstormHandler(
  input: unknown,
): Promise<Result<AuthoringResult>> {
  const parsed = tfcBrainstormInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { name, category, intent } = parsed.data;
  return buildBrainstormPrompt({ name, category, intent });
}

// ── tfc_generate — IMPLEMENTED ───────────────────────────────────────────────

export async function tfcGenerateHandler(
  input: unknown,
): Promise<Result<AuthoringResult>> {
  const parsed = tfcGenerateInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name, layers } = parsed.data;
  return buildGeneratePrompt({ category, name, layers });
}

// ── tfc_validate — IMPLEMENTED ───────────────────────────────────────────────

export async function tfcValidateHandler(
  input: unknown,
): Promise<Result<ValidationReport>> {
  const parsed = tfcValidateInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name } = parsed.data;
  return validateSkill({ category, name });
}

// ── tfc_score — IMPLEMENTED ───────────────────────────────────────────────────

export async function tfcScoreHandler(
  input: unknown,
): Promise<Result<ScoreReport>> {
  const parsed = tfcScoreInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name } = parsed.data;
  return scoreSkill({ category, name });
}

// ── tfc_migrate — IMPLEMENTED ────────────────────────────────────────────────

export async function tfcMigrateHandler(
  input: unknown,
): Promise<Result<MigrationPlan>> {
  const parsed = tfcMigrateInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { sourcePath, sourceType, category, name } = parsed.data;
  const dryRun = parsed.data.dryRun ?? false;
  return migrateSkill({ sourcePath, sourceType, category, name, dryRun });
}

// ── tfc_install — IMPLEMENTED ────────────────────────────────────────────────

export async function tfcInstallHandler(
  input: unknown,
): Promise<Result<InstallResult>> {
  const parsed = tfcInstallInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name } = parsed.data;
  const dryRun = parsed.data.dryRun ?? false;
  return installSkill({ category, name, dryRun });
}

// ── tfc_register — IMPLEMENTED ───────────────────────────────────────────────

export async function tfcRegisterHandler(
  input: unknown,
): Promise<Result<{ spawnerLink: string; hint: string }>> {
  const parsed = tfcRegisterInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name } = parsed.data;
  return registerSkill({ category, name });
}

// ── tfc_list — IMPLEMENTED ───────────────────────────────────────────────────

export async function tfcListHandler(
  input: unknown,
): Promise<Result<ListResult>> {
  const parsed = tfcListInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const brokenOnly = parsed.data.brokenOnly ?? false;
  return listSkills({ brokenOnly });
}
