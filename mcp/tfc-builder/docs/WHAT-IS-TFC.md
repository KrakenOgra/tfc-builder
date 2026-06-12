# What is a TFC skill?

TFC (The Future Code) is a unified skill format that is simultaneously:

- **machine-discoverable** — `spec.yaml` triggers let tools like Spawner find and route to the skill automatically
- **human-executable** — `SKILL.md` is the instruction set Claude reads and runs at session time
- **self-improving** — `learnings.jsonl` records outcomes from every run; the runtime uses this to adapt

## Why a new format?

Skills for Claude currently exist in two incompatible formats:

| Format | Strength | Weakness |
|--------|----------|---------|
| Spawner YAML (`skill.yaml`) | Findable, composable, machine-routable | Not executable — no instruction layer |
| gstack (`SKILL.md`) | Executable, self-improving | Not composable — no metadata, no triggers |

Every builder had to choose one. TFC eliminates the choice by merging all four layers into one directory contract.

## The four layers

```
SPEC     — machine-readable identity     spec.yaml
EXECUTE  — human-readable instructions   SKILL.md
LEARN    — operational feedback loop     learnings.jsonl
ROUTE    — declarative model/chain       spec.yaml routing section
```

## Directory contract

Every TFC skill lives at:

```
~/.future-code/skills/{category}/{skill-name}/
├── spec.yaml          REQUIRED — identity, triggers, model tier, composition
├── SKILL.md           REQUIRED — six intelligence layers Claude reads at runtime
├── validations.yaml   OPTIONAL — quality gates (required for complex skills)
└── learnings.jsonl    AUTO     — written by runtime, never hand-edited
```

## The six intelligence layers in SKILL.md

| Layer | Purpose |
|-------|---------|
| **Identity** | What this skill does, when to use it, what it owns |
| **Principles** | The non-negotiables — what the skill always/never does |
| **Patterns** | Named, reusable techniques with concrete examples |
| **Anti-Patterns** | What to avoid and why — each one inverts a principle |
| **Quick Wins** | Immediate-value moves any user can apply in under 5 minutes |
| **Handoffs** | When to exit this skill and which skill to chain to next |

## spec.yaml fields

```yaml
id: skill-name              # kebab-case, globally unique
name: Human Readable Name
version: 1.0.0
category: ai | backend | design | devops | data | pattern | ...
description: |
  One paragraph for the routing layer — "when should I load this?"

triggers:
  - "exact phrase user might say"

model_tier: opus | sonnet | haiku

owns:
  - domain-responsibility-slug

pairs_with:
  - skill-id: other-skill
    direction: before | after | parallel
    reason: "one line why"
```

## Score and quality

`tfc_score` rates a skill 0-100 on intelligence density. Thresholds:

| Score | Meaning |
|-------|---------|
| 0-39 | Placeholder content still in place — not usable |
| 40-69 | Drafted but sparse — works, could be better |
| 70-89 | Well-authored — ready for production use |
| 90-100 | Dense, battle-tested — reference quality |

## What tfc-builder automates

`tfc-builder` is the MCP server that handles the entire build pipeline:
scaffold → brainstorm → generate → validate → score → install.

Claude executes the authoring prompts in-session. No API key needed.
The server has zero external HTTP calls.
