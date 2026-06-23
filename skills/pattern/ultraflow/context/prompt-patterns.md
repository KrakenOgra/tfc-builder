---
last_verified: 2026-06-21
fill_hint: "Skeleton per pattern + when it beats the alternative."
---

## Structured Output

- A forged skill's runtime output contract IS its structured output: the four required_sections (`## ROUTE`, `## GROUNDED`, `## FORGE REPORT`, `## LANE EARNED`). tfc_behavioral checks the scaffold_template covers every one.
- Declare `output_schema` once a skill reaches eval_proven so what it emits is machine-checkable. tfc_validate warns at eval_proven+ when it is absent.
- The forge never asks a model to free-form a lane. The lane is a closed enum (authored | eval_proven | evolution_proven) read from disk by tfc_lane.

## Few-Shot

- The golden tasks in evals.yaml are the few-shot set: each is a prompt plus must[] and must_not[] strings. They serve double duty as behavior examples and as regression tests.
- One task per route shape (decision, build, forge, govern) plus one ground-halt. Five shapes, five tasks: the minimum that proves routing rather than asserting it.
- A must_not string like "crucial" or "delve" turns the eval into a voice guard too: a passing run also proves clean voice.

## Tool/Function Calling

- Each forge stage binds to one tool. Stage 4: tfc_new. Stage 5: tfc_eval then tfc_lane. Stage 6: tfc_install, tfc_register, tfc_integrate.
- Compose, do not re-implement. Stage 1 calls kraken-flow; Stage 3 calls autovibe. Re-deriving their logic inline forks a second copy that drifts from the proven original.
- A just-registered MCP tool is not callable in the same session. The CLI and the installed files work now; the MCP surface needs a Claude Code restart.
