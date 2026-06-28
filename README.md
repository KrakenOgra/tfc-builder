# tfc-builder

243 tests green on every commit. 42 tools. 0 external API calls. One command from plain English to a deployed, self-improving Claude skill.

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

**v2 — "Executable Skills OS":** a skill can also declare decision structures in `spec.yaml` (capabilities, mode_check, evidence_gates, inputs, context_routing, recovery_protocol, …) that `tfc_assemble` compiles into a 22-layer SKILL.md a fresh LLM executes as a decision graph — declaring its mode and preset and gating each phase without asking a structural question. See [mcp/tfc-builder/docs/WHAT-IS-TFC.md](mcp/tfc-builder/docs/WHAT-IS-TFC.md#v2--the-22-executable-layers).

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

Restart Claude. You now have 32 tools.

---

## The 32 tools

### Build
| Tool | What it does |
|------|-------------|
| `tfc_compile` | Front door — plain English → complete, validatable skill package |
| `tfc_new` | Scaffold an empty skill directory from the template |
| `tfc_brainstorm` | Prompt template for Identity + Principles authoring |
| `tfc_generate` | Prompt template for Patterns, Anti-Patterns, Quick Wins, Handoffs |
| `tfc_migrate` | Convert an existing skill to TFC format |
| `tfc_validate` | Gate-check against `validations.yaml` — blocking issues prevent install |
| `tfc_score` | 0–100 intelligence density score with exact gap list |
| `tfc_behavioral` | Deterministic, zero-model contract QA |
| `tfc_install` | Register skill into `~/.claude/skills/` and the skill registry |
| `tfc_register` | Spawner-only registration without the validate gate |

### Evidence lane
| Tool | What it does |
|------|-------------|
| `tfc_eval` | Behavioral evaluation against `evals.yaml` — proves the skill works, not just that it's written |
| `tfc_replay` | Stability quorum — N-sample eval variance check |
| `tfc_evolve` | Analyze `learnings.jsonl` and propose targeted improvements from real evidence |
| `tfc_lane` | Recompute earned lane from disk (authored / eval_proven / evolution_proven) |
| `tfc_decay` | Read-only proof staleness overlay |
| `tfc_capture` | Wire learnings capture hook into SKILL.md |

### Context engine
| Tool | What it does |
|------|-------------|
| `tfc_context` | Scaffold context/ stubs from taxonomy — human fills (INV-4) |
| `tfc_context_fill` | Prompt-template to fill stubs from grounded sources only |
| `tfc_context_get` | Return rendered context files ready for a prompt |
| `tfc_context_update` | Re-stamp last_verified after a human review |
| `tfc_context_audit` | Report fill ratio and stale sections |
| `tfc_context_discover` | Surface skills with unfilled or stale context |
| `tfc_context_coverage` | Coverage heatmap per taxonomy domain |

### Portfolio and ecosystem
| Tool | What it does |
|------|-------------|
| `tfc_list` | List all TFC skills, detect dangling symlinks |
| `tfc_portfolio` | Whole-portfolio health surface (lanes, decay, evolve-ready) |
| `tfc_doctor` | Lane-aware health check across all installed skills |
| `tfc_relink` | Repair missing or dangling skill symlinks |
| `tfc_pack_bridge` | Enforce that packs only reference `eval_proven`+ skills |
| `tfc_integrate` | Write validated integration contracts into spec.yaml |
| `tfc_graph` | Build skill dependency graph from pairs_with edges |
| `tfc_compose` | Multi-skill composition plan for a goal |
| `tfc_recommend` | Rank installed skills for a given task |

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
| [How to Use](docs/HOW-TO-USE.md) | Full walkthrough of all 32 tools |
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

199 tests verify all three on every commit.

---

## What's inside

```
mcp/tfc-builder/     ← the MCP server (TypeScript, 32 tools)
skills/              ← bundled skill library
docs/                ← documentation
analytics/           ← usage logs
runtime/             ← V3 Living Lane bash scripts
```
