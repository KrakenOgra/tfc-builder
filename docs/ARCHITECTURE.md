# TFC Architecture

## What we deleted (and why it mattered)

Before TFC, skill systems made you choose: machine-discoverable or human-executable. Not because one was better — because they were built for different problems and nobody merged them.

TFC deletes the choice. Every skill is simultaneously discoverable by the skill registry, executable by Claude Code, self-improving via the learnings loop, and quality-gated before install. Four responsibilities. Four files. One directory contract. No exceptions.

---

## Three things that never break

Before the architecture, the invariants — these are load-bearing:

**No external API calls.** Eval and evolve run inside your Claude session. Zero added cost. Skills improve without per-call fees.

**Lane purity.** Lane values (`authored`, `eval_proven`, `evolution_proven`) compute from disk evidence — `learnings.jsonl` and `eval-report.json`. Never from timestamps. Never guessed.

**No synthetic learnings.** `learnings.jsonl` only gets records from real invocations. Manufactured training data corrupts the feedback loop and makes `tfc_evolve` propose improvements for things that never happened.

199 tests verify all three on every commit.

---

## The 5-layer system

```
┌─────────────────────────────────────────────────────┐
│  Layer 5 — Context Engine (CCE v2)                  │
│  tfc_context → fill → get → audit → coverage        │
│  Skills load grounded, reviewed context at runtime  │
├─────────────────────────────────────────────────────┤
│  Layer 4 — The Living Lane (V3)                     │
│  capture → decay → relink → replay → portfolio      │
│  Skills evolve from real usage, automatically       │
├─────────────────────────────────────────────────────┤
│  Layer 3 — Evaluation Loop (V2)                     │
│  tfc_eval → tfc_replay → tfc_evolve → lane promotion│
│  Skills earn trust through behavioral proof         │
├─────────────────────────────────────────────────────┤
│  Layer 2 — Quality Gates (V1+)                      │
│  validate → behavioral → score → install            │
│  Skills pass a quality bar before going live        │
├─────────────────────────────────────────────────────┤
│  Layer 1 — The Skill Format (V1)                    │
│  spec.yaml + SKILL.md + validations.yaml + learnings│
│  The atomic unit Claude discovers and loads         │
└─────────────────────────────────────────────────────┘
```

Each layer builds on the one below. You can use Layer 1 alone. Every layer you add makes the skill more reliable.

---

## Layer 1 — The skill format

Every TFC skill is exactly **4 files**:

### `spec.yaml` — Discovery and routing

```yaml
id: react-a11y-reviewer
name: React Accessibility Reviewer
version: 1.0.0
category: frontend
layer: 1
description: |
  Reviews React components for WCAG compliance...

triggers:
  - "review for accessibility"
  - "a11y check"
  - "wcag compliance"

pairs_with:
  - code-reviewer
  - testing-expert
```

Claude Code and the skill registry read `spec.yaml` to know what this skill does, when to route to it, and what to run alongside it.

### `SKILL.md` — The executable instructions

The document Claude reads when the skill is invoked. Six required sections:

```markdown
## Identity      → who Claude becomes when running this skill
## Principles    → non-negotiable rules — the "why" behind every decision
## Patterns      → named, concrete, executable recipes
## Anti-Patterns → named failure modes with root causes and fixes
## Quick Wins    → 3 immediate actions for any invocation
## Handoffs      → which other skills to chain to and what to pass
```

### `validations.yaml` — Machine-readable quality gates

```yaml
blocking:
  - id: has-identity
    check: "SKILL.md contains ## Identity section"
    message: "Every skill needs an Identity — who is Claude when running this?"
  - id: min-principles
    check: "At least 3 principles defined"

warnings:
  - id: no-anti-patterns
    check: "## Anti-Patterns section is non-empty"
```

Blocking checks prevent install. Warnings let you proceed but flag gaps.

### `learnings.jsonl` — The feedback loop

Auto-written after each real invocation. Never hand-edited.
```jsonl
{"ts": 1749987600, "outcome": "good", "pattern": "Binary frame in first sentence converted skeptics", "context": "landing-page-copy"}
{"ts": 1749991200, "outcome": "bad", "pattern": "Skipped the proof step — reader resistance high", "context": "hero-section"}
```

`tfc_evolve` reads this file and turns patterns into targeted improvements to SKILL.md.

---

## Layer 2 — Quality gates

Before a skill installs, it passes `tfc_validate`. The scoring system gives a 0–100 intelligence density score:

| Dimension | Weight | What it checks |
|-----------|--------|----------------|
| Identity clarity | 20% | Is the persona specific and executable? |
| Principle depth | 25% | Are principles falsifiable and non-obvious? |
| Pattern coverage | 25% | Do patterns have concrete examples? |
| Anti-pattern richness | 15% | Are failure modes documented with "why"? |
| Handoff wiring | 15% | Does the skill know what to chain to? |

Below 60 → inconsistent Claude behavior. Above 85 → production-grade.

---

## Layer 3 — The evaluation loop

The lane system tracks earned evidence:

```
authored  →  eval_proven  →  evolution_proven
  (built)       (tested)         (improved)
```

**authored → eval_proven:** Run `tfc_eval`. It executes the skill against scenarios in `evals.yaml` and checks behavioral criteria. Pass → lane updates.

```yaml
evals:
  - name: skeptical-reader-hero
    input: "Write a hero section for a B2B SaaS tool"
    criteria:
      - "Proof element appears before any promise"
      - "Contains a specific number with units"
      - "Binary frame present before CTA"
```

**eval_proven → evolution_proven:** After real usage accumulates in `learnings.jsonl`, run `tfc_evolve`. It analyzes patterns and proposes targeted edits. Accept them, run `tfc_eval` again to confirm the improvement held. Lane advances.

---

## Layer 4 — The Living Lane (V3)

Skills compound without manual intervention.

```
Real invocation
      ↓
   capture    → writes outcome to learnings.jsonl
      ↓
   decay      → marks stale learnings (>90 days, low-signal) as inactive
      ↓
   relink     → deduplicates identical skills → symlinks (one source of truth)
      ↓
   replay     → surfaces cross-session patterns
      ↓
   portfolio  → cross-skill analytics: usage frequency, lane distribution, evolution candidates
```

---

## Layer 5 — The Context Engine (CCE v2)

Why it exists: a SKILL.md can be perfectly structured and still produce generic output. The reason is empty `context/` stubs — placeholders that validate but carry no actual domain knowledge.

The Context Engine removes that failure mode. It scaffolds context files from a taxonomy, enforces that humans (not the model) fill them from cited sources, stamps `last_verified` dates, and surfaces stale or missing context before it causes invisible quality degradation.

```
tfc_context        → scaffold context/ stubs from taxonomy
tfc_context_fill   → prompt template to fill a stub (human-executed, source-cited)
tfc_context_get    → retrieve filled context for injection at runtime
tfc_context_update → re-stamp last_verified after review
tfc_context_audit  → fill ratio + staleness report per skill
tfc_context_discover → library-wide: which skills have unfilled/stale context
tfc_context_coverage → heatmap: which taxonomy domains are covered vs empty
```

**INV-4 (invariant that cannot break):** context filling is model-free. `tfc_context_fill` returns a prompt template — Claude executes it offline. The server never fills context itself. This keeps context grounded and auditable.

The `context/` directory lives inside the skill directory alongside `SKILL.md`. It is read at invocation time. The skill loads with both the SKILL.md instructions and the filled context files, so the agent has domain-specific grounding without the user needing to re-explain it.

---

### The pack bridge

`tfc_pack_bridge` connects skills to Kraken OS packs. A pack is a higher-order context unit that bundles multiple skills into a reasoning mode. The bridge enforces that packs only reference skills at `eval_proven` or higher — no pack pulls in an untested skill.

---

## How the 32 tools map to the layers

```
Layer 1 (format):     tfc_new, tfc_brainstorm, tfc_generate, tfc_compile, tfc_migrate
Layer 2 (quality):    tfc_validate, tfc_behavioral, tfc_score, tfc_lane, tfc_install,
                      tfc_register, tfc_list
Layer 3 (eval loop):  tfc_eval, tfc_replay, tfc_evolve, tfc_decay, tfc_capture, tfc_doctor
Layer 4 (living):     tfc_pack_bridge, tfc_portfolio, tfc_relink, tfc_integrate,
                      tfc_graph, tfc_compose, tfc_recommend
                      + runtime: capture, decay, relink, replay, portfolio
Layer 5 (context):    tfc_context, tfc_context_fill, tfc_context_get, tfc_context_update,
                      tfc_context_audit, tfc_context_discover, tfc_context_coverage
```

---

## Where files live

```
~/.future-code/
├── mcp/tfc-builder/         ← the MCP server (TypeScript, 32 tools, 199 tests)
│   ├── src/core/            ← all tool implementations
│   ├── src/tools/           ← MCP tool registration (index.ts, schemas.ts, registry.ts)
│   ├── runtime/             ← bash scripts (lane-gate, learnings-log, preamble, replay-aggregate)
│   └── test/                ← vitest test suite
├── skills/                  ← your skill library
│   ├── {category}/{name}/   ← individual skill packages
│   └── _template/           ← canonical template for new skills
├── analytics/               ← usage logs (runs.jsonl, waves.jsonl, tfc-builder.jsonl)
└── docs/                    ← documentation (you are here)
```
