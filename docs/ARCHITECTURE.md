# TFC Architecture — How It Works Under the Hood

## The Big Picture

TFC is a skill OS for Claude. It answers one question: **"How do you make Claude reliably smarter at a specific task, and keep it getting smarter over time?"**

The answer is a 4-layer system:

```
┌─────────────────────────────────────────────────────┐
│  Layer 4 — The Living Lane (V3)                     │
│  capture → decay → relink → replay → portfolio      │
│  Skills evolve from real usage, automatically       │
├─────────────────────────────────────────────────────┤
│  Layer 3 — Evaluation Loop (V2)                     │
│  tfc_eval → tfc_evolve → lane promotion             │
│  Skills earn trust through behavioral proof         │
├─────────────────────────────────────────────────────┤
│  Layer 2 — Quality Gates (V1+)                      │
│  validate → score → install                         │
│  Skills pass a quality bar before going live        │
├─────────────────────────────────────────────────────┤
│  Layer 1 — The Skill Format (V1)                    │
│  spec.yaml + SKILL.md + validations.yaml + learnings│
│  The atomic unit that Claude can discover and load  │
└─────────────────────────────────────────────────────┘
```

---

## Layer 1 — The Skill Format

Every TFC skill is exactly **4 files**:

### `spec.yaml` — Discovery & Routing
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

Claude Code and Spawner read `spec.yaml` to know:
- What this skill does (the `description`)
- When to route to it (the `triggers`)
- What to run alongside it (the `pairs_with`)

### `SKILL.md` — The Instructions
The document Claude reads when the skill is invoked. Contains 6 sections:

```markdown
## Identity     → who Claude becomes when running this skill
## Principles   → non-negotiable rules (the "why")
## Patterns     → concrete, executable playbooks
## Anti-Patterns → what to never do and why
## Quick Wins   → 3 immediate actions for any invocation
## Handoffs     → which other skills to chain to
```

### `validations.yaml` — Quality Gates
Machine-readable checks that run before install:
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

### `learnings.jsonl` — The Feedback Loop
Auto-written after each real invocation. Never hand-edited.
```jsonl
{"ts": 1749987600, "outcome": "good", "pattern": "Binary frame in first sentence converted skeptics", "context": "landing-page-copy"}
{"ts": 1749991200, "outcome": "bad", "pattern": "Skipped the proof step — reader resistance high", "context": "hero-section"}
```

`tfc_evolve` reads this file and turns patterns into improvements to SKILL.md.

---

## Layer 2 — Quality Gates

Before a skill can be installed, it must pass `tfc_validate`. The scoring system (`tfc_score`) gives a 0-100 intelligence density score based on:

| Dimension | Weight | What it checks |
|-----------|--------|----------------|
| Identity clarity | 20% | Is the persona specific and executable? |
| Principle depth | 25% | Are principles falsifiable and non-obvious? |
| Pattern coverage | 25% | Do patterns have concrete examples? |
| Anti-pattern richness | 15% | Are failure modes documented with "why"? |
| Handoff wiring | 15% | Does the skill know what to chain to? |

A skill scoring below 60 typically produces inconsistent Claude behavior. Above 85 is production-grade.

---

## Layer 3 — The Evaluation Loop (V2)

The lane system tracks earned evidence:

```
authored  →  eval_proven  →  evolution_proven
  (built)       (tested)         (improved)
```

### How lane promotion works

**authored → eval_proven:**
Run `tfc_eval`. It executes the skill against scenarios defined in `evals.yaml` and checks that outputs meet behavioral criteria. If it passes — lane updates to `eval_proven`.

```yaml
# evals.yaml example
evals:
  - name: skeptical-reader-hero
    input: "Write a hero section for a B2B SaaS tool"
    criteria:
      - "Proof element appears before any promise"
      - "Contains a specific number with units"
      - "Binary frame present before CTA"
```

**eval_proven → evolution_proven:**
After real usage accumulates in `learnings.jsonl`, run `tfc_evolve`. It analyzes patterns and proposes targeted edits to SKILL.md. Accept them, run `tfc_eval` again to confirm the improvement held, and the lane advances.

---

## Layer 4 — The Living Lane (V3)

V3 makes skill evolution continuous — skills compound without manual intervention.

### The V3 pipeline

```
Real invocation
      ↓
   capture.ts     → writes outcome to learnings.jsonl
      ↓
   decay.ts       → marks stale learnings (> 90 days, low-signal) as inactive
      ↓
   relink.ts      → deduplicates identical skills → symlinks (saves disk, forces one source of truth)
      ↓
   replay.ts      → replays historical learnings to surface cross-session patterns
      ↓
   portfolio.ts   → cross-skill analytics: usage frequency, lane distribution, evolution candidates
```

### The pack bridge

`tfc_pack_bridge` connects skills to Kraken OS packs. A pack is a higher-order context unit — it bundles multiple skills into a reasoning mode. The bridge enforces that packs only reference skills at `eval_proven` lane or higher. This prevents packs from pulling in untested skills.

```
packs.yaml
  └── P07 Persona Mastery
        └── requires: personality-voice (must be eval_proven+)
```

---

## How the 20 tools map to the layers

```
Layer 1 (format):     tfc_new, tfc_brainstorm, tfc_generate, tfc_compile, tfc_migrate
Layer 2 (quality):    tfc_validate, tfc_score, tfc_lane, tfc_install, tfc_register, tfc_list
Layer 3 (eval loop):  tfc_eval, tfc_evolve, tfc_doctor
Layer 4 (living):     tfc_pack_bridge + runtime: capture, decay, relink, replay, portfolio
```

---

## Where files live

```
~/.future-code/              ← TFC root
├── mcp/tfc-builder/         ← the MCP server (TypeScript)
│   ├── src/core/            ← all tool implementations
│   ├── src/tools/           ← MCP tool registration (index.ts, schemas.ts, registry.ts)
│   ├── runtime/             ← bash scripts (lane-gate, learnings-log, preamble, replay-aggregate)
│   └── test/                ← vitest test suite (157 tests)
├── skills/                  ← your skill library
│   ├── {category}/{name}/   ← individual skill packages
│   └── _template/           ← base template for new skills
├── analytics/               ← usage logs (runs.jsonl, waves.jsonl, tfc-builder.jsonl)
└── docs/                    ← documentation (you are here)
```

---

## Key invariants (things that never break)

1. **INV-1: No external API calls** — eval and evolve use Claude-in-session as the engine. Zero API cost beyond the session itself.
2. **INV-7: Lane purity** — lane values are computed from disk evidence (learnings.jsonl, eval-report.json), never from timestamps or guesses.
3. **INV-8: No synthetic learnings** — `learnings.jsonl` only contains records from real invocations. No fabricated training data.

These invariants are verified by the test suite on every commit.
