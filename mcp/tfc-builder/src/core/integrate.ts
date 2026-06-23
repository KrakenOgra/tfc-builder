import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { loadSkill, importedContextReachable } from "./checks.js";
import { skillDir } from "./paths.js";
import { readYaml, writeYaml } from "./yamlio.js";
import { validateSkill, type ValidationReport } from "./validate.js";
import type { SpecYaml, PairsWith } from "./types.js";

// ── Validated integration contracts (v3 W5 / Vector V5) ─────────────────────────
// Replaces ad-hoc CLAUDE.md integration notes with a CHECKED spec.yaml edit. Writes
// EITHER a skill pairing (pairs_with — direction + reason are mandatory) OR an MCP
// requirement (requires — any id ending in "-mcp"), then re-validates so a broken
// contract never lands silently. The integration surface stops being aspirational.

export interface IntegrateInput {
  category: string;
  name: string;
  // a TFC skill id (→ pairs_with) OR an MCP server id ending in "-mcp" (→ requires)
  system: string;
  direction?: "before" | "after" | "parallel";
  reason?: string;
  dryRun?: boolean;
}

export interface IntegrateResult {
  kind: "pairs_with" | "requires";
  specPath: string;
  added: PairsWith | string;
  dryRun: boolean;
  validation?: ValidationReport;
}

export async function integrateSkill(
  input: IntegrateInput,
): Promise<Result<IntegrateResult>> {
  const { category, name, system } = input;
  const skillR = await loadSkill(category, name);
  if (!skillR.ok) return skillR;

  // v4 W2: imported context must be reachable BEFORE we land any integration contract. This is
  // a warning in plain tfc_validate but BLOCKING here — a dangling imports_context is a broken
  // composition, and tfc_integrate exists to refuse broken contracts.
  const icr = importedContextReachable(skillR.data);
  if (!icr.passed) {
    return fail(
      "UNREACHABLE_CONTEXT",
      icr.message ?? "imported context unreachable",
      "Run tfc_context on the source skill, or fix imports_context",
    );
  }

  const dirR = skillDir(category, name);
  if (!dirR.ok) return fail("BAD_INPUT", dirR.error.message);
  const specPath = nodePath.join(dirR.path, "spec.yaml");
  const specR = await readYaml<SpecYaml>(specPath);
  if (!specR.ok) return specR;
  const spec = specR.data;
  const dryRun = input.dryRun ?? false;

  // MCP requirement
  if (/-mcp$/.test(system)) {
    const requires = Array.isArray(spec.requires) ? [...spec.requires] : [];
    if (!requires.includes(system)) requires.push(system);
    if (!dryRun) {
      const w = await writeYaml(specPath, { ...spec, requires });
      if (!w.ok) return w;
    }
    const validation = dryRun ? undefined : await runValidate(category, name);
    return ok({
      kind: "requires",
      specPath,
      added: system,
      dryRun,
      ...(validation ? { validation } : {}),
    });
  }

  // Skill pairing — V5: direction + reason are MANDATORY (no unvalidated pairs).
  if (!input.direction)
    return fail(
      "BAD_INPUT",
      "skill pairing requires direction: before | after | parallel",
    );
  if (!input.reason || input.reason.trim().length === 0)
    return fail("BAD_INPUT", "skill pairing requires a non-empty reason");

  // v4 W5 note: integrate does NOT hard-block on pairs_with target existence. pairs_with can
  // legitimately reference skills in another ecosystem (e.g. reel-forge → remotion-reel-editor in
  // gstack), which TFC cannot resolve. The pairs-with-resolve gate surfaces unresolved pairs as a
  // WARNING in tfc_validate instead — honest signal without false-blocking cross-system composition.
  const pair: PairsWith = {
    skill: system,
    direction: input.direction,
    reason: input.reason.trim(),
  };
  const pairs = Array.isArray(spec.pairs_with) ? [...spec.pairs_with] : [];
  if (!pairs.some((p) => p.skill === system)) pairs.push(pair);
  if (!dryRun) {
    const w = await writeYaml(specPath, { ...spec, pairs_with: pairs });
    if (!w.ok) return w;
  }
  const validation = dryRun ? undefined : await runValidate(category, name);
  return ok({
    kind: "pairs_with",
    specPath,
    added: pair,
    dryRun,
    ...(validation ? { validation } : {}),
  });
}

async function runValidate(
  category: string,
  name: string,
): Promise<ValidationReport | undefined> {
  const r = await validateSkill({ category, name });
  return r.ok ? r.data : undefined;
}
