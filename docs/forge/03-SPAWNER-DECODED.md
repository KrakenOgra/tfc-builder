# 03 — SPAWNER DECODED: how 478 skills carry domain intelligence in YAML
# Traced in ~/.spawner/skills/ (registry v3.0.0, 37+ categories) + the hosted MCP

spawner's bet is the opposite of gstack's: forget runtime, forget workflow, compress a
**domain expert** into machine-readable YAML and make it discoverable. Where gstack
skills tell the model what to DO, spawner skills tell the model who to BE.

---

## 1. The anatomy — what a world-class spawner skill contains

`spawner_skill_new` (the hosted creator) declares the full shape: **8 files**:

```
{skill}/
├── skill.yaml            the core: identity + all intelligence layers
├── sharp-edges.yaml      structured gotchas (id, severity, situation, why, solution,
│                         symptoms, red_flags)
├── validations.yaml      quality gates as data
├── collaboration.yaml    delegation rules between skills (who hands what to whom)
├── patterns.md           deep-dive pattern content
├── anti-patterns.md      deep-dive failure content
├── decisions.md          decision frameworks for the domain
└── sharp-edges.md        prose expansion of the gotchas
```

Most installed skills carry a subset (ai-code-generation: skill.yaml only, 743 lines).
The richest (frameworks/angular) carry the full intelligence layer set inside skill.yaml.

## 2. The 7 intelligence layers (the actual value)

Verified field-by-field in `frameworks/angular/skill.yaml` and
`ai/ai-code-generation/skill.yaml`:

| # | Layer | Field | What makes it work |
|---|-------|-------|--------------------|
| 1 | Expert persona | `identity:` | FIRST PERSON, with named battle scars: "The team that put business logic in components couldn't test anything. The team that used OnPush everywhere had fast apps." Calibrates judgment, not just knowledge. |
| 2 | Domain philosophy | `principles:` | 7 imperatives ("Signals for state, RxJS for async streams"). Constraints, not preferences. |
| 3 | Known-good recipes | `patterns:` | Named + `when:` + full working `example:` with BAD/GOOD code. ~200 lines in angular. A named pattern with an example is a repeatable solution; a bullet is a hint. |
| 4 | Battle scars | `anti_patterns:` | Named + root-cause `why:` + exact `instead:` fix. The `why:` is what lets the model recognize the pattern in NEW situations. |
| 5 | Boundary contracts | `owns:` / `does_not_own:` / `handoffs:` | "visual-design-aesthetics → ui-design". Prevents scope bleed; enables composition. |
| 6 | Quick action | `quick_wins:` | 10 zero-ambiguity actions, each completable in <15 min. |
| 7 | Tool inventory | `stack:` + `expertise_level:` | Versioned tool table with hard-won notes. |

**The compression insight:** identity + principles cost ~20 lines and do more work than
200 lines of workflow, because they change how the model weighs EVERY subsequent
decision. This is what TFC's intelligence-context-guide.md correctly extracted and what
tfc_score now enforces.

## 3. Discovery and composition — the registry layer

- `registry.yaml` v3.0.0: 478 skills, 37+ categories, pack definitions.
- `spawner_skills(action="search"|"list"|"local"|"get")`: hosted index at
  mcp.vibeship.co; `action="local"` reads this machine.
- `triggers:` arrays drive search; `pairs_with:` + `collaboration.yaml` define the
  composition graph (which skill delegates to which, before/after/parallel).
- The Kraken tier-0 hook consumes this index: today's banner emitted
  `DOMAIN SKILL: spawner_skills(action="local", name="ai/ai-code-generation-tfc")`,
  i.e. a TFC skill, symlinked into the spawner tree, was selected by the routing layer.
  **The discovery pipeline is the part of spawner that already works end-to-end.**

Supporting tools worth knowing: `spawner_skill_score` (hosted quality score; caps ~50
for multi-file local substrate skills it cannot index: known limitation),
`spawner_skill_brainstorm/research/upgrade`, `spawner_watch_out` (sharp edges by stack),
`spawner_analyze` (stack detect → skill recommendation).

## 4. Where spawner fails (confirmed, not theoretical)

| Failure | Evidence | Consequence |
|---------|----------|-------------|
| Not executable | skill.yaml has no SKILL.md, no workflow, no stop points | A skill is a fact, not an action. Claude can find it but cannot RUN it. At L3+ it reads as reference trivia. |
| Frozen at birth | No learnings file, no telemetry, no version bumps observed | Skill #478 is exactly as good as the day it was written. Nothing compounds. |
| No model routing | No model_tier anywhere in the schema | An Opus-grade research skill and a Haiku-grade lookup are routed identically. |
| Trigger collision | `triggers: ["build", "ai", "design"]` style one-worders across hundreds of skills | search("build") returns noise; the hook's regex hint misfires (this session: P01 fired on an L3 design task). |
| All-YAML ergonomics | 743-line YAML with embedded code examples | Authoring friction; code in YAML strings loses highlighting/linting; nobody writes 8 files by hand. |
| Hosted/local split | hosted registry does not index local `pattern/` skills | Local skills are second-class in search (memory: P10 caveat, score caps ~50). |

## 5. What the Forge adopts from spawner

| Adopt | How | Where |
|-------|-----|-------|
| The 7 intelligence layers | Already in TFC SKILL.md sections + tfc_score rubric. Keep. | `_template/SKILL.md` |
| `sharp_edges` with mandatory `solution:` | Already in spec.yaml. Keep the "warning without a fix is noise" rule. | `_template/spec.yaml` |
| `owns:`/`does_not_own:` boundary contracts | In spec.yaml; scorer checks "Does NOT own". Keep. | spec.yaml + score.ts |
| `pairs_with` + collaboration semantics | Extend pairs_with with `direction:` + `reason:` (already in TFC spec). Add collaboration.yaml ONLY for multi-skill systems (kraken-flow pattern). | spec.yaml |
| Registry + triggers discovery | Keep dual registration (proven live today). Enforce ≥4-word triggers at validate time (gate exists). | install.ts + checks.ts |
| Density contract on migration | Built (mappers count patterns/anti-patterns, prompt requires ≥). Keep and extend to evolve. | mappers/*.ts |

## 6. What the Forge rejects from spawner

1. **8 hand-authored files per skill.** TFC's 4-file contract + generated sections wins.
   The 4 extra MD files become OPTIONAL `references/` content for deep domains only.
2. **YAML as the execution surface.** YAML is the address (spec); markdown is the
   building (SKILL.md). Settled by TFC v1, confirmed correct by this audit.
3. **Hosted-first scoring.** tfc_score runs locally, offline, deterministic. Keep it
   that way; spawner_skill_score becomes a second opinion, never the gate.
