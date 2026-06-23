# TFC Tools Reference (v4 — 28 tools)

Every tool is **model-free** in the INV-1 sense: none call an external model API. Tools marked
*(prompt)* return a prompt-template that Claude executes in-session (Claude is the engine), still
with no API key. All file-writing tools use `Result<T>` + `skillDir`/`safeJoin` (INV-2).

| Tool | Purpose | Inputs | Outputs | Model-free | Added |
|------|---------|--------|---------|------------|-------|
| tfc_new | Scaffold a skill from `_template/` | category, name, archetype?, dryRun?, withContext? | {dir, files} | Yes | v3 (+withContext v4 W1) |
| tfc_brainstorm | Prompt to brainstorm intelligence layers *(prompt)* | name, category, intent | prompt | Yes | v3 |
| tfc_generate | Prompt to generate named layers *(prompt)* | category, name, layers | prompt | Yes | v3 |
| tfc_validate | Gate-check against `validations.yaml` | category, name | {blocking, warnings, info} | Yes | v3 |
| tfc_score | Score 0–100 against the archetype rubric | category, name | {score, breakdown, gaps} | Yes | v3 |
| tfc_migrate | Migrate a spawner/gstack skill to TFC | sourcePath, sourceType, category, name, dryRun? | plan | Yes | v3 |
| tfc_install | Create both invocation symlinks (idempotent) | category, name, dryRun? | {links} | Yes | v3 |
| tfc_register | Register in the spawner index | category, name | {spawnerLink} | Yes | v3 |
| tfc_list | List installed skills + dangling symlinks | brokenOnly? | {skills} | Yes | v3 |
| tfc_lane | Recompute the EARNED lane from disk | category, name | {lane, reasons, cacheDrift} | Yes | v3 |
| tfc_eval | Behavioral-eval prompt (golden, optional `--live`) *(prompt)* | category, name, taskIds?, live? | {prompt, source} | Yes | v3 (+`--live` v4 W4) |
| tfc_evolve | Loop-closing prompt (consume learnings, re-eval) *(prompt)* | category, name, force?, dryRun? | prompt | Yes | v3 |
| tfc_pack_bridge | Pack pairings below their `min_lane` floor | packsFile? | {rows} | Yes | v3 |
| tfc_doctor | System health + per-skill earned lanes | — | {checks, skills} | Yes | v3 |
| tfc_compile | Intent front door → born-loop-ready SkillCard *(prompt)* | intent, context? | prompt | Yes | v3 |
| tfc_capture | Wire/audit continuous learnings capture | audit?, category?, name?, dryRun? | {wired \| audit} | Yes | v3 |
| tfc_relink | Repair invocation symlinks (de-dup identical) | category?, name?, dryRun? | {repairs, conflicts} | Yes | v3 |
| tfc_decay | Perishable-proof overlay (stale → drop a rung) | category, name, asOf? | {stale, effectiveLane} | Yes | v3 |
| tfc_replay | N-sample eval stability quorum *(prompt)* | category, name, samples? | prompt | Yes | v3 |
| tfc_portfolio | One-currency portfolio rollup | asOf? | {histogram, decayPressure, ...} | Yes | v3 (+succeededBy v4 W5) |
| tfc_behavioral | Deterministic contract QA (no model) | category, name | {report} | Yes | v3 |
| tfc_integrate | Write a validated integration contract | category, name, system, direction?, reason?, dryRun? | {kind, added, validation} | Yes | v3 |
| tfc_context | Scaffold `context/` stubs from the taxonomy | category, name, files?, dryRun? | {dir, created[]} | Yes | v4 W1 |
| tfc_context_audit | Scan the fleet for missing/stale/undeclared context | asOf?, staleDays? | {skill, missing, stale, undeclared}[] | Yes | v4 W1 |
| tfc_context_update | Re-stamp `last_verified` on one context file | category, name, file | {path, last_verified} | Yes | v4 W1 |
| tfc_compose | Resolve the `imports_context` chain (depth ≤ 3) | category, name | {resolved[], depth, cycle?} | Yes | v4 W2 |
| tfc_graph | Discovery graph: pairs_with + imports_context edges | — | {nodes[], edges[]} | Yes | v4 W5 |
| tfc_recommend | Top-3 skills adjacent in the discovery graph | category, name | {skill, reason, edge}[3] | Yes | v4 W5 |

## v4 additions at a glance

- **Portable context** (`tfc_context*`): a skill carries its domain knowledge in-repo under
  `context/`, instead of re-deriving it per run or reading a machine-specific absolute path.
- **Composition** (`tfc_compose`): a skill inherits another's context via `imports_context`.
- **Discovery** (`tfc_graph`, `tfc_recommend`): the skill graph is traversable.
- **Live eval** (`tfc_eval --live`): the eval score can read real invocation history.
