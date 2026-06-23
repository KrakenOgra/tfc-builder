---
last_verified: 2026-06-23
fill_hint: "Table: model -> strength -> cost -> context; stamp last_verified."
---

## Capability vs Cost
source: ultraflow/SKILL.md#stage-1 + ultraflow/SKILL.md#stage-4 + ultraflow/spec.yaml#model_tier

Which model tier each forge stage needs, and why a cheaper one fails it.

| Stage | Tool | Tier | Why this floor |
|-------|------|------|----------------|
| 1 Ground + Frame | kraken-flow | opus | Grounding must reject a fabricated actor/cost/evidence. A weaker model passes ungrounded intents and the whole motion amplifies the lie downstream. |
| 2 Route | (owned) | sonnet | Intent classification into decision/build/forge/govern. Weaker models misclassify "enhance this skill" as forge instead of build. |
| 3 Compile | autovibe | opus (ULTRA), sonnet (plain pack) | ULTRA backend enforces an ambition floor and a thinking protocol; a thin model drops below it. Plain pack uses sonnet. |
| 4 Forge (author SKILL.md) | tfc_new + hand-author | opus | tfc_score caps the rubric low on thin prose. The authored SKILL.md must read like a senior operator wrote it: named gates, real tools, no placeholders. |
| 5 Prove | tfc_eval | session model | The judge is model-free (must/must_not strings, INV-1). Only the baseline-vs-skill run uses the session model. Any tier works. |
| 6 Install + Govern | tfc_install, tfc_register | none | Deterministic file ops. No model call (INV-3). Batch with read-only govern tools (tfc_graph, tfc_lane, tfc_portfolio) in one turn. |
| 7 Close the loop | mind_remember | none | mind_remember is a structured API call. Session model handles the content string. |

ultraflow declares `model_tier: opus` because Stage 1 (ground crux) and Stage 4 (SKILL.md authoring) set the floor. The cheaper stages ride along.

## Context Limits
source: ultraflow/SKILL.md#stack-reference + ultraflow/SKILL.md#the-forge-spine

- The forge holds SKILL.md (20-30KB) + spec.yaml (10-13KB) + the autovibe pack at once. Keep the working set under ~60KB so the model carries the whole contract, not a truncated half.
- ultraflow v1.2.0 SKILL.md is ~25KB. spec.yaml is ~13KB. Total ~38KB base before the autovibe pack.
- Golden-task eval loads the skill twice per task (baseline run, then skill-loaded run). Budget 2x the SKILL.md size per task = ~50KB per task x 5 tasks = ~250KB across a full eval run.
- A skill that needs knowledge pasted into every prompt has a missing context/ layer. That knowledge belongs in `context/<file>.md`, read once at session start via tfc_context_get, not re-pasted each run.
- tfc_context_get(name=ultraflow, task=...) returns the top-K sections within a token budget (default 2000 tokens). Set topK and tokenBudget to match the calling model's working memory budget.
- When the forge's working set exceeds 60KB, split the authoring into two turns: first author the protocol sections (Preamble, Stages, Output Contract), then the reference sections (Patterns, Anti-Patterns, Sharp Edges).

## Latency Profiles
source: ultraflow/SKILL.md#stage-5 + ultraflow/SKILL.md#the-tfc-tool-map

- Read-only govern tools return in under a second: tfc_graph, tfc_lane, tfc_portfolio, tfc_recommend, tfc_context_coverage, tfc_context_discover. Batch them in one turn.
- tfc_eval is the slow stage: N golden tasks x 2 runs (baseline + loaded). Five tasks is roughly ten model turns. Re-eval only on a version bump, not every prose edit.
- tfc_context_get is model-free and deterministic (identical request = identical bytes, INV-4). It ranks by lexical score. No model turn; latency is pure disk read + string assembly.
- tfc_context_fill returns a fill PROMPT that Claude executes offline. The tool itself is model-free (disk reads + string assembly). The actual fill is one model turn per domain.
- tfc_evolve is the write-heavy stage: it folds learnings, bumps version, writes CHANGELOG, marks consumed. One model turn for section regen; the gate (lane-gate.sh) is sub-second.
- Do not block the user on Stage 5. Report the earned lane once the report lands; continue with Stage 6 in the same response if possible.
