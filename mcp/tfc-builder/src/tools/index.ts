import { fail, ok, type Result } from "../core/result.js";
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
import { runBehavioral, type BehavioralReport } from "../core/behavioral.js";
import { integrateSkill, type IntegrateResult } from "../core/integrate.js";
import { loadSkill } from "../core/checks.js";
import {
  tfcContext,
  auditContext,
  updateContext,
  type ContextStubResult,
  type ContextAuditEntry,
} from "../core/context.js";
import { composeContext, type ComposeResult } from "../core/compose.js";
import { getContext, type RetrieveResult } from "../core/context-retrieve.js";
import { buildFillPrompt, type FillPromptResult } from "../core/context-fill.js";
import { discoverDomains, type DiscoveryResult } from "../core/context-discover.js";
import {
  recordSectionReceipt,
  promoteAngles,
  type PromotionVerdict,
} from "../core/context-receipt.js";
import { scoreCoverage, type CoverageVerdict } from "../core/context-coverage.js";
import {
  buildGraph,
  recommend,
  type SkillGraph,
  type Recommendation,
} from "../core/graph.js";
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
  tfcBehavioralInput,
  tfcIntegrateInput,
  tfcContextInput,
  tfcContextAuditInput,
  tfcContextUpdateInput,
  tfcContextGetInput,
  tfcContextFillInput,
  tfcContextDiscoverInput,
  tfcContextCoverageInput,
  tfcContextReceiptInput,
  tfcContextPromoteInput,
  tfcComposeInput,
  tfcGraphInput,
  tfcRecommendInput,
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
  tfcBehavioralInput,
  tfcIntegrateInput,
  tfcContextInput,
  tfcContextAuditInput,
  tfcContextUpdateInput,
  tfcContextGetInput,
  tfcContextFillInput,
  tfcContextDiscoverInput,
  tfcContextCoverageInput,
  tfcContextReceiptInput,
  tfcContextPromoteInput,
  tfcComposeInput,
  tfcGraphInput,
  tfcRecommendInput,
};

// ── tfc_new — IMPLEMENTED ─────────────────────────────────────────────────────

export async function tfcNewHandler(
  input: unknown,
): Promise<Result<CreatedPaths>> {
  const parsed = tfcNewInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name, archetype } = parsed.data;
  const dryRun = parsed.data.dryRun ?? false;
  const withContext = parsed.data.withContext ?? false;
  return scaffoldSkill({
    category,
    name,
    dryRun,
    withContext,
    today: new Date().toISOString().slice(0, 10), // boundary only (INV-7: core is clock-free)
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
  const { category, name, taskIds, live } = parsed.data;
  return buildEvalPrompt({
    category,
    name,
    ...(taskIds ? { taskIds } : {}),
    ...(live !== undefined ? { live } : {}),
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

// ── tfc_behavioral — IMPLEMENTED (v3 W3) ──────────────────────────────────────

export async function tfcBehavioralHandler(
  input: unknown,
): Promise<Result<BehavioralReport>> {
  const parsed = tfcBehavioralInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name } = parsed.data;
  const skillR = await loadSkill(category, name);
  if (!skillR.ok) return skillR;
  return ok(runBehavioral(skillR.data));
}

// ── tfc_integrate — IMPLEMENTED (v3 W5) ───────────────────────────────────────

export async function tfcIntegrateHandler(
  input: unknown,
): Promise<Result<IntegrateResult>> {
  const parsed = tfcIntegrateInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name, system, direction, reason, dryRun } = parsed.data;
  return integrateSkill({
    category,
    name,
    system,
    ...(direction ? { direction } : {}),
    ...(reason ? { reason } : {}),
    ...(dryRun !== undefined ? { dryRun } : {}),
  });
}

// ── tfc_context — IMPLEMENTED (v4 W1) ─────────────────────────────────────────

export async function tfcContextHandler(
  input: unknown,
): Promise<Result<ContextStubResult>> {
  const parsed = tfcContextInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name, files, dryRun } = parsed.data;
  const today = new Date().toISOString().slice(0, 10); // boundary only (INV-7: core is clock-free)
  return tfcContext({
    category,
    name,
    today,
    ...(files ? { files } : {}),
    ...(dryRun !== undefined ? { dryRun } : {}),
  });
}

// ── tfc_context_audit — IMPLEMENTED (v4 W1) ───────────────────────────────────

export async function tfcContextAuditHandler(
  input: unknown,
): Promise<Result<ContextAuditEntry[]>> {
  const parsed = tfcContextAuditInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const asOf = parsed.data?.asOf;
  const asOfMs = asOf ? Date.parse(asOf) : Date.now(); // boundary only
  if (Number.isNaN(asOfMs)) {
    return fail("BAD_INPUT", `Invalid asOf date: ${String(asOf)}`);
  }
  const staleDays = parsed.data?.staleDays;
  return auditContext({
    asOfMs,
    ...(staleDays ? { staleDays } : {}),
  });
}

// ── tfc_context_update — IMPLEMENTED (v4 W1) ──────────────────────────────────

export async function tfcContextUpdateHandler(
  input: unknown,
): Promise<Result<{ path: string; last_verified: string }>> {
  const parsed = tfcContextUpdateInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { name, file } = parsed.data;
  const today = new Date().toISOString().slice(0, 10); // boundary only
  return updateContext({ name, file, today });
}

// ── tfc_compose — IMPLEMENTED (v4 W2) ─────────────────────────────────────────

export async function tfcComposeHandler(
  input: unknown,
): Promise<Result<ComposeResult>> {
  const parsed = tfcComposeInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name } = parsed.data;
  return composeContext({ category, name });
}

// ── tfc_context_get — IMPLEMENTED (CCE v2 W1) ─────────────────────────────────
// Deterministic ONLINE read: NO clock injected (INV-4 — identical request, identical bytes).

export async function tfcContextGetHandler(
  input: unknown,
): Promise<Result<RetrieveResult>> {
  const parsed = tfcContextGetInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { name, task, domain, tokenBudget, topK } = parsed.data;
  return getContext({
    name,
    task,
    ...(domain ? { domain } : {}),
    ...(tokenBudget ? { tokenBudget } : {}),
    ...(topK ? { topK } : {}),
  });
}

// ── tfc_context_fill — IMPLEMENTED (CCE v2 W3) ────────────────────────────────
// Model-free: harvests grounded disk sources + emits an OFFLINE fill prompt for Claude (INV-4).

export async function tfcContextFillHandler(
  input: unknown,
): Promise<Result<FillPromptResult>> {
  const parsed = tfcContextFillInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { name, domain } = parsed.data;
  return buildFillPrompt({ name, domain });
}

// ── tfc_context_discover — IMPLEMENTED (CCE v2 W4) ────────────────────────────
// Read-only: taxonomy domains ∪ per-skill _angles.yaml manifests. Model-free (INV-4).

export async function tfcContextDiscoverHandler(
  input: unknown,
): Promise<Result<DiscoveryResult>> {
  const parsed = tfcContextDiscoverInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  return discoverDomains();
}

// ── tfc_context_coverage — IMPLEMENTED (CCE v2 W5) ────────────────────────────
// Read-only: angle-completeness = answered angles / declared angles. Model-free (INV-4).

export async function tfcContextCoverageHandler(
  input: unknown,
): Promise<Result<CoverageVerdict>> {
  const parsed = tfcContextCoverageInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  return scoreCoverage({ name: parsed.data.name });
}

// ── tfc_context_receipt — IMPLEMENTED (Foundry W-A) ───────────────────────────
// Append side: record that a real build retrieved an angle's file and passed/failed.
// Clock injected here (INV-7: core stays clock-free).

export async function tfcContextReceiptHandler(
  input: unknown,
): Promise<Result<{ path: string; total: number }>> {
  const parsed = tfcContextReceiptInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const ts = new Date().toISOString(); // boundary only
  return recordSectionReceipt({ ...parsed.data, ts });
}

// ── tfc_context_promote — IMPLEMENTED (Foundry W-A) ───────────────────────────
// Read side: an angle is `required` only after >= minReceipts passing receipts, else `provisional`.
// Makes coverage's denominator EARNED, not author-asserted. Model-free (INV-4).

export async function tfcContextPromoteHandler(
  input: unknown,
): Promise<Result<PromotionVerdict>> {
  const parsed = tfcContextPromoteInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { name, minReceipts } = parsed.data;
  return promoteAngles(minReceipts ? { name, minReceipts } : { name });
}

// ── tfc_graph — IMPLEMENTED (v4 W5) ───────────────────────────────────────────

export async function tfcGraphHandler(
  input: unknown,
): Promise<Result<SkillGraph>> {
  const parsed = tfcGraphInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  return buildGraph();
}

// ── tfc_recommend — IMPLEMENTED (v4 W5) ───────────────────────────────────────

export async function tfcRecommendHandler(
  input: unknown,
): Promise<Result<Recommendation[]>> {
  const parsed = tfcRecommendInput.safeParse(input);
  if (!parsed.success) return fail("BAD_INPUT", parsed.error.message);
  const { category, name } = parsed.data;
  return recommend({ category, name });
}
