# 04 — FORGE DESIGN: the system that turns intent into a world-class skill
# TFC v2. One pipeline: INTENT → SPEC → GENERATE → VALIDATE → SCORE → EVAL → INSTALL → OBSERVE → EVOLVE

This is the core doc. It commits to decisions (no option lists without a verdict).

---

## PRIOR ART (what each system proved)

| System | Proved | Failed at |
|--------|--------|-----------|
| spawner | Domain intelligence compresses into 7 YAML layers; discovery via triggers + registry scales to 478 skills | Execution, learning, model routing |
| gstack | Skills as compiled artifacts; description-text routing; preamble state machine; model overlays; decision briefs | Creation from intent; machine-readable metadata; measurement |
| tfc-builder v1 | The 4-file merge works; Claude-as-engine authoring works; density contracts prevent migration regression; dual registration reaches the live router (proven today) | One-shape scoring; no evals; learning loop has no reader |
| Kraken OS | Level-gated routing (L1–L4), pack required_sections (MNEP), engagement gates | Pack regex hints misfire; packs and skills are parallel systems, not one |

## FIRST PRINCIPLES

1. **A skill is a behavioral delta.** Its worth = (model output with skill) minus
   (model output without skill). Anything unmeasured is decoration. Therefore evals
   are not optional (Decision 4).
2. **Intelligence has a shape.** Domain expertise (BE someone) and workflow discipline
   (DO something) are different deltas and need different rubrics (Decision 1).
3. **Skills are compiled, not written.** Shared behavior lives once; per-skill content
   lives in the skill; an install step splices them (Decision 6).
4. **The description is the API.** Routing happens in the ~80 words the harness shows
   the model. Engineer them; never hand-write them twice (Decision 3).
5. **A skill that does not learn is decaying.** Close the loop or admit the promise is
   false (Decision 5).
6. **One source of truth per fact.** spec.yaml owns identity/routing/composition;
   SKILL.md owns instructions; learnings.jsonl owns experience; evals.yaml owns proof.

---

## ARCHITECTURE

```
                       ┌─────────────────────────────────────────────┐
 USER INTENT           │              tfc-builder v2 (MCP)           │
 "I want a skill that  │                                             │
  teaches any domain"  │  tfc_compile   intent → SkillCard (new)     │
        │              │  tfc_new       scaffold from archetype      │
        ▼              │  tfc_brainstorm / tfc_generate  (exists)    │
   ┌──────────┐        │  tfc_validate  gates (+ --fix) (extend)     │
   │ SkillCard │───────►  tfc_score     per-archetype rubric (extend)│
   └──────────┘        │  tfc_eval      golden tasks + judge (new)   │
                       │  tfc_install   compile + link    (extend)   │
                       │  tfc_route     render routing table (new)   │
                       │  tfc_doctor    system health     (new)      │
                       │  tfc_evolve    learnings → regen (new)      │
                       └──────────────────┬──────────────────────────┘
                                          │ writes
        ┌─────────────────────────────────┼──────────────────────────┐
        ▼                                 ▼                          ▼
~/.future-code/skills/{cat}/{name}/   ~/.claude/skills/{name}/   ~/.spawner/skills/
├── spec.yaml      (identity+routing)   SKILL.md (COMPILED        {cat}/{name}-tfc →
├── SKILL.md       (authored+managed)    artifact, symlink)        (discovery symlink)
├── evals.yaml     (golden tasks)            │                          │
├── validations.yaml                         ▼                          ▼
├── learnings.jsonl ◄── runtime writes   Claude Code            spawner_skills(local)
└── eval-report.json ◄── tfc_eval       description routing     + Kraken tier-0 hook
                                                                 (DOMAIN SKILL line)
RUNTIME (shared, spliced at compile): runtime/preamble.sh, runtime/overlays/*.md,
runtime/decision-brief.md, runtime/voice.md
```

---

## DECISION 1 — Skill archetypes (fixes the 0/100 problem)

`spec.yaml` gains a required field:

```yaml
archetype: domain-expert | workflow | hybrid | reference
```

| Archetype | Is | Examples | Scored on |
|-----------|----|----------|-----------|
| `domain-expert` | A compressed expert: BE someone | angular, ai-code-generation | Current rubric: identity 15, principles 15, patterns 20, anti-patterns 20, quick-wins 10, handoffs 10, voice 10 |
| `workflow` | An executable procedure: DO something | investigate, ship, vague-to-system | NEW rubric: phases 20 (numbered, ordered), stop-points 15 (explicit gates), preamble 10, completion-protocol 10, evidence-rules 15 ("screenshot or it didn't happen"), failure-paths 10 (BLOCKED/NEEDS_CONTEXT defined), handoffs 10, voice 10 |
| `hybrid` | Both (most real skills) | deep-understanding, kraken-flow | 50% of each rubric; must clear 60 on both halves |
| `reference` | Lookup tables, cheatsheets | claude-api | Coverage 40, freshness 20 (version-stamped), retrieval shape 30 (tables, anchors), voice 10 |

Detection: `tfc_compile` infers archetype from intent verbs (teach/debug/ship → workflow
or hybrid; "expert in X" → domain-expert); author can override; `tfc_score` reads the
field and applies the right rubric. A skill scored against the wrong rubric is a
validation ERROR, not a low score.

**Acceptance test:** `vague-to-system` re-scored as `workflow` must score ≥70 without
content changes (it has phases, gates, routing). If it does not, the workflow rubric is
wrong, not the skill.

## DECISION 2 — The intent compiler: `tfc_compile`

The missing front door. Today the pipeline starts at `tfc_new` (you already know
category/name). Real users start with a vibe: "skill that can teach any domain."

`tfc_compile(intent, context?)` returns a **SkillCard** (prompt-template pattern, Claude
fills it in-session, same as brainstorm):

```yaml
# SkillCard — the contract between intent and pipeline
name: domain-mastery            # proposed
category: learning
archetype: hybrid
one_liner: "Builds a personalized mastery curriculum for any domain in one session"
jobs_to_be_done:                # 3–5, each "When I... I want... so I..."
covers_existing: [deep-understanding, learn-itr]   # MUST search first:
overlap_verdict: extend | new | upgrade-existing    # spawner_skills + tfc_list + ~/.claude/skills
layer_plan:                     # which intelligence layers, with target counts
  identity: required            # e.g. patterns: 5 (spaced-repetition, feynman-gate, ...)
routing_draft: {use_when: [...], proactive_when: [...], voice_triggers: [...], never_when: [...]}
model_tier: sonnet
eval_seeds:                     # 3 golden tasks proposed AT BIRTH (Decision 4)
open_questions: [...]           # max 3, AskUserQuestion if blocking
```

Rule inherited from vague-to-system: max 3 questions, then commit. Rule inherited from
Kraken P10: "codify a proven pattern" — `overlap_verdict` forces the search-before-build
gate so the Forge never mints a duplicate of an existing skill.

## DECISION 3 — Routing is compiled from spec.yaml

`spec.yaml` gains:

```yaml
routing:
  use_when:                      # exact phrases, ≥4 words each
    - "teach me this domain from scratch"
  proactive_when: "user is studying material and retention is the goal"
  voice_triggers: ["deep understanding", "make me master this"]
  never_when: "user wants a quick factual lookup (route: reference skill)"
  disambiguate: "for one-shot explanations use /learn-itr; this skill builds a curriculum"
```

`tfc_install` compiles this into the SKILL.md frontmatter `description:` using the
gstack grammar (02-GSTACK Mechanism 1): Use-when phrases, the proactive contract
sentence ("Proactively invoke this skill (do NOT answer directly) when..."), voice
triggers line, disambiguation line. The same block feeds:

1. Claude Code harness routing (frontmatter) — compiled
2. spawner search (`triggers:` mirrors `use_when`) — compiled
3. Kraken tier-0 hook (DOMAIN SKILL via spawner symlink) — already live
4. `tfc_route` master table (02-GSTACK Mechanism 2) — rendered on demand

One authored block, four routing surfaces, zero drift. Validation gate: every
`use_when` ≥4 words; `disambiguate:` required when `tfc_route` detects trigger overlap
with an installed skill.

## DECISION 4 — Evals at birth: `evals.yaml` + `tfc_eval`

Every skill ships with golden tasks (seeded by tfc_compile, refined by the author):

```yaml
# evals.yaml
golden_tasks:
  - id: gt-01
    prompt: "I want to deeply understand how transformers work. I have 30 min/day."
    must: ["asks calibration questions before teaching", "produces a session plan with spaced checkpoints", "includes a Feynman test"]
    must_not: ["dumps a wall of explanation immediately", "skips prerequisite check"]
rubric:
  - "Did the skill change behavior vs a no-skill baseline?"   # the delta question
  - "Were all must-items observably present?"
pass_threshold: 0.8
```

`tfc_eval(category, name)` returns a judge prompt-template: Claude runs each golden
task twice in-session (baseline framing vs skill-loaded framing), grades against
must/must_not + rubric, writes `eval-report.json` `{behavioral_score, per_task, deltas}`.
No API key: the same Claude-as-engine pattern as brainstorm. The TRUE grade of a skill:

```
grade = structural (tfc_score) AND behavioral (tfc_eval)   # both must pass
```

`tfc_install --strict` refuses to link a skill whose eval has never run. This is the
moat: neither gstack nor spawner measures behavioral delta.

## DECISION 5 — Close the loop: `tfc_evolve`

The reader for what v1 only writes:

```
tfc_evolve(category, name) →
  1. read learnings.jsonl (new entries since version N) + analytics + eval-report
  2. cluster: operational fixes | sharp-edge confirmations | routing misses | timing
  3. return a regeneration prompt scoped to the weakest sections, carrying:
     - the density contract (counts must not decrease)
     - the learnings as REQUIRED inputs ("pattern X failed twice on ESM imports →
       add anti-pattern or fix the example")
  4. Claude applies edits → version bump (1.0.0 → 1.1.0) → re-validate → re-score → re-eval
  5. append one line to skills/{cat}/{name}/CHANGELOG.jsonl (what changed and why)
```

Trigger surfaces: `tfc_list` gains `evolvePending: true` when ≥5 unconsumed learnings;
the preamble prints `EVOLVE_PENDING: 5 learnings since v1.0.0`. The promise "after 10
runs, measurably better" becomes mechanical: run 10 → evolve → eval delta proves it.

## DECISION 6 — The compile step (managed blocks)

SKILL.md = authored sections + managed blocks. `tfc_install` (and `tfc_new`) renders:

```
<!-- TFC:MANAGED:preamble -->      ← from runtime/preamble.sh (state contract v2:
                                      MODEL_TIER, ARCHETYPE, LEARNINGS+top3,
                                      EVAL_STATUS, EVOLVE_PENDING, SPAWNED_SESSION)
<!-- TFC:MANAGED:decision-brief -->← from runtime/decision-brief.md (gstack Mechanism 6,
                                      adopted verbatim: D-numbering, ELI10, RECOMMENDATION,
                                      Completeness, dual-scale effort, Net, self-check)
<!-- TFC:MANAGED:overlay -->       ← from runtime/overlays/{model}.md with {{INHERIT}}
                                      resolution; subordinate-to-gates clause mandatory
<!-- TFC:MANAGED:voice -->         ← rules + the GOOD/BAD example pair
```

Recompile (`tfc_install --recompile-all`) refreshes every installed skill's managed
blocks without touching authored content. Fix the preamble once, all skills updated:
gstack's compiler advantage, without making the whole file generated.

## DECISION 7 — One system, not three (Kraken integration)

- **Packs reference TFC skills, not prose.** packs.yaml `pairs_skill:` entries point at
  installed TFC skills (P16 → learning/domain-mastery). The pack stays the THINKING
  lens; the skill is the EXECUTABLE. No content duplication.
- **MNEP alignment:** spec.yaml `required_sections` + `scaffold_template` already mirror
  pack MNEP fields. tfc_validate gains a check: if the skill declares required_sections,
  SKILL.md must instruct emitting them (keeps hook-gate compliance automatic).
- **Hook hint correction stays model-side.** The tier-0 regex is a HINT (today it
  misbound P01 to an L3 task). The Forge does not try to fix the regex; it makes
  descriptions and triggers specific enough that the hint is usually right, and
  `tfc_route` exposes collisions that cause misfires.
- **Memory split stands:** Mind v5 = semantic/salience memory; learnings.jsonl =
  per-skill operational memory; runs.jsonl = per-project journal. Do not merge.

---

## §6 WORKED EXAMPLE — "a skill that can teach any domain" in ~20 minutes

The user's own test case ("like deep-understanding: explain or teach anything, build
your course, in 20 minutes or 2–3 outputs"). The Forge pipeline, end to end:

```
T+0   tfc_compile("skill that teaches any domain, builds a personal curriculum,
                   verifies mastery")
      → SkillCard: name=domain-mastery, category=learning, archetype=hybrid,
        covers_existing=[deep-understanding, learn-itr] → overlap_verdict: NEW
        (deep-understanding = full curriculum ENGINE w/ SM-2; learn-itr = single-session
         compression; this = repeatable 20-min course builder bridging both),
        eval_seeds drafted. 1 question max ("who is the default learner?").
T+2   tfc_new(learning, domain-mastery)         → scaffold from hybrid archetype template
T+3   tfc_brainstorm(intent…)                   → Claude writes Identity ("You have taught
        domains from transformers to tax law; the learner who could recite but not
        rebuild taught you that recall is not mastery…"), 6 Principles (imperatives:
        "Calibrate before teaching: 3 questions, never more", "No session without a
        Feynman gate", "Prerequisites are a graph, not a list"…), description, triggers
T+8   tfc_generate(layers: patterns, anti-patterns, quick-wins, handoffs, stack)
      → 5 named Patterns (Prereq-Graph-First, 20-Minute-Loop, Feynman-Gate,
        Spaced-Checkpoint, Analogy-Bridge), 4 Anti-Patterns (Wall-of-Explanation,
        Coverage-Theater, Prereq-Skip, Recall≠Mastery), Quick Wins, Handoffs
        (provides→deep-understanding for SM-2 long-term tracking; does NOT own
        flashcard scheduling → deep-understanding)
T+14  tfc_validate → fix 2 voice hits via --fix prompt → clean
T+15  tfc_score → archetype=hybrid → 84/100 (both halves >60) ✓
T+16  tfc_eval → 3 golden tasks run in-session vs baseline → behavioral 0.86 ✓
        (gt-01 delta: baseline dumps explanation; skill-loaded output calibrates
         first, plans sessions, ends with a Feynman test)
T+19  tfc_install → routing compiled into frontmatter, 2 symlinks, managed blocks spliced
T+20  DONE. /domain-mastery is invocable, discoverable, hook-routable, eval-proven.
      After ~10 real runs: EVOLVE_PENDING fires → tfc_evolve → v1.1.0, eval delta logged.
```

Two to three outputs total (compile+brainstorm = 1, generate = 2, eval+install = 3).
Exactly the user's target envelope.

---

## VIA NEGATIVA — what the Forge will NOT do

1. **No API keys, ever.** Claude-as-engine for compile/brainstorm/generate/eval/evolve.
2. **No second memory system.** Mind v5 stays the semantic brain (no GBrain clone).
3. **No hosted dependency in the gate path.** tfc_score/tfc_validate stay local and
   deterministic; hosted spawner_skill_score is advisory only.
4. **No auto-editing authored prose.** Evolve and voice-fix return prompts; Claude
   applies them visibly in-session; CHANGELOG.jsonl records it.
5. **No new vault/notes surface.** Docs live here; runtime state lives in
   ~/.future-code; vault remains Kraken's, opt-in.
6. **No 8-file authoring burden.** 4 files + optional evals.yaml; deep-dive references/
   only when a domain genuinely needs them.

## DESIGN DECISION (summary line)

TFC v2 = v1's plumbing + four new organs: **archetypes** (score the right shape),
**tfc_compile** (intent front door), **tfc_eval** (prove the behavioral delta),
**tfc_evolve** (consume learnings) + **compiled routing/managed blocks** (gstack's
compiler advantage). Build order and effort: 06-ROADMAP.md.
