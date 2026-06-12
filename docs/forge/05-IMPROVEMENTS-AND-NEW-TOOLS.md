# 05 — IMPROVEMENTS, NEW TOOLS, STRATEGY
# Every change, prioritized. Tool contracts ready to implement against.

Priority key: **P0** = the moat (do first) · **P1** = compounding quality · **P2** = polish.

---

## A. Improvements to EXISTING tools (tfc-builder v1 → v2)

| # | Pri | Tool | Change | Where |
|---|-----|------|--------|-------|
| 1 | P0 | `tfc_score` | Per-archetype rubrics (domain-expert / workflow / hybrid / reference). Current rubric becomes DOMAIN_RUBRIC. Acceptance: vague-to-system as `workflow` scores ≥70 unchanged. | `src/core/score.ts`, `checks.ts` |
| 2 | P0 | `tfc_new` | Archetype-specific scaffold templates (`_template/` gains `workflow/`, `reference/` variants; current template = domain-expert/hybrid). | `src/core/scaffold.ts`, `skills/_template/` |
| 3 | P0 | `tfc_install` | Compile step: render managed blocks (preamble, decision-brief, overlay, voice) + compile `routing:` → frontmatter description. Flags: `--recompile-all`, `--strict` (require eval pass). | `src/core/install.ts` |
| 4 | P1 | `tfc_validate` | New gates: `routing-block-present`, `archetype-declared`, `required-sections-instructed` (MNEP), `disambiguate-on-collision`. Add `--fix` mode returning scoped rewrite prompts for voice violations. | `src/core/validate.ts`, new `prompts/voicefix.fragment.ts` |
| 5 | P1 | `tfc_list` | Add `evolvePending` (≥5 unconsumed learnings), `evalStatus` (never/pass/fail/stale), `archetype` per skill. | `src/core/install.ts` (list fn) |
| 6 | P1 | `tfc_migrate` | Use archetype detection on source (gstack source → workflow, spawner source → domain-expert by default); density contract extended to phases/stop-points for workflow sources. | `src/core/migrate.ts`, `mappers/*` |
| 7 | P2 | `tfc_brainstorm` / `tfc_generate` | Accept `archetype` to select fragments (workflow skills get PHASES/STOP-POINTS/EVIDENCE fragments instead of patterns-only). | `src/core/authoring.ts` + new fragments |
| 8 | P2 | telemetry | Add `skill` invocation telemetry (preamble appends to `analytics/runs.jsonl` with skill, project, duration) so doctor/evolve see real usage, not just builder usage. | `runtime/preamble.sh` |

## B. NEW tools — contracts

### Tool 1 · `tfc_compile` (P0) — the intent front door
```
in:  { intent: string, context?: string }
out: { ok, data: { prompt } }            # prompt-template; Claude fills the SkillCard
```
The prompt instructs Claude to: (1) search before building: `tfc_list` + `ls
~/.claude/skills` + `spawner_skills(search)` → fill `covers_existing` +
`overlap_verdict` (new | extend | upgrade-existing); (2) infer archetype from intent
verbs; (3) draft layer_plan with target counts, routing block, model_tier, 3 eval
seeds; (4) ask AT MOST 3 questions, only if blocking. Output contract: a fenced
SkillCard YAML between `---START-SKILLCARD---` delimiters.
**Where:** `src/core/compile.ts` + `prompts/skillcard.fragment.ts`. Failure codes:
`BAD_INPUT` (intent <5 words → hint "describe the job, not the feature").

### Tool 2 · `tfc_eval` (P0) — behavioral proof
```
in:  { category, name, taskIds?: string[] }
out: { ok, data: { prompt, reportPath } }   # judge prompt; Claude writes eval-report.json
```
Reads `evals.yaml` (NOT_FOUND hint: "seed it from the SkillCard or run tfc_compile").
The judge prompt runs each golden task baseline-vs-skill-loaded, checks must/must_not
observably, scores rubric items 0–1, writes
`{behavioral_score, per_task:[{id,pass,delta_note}], ts, skill_version}` to
`eval-report.json`. `pass_threshold` from evals.yaml (default 0.8).
**Where:** `src/core/evaluate.ts` + `prompts/judge.fragment.ts`. New file in skill
contract: `evals.yaml` (template in `_template/`).

### Tool 3 · `tfc_evolve` (P0) — the loop closer
```
in:  { category, name, dryRun?: boolean }
out: { ok, data: { prompt, learningsConsumed: n, targetSections: [...] } }
```
Clusters unconsumed learnings (operational/sharp_edge/routing/timing) + eval failures
+ run telemetry; emits a regeneration prompt scoped to weakest sections, carrying the
density contract and the learnings as required inputs; instructs version bump +
CHANGELOG.jsonl append + re-validate/re-score/re-eval chain. Marks learnings consumed
(adds `consumed_in: vX.Y.Z` field; file stays append-only otherwise).
**Where:** `src/core/evolve.ts`. Guard: refuses (`NOT_READY`) under 3 learnings unless
`force`.

### Tool 4 · `tfc_route` (P1) — routing visibility + collision detection
```
in:  { format?: "table" | "claudemd" | "json", checkCollisions?: boolean }
out: { ok, data: { routingTable, collisions: [{skillA, skillB, sharedTrigger}] } }
```
Renders the master intent→skill table from all installed skills' `routing:` blocks
(gstack Mechanism 2, generated not hand-written). `claudemd` format emits a paste-ready
`## Skill routing` section. Collision check powers the `disambiguate-on-collision`
validate gate.
**Where:** `src/core/route.ts`.

### Tool 5 · `tfc_doctor` (P1) — system health
```
in:  {}
out: { ok, data: { skills: n, links: {ok, broken}, neverInvoked: [...],
       evolvePending: [...], evalStale: [...], builderErrors: {tool: failRate},
       slowest: [...], voiceDebt: [...] } }
```
Aggregates `analytics/*.jsonl` + tfc_list + eval reports into one verdict. The
"is my skill system healthy" command. **Where:** `src/core/doctor.ts`.

### Tool 6 · `tfc_pack_bridge` (P2) — Kraken pack ↔ TFC skill sync
```
in:  { packsYaml?: path }    # default ~/.spawner/skills/pattern/kraken-packs/packs.yaml
out: { ok, data: { bound: [{pack, skill}], unbound_packs, unbound_skills, drift } }
```
Read-only report: which packs declare `pairs_skill` pointing at installed TFC skills,
which TFC skills have no pack lens, where required_sections drift between pack and
spec.yaml. Never edits packs.yaml (vault/pack layer stays Kraken-owned).
**Where:** `src/core/packbridge.ts`.

## C. New skill-contract files

| File | Required? | Owner |
|------|-----------|-------|
| `evals.yaml` | Required for install `--strict`; seeded by tfc_compile | author + compile |
| `eval-report.json` | Generated by tfc_eval | machine |
| `CHANGELOG.jsonl` | Generated by tfc_evolve | machine |
| `runtime/overlays/{claude,gpt,gemini,o-series}.md` | Shared (not per-skill) | TFC runtime |
| `runtime/decision-brief.md` | Shared managed block | TFC runtime |

## D. Strategy — how this wins

1. **Lane choice:** gstack owns hand-crafted workflow skills; spawner owns the
   discovery index. The Forge owns the GENERATOR: the only system where intent → 
   installed, eval-proven, self-improving skill in one session. Do not compete on
   skill count; compete on skill BIRTH RATE and IMPROVEMENT RATE.
2. **Eval-first as the trust wedge.** "Score 90" is marketing; "behavioral delta 0.86
   on 3 golden tasks, report on disk" is proof. No competitor measures this today.
3. **Migration as adoption.** tfc_migrate with density contracts converts the two
   existing corpora (478 spawner + ~58 gstack) into Forge skills mechanically. Priority
   order: skills the Kraken packs reference (P04/P05/P16 pairs), then top spawner
   search hits.
4. **The flagship proves it.** Build `learning/domain-mastery` (04-FORGE §6) as the
   public demo: one session, timed, eval report attached.
5. **Dogfood gate.** Every new Forge feature ships only after the builder pipeline
   itself uses it (tfc-builder skills for building tfc-builder: the build/ CATCQ pack
   already established this culture).
6. **Stay local-first.** No API keys, no hosted gates. The moment scoring or evals
   require a server, the system dies on a plane. (Hosted = advisory second opinions.)
