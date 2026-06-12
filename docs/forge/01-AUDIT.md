# 01 — AUDIT: ~/.future-code and tfc-builder, live-tested
# Verdict: 7.5/10 plumbing, 4/10 intelligence pipeline. Strong foundation, three structural gaps.

**Audited:** 2026-06-11, against the running MCP (tools called live, not just read).

---

## 1. Inventory — what exists

```
~/.future-code/
├── THE_FUTURE_CODE.md        588 lines. The spec. 4 layers: SPEC/EXECUTE/LEARN/ROUTE.
├── docs/                     4 docs: gstack-comparison (108), spawner-comparison (80),
│                             intelligence-context-guide (449), migration-guide (226)
├── build/tfc-builder-mcp/    11 CATCQ prompt-pack files (00-PROJECT → 10-ship-gate)
│                             that BUILT the MCP. RUN-ORDER.md is the dependency graph.
├── mcp/tfc-builder/          The MCP. TypeScript, 16 src files, test/{core,e2e,security},
│                             93%+ coverage on src/core, 76+ tests.
├── runtime/                  preamble.sh + learnings-log.sh (shared bash)
├── skills/                   _template/ + 3 real skills (ai-code-generation,
│                             learn-itr, vague-to-system)
└── analytics/                tfc-builder.jsonl (telemetry sink, append-only)
```

### MCP source map (where each behavior lives)

| File | Owns |
|------|------|
| `src/server.ts` | MCP stdio entry |
| `src/tools/index.ts` + `registry.ts` + `schemas.ts` | Tool registry, Zod input validation |
| `src/core/scaffold.ts` | tfc_new (template copy + token swap) |
| `src/core/authoring.ts` | tfc_brainstorm + tfc_generate (prompt assembly) |
| `src/core/prompts/*.fragment.ts` | The 8 writing-guide fragments (identity, principles, patterns, anti-patterns, quick-wins, handoffs, stack, voice) |
| `src/core/validate.ts` + `checks.ts` | tfc_validate gates (CHECK_REGISTRY) |
| `src/core/score.ts` | tfc_score 100-point rubric |
| `src/core/migrate.ts` + `mappers/{spawner,gstack}.ts` | tfc_migrate + density contract |
| `src/core/install.ts` | tfc_install / tfc_register / tfc_list, symlink safety |
| `src/core/paths.ts` | safeJoin, 3 allowed roots |
| `src/core/telemetry.ts` | per-call JSONL append, never throws |

---

## 2. Live test evidence (run today)

| Test | Result |
|------|--------|
| `tfc_list` | 3 skills, ALL 6 symlinks `ok` (claude + spawner sides) |
| `tfc_score ai/ai-code-generation` | **90/100** — identity 15, principles 15, patterns 20, anti-patterns 20, quick-wins 10, handoffs 10, voice 0 (em dash + AI vocabulary found) |
| `tfc_score learning/learn-itr` | **100/100** — clean |
| `tfc_score pattern/vague-to-system` | **0/100** — every intelligence section placeholder/absent |
| Tier-0 hook integration | The Kraken hook banner emitted `DOMAIN SKILL: spawner_skills(action="local", name="ai/ai-code-generation-tfc")` for THIS audit session. The spawner symlink registration is live and reachable by the routing layer end-to-end. |

---

## 3. What is strong (keep, do not rebuild)

1. **Result envelope discipline.** Every tool returns `{ok,data}|{ok,error{code,message,hint}}`.
   The MCP boundary never throws. 8 stable failure codes. This is better engineering than
   most public MCPs.
2. **Path safety.** `safeJoin` rejects `..`, leading `/`, null bytes; symlinks restricted
   to 3 allowed roots. Security tests exist (`test/security/`).
3. **Validate-first install.** Blocking gates run inside `tfc_install`; disk untouched on
   failure. Idempotent re-install (`exists`), conflicts surfaced (`LINK_CONFLICT`), never
   silently repointed.
4. **Claude-as-engine pattern.** `tfc_brainstorm`/`tfc_generate` return prompt templates
   with strict delimiter output contracts (`---START-SECTION---`). No API key, no vendor
   lock, no cost. Same pattern as IdeaRalph. Correct call.
5. **Density contract in migration.** `mappers/spawner.ts` counts source patterns and
   anti-patterns and makes the authoring prompt require ≥ that count. This is the single
   best anti-regression idea in the codebase: migration cannot silently dumb a skill down.
6. **The intelligence-context-guide.** `docs/intelligence-context-guide.md` correctly
   identified that a spawner skill.yaml is a compressed domain expert with 6+ layers, and
   wrote the extraction protocol. The scorer was then built to enforce it. Spec → rubric
   → tool: a real quality chain.
7. **Dual registration model.** `~/.claude/skills/{name}` (invocable) + `~/.spawner/skills/{cat}/{name}-tfc`
   (discoverable). Proven live by the hook banner today.
8. **The build/ prompt-pack.** The MCP was itself built from an 11-file CATCQ plan with a
   dependency graph and a ship gate. The factory that built the factory is preserved and
   re-runnable. Almost nobody keeps this artifact.
9. **Telemetry that never fails the call.** Write failures swallowed. Correct priority.

---

## 4. Gaps — each with WHAT / HOW / WHERE

### GAP 1 — The scorer recognizes only one skill shape  ⟵ highest priority
**Evidence:** `vague-to-system` scores 0/100 yet is a real, working, installed skill
(it is a workflow/router skill: CLASSIFY → INTERROGATE → FORGE → ROUTE). gstack's
`investigate` (918 lines of workflow) would also score ~0.
**WHAT:** Add skill archetypes: `domain-expert`, `workflow`, `hybrid`, `reference`.
Score each archetype against its own rubric (workflow skills: phases, stop points,
completion protocol, preamble, evidence requirements — not identity/patterns).
**HOW:** Add `archetype:` field to spec.yaml schema; branch `scoreFromLoaded()` on it;
add a `WORKFLOW_RUBRIC` beside the current one (current rubric becomes `DOMAIN_RUBRIC`).
**WHERE:** `src/core/score.ts`, `src/core/checks.ts` (new section extractors),
`skills/_template/spec.yaml` (new field), `04-FORGE-DESIGN.md` Decision 1 has the rubric.

### GAP 2 — No behavioral eval. Score measures shape, not effect.
**Evidence:** `score.ts` is regex/count-based (`countRealNamedItems`, `isFilledContent`).
Three garbage patterns named "Foo/Bar/Baz" with fake examples would score 20/20.
Nothing ever tests "does loading this skill change model output for the better?"
**WHAT:** `tfc_eval` — golden tasks per skill + LLM-judge rubric (Claude-as-engine,
same no-API-key pattern as brainstorm). Structural score (tfc_score) + behavioral
score (tfc_eval) = the real grade.
**HOW:** New file `evals.yaml` per skill (3–5 golden prompts + expected-behavior
checklist); tool returns a judge prompt; Claude executes and writes `eval-report.json`.
**WHERE:** New `src/core/evaluate.ts` + `src/core/prompts/judge.fragment.ts`;
spec in `05-IMPROVEMENTS-AND-NEW-TOOLS.md` Tool 2.

### GAP 3 — The learning loop has a writer but no reader
**Evidence:** `learnings.jsonl` is written (runtime/learnings-log.sh, preamble surfaces
top 3) and telemetry accumulates in `analytics/`, but NOTHING consumes either to change
a skill. THE_FUTURE_CODE.md promises "after 10 runs, measurably better" — currently false:
nothing rewrites the skill.
**WHAT:** `tfc_evolve` — reads learnings.jsonl + telemetry for a skill, clusters insights,
returns a regeneration prompt targeting the weak sections, bumps version, re-scores.
**HOW:** Threshold trigger (≥5 learnings since last version bump) surfaced by `tfc_list`;
evolve prompt includes the density contract so evolution never loses content.
**WHERE:** New `src/core/evolve.ts`; consumes `skills/*/*/learnings.jsonl` +
`analytics/tfc-builder.jsonl`; spec in `05-IMPROVEMENTS` Tool 3.

### GAP 4 — Routing is registered but not engineered
**Evidence:** TFC installs symlinks, but the SKILL.md frontmatter `description:` (the text
Claude Code actually routes on) is whatever the author wrote. gstack engineers this text
deliberately: "Use when asked to X", "Proactively invoke when Y", "Voice triggers: Z".
TFC has no contract for it and no compiler producing it.
**WHAT:** A `routing:` block in spec.yaml (`use_when`, `proactive_when`, `voice_triggers`,
`never_when`) compiled by `tfc_install` into the SKILL.md frontmatter description.
**HOW:** Template the description; validate gate "routing block present"; see
`02-GSTACK-DECODED.md` Mechanism 1 for the grammar that works.
**WHERE:** `skills/_template/spec.yaml`, `src/core/install.ts` (compile step),
`src/core/checks.ts` (gate).

### GAP 5 — Preamble is copy-pasted, not compiled
**Evidence:** `runtime/preamble.sh` exists, but `_template/SKILL.md` embeds the whole
block with `SKILL_ID_PLACEHOLDER` comments ("Do not edit this block directly... and
regenerate") — yet there is no regenerate command. gstack solved this: SKILL.md is
generated from SKILL.md.tmpl + `{{PREAMBLE}}` blocks via `gen:skill-docs`.
**WHAT:** Make SKILL.md a build artifact: `tfc_install --compile` (or `tfc_new`) splices
preamble + model overlay + routing frontmatter from shared sources.
**HOW:** Token swap already exists in `scaffold.ts` (`tokens.ts`); extend it to a compile
step that re-renders managed blocks while preserving authored sections.
**WHERE:** `src/core/scaffold.ts`, `src/core/install.ts`, `runtime/preamble.sh`.

### GAP 6 — No model overlays
**Evidence:** spec.yaml has `model_tier` (good) but nothing adapts a skill's behavior per
model family. gstack ships 6 overlay files with `{{INHERIT:claude}}` inheritance.
**WHAT:** `runtime/overlays/{claude,gpt,gemini,o-series}.md` + compile-time splice into
a `## Model Behavioral Patch` section, subordinate to skill gates.
**HOW:** Copy gstack's overlay semantics (they are model-agnostic prose, MIT-licensed
pattern); wire into the compile step from GAP 5.
**WHERE:** `runtime/overlays/`, `src/core/install.ts`.

### GAP 7 — cli.ts exists but is not the documented path
**Evidence:** `src/cli.ts` (4.1K) exists; README documents only MCP usage; THE_FUTURE_CODE
Phase 2 lists "tfc CLI" as unbuilt. State unclear = trust low.
**WHAT:** Decide: CLI is a thin wrapper over the same core (one binary `tfc` with
new/validate/score/install/list). Document or delete.
**WHERE:** `src/cli.ts`, README "Install" section, `package.json` bin entry.

### GAP 8 — Voice gate detects but cannot fix
**Evidence:** ai-code-generation lost 10 points to em dashes + AI vocabulary; the gate
names the violation but the fix is manual.
**WHAT:** `tfc_validate --fix` returns a rewrite prompt scoped to violating lines only
(Claude-as-engine again); never auto-edits authored content silently.
**WHERE:** `src/core/validate.ts`, new fragment `src/core/prompts/voicefix.fragment.ts`.

### GAP 9 — Telemetry is write-only
**Evidence:** `analytics/tfc-builder.jsonl` accumulates per-call lines; nothing reads it.
**WHAT:** `tfc_doctor` aggregates: tool failure rates, slowest tools, skills never
invoked since install, dangling links (extends tfc_list), learnings-pending-evolution.
**WHERE:** New `src/core/doctor.ts`; spec in `05-IMPROVEMENTS` Tool 5.

### GAP 10 — Three skills, no flagship
**Evidence:** The format claims "can make a perfect skill for any intent" with n=3, one
of which scores 0. No skill yet demonstrates the full loop (intent → generate → eval →
evolve after real runs).
**WHAT:** Build the flagship: the "teach any domain" skill from the user's own brief,
via the full Forge pipeline, timed. This is the worked example in `04-FORGE-DESIGN.md` §6.
**WHERE:** `skills/learning/domain-mastery/` (new), built by the pipeline itself.

---

## 5. Scoring the system itself

| Dimension | Score | Why |
|-----------|-------|-----|
| Engineering quality (MCP core) | 9/10 | Envelope, safety, tests, idempotency. Professional. |
| Skill format design | 8/10 | 4-layer synthesis is correct; archetypes missing. |
| Authoring pipeline | 7/10 | Brainstorm/generate/migrate with density contract. Strong. |
| Scoring/validation | 5/10 | Real rubric but shape-blind and behavior-blind. |
| Routing | 6/10 | Dual registration works (proven live); description text not engineered. |
| Learning loop | 2/10 | Writer exists, reader does not. The core promise is unimplemented. |
| Evals | 0/10 | Absent. Absent in gstack and spawner too: open lane. |
| **Overall** | **7.5/10 plumbing, 4/10 intelligence pipeline** | Foundation is shippable; the moat (eval + evolve) is unbuilt. |

**The one-line verdict:** v1 built the body. The Forge (04-FORGE-DESIGN) builds the
nervous system: archetypes, evals, evolution, engineered routing.
