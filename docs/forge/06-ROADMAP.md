# 06 — ROADMAP: build waves, exact targets, exit gates
# Sequenced so every wave ships something usable. Effort assumes Claude-driven sessions.

Conventions: all paths relative to `~/.future-code/mcp/tfc-builder/` unless noted.
Every wave ends: `npm test` green + `tfc_validate` on touched skills + one-line entry
in `~/.future-code/analytics/waves.jsonl`.

---

## WAVE 1 — Archetypes (fixes the wrong-rubric bug) · ~1 session · P0

| Step | Do | Where |
|------|----|----|
| 1.1 | Add `archetype` to spec schema (enum, required, default `domain-expert` for back-compat) | `src/core/types.ts`, `src/tools/schemas.ts` |
| 1.2 | Split rubrics: `DOMAIN_RUBRIC` (current) + `WORKFLOW_RUBRIC` (phases 20, stop-points 15, preamble 10, completion 10, evidence 15, failure-paths 10, handoffs 10, voice 10) + hybrid (both halves ≥60) + reference | `src/core/score.ts` |
| 1.3 | New extractors: `countPhases`, `countStopPoints`, `hasCompletionProtocol` | `src/core/checks.ts` |
| 1.4 | Set `archetype: workflow` in vague-to-system spec; `hybrid` in learn-itr | `~/.future-code/skills/*/spec.yaml` |
| 1.5 | Tests: each archetype scored on a fixture; the acceptance test | `test/core/score.test.ts`, `test/fixtures/` |

**Exit gate:** `tfc_score pattern/vague-to-system` ≥70 with zero content edits.

## WAVE 2 — Compiled routing + managed blocks · ~1–2 sessions · P0

| Step | Do | Where |
|------|----|----|
| 2.1 | `routing:` block in spec template + Zod schema (use_when ≥4 words, voice_triggers, proactive_when, never_when, disambiguate) | `skills/_template/spec.yaml`, `src/tools/schemas.ts` |
| 2.2 | Description compiler: routing → frontmatter description (gstack grammar) | `src/core/install.ts` (new `compileDescription()`) |
| 2.3 | Managed blocks: `<!-- TFC:MANAGED:x -->` markers; splice preamble/decision-brief/overlay/voice; `--recompile-all` | `src/core/install.ts`, `src/core/tokens.ts` |
| 2.4 | Author the shared sources: state-contract v2 preamble; decision-brief (adopt gstack format); 4 overlays with `{{INHERIT}}`; voice + GOOD/BAD pair | `~/.future-code/runtime/{preamble.sh,decision-brief.md,voice.md,overlays/*.md}` |
| 2.5 | Validate gates: routing-block-present, archetype-declared | `src/core/validate.ts` |
| 2.6 | Recompile the 3 installed skills; verify links + descriptions | `tfc_install --recompile-all`, then `tfc_list` |

**Exit gate:** all 3 skills carry compiled descriptions + managed blocks; editing
`runtime/preamble.sh` + recompile updates all three; authored sections untouched (diff
proves it).

## WAVE 3 — tfc_compile + tfc_eval (the moat) · ~2 sessions · P0

| Step | Do | Where |
|------|----|----|
| 3.1 | SkillCard fragment + `tfc_compile` (search-before-build instructions, archetype inference, 3-question cap, eval seeds) | `src/core/compile.ts`, `src/core/prompts/skillcard.fragment.ts`, `src/tools/` |
| 3.2 | `evals.yaml` template + schema | `skills/_template/evals.yaml`, `src/tools/schemas.ts` |
| 3.3 | `tfc_eval`: judge fragment (baseline-vs-loaded, must/must_not, rubric 0–1) + report writer | `src/core/evaluate.ts`, `prompts/judge.fragment.ts` |
| 3.4 | `tfc_install --strict` (require eval pass) | `src/core/install.ts` |
| 3.5 | e2e: compile → new → brainstorm → generate → validate → score → eval → install on a throwaway skill | `test/e2e/lifecycle.test.ts` (extend) |

**Exit gate:** full pipeline runs on a fresh intent in one session; `eval-report.json`
exists with behavioral_score; `--strict` blocks an eval-less skill.

## WAVE 4 — THE FLAGSHIP: learning/domain-mastery · ~1 session (~20 min target) · P0

Execute 04-FORGE-DESIGN §6 exactly, timed, using only the pipeline (no hand-editing
outside the returned prompts). Deliverables: the installed skill, its eval report,
and a timing log appended to `analytics/waves.jsonl`.

**Exit gate:** `/domain-mastery` invocable; hook banner can route to it
(`spawner_skills(action="local", name="learning/domain-mastery-tfc")`); behavioral
score ≥0.8; total wall-clock ≤30 min (target 20).

## WAVE 5 — tfc_evolve + telemetry close · ~1–2 sessions · P0/P1

| Step | Do | Where |
|------|----|----|
| 5.1 | Run-telemetry in preamble (`analytics/runs.jsonl`) + per-project journal | `runtime/preamble.sh` |
| 5.2 | `tfc_evolve` (cluster → scoped regen prompt → density contract → version bump → CHANGELOG.jsonl → consumed markers) | `src/core/evolve.ts` |
| 5.3 | `tfc_list` gains evolvePending/evalStatus/archetype | `src/core/install.ts` |
| 5.4 | Preamble prints `EVOLVE_PENDING: n` | `runtime/preamble.sh` |
| 5.5 | Use domain-mastery for ~10 real sessions → run the first real evolution → eval delta | live usage |

**Exit gate:** one skill evolved v1.0.0 → v1.1.0 from real learnings; re-eval shows
non-negative delta; CHANGELOG.jsonl explains every change.

## WAVE 6 — Visibility + bridge: tfc_route, tfc_doctor, tfc_pack_bridge, voice --fix · ~1–2 sessions · P1/P2

route table + collision gate (`src/core/route.ts`) · doctor aggregation
(`src/core/doctor.ts`) · pack bridge read-only report (`src/core/packbridge.ts`) ·
`tfc_validate --fix` voice prompts · decide cli.ts (document `tfc` bin or delete).

**Exit gate:** `tfc_doctor` returns one healthy verdict; `tfc_route checkCollisions`
clean across installed skills; cli.ts state resolved.

## WAVE 7 — Migration at scale (ongoing) · P1

Order: (1) skills Kraken packs name in `pairs_skill`/skill_chain (deep-understanding,
realthink, think-pipeline get spec.yaml + routing blocks via tfc_migrate gstack-mapper);
(2) top spawner skills by hook DOMAIN-SKILL hits; (3) every NEW skill is Forge-born
(policy line added to `~/vibeship-x-kraken/CLAUDE.md` tool-routing table).
Each migration: density contract enforced, eval seeds added, archetype set.

---

## Risk register (what bites, pre-named)

| Risk | Mitigation |
|------|------------|
| Recompile clobbers authored prose | Managed-block markers + diff test in Wave 2.6; never write outside markers |
| Eval theater (judge grades its own homework leniently) | must/must_not are OBSERVABLE strings/behaviors, not vibes; baseline-vs-loaded delta framing; spot-audit reports monthly via tfc_doctor |
| Archetype gaming (declare reference to dodge rubric) | validate gate: archetype must match structure (workflow sections present ⇒ cannot be reference) |
| Trigger collisions as corpus grows | tfc_route collision gate is blocking at install from Wave 6 |
| Claude Code restart amnesia (new tools invisible) | after MCP rebuild: restart host, verify with `tfc_list` (same lesson as kraken-mcp persona fix, audit 2026-06-11) |
| Scope creep into a second memory/vault system | VIA NEGATIVA list in 04-FORGE-DESIGN is the contract; doctor flags new state files outside the contract |

## Definition of done (the whole program)

A stranger with this repo can: speak an intent → get an installed, routed, eval-proven
skill in one session → use it 10 times → run one command and watch it improve itself,
with the proof on disk. That is the system gstack and spawner do not have.
