import type { LoadedSkill } from "./checks.js";

// ── Behavioral QA (v3 W3 / Vector V3) ───────────────────────────────────────────
// Deterministic, NO model call (INV-4). This module imports ONLY a type from checks.ts
// (erased at build) — it performs zero network, fs, or child-process I/O. That is what
// makes behavioral QA cheap and CI-able: it does not run an agent, it checks that the
// skill's DECLARED contract is internally executable.
//
// The three checks together dissolve the v3 crux ("skills are read, not run"): a skill
// that drops a required section or declares a phase with a hand-wavy acceptance criterion
// FAILS here before it ships, so a low-capability agent cannot quietly produce a weaker
// output than the contract demands.

export interface BehavioralCheck {
  id: string;
  passed: boolean;
  message: string;
}

export interface BehavioralReport {
  passed: boolean;
  checks: BehavioralCheck[];
}

// An acceptance criterion is "satisfiable" only if it names a concrete, checkable thing:
// a command/path in backticks, a comparison, a file extension, or a check verb. Free-text
// prose ("looks good", "is clear") is NOT machine-shaped and is rejected. This is the
// single bar all archetypes share (the v3 deletion of archetype-as-QA-gate).
export const ACCEPTANCE_SHAPE_RE =
  /`[^`]+`|\b(grep|exists?|returns?|matches?|contains?|count|present|file|path|exit|test|diff|pass(?:es)?|fail(?:s)?)\b|[<>=]=|\.(json|ya?ml|md|ts|sh)\b/i;

export function runBehavioral(skill: LoadedSkill): BehavioralReport {
  const checks: BehavioralCheck[] = [];
  const required = skill.specYaml.required_sections ?? [];
  const scaffold = skill.specYaml.scaffold_template ?? "";

  // 1 — the scaffold the agent is handed already carries every required section.
  const missingInScaffold = required.filter((s) => !scaffold.includes(s));
  checks.push({
    id: "scaffold-covers-required-sections",
    passed: missingInScaffold.length === 0,
    message:
      missingInScaffold.length === 0
        ? "scaffold_template covers every required_section"
        : `scaffold_template missing: ${missingInScaffold.join(", ")}`,
  });

  // 2 — the shipped SKILL.md carries every required section.
  const missingInMd = required.filter((s) => !skill.skillMdText.includes(s));
  checks.push({
    id: "skillmd-covers-required-sections",
    passed: missingInMd.length === 0,
    message:
      missingInMd.length === 0
        ? "SKILL.md covers every required_section"
        : `SKILL.md missing: ${missingInMd.join(", ")}`,
  });

  // 3 — every declared phase artifact has a machine-shaped acceptance criterion.
  const phases = skill.specYaml.phases ?? [];
  const unsatisfiable = phases.filter(
    (p) => !p.acceptance || !ACCEPTANCE_SHAPE_RE.test(p.acceptance),
  );
  checks.push({
    id: "phase-acceptance-satisfiable",
    passed: unsatisfiable.length === 0,
    message:
      unsatisfiable.length === 0
        ? `all ${phases.length} declared phase artifact(s) are machine-checkable`
        : `phases with non-machine-shaped acceptance: ${unsatisfiable
            .map((p) => p.name ?? p.artifact)
            .join(", ")}`,
  });

  return { passed: checks.every((c) => c.passed), checks };
}
