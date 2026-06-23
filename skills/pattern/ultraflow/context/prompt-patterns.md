---
last_verified: 2026-06-23
fill_hint: "Skeleton per pattern + when it beats the alternative."
---

## Structured Output
source: ultraflow/SKILL.md#the-output-contract + ultraflow/spec.yaml#required_sections + ultraflow/spec.yaml#scaffold_template

- A forged skill's runtime output contract IS its structured output: the four required_sections that tfc_behavioral checks (`## ROUTE`, `## GROUNDED`, `## FORGE REPORT`, `## LANE EARNED`).
- The scaffold_template in spec.yaml defines the skeleton every /ultraflow run must emit. tfc_behavioral checks that the template covers every required_section and that SKILL.md prose also covers every required_section -- deterministically, no model call.
- The lane is a closed enum: authored | eval_proven | evolution_proven. It is read from disk by tfc_lane, never computed inline. Never compute it in the response; cite tfc_lane's exact return value.
- `Forge: ~/.future-code/skills/<cat>/<name>/` and `Forge: skipped (<reason>)` are the two valid FORGE REPORT lines. No prose alternative -- the must[] strings in evals.yaml grep for these exact substrings.
- The Output Contract format prints Shape as exactly one of: `decision | build | forge | govern`. A typo or synonym (e.g. "create" instead of "forge") fails the golden-task must[] check.
- `Verdict: YES actor+cost+evidence` or `Verdict: NO -> HALTED (needed: ...)` are the two GROUNDED lines. The word `HALTED` must be literal -- the ground-halt golden task greps for it.

## Few-Shot
source: ultraflow/evals.yaml (sourced via ultraflow/eval-report.json) + ultraflow/SKILL.md#stage-5

- The golden tasks in evals.yaml serve double duty as few-shot examples AND regression tests. One task per route shape (decision, build, forge, govern) plus one ground-halt: 5 tasks, 5 behaviors proved.
- Few-shot prompts for ultraflow are route-shape demonstrations: "I keep hand-writing X every release" cues forge; "just this once" cues build; "Should I use X or Y" cues decision; "Audit the portfolio" cues govern.
- A must_not string like `crucial` or `delve` turns the eval into a voice guard: a passing run proves both routing AND clean voice. Design golden tasks to enforce both.
- Baseline run (no skill loaded) is the control: it measures what the raw model does. The delta_note must state the OBSERVABLE difference -- what the baseline missed that the skill-loaded run produced.
- All 5 ultraflow golden tasks pass at behavioral_score 1.0 (eval-report v1.2.0, 2026-06-23). Variance: 0.0. This means the skill changes output on every route shape.
- New golden tasks are needed when a new route mode is added (e.g. `--enhance` or `--context`). Add one must[] per new required_section or output line the mode introduces.

## Tool/Function Calling
source: ultraflow/SKILL.md#the-tfc-tool-map + ultraflow/SKILL.md#the-forge-spine

- Each forge stage binds to exactly one tool set. Stage 4: tfc_compile (SkillCard) + tfc_new (scaffold) + tfc_validate + tfc_score + tfc_behavioral. Stage 5: tfc_eval + tfc_lane + tfc_evolve. Stage 6: tfc_install + tfc_register + tfc_integrate.
- Compose, do not re-implement. Stage 1 calls kraken-flow; Stage 3 calls autovibe. Re-deriving their logic inline forks a second copy that drifts from the proven original and discards their earned lanes.
- tfc_context_get is the Stage 4 seeding tool (step-0): call it BEFORE authoring SKILL.md when a proven skill in the same domain exists. It returns ranked grounded prose with per-section source: provenance. Model-free, deterministic (INV-4).
- tfc_context_fill is the offline-fill tool: it returns a fill PROMPT template that Claude executes out-of-band. The tool itself makes no model call. The author runs the template to draft context/<file>.md with mandatory source: lines.
- tfc_context_discover requires no parameters: it reads context-taxonomy.yaml + all _angles.yaml manifests from disk. Call it first when working with context to see what domains and angles are available.
- tfc_context_coverage requires a _angles.yaml manifest in the skill's context/ dir. Without it, coverage returns NOT_FOUND. Author the manifest first (domain + angles[] + depth_target), then call coverage to score.
- A just-registered MCP tool is not callable this session (sharp edge: mcp-tool-needs-restart). Use the CLI (`node dist/cli.js <cmd>`) or the installed files. Tell the user to restart Claude Code for MCP visibility.
