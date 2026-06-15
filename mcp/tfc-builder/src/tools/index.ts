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
  skillReachable,
  type InstallResult,
  type ListResult,
} from "../core/install.js";
import { recomputeLane, type LaneVerdict } from "../core/lane.js";
import { buildEvalPrompt, type EvalPromptResult } from "../core/evaluate.js";
import { buildEvolvePrompt, type EvolvePromptResult } from "../core/evolve.js";
import {
  buildPackBridgeReport,
  type PackBridgeReport,
} from "../core/packbridge.js";
import { runDoctor, type DoctorReport } from "../core/doctor.js";
import {
  buildCompilePrompt,
  type CompilePromptResult,
} from "../core/compile.js";
import {
  wireCapture,
  auditCapture,
  type WireCaptureResult,
  type CaptureAuditResult,
} from "../core/capture.js";
import { repairLinks, type RelinkResult } from "../core/relink.js";
import { laneAsOf, type DecayVerdict } from "../core/decay.js";
import { buildReplayPrompt, type ReplayPromptResult } from "../core/replay.js";
import { rollup, type PortfolioRollup } from "../core/portfolio.js";
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
  tfcLaneInput,
  tfcEvalInput,
  tfcEvolveInput,
  tfcPackBridgeInput,
  tfcDoctorInput,
  tfcCompileInput,
  tfcCaptureInput,
  tfcRelinkInput,
  tfcDecayInput,
  tfcReplayInput,
  tfcPortfolioInput,
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
  tfcLaneInput,
  tfcEvalInput,
  tfcEvolveInput,
  tfcPackBridgeInput,
  tfcDoctorInput,
  tfcCompileInput,
  tfcCaptureInput,
  tfcRelinkInput,
  tfcDecayInput,
  tfcReplayInput,
  tfcPortfolioInput,
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

// ── tfc_lane — IMPLEMENTED ────────────────────────────────────────────────────

export async function tfcLaneHandler(
  input: unknown,
): Promise<Result<LaneVerdict>> {
  const parsed = tfcLaneInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name } = parsed.data;
  // W2: feed real reachability so `tfc lane` reports effectiveLane:blocked for an unreachable skill.
  const reachable = await skillReachable(category, name);
  return recomputeLane(category, name, { reachable });
}

// ── tfc_eval — IMPLEMENTED ────────────────────────────────────────────────────

export async function tfcEvalHandler(
  input: unknown,
): Promise<Result<EvalPromptResult>> {
  const parsed = tfcEvalInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name, taskIds } = parsed.data;
  return buildEvalPrompt({
    category,
    name,
    ...(taskIds ? { taskIds } : {}),
  });
}

// ── tfc_evolve — IMPLEMENTED ──────────────────────────────────────────────────

export async function tfcEvolveHandler(
  input: unknown,
): Promise<Result<EvolvePromptResult>> {
  const parsed = tfcEvolveInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name, force, dryRun } = parsed.data;
  return buildEvolvePrompt({
    category,
    name,
    ...(force !== undefined ? { force } : {}),
    ...(dryRun !== undefined ? { dryRun } : {}),
  });
}

// ── tfc_pack_bridge — IMPLEMENTED ─────────────────────────────────────────────

export async function tfcPackBridgeHandler(
  input: unknown,
): Promise<Result<PackBridgeReport>> {
  const parsed = tfcPackBridgeInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { packsFile } = parsed.data;
  return buildPackBridgeReport(packsFile ? { packsFile } : {});
}

// ── tfc_doctor — IMPLEMENTED ──────────────────────────────────────────────────

export async function tfcDoctorHandler(
  input: unknown,
): Promise<Result<DoctorReport>> {
  const parsed = tfcDoctorInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  return runDoctor();
}

// ── tfc_compile — IMPLEMENTED ─────────────────────────────────────────────────

export async function tfcCompileHandler(
  input: unknown,
): Promise<Result<CompilePromptResult>> {
  const parsed = tfcCompileInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { intent, context } = parsed.data;
  return buildCompilePrompt({ intent, ...(context ? { context } : {}) });
}

// ── tfc_capture — IMPLEMENTED ─────────────────────────────────────────────────

export async function tfcCaptureHandler(
  input: unknown,
): Promise<Result<WireCaptureResult | CaptureAuditResult>> {
  const parsed = tfcCaptureInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  if (parsed.data.audit === true) return auditCapture();
  const { category, name, dryRun } = parsed.data;
  return wireCapture({
    ...(category ? { category } : {}),
    ...(name ? { name } : {}),
    ...(dryRun !== undefined ? { dryRun } : {}),
  });
}

// ── tfc_relink — IMPLEMENTED ──────────────────────────────────────────────────

export async function tfcRelinkHandler(
  input: unknown,
): Promise<Result<RelinkResult>> {
  const parsed = tfcRelinkInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name, dryRun } = parsed.data;
  return repairLinks({
    ...(category ? { category } : {}),
    ...(name ? { name } : {}),
    ...(dryRun !== undefined ? { dryRun } : {}),
  });
}

// ── tfc_decay — IMPLEMENTED ───────────────────────────────────────────────────

export async function tfcDecayHandler(
  input: unknown,
): Promise<Result<DecayVerdict>> {
  const parsed = tfcDecayInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name } = parsed.data;
  // Boundary default ONLY — the verdict (core/decay.ts) never reads the clock (INV-7).
  const asOf = parsed.data.asOf ?? new Date().toISOString();
  return laneAsOf({ category, name, asOf });
}

// ── tfc_replay — IMPLEMENTED ──────────────────────────────────────────────────

export async function tfcReplayHandler(
  input: unknown,
): Promise<Result<ReplayPromptResult>> {
  const parsed = tfcReplayInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name } = parsed.data;
  const samples = parsed.data.samples ?? 3;
  return buildReplayPrompt({ category, name, samples });
}

// ── tfc_portfolio — IMPLEMENTED ───────────────────────────────────────────────

export async function tfcPortfolioHandler(
  input: unknown,
): Promise<Result<PortfolioRollup>> {
  const parsed = tfcPortfolioInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const asOf = parsed.data?.asOf;
  return rollup(asOf ? { asOf } : {});
}
