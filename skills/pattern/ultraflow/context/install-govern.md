---
last_verified: 2026-06-23
fill_hint: "Symlinks, registry, portfolio governance -- the stage 6 and govern-mode toolset."
---

## Install and Register
source: ultraflow/SKILL.md#stage-6-install-and-govern

- tfc_install creates two symlinks: one in TFC_HOME (the forge's internal index) and one in CLAUDE_SKILLS (the harness's slash-skill lookup). Both must exist for a skill to be live.
- tfc_register adds the spawner index row. Without it, spawner_skills cannot find the skill and the discovery graph misses it.
- tfc_integrate writes validated pairings into spec.yaml: system, direction (before/after/parallel), reason. Documents the composition contract.
- Verification sequence: `tfc_list` (no dangling entries) -> `test -e .claude/skills/<name>/SKILL.md` exits 0 -> tfc_lane returns reachable:true.
- A skill can be eval_proven but reachable:false when tfc_install has not run or the CLAUDE_SKILLS symlink is broken. tfc_relink recreates missing symlinks and de-dups stale copies.

## Portfolio Governance Tools
source: ultraflow/SKILL.md#stage-6-install-and-govern (Governance tools subsection)

- tfc_graph: visualize the skill discovery graph and adjacency. Use to see which skills are connected and which are isolated.
- tfc_recommend(category, name): returns top adjacent skills. Use after forging to discover what the new skill should pair_with.
- tfc_compose(category, name): resolves the imports_context inheritance chain. Use when a skill imports context from another.
- tfc_capture(audit=true): the honest dead-loop view. Returns neverInvoked skills (runsCount=0). Use after portfolio growth to prune candidates.
- tfc_pack_bridge: flags any Kraken pack whose paired skill fell below its evidence floor. Run before /ship to catch lane regressions.
- tfc_decay: ages proofs past the freshness horizon (eval_proven: 30 days, evolution_proven: 60 days). Drops effective lane of stale proofs.
- tfc_replay: replays the history of a skill's eval/evolve cycle. Use for post-mortems or to understand how a skill evolved.
- tfc_portfolio: full portfolio view. Shows lane distribution, freshness, runsCount across all registered skills.
- tfc_doctor: full health check before forging. Catches dangling symlinks, stray state, missing manifests. Run once at the start of any govern session.
- tfc_relink: recreates missing symlinks and de-dups stale copies. Safe to run; it reports real conflicts for a human to resolve rather than silently overwriting.
- tfc_list: shows all registered skills with their effective lanes. A dangling entry means tfc_install is needed.

## When to Run Govern
source: ultraflow/SKILL.md#modes + ultraflow/SKILL.md#quick-wins

- Run `/ultraflow --govern` to get the honest portfolio view: neverInvoked skills, packs below their evidence floor, stale proofs.
- Run tfc_doctor before EVERY forge session. A broken forge (dangling symlinks, stray state) will fail the Stage 6 install step.
- Run tfc_decay periodically (weekly is reasonable). Skills with stale proofs misrepresent their lane to pack_bridge.
- Run tfc_capture --audit after every 3-5 new forge runs. A portfolio that grows without pruning drifts toward neverInvoked bloat.
