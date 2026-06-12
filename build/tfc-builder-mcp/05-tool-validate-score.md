# 05 — tfc_validate + tfc_score — the gate engine

> `ENVOKE: testing/test-architect` (primary).
> `ENVOKE: security/input-validation`, `backend/error-handling`, `mind/code-quality` (support).

---

# CONTEXT
Project:        tfc-builder MCP (see 00-PROJECT.md)
Stack:          TypeScript strict + zod + yaml + core lib
Current state:  Skills can be scaffolded and authored. Nothing checks them.
User persona:   Builder who will not install a skill that fails its own gates.
Reference:      ~/.future-code/skills/_template/validations.yaml (the gate list),
                ~/.future-code/docs/intelligence-context-guide.md (the density test)
Code target:    src/core/validate.ts + src/core/score.ts + two handlers

# ACTION
IMPLEMENT tfc_validate (run validations.yaml gates) and tfc_score (0-100 intelligence-density score with a gap list).

# TARGET
Files to create or modify:
  src/core/validate.ts     (validateSkill({category,name}) -> Result<ValidationReport>)
  src/core/score.ts        (scoreSkill({category,name}) -> Result<ScoreReport>)
  src/core/checks.ts       (the named check functions: preamblePresent, requiredSectionsPresent,
                            specIdMatchesDir, telemetryPresent, voiceEmDash, voiceAiVocab,
                            triggersSpecific, sharpEdgesHaveSolutions)
  src/tools/index.ts       (wire tfcValidateHandler, tfcScoreHandler)

Do NOT modify:
  src/core/scaffold.ts | authoring.ts

# CONSTRAINTS
- validate reads the skill's own `validations.yaml` if present, else the template's default gate set. Each gate has `id`, `severity` (blocking|warning|info), and a check.
- Each check is a pure function `(skill: LoadedSkill) => CheckOutcome`. `checks.ts` is a registry mapping gate `id -> function`. No check throws; a parse failure is a failed check, not a crash.
- Voice checks: `voiceEmDash` flags ` — `; `voiceAiVocab` flags delve|crucial|robust|comprehensive|nuanced|multifaceted (word-boundary, case-insensitive).
- `triggersSpecific`: every spec.yaml trigger >= 4 words. `specIdMatchesDir`: spec.id === parent dir name.
- ValidationReport: `{ passed: boolean, blocking: GateResult[], warnings: GateResult[], info: GateResult[] }`. `passed` is true only when blocking is empty.
- score (the intelligence-density test from the guide): count named `### ` patterns + anti-patterns in SKILL.md; presence of Identity with a hard-won lesson (not a job title); imperative principles; Quick Wins; a "Does NOT own" entry; voice clean. Map to the 100-pt breakdown. Return `gaps[]` naming each missing/weak section with a one-line fix.
- score reuses validate outcomes; it does not re-implement the voice checks.

# QUALITY
- Full types, no `any`. `GateResult = { id, severity, passed, message }`. `ScoreReport = { score, breakdown: Record<string,number>, gaps: string[] }`.
- Every check is independently unit-tested with a passing and a failing fixture skill.
- Score is deterministic and monotonic: adding a valid pattern never lowers the score.
- Unit test: a skill with em dash in SKILL.md -> validate warnings include `voice-em-dash`.
- Unit test: a skill whose dir name != spec.id -> validate blocking includes `spec-id-matches-directory`, passed=false.
- Unit test: the `_template` itself scores in a known band and lists its placeholder gaps.

# QUALITY WRAP

## Scope limiters
- Validate enforces STRUCTURE and VOICE. It does not judge whether the content is good advice — that is the author's (Claude's) job via 04.
- Do not auto-fix here. Report only. (A future tfc_fix could call 04; out of scope for v1.)
- Do not install on a failing validate — install (07) calls validate and refuses on blocking failures.

## Anti-pattern guards
- AVOID: a check that throws — every check returns an outcome, parse errors included.
- AVOID: regex that matches em dash inside code fences only-when-unintended — scope voice checks to prose, document the choice.
- AVOID: score that rewards length — density counts NAMED sections, not characters.
- AVOID: duplicated voice logic across validate and score — score imports validate's checks.

## VERIFY
After implementation, run:
- `npm run typecheck` && `npm run lint` — must pass
- `npm run test src/core/validate src/core/score src/core/checks` — all green
- Manual smoke: tfc_validate on a freshly scaffolded (un-authored) skill -> warnings about placeholder triggers + missing intelligence; tfc_score -> low score with a concrete gap list
