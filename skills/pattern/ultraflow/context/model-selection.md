---
last_verified: 2026-06-21
fill_hint: "Table: model -> strength -> cost -> context; stamp last_verified."
---

## Capability vs Cost

Which model tier each forge stage needs, and why a cheaper one fails it.

| Stage | Tool | Tier | Why this floor |
|-------|------|------|----------------|
| 1 Ground + Frame | kraken-flow | opus | Grounding must reject a fabricated actor/cost/evidence. A weaker model passes ungrounded intents and the whole motion amplifies the lie. |
| 3 Compile | autovibe | opus (ULTRA), sonnet (plain pack) | The ULTRA backend enforces an ambition floor and a thinking protocol; a thin model drops below it. |
| 4 Forge (author SKILL.md) | tfc_new + hand-author | opus | tfc_score caps the rubric low on thin prose. The skill must read like a senior wrote it. |
| 5 Prove | tfc_eval | session model | The judge is model-free (must/must_not strings); only the baseline-vs-skill run uses the session model. |
| 6 Install + Govern | tfc_install, tfc_register | none | Deterministic file ops. No model call (INV-3). |

ultraflow declares `model_tier: opus` because Stage 1 and Stage 4 set the floor. The cheap stages ride along.

## Context Limits

- The forge holds SKILL.md (20-30KB) + spec.yaml (10-13KB) + the autovibe pack at once. Keep the working set under ~60KB so the model carries the whole contract, not a truncated half.
- Golden-task eval loads the skill twice per task (baseline, then skill-loaded). Budget 2x the SKILL.md size per task.
- A skill that needs knowledge pasted into every prompt has a missing context/ layer. That knowledge belongs in context/<file>.md, read once, not re-pasted each run.

## Latency Profiles

- Read-only govern tools (tfc_graph, tfc_lane, tfc_portfolio, tfc_recommend) return in well under a second. Batch them in one turn.
- tfc_eval is the slow stage: N golden tasks x 2 runs. Five tasks is roughly ten model turns. Re-eval only on a version bump, not every edit.
- Do not block the user on Stage 5. Report the earned lane once the report lands, then continue.
