---
last_verified: 2026-06-23
fill_hint: "Stages 4-6: compile/scaffold/validate/score/behavioral, the owned motion."
---

## Stage 4 -- Forge
source: ultraflow/SKILL.md#stage-4-forge

- tfc_compile(intent=...): returns the born-loop-ready SkillCard (lane: authored + 3 eval seeds). This is the birth certificate, not the skill itself.
- tfc_new(category, name, archetype): scaffolds from _template. NEVER use tfc_migrate on an existing tree (throws EISDIR). The forge path is tfc_new -> hand-author SKILL.md.
- Context seeding (step-0, v1.2.0): if a proven skill in the same domain exists, call tfc_context_get(name=<similar>, task=<intent>) first. Seed SKILL.md from the returned grounded prose. Each section carries `source:` provenance.
- Author SKILL.md from the SkillCard + autovibe pack: concrete protocol, real gates, named tools, no placeholders. tfc_score penalizes thin prose.
- Quality gates after authoring, in order: tfc_validate (blocking structural gates) -> tfc_score (archetype rubric, 0-100) -> tfc_behavioral (deterministic: scaffold_template covers every required_section, SKILL.md covers every required_section).
- A tfc_validate blocking failure stops the forge. Fix the named gap; do not install below the floor.

## Stage 5 -- Prove
source: ultraflow/SKILL.md#stage-5-prove-and-evolve

- tfc_eval(category, name): runs the golden tasks in evals.yaml, baseline vs skill-loaded, writes eval-report.json. A fresh passing report (behavioral_score >= pass_threshold) promotes to eval_proven.
- tfc_lane(category, name): recomputes the earned lane from disk (spec + eval-report + CHANGELOG). ALWAYS cite its exact return value in `## LANE EARNED`. Never assert a lane by hand.
- tfc_evolve(category, name): folds >=3 unconsumed learnings + eval failures into the weakest SKILL.md sections, bumps version, re-evals. Reaches evolution_proven only if delta >= 0.05. NOT_READY under 3 learnings is correct, not a failure.
- The lane is: authored (birth, no eval) -> eval_proven (fresh passing eval-report) -> evolution_proven (evolve with delta >= 0.05).

## Stage 6 -- Install and Govern
source: ultraflow/SKILL.md#stage-6-install-and-govern

- tfc_install(category, name): creates both symlinks -- TFC_HOME and CLAUDE_SKILLS. A skill is not live until tfc_install runs; tfc_lane can return eval_proven but reachable:false without it.
- tfc_register(category, name): adds the spawner index row so spawner_skills finds it. Without this, the skill exists in TFC but not in the discovery graph.
- tfc_integrate(category, name, system, direction, reason): writes validated pairings into spec.yaml. Documents how this skill composes with others.
- Verify after install: `tfc_list` shows no dangling entry; `test -e .claude/skills/<name>/SKILL.md` exits 0.
- A just-registered MCP tool is not callable this session. Tell the user to restart Claude Code. The CLI (`node dist/cli.js`) and installed files work immediately.
