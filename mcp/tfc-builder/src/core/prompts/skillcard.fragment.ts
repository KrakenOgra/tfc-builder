// Wave 6 (V1 — authoring polish, LAST): the SkillCard the intent front door emits.
// A compiled skill is born LOOP-READY — the card carries `lane: authored` (the first
// rung of the earned-evidence ladder, recomputed later by core/lane.ts) and 3 eval
// seeds (the evals.yaml stub that makes eval_proven reachable in the same session).
//
// The skeleton below is LITERAL on purpose: `lane: authored` and three `eval_seeds`
// always appear in the emitted prompt, so the wave VERIFY (`grep "lane: *authored"`)
// holds for any intent — the front door cannot forget the loop.

export const SKILLCARD_FRAGMENT = `## OUTPUT CONTRACT — the SkillCard

Emit ONE fenced YAML block between these exact delimiters and nothing else after it:

---START-SKILLCARD---
intent: "<the job in one line, copied/condensed from the request>"

# SEARCH-FIRST verdict (fill from the SEARCH step — never skip it)
covers_existing:            # skills that already touch this job, with where you found them
  - "<category/name or ~/.claude/skills/<name> — what it covers>"
overlap_verdict: new        # new | extend | upgrade-existing  (if not 'new', name the target skill)

# IDENTITY
category: <kebab-case>      # ai | backend | design | devops | data | pattern | dev | security | learning
name: <kebab-case>          # globally unique, matches the dir
archetype: <inferred>       # domain-expert | workflow | hybrid | reference (use the hint, override if wrong)
model_tier: sonnet          # opus=strategic/L4, sonnet=build, haiku=tactical
priority: 50                # 0..100, conflict resolution

description: |
  One paragraph for the ROUTING layer — "when should Claude load this skill?".
  Under 5 sentences. A capability, not a category.

triggers:                   # 4-8 situation phrases, each >= 4 words, what the USER says
  - "<specific situation trigger 1>"
  - "<trigger 2>"
  - "<trigger 3>"
  - "<trigger 4>"

# LAYER PLAN — target counts the author must hit (density contract, not prose)
layer_plan:
  identity: 1               # the "you are…" frame
  principles: 4             # imperatives
  patterns: 3               # named, with the failure each prevents
  anti_patterns: 3          # root-cause first
  quick_wins: 3
  handoffs: 2

# ROUTING block (gstack Mechanism 2 — generated, compiled into the frontmatter description)
routing:
  owns:
    - "<responsibility-slug this skill is authoritative for>"
  does_not_own:
    - "<scope-slug -> owning-skill — prevents collision>"

# BORN LOOP-READY — the earned-evidence ladder starts here; recomputed by core/lane.ts.
lane: authored

# BORN PERISHABLE (v3 W3) — proof is good-NOW, not good-forever. core/decay.ts compares the
# recorded proof timestamp against this horizon and drops the EFFECTIVE lane one rung when stale.
freshness_horizon:
  eval_days: 30
  evolution_days: 60

# 3 EVAL SEEDS — the evals.yaml stub (>=3 is the floor for eval_proven). Observable
# must/must_not only — score what APPEARS, never "looks good".
pass_threshold: 0.8
eval_seeds:
  - id: <kebab-task-1>
    prompt: "<exact user input to run baseline-vs-skill-loaded>"
    must:
      - "<literal substring the skill-loaded output MUST contain>"
    must_not:
      - "<substring that signals failure/regression>"
  - id: <kebab-task-2>
    prompt: "<second distinct scenario this skill claims to handle>"
    must:
      - "<observable marker of correct behavior>"
  - id: <kebab-task-3>
    prompt: "<third scenario — an edge or failure mode the skill guards>"
    must:
      - "<observable marker>"
    must_not:
      - "<the wrong behavior this skill prevents>"
---END-SKILLCARD---

After the card, list the exact next commands (do not run them yet):
  tfc_new <category> <name> --archetype <archetype>
  # write SKILL.md to the layer_plan, copy eval_seeds into evals.yaml + the freshness_horizon block into spec.yaml
  tfc_install <category> <name>   # auto-injects the runtime capture hook → the skill is born OBSERVABILITY-WIRED (W1):
                                  # a real invocation appends one runs.jsonl row + makes tfc_learn one reliable call
  tfc_validate <category> <name>  →  tfc_eval <category> <name>  (earns eval_proven)
  # the loop is now alive: capture (W1) feeds learnings → tfc_evolve → evolution_proven; decay (W3) keeps it honest`;
