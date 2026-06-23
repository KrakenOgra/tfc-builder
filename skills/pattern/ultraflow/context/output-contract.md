---
last_verified: 2026-06-23
fill_hint: "The four required_sections, scaffold_template, and what each line must contain."
---

## The Four Required Sections
source: ultraflow/SKILL.md#the-output-contract + ultraflow/spec.yaml#required_sections

- Every /ultraflow run emits exactly 4 sections, in this order: `## ROUTE`, `## GROUNDED`, `## FORGE REPORT`, `## LANE EARNED`.
- tfc_behavioral checks these sections twice: once in scaffold_template (spec.yaml) and once in SKILL.md prose. Both must cover all 4. This is the deterministic contract check -- no model call.
- The sections are the grep targets for all 5 golden tasks. A run that restructures them (different headers, merged sections) will fail must[] checks.
- `## ROUTE` must contain: `Shape: <decision|build|forge|govern>` and `Why: <one line>`. The Shape line is a literal substring checked by the eval. No alternative phrasing.
- `## GROUNDED` must contain: `Verdict: YES ...` or `Verdict: NO -> HALTED (needed: ...)`. The word `HALTED` is a must[] literal. The word `Evidence:` is also required in the passing case.
- `## FORGE REPORT` must contain: `Forge: ~/.future-code/skills/<cat>/<name>/` (for a forge route) or `Forge: skipped (<reason>)` (for non-forge). `Validate:`, `Score:`, `Behavioral:`, `Install:`, `Register:`, `Native:` are also required for a forge route.
- `## LANE EARNED` must contain: `Lane: authored | eval_proven | evolution_proven` (from tfc_lane, not asserted). The value must be the exact string tfc_lane returns.

## scaffold_template Structure
source: ultraflow/spec.yaml#scaffold_template

- The scaffold_template in spec.yaml is the BLUEPRINT that every /ultraflow session must instantiate. It is the machine-readable form of the output contract.
- tfc_behavioral reads scaffold_template and checks that every required_section header appears in it. A section missing from the template fails behavioral before the skill ships.
- The template uses `|` (pipe) as a placeholder marker for values Claude fills in: `Shape: decision | build | forge | govern` means exactly one of those, not a literal pipe.
- Placeholder format in the template: `[one line: ...]` or `[what goes here]`. Claude replaces these with the actual grounded values. Never emit the placeholder text in a real run.
- Phases in spec.yaml describe the acceptance criteria for each stage's artifact. tfc_behavioral checks these are machine-shaped (not vague prose like "looks good").

## Emit Every Run
source: ultraflow/SKILL.md#the-output-contract + ultraflow/SKILL.md#execution-record

- The output contract is not optional for the forge route. Even for the decision route (which stops after stage 2), `## ROUTE` and `## GROUNDED` must appear.
- The Execution Record bash snippet must run after EVERY run, even uneventful ones. Set outcome to "completed" and insight to "standard completion" for runs with nothing new to observe (INV-8).
- Telemetry runs last: it writes to analytics/skill-usage.jsonl with skill, duration_s, outcome, route, lane, session, project, branch, ts. This feeds the live eval source for tfc_eval --live.
- mind_remember fires at Stage 7: `content="CRUX | FRAME | FORGED <name> @ lane | report <slug>"`, content_type="event", temporal_level=3, salience=0.85. This seeds future mind_retrieve hits for related intents.
- The outcome ledger row in `~/.kraken/outcomes/decisions.jsonl` is the pending close: `/ultraflow --outcome <slug> good|bad` closes it via mind_decide, which adjusts salience of the memories used in this run.
