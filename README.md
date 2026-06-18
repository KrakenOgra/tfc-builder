# tfc-builder

157 tests green on every commit. 20 tools. 0 external API calls. One command from plain English to a deployed, self-improving Claude skill.

**The Future Code** is a skill OS for Claude. Describe what you want. TFC builds the package, validates it against blocking quality gates, installs it, and captures what works every time you run it. A skill at run 10 is measurably smarter than run 1. You don't re-teach it — it observes.

[![CI](https://github.com/Cyperphycho/tfc-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/Cyperphycho/tfc-builder/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/tfc-builder)](https://www.npmjs.com/package/tfc-builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## The problem

You've explained the same context to Claude 12 times. You got 12 slightly different results. Not because Claude is unreliable — because a repeated task treated as a one-off prompt never validates, never improves, and forgets everything the moment the session ends.

TFC fixes this by treating Claude capability as a software artifact: versioned, quality-gated, and learning from real use.

## One command

```
tfc_compile("describe the skill you want in plain English")
```

That is the front door. Describe it once. TFC scaffolds the 4-file skill package, runs it through blocking validation, gives you the intelligence density score, and hands you something installable. No format to learn first.

---

## What a TFC skill is

A **4-file package** Claude reads at runtime:

```
skills/{category}/{name}/
├── spec.yaml          → what Claude discovers and when to route here
├── SKILL.md           → the instructions Claude executes when invoked
├── validations.yaml   → quality gates that block weak skills from installing
└── learnings.jsonl    → auto-written after each real use — never hand-edit
```

Each SKILL.md has six intelligence layers: Identity, Principles, Patterns, Anti-Patterns, Quick Wins, and Handoffs. The structure is machine-discoverable via the skill registry, human-executable via Claude Code `/skill-name`, and self-improving via the learnings loop.

---

## Install

**Claude Code** — add to `~/.claude/settings.json`:
```json
{
  "mcpServers": {
    "tfc-builder": {
      "command": "npx",
      "args": ["tfc-builder"]
    }
  }
}
```

**Claude Desktop** — add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "tfc-builder": {
      "command": "npx",
      "args": ["tfc-builder"]
    }
  }
}
```

Restart Claude. You now have 20 tools.

---

## The 20 tools

### Build
| Tool | What it does |
|------|-------------|
| `tfc_compile` | Front door — plain English → complete, validatable skill package |
| `tfc_new` | Scaffold an empty skill directory from the template |
| `tfc_brainstorm` | Prompt template for Identity + Principles authoring |
| `tfc_generate` | Prompt template for Patterns, Anti-Patterns, Quick Wins, Handoffs |
| `tfc_migrate` | Convert an existing skill to TFC format |

### Quality
| Tool | What it does |
|------|-------------|
| `tfc_validate` | Gate-check against `validations.yaml` — blocking issues prevent install |
| `tfc_score` | 0–100 intelligence density score with exact gap list |
| `tfc_lane` | Show the skill's earned evidence tier |

### Evolve
| Tool | What it does |
|------|-------------|
| `tfc_eval` | Behavioral evaluation against `evals.yaml` — proves the skill works, not just that it's written |
| `tfc_evolve` | Analyze `learnings.jsonl` and propose targeted improvements from real evidence |
| `tfc_doctor` | Lane-aware health check across all installed skills |

### Install & Maintain
| Tool | What it does |
|------|-------------|
| `tfc_install` | Register skill into `~/.claude/skills/` and the skill registry |
| `tfc_register` | Spawner-only registration without the validate gate |
| `tfc_list` | List all TFC skills, detect dangling symlinks |
| `tfc_pack_bridge` | Enforce that packs only reference `eval_proven`+ skills |

### V3 Living Lane (runtime, auto-managed)
| Module | What it does |
|--------|-------------|
| `capture` | Writes outcomes to `learnings.jsonl` after real invocations |
| `decay` | Marks stale learnings as inactive |
| `relink` | Deduplicates identical skills into symlinks |
| `replay` | Surfaces cross-session patterns from historical learnings |
| `portfolio` | Cross-skill analytics: usage, lane distribution, evolution candidates |

---

## The skill lifecycle

```
tfc_compile("intent")           ← one plain-English line
       ↓
tfc_validate + tfc_score        ← must pass gates and score > 70
       ↓
tfc_install                     ← /skill-name is live in Claude Code
       ↓
Use it 5+ times for real        ← learnings.jsonl fills with what worked
       ↓
tfc_evolve                      ← proposes improvements from real evidence
       ↓
tfc_eval                        ← confirms improvement held → lane: eval_proven
       ↓
Use more → tfc_evolve again     ← lane: evolution_proven
```

This loop is why TFC skills compound while generic Claude prompts plateau.

---

## The lane system

Every skill has an earned evidence tier:

| Lane | What it means | When to rely on it |
|------|---------------|--------------------|
| `authored` | Written, not tested | Start here — not the destination |
| `eval_proven` | Passed behavioral eval | Daily-driver safe |
| `evolution_proven` | Improved from real feedback | Worth sharing and depending on |

Lane values compute from disk evidence — `learnings.jsonl` and `eval-report.json`. Never guessed. Never faked.

---

## Documentation

| Doc | What's in it |
|-----|-------------|
| [Quickstart](docs/QUICKSTART.md) | Up and running in 5 minutes |
| [How to Use](docs/HOW-TO-USE.md) | Full walkthrough of all 20 tools |
| [When to Use](docs/WHEN-TO-USE.md) | Decision guide — which tool, which situation |
| [Architecture](docs/ARCHITECTURE.md) | How TFC works under the hood |
| [What is TFC](THE_FUTURE_CODE.md) | The philosophy and format in depth |
| [Migration Guide](docs/migration-guide.md) | Migrate your existing skills to TFC |
| [Intelligence Context Guide](docs/intelligence-context-guide.md) | Writing SKILL.md sections that work |

---

## Three things that never break

**No external API calls.** Eval and evolve run inside your Claude session. Zero cost beyond the session itself.

**Lane purity.** Lane values compute from disk evidence. Never guessed. Never timestamped.

**No synthetic learnings.** `learnings.jsonl` only contains records from real invocations. Manufactured data breaks the evolution signal.

157 tests verify all three on every commit.

---

## What's inside

```
mcp/tfc-builder/     ← the MCP server (TypeScript, 20 tools)
skills/              ← bundled skill library
docs/                ← documentation
analytics/           ← usage logs
runtime/             ← V3 Living Lane bash scripts
```
