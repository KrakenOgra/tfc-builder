---
last_verified: 2026-06-23
fill_hint: "eval -> lane -> evolve cycle, delta gate, CHANGELOG, when NOT_READY is correct."
---

## The Eval Cycle
source: ultraflow/SKILL.md#stage-5-prove-and-evolve + ultraflow/eval-report.json

- tfc_eval returns a prompt template Claude executes: run each golden task baseline-vs-loaded, judge by observable strings, write eval-report.json with skill_version matching spec.yaml.
- The lane-gate validates the report: rejects if behavioral_score < pass_threshold (0.8), if per_task count != total tasks, if skill_version doesn't match the spec, or if any task is missing must/must_not. Exit 0 = valid.
- Re-eval is required on EVERY version bump. The lane-gate checks that spec version == eval-report skill_version. A version mismatch drops the effective lane to authored.
- Source field: `seeds` (golden tasks from evals.yaml) or `live` (>=3 real time-spread invocations from analytics/runs.jsonl). Both are judged the same way by the gate. The source label is informational.
- ultraflow's 5 golden tasks cover 5 behaviors: decision routing, build routing, forge full motion, ground halt, govern routing. All 5 pass at behavioral_score 1.0 (v1.2.0, 2026-06-23).

## The Evolve Gate
source: ultraflow/SKILL.md#stage-5-prove-and-evolve + ultraflow/CHANGELOG.jsonl

- tfc_evolve requires >=3 unconsumed learnings. NOT_READY is correct under 3. Never use --force to bypass without 3 genuine learnings (INV-8: never fabricate a learning).
- The evolve rewrites only the WEAKEST sections of SKILL.md, not the whole file. It names the sections_touched.
- Earns evolution_proven only if post_eval_score - pre_eval_score >= 0.05. A non-improving evolve (delta < 0.05) writes an honest CHANGELOG row and stays eval_proven.
- When pre_eval_score is already 1.0, delta cannot be >=0.05. The evolve is still valid and useful -- it folds learnings into the prose and closes the loop -- but the lane stays eval_proven honestly.
- After evolve: bump version in BOTH spec.yaml and SKILL.md frontmatter. Version drift between them is a sharp edge that drops the lane to authored on the next tfc_lane call.

## CHANGELOG and Consumed Learnings
source: ultraflow/SKILL.md#stage-7-close-the-loop + ultraflow/CHANGELOG.jsonl (v1.2.0 row)

- CHANGELOG.jsonl is append-only: each evolve writes one row with ts, from_version, to_version, learnings_consumed (hash list), pre_eval_score, post_eval_score, delta, sections_touched.
- Mark learnings consumed by setting `"consumed_in":"<version>"` on each consumed row in learnings.jsonl. The hash is md5(line)[:12].
- A CHANGELOG row with delta < 0.05 and an honest pre/post score is better than a fabricated row with a false delta. Honesty in the log is INV-8's downstream enforcement.
- The lane requires CHANGELOG present + a qualifying row (delta >= 0.05) to promote to evolution_proven. Without a qualifying row, the lane stays eval_proven regardless of CHANGELOG presence.
- ultraflow v1.1.0->v1.2.0 evolve: 6 learnings consumed, delta 0.0 (pre=1.0 can't go higher), lane stayed eval_proven. Honest result.
