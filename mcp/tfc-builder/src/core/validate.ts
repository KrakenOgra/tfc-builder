import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { loadSkillFromDir, CHECK_REGISTRY, type GateResult } from "./checks.js";
import { exists } from "./fs.js";
import { readYaml } from "./yamlio.js";
import { skillDir, templateDir } from "./paths.js";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ValidationGate {
  id: string;
  check: string;
  severity: "blocking" | "warning" | "info";
  message: string;
}

interface ValidationsYaml {
  version: string;
  skill_id: string;
  validations: ValidationGate[];
}

export interface ValidationReport {
  passed: boolean;
  blocking: GateResult[];
  warnings: GateResult[];
  info: GateResult[];
}

// ── Gate loading ──────────────────────────────────────────────────────────────

async function loadGates(skillDir_: string): Promise<Result<ValidationGate[]>> {
  const skillValidations = nodePath.join(skillDir_, "validations.yaml");
  const templateValidations = nodePath.join(templateDir(), "validations.yaml");

  const source = (await exists(skillValidations)) ? skillValidations : templateValidations;
  const yamlR = await readYaml<ValidationsYaml>(source);
  if (!yamlR.ok) return yamlR;

  const gates = yamlR.data.validations;
  if (!Array.isArray(gates)) {
    return fail("PARSE_ERROR", "validations.yaml: expected 'validations' array");
  }
  return ok(gates);
}

// ── Core implementation ───────────────────────────────────────────────────────

export async function validateSkillFromDir(
  dir: string,
): Promise<Result<ValidationReport>> {
  const [skillR, gatesR] = await Promise.all([
    loadSkillFromDir(dir),
    loadGates(dir),
  ]);
  if (!skillR.ok) return skillR;
  if (!gatesR.ok) return gatesR;

  const skill = skillR.data;
  const gates = gatesR.data;

  const blocking: GateResult[] = [];
  const warnings: GateResult[] = [];
  const info: GateResult[] = [];

  for (const gate of gates) {
    const checkFn = CHECK_REGISTRY.get(gate.id);
    const outcome = checkFn
      ? checkFn(skill)
      : { passed: false, message: `No check implementation for gate: ${gate.id}` };

    const result: GateResult = {
      id: gate.id,
      severity: gate.severity,
      passed: outcome.passed,
      message: outcome.message ?? gate.message,
    };

    if (gate.severity === "blocking") blocking.push(result);
    else if (gate.severity === "warning") warnings.push(result);
    else info.push(result);
  }

  return ok({
    passed: blocking.every((g) => g.passed),
    blocking,
    warnings,
    info,
  });
}

export async function validateSkill(input: {
  category: string;
  name: string;
}): Promise<Result<ValidationReport>> {
  const dirR = skillDir(input.category, input.name);
  if (!dirR.ok) return fail("BAD_INPUT", dirR.error.message);
  return validateSkillFromDir(dirR.path);
}
