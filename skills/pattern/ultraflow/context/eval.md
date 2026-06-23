---
last_verified: 2026-06-21
fill_hint: "Define must/must_not strings + a model-free judge where possible."
---

## Golden Tasks

- A golden task is a prompt plus must[] and must_not[] of OBSERVABLE strings the output contract emits. Scored on appearance, never on "reads well".
- ultraflow's five: route-decision-no-forge, route-build-skips-forge, route-forge-full-motion, ground-halt-ungrounded, route-govern-no-build. One per route shape plus the ground halt.
- Each must[] entry should be a literal header or line the skill prints (`## ROUTE`, `Shape: forge`, `Verdict: NO`). If you cannot grep for it, it is not a golden assertion.

## Judge Rubrics

- The judge is model-free where possible: grep the output for each must/must_not string. Deterministic, repeatable, no API key.
- pass_threshold 0.8: a skill must pass at least 4 of 5 tasks to earn eval_proven.
- The lane gate reads the SCORE, never the source. A seeds-based report and a live report (>=3 real invocations) are judged the same way.

## Regression Signals

- evalStale: the spec version moved past the eval-report version. Re-eval on every version bump or the lane silently drops to authored.
- A dropped required_section fails tfc_behavioral before it ships. That is the gate that stops output quality from scaling only with the running agent's capability.
- decayPressure: a proof older than the freshness horizon (eval 30 days, evolution 60 days) drops the effective lane until it is re-proven.
