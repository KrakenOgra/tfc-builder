# tfc-builder

**The Future Code — a skill OS for Claude.**

Build skills that make Claude reliably better at specific tasks. Skills validate before installing, evolve from real usage, and compound over time without re-prompting.

No API key needed. Claude in-session is the generation engine.

[![CI](https://github.com/Cyperphycho/tfc-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/Cyperphycho/tfc-builder/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/tfc-builder)](https://www.npmjs.com/package/tfc-builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## The 30-second version

You have a task you do with Claude repeatedly. Instead of copy-pasting the same context every time, you build a TFC skill. The skill:
1. Loads your context automatically when you type `/skill-name`
2. Gets validated before install so it can't be weak
3. Learns from real usage and proposes improvements
4. Compounds — a skill used 10 times is smarter than a fresh prompt

**One command to start:**
```
tfc_compile("describe the skill you want in plain English")
```

---

## What is a TFC skill?

A TFC skill is a **4-file package** Claude reads at runtime:

```
skills/{category}/{name}/
├── spec.yaml          → discovery metadata + routing triggers
├── SKILL.md           → the instructions Claude executes
├── validations.yaml   → quality gates (blocking + warnings)
└── learnings.jsonl    → feedback loop (auto-written after each real use)
```

Each SKILL.md carries **6 intelligence layers**: Identity, Principles, Patterns, Anti-Patterns, Quick Wins, and Handoffs. The structure is simultaneously machine-discoverable (via spawner), human-executable (Claude Code `/skill-name`), and self-improving (the learnings loop).

---

## Install tfc-builder

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

Restart Claude. 20 tools are now available.

---

## The 20 tools

### Build
| Tool | What it does |
|------|-------------|
| `tfc_compile` | Front door — converts plain-English intent into a complete skill package |
| `tfc_new` | Scaffold an empty skill directory from the template |
| `tfc_brainstorm` | Prompt template for Identity + Principles authoring |
| `tfc_generate` | Prompt template for Patterns, Anti-Patterns, Quick Wins, Handoffs |
| `tfc_migrate` | Convert a spawner or gstack skill to TFC format |

### Quality
| Tool | What it does |
|------|-------------|
| `tfc_validate` | Gate-check against `validations.yaml` — blocking + warnings |
| `tfc_score` | Score 0–100 on intelligence density with exact gap list |
| `tfc_lane` | Show the skill's earned evidence tier (authored / eval_proven / evolution_proven) |

### Evolve
| Tool | What it does |
|------|-------------|
| `tfc_eval` | Behavioral evaluation against `evals.yaml` — proves the skill works |
| `tfc_evolve` | Analyze `learnings.jsonl` and propose targeted improvements |
| `tfc_doctor` | Lane-aware health check across all installed skills |

### Install & Maintain
| Tool | What it does |
|------|-------------|
| `tfc_install` | Symlink skill into `~/.claude/skills/` and `~/.spawner/skills/` |
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
tfc_compile("intent")           ← describe what you want
       ↓
tfc_validate + tfc_score        ← must pass gates and score > 70
       ↓
tfc_install                     ← creates /skill-name in Claude Code
       ↓
Use it 5+ times for real        ← learnings.jsonl fills up
       ↓
tfc_evolve                      ← proposes targeted improvements
       ↓
tfc_eval                        ← confirms improvement held (lane: eval_proven)
       ↓
Use more → tfc_evolve again     ← lane: evolution_proven
```

---

## Lane system

Every skill has an earned evidence tier:

| Lane | Meaning | Trust level |
|------|---------|-------------|
| `authored` | Written, not tested | Use with caution |
| `eval_proven` | Passed behavioral eval | Safe for daily use |
| `evolution_proven` | Improved from real feedback | Actively compounding |

---

## Documentation

| Doc | What's in it |
|-----|-------------|
| [Quickstart](docs/QUICKSTART.md) | Up and running in 5 minutes |
| [How to Use](docs/HOW-TO-USE.md) | Full walkthrough of all 20 tools |
| [When to Use](docs/WHEN-TO-USE.md) | Decision guide — which tool, which situation |
| [Architecture](docs/ARCHITECTURE.md) | How TFC works under the hood |
| [What is TFC](docs/WHAT-IS-TFC.md) | The philosophy and format in depth |
| [Migration Guide](docs/migration-guide.md) | Move from spawner/gstack to TFC |
| [Intelligence Context Guide](docs/intelligence-context-guide.md) | Writing SKILL.md sections that work |

---

## Key invariants

- **No external API calls** — eval and evolve use Claude in-session. Zero extra cost.
- **Lane purity** — lanes are computed from disk evidence, never guessed or timestamped.
- **No synthetic learnings** — `learnings.jsonl` only contains records from real invocations.

157 tests verify these on every commit.

---

## What's inside

```
mcp/tfc-builder/     ← the MCP server (TypeScript, 20 tools)
skills/              ← bundled skill library
docs/                ← documentation
analytics/           ← usage logs
runtime/             ← V3 Living Lane bash scripts
```
