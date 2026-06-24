# tfc-builder

**The Future Code skill builder — MCP server + CLI.**

Build, validate, score, migrate, and install [TFC skills](https://github.com/Cyperphycho/tfc-builder/blob/main/docs/WHAT-IS-TFC.md) for Claude Code and Claude Desktop.
No API key. Claude in-session is the generation engine.

[![CI](https://github.com/Cyperphycho/tfc-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/Cyperphycho/tfc-builder/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/tfc-builder)](https://www.npmjs.com/package/tfc-builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What is a TFC skill?

A TFC (The Future Code) skill is a **4-file package** that loads into Claude as structured context:

```
skills/{category}/{name}/
├── spec.yaml          machine-readable metadata + routing triggers
├── SKILL.md           executable instructions Claude reads at runtime
├── validations.yaml   quality gates (blocking + warning)
└── learnings.jsonl    runtime feedback loop (auto-written, never hand-edit)
```

Every skill carries **six intelligence layers**: Identity, Principles, Patterns, Anti-Patterns, Quick Wins, and Handoffs. The format is simultaneously machine-discoverable (spawner), human-executable (Claude Code), and self-improving (learnings loop).

`tfc-builder` automates the full build pipeline for this format.

---

## The 37 tools

See [docs/TOOLS.md](docs/TOOLS.md) for the full reference (input schema, output shape, failure codes).

**Build pipeline:**

| Tool | What it does |
|------|-------------|
| `tfc_compile` | Intent front door — one-line description → SkillCard prompt |
| `tfc_new` | Scaffold a new skill directory from the template |
| `tfc_brainstorm` | Prompt-template for Identity + Principles authoring |
| `tfc_generate` | Prompt-template for Patterns, Anti-Patterns, Quick Wins, Handoffs |
| `tfc_validate` | Gate-check against `validations.yaml` — blocking + warnings |
| `tfc_score` | Score 0-100 on intelligence density with exact gap list |
| `tfc_behavioral` | Deterministic, zero-model contract QA (INV-3) |
| `tfc_migrate` | Migrate a spawner or gstack skill to TFC format |
| `tfc_install` | Create symlinks in `~/.claude/skills/` and `~/.spawner/skills/` |
| `tfc_register` | Spawner-only registration without the validate gate |

**Evidence lane:**

| Tool | What it does |
|------|-------------|
| `tfc_eval` | Prompt-template for behavioral evaluation against golden tasks |
| `tfc_replay` | Stability quorum — N-sample eval variance check |
| `tfc_evolve` | Prompt-template to fold learnings into skill + re-eval |
| `tfc_lane` | Recompute earned lane from disk (authored / eval_proven / evolution_proven) |
| `tfc_decay` | Read-only proof staleness overlay |
| `tfc_capture` | Wire learnings capture hook into SKILL.md |

**Context engine (v4):**

| Tool | What it does |
|------|-------------|
| `tfc_context` | Scaffold context/ stubs from taxonomy — human fills (INV-4) |
| `tfc_context_fill` | Prompt-template to fill stubs from grounded sources only |
| `tfc_context_get` | Return rendered context files ready for a prompt |
| `tfc_context_update` | Re-stamp last_verified after a human review |
| `tfc_context_audit` | Report fill ratio and stale sections |
| `tfc_context_discover` | Surface skills with unfilled or stale context |
| `tfc_context_coverage` | Coverage heatmap per taxonomy domain |
| `tfc_context_forge` | Derive a context/ scaffold FROM SKILL.md for any domain — no taxonomy entry needed |
| `tfc_context_receipt` | Record a section receipt: a real build retrieved an angle and passed/failed |
| `tfc_context_promote` | Promote angles by receipt, not author declaration (earnedCoverage) |

**Self-compressing loop (TFC 1000x):**

| Tool | What it does |
|------|-------------|
| `tfc_attribute` | Attribute section-level execution credit from `learnings.jsonl` → `section-receipts.jsonl` (0 API calls, retroactive) |
| `tfc_grammar_guide` | Per-section compile directives (⬆ STRENGTHEN / ⬇ REVIEW-PRUNE / 📌 KEEP-PINNED) from receipts — closes the PGO loop |

**Portfolio and ecosystem:**

| Tool | What it does |
|------|-------------|
| `tfc_list` | List all TFC skills and detect dangling symlinks |
| `tfc_portfolio` | Whole-portfolio health surface (lanes, decay, evolve-ready) |
| `tfc_doctor` | System health + per-skill lane audit |
| `tfc_relink` | Repair missing or dangling skill symlinks |
| `tfc_pack_bridge` | Cross-ecosystem pack↔skill evidence floor check |
| `tfc_integrate` | Write validated integration contracts into spec.yaml |
| `tfc_graph` | Build skill dependency graph from pairs_with edges |
| `tfc_compose` | Multi-skill composition plan for a goal |
| `tfc_recommend` | Rank installed skills for a given task |

---

## Install

### Option A — npx (no install required)

Add to your MCP config and npx handles the rest:

**Claude Code** (`~/.claude/settings.json` → `mcpServers`):
```json
{
  "mcpServers": {
    "tfc-builder": {
      "command": "npx",
      "args": ["tfc-builder"],
      "env": {}
    }
  }
}
```

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json` on Mac,
`%APPDATA%\Claude\claude_desktop_config.json` on Windows):
```json
{
  "mcpServers": {
    "tfc-builder": {
      "command": "npx",
      "args": ["tfc-builder"],
      "env": {}
    }
  }
}
```

Restart Claude. Confirm by asking: *"List the tfc-builder tools."*

---

### Option B — npm global install

```bash
npm install -g tfc-builder
```

Then add to your MCP config:
```json
{
  "mcpServers": {
    "tfc-builder": {
      "command": "tfc-builder",
      "args": [],
      "env": {}
    }
  }
}
```

---

### Option C — clone and build

```bash
git clone https://github.com/Cyperphycho/tfc-builder
cd tfc-builder
npm install && npm run build
```

Add to your MCP config with the full path to the built server:
```json
{
  "mcpServers": {
    "tfc-builder": {
      "command": "node",
      "args": ["/absolute/path/to/tfc-builder/dist/server.js"],
      "env": {}
    }
  }
}
```

---

## Configuration (optional)

Override the default skill roots via environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `TFC_ROOT` | `~/.future-code` | Where TFC skills are stored |
| `CLAUDE_SKILLS_DIR` | `~/.claude/skills` | Claude Code skills directory |
| `SPAWNER_SKILLS_DIR` | `~/.spawner/skills` | Spawner skills directory |

Example — use a custom skill root:
```json
{
  "mcpServers": {
    "tfc-builder": {
      "command": "npx",
      "args": ["tfc-builder"],
      "env": {
        "TFC_ROOT": "/my/custom/skills-root"
      }
    }
  }
}
```

---

## Quickstart — build a skill end to end

### Step 1: Scaffold

```
tfc_new({ "category": "ai-agents", "name": "prompt-engineer" })
```

Creates `~/.future-code/skills/ai-agents/prompt-engineer/` with 3 files.

### Step 2: Brainstorm Identity and Principles

```
tfc_brainstorm({
  "category": "ai-agents",
  "name": "prompt-engineer",
  "intent": "generate type-safe TypeScript prompt templates for structured LLM output"
})
```

Returns a prompt. **Claude executes it in-session** and writes the Identity and Principles
sections to `SKILL.md`, plus `description` and `triggers` to `spec.yaml`.

### Step 3: Generate Patterns and Anti-Patterns

```
tfc_generate({
  "category": "ai-agents",
  "name": "prompt-engineer",
  "layers": ["patterns", "anti-patterns", "quick-wins", "handoffs"]
})
```

Returns a prompt. Claude executes it and writes each section.

### Step 4: Validate

```
tfc_validate({ "category": "ai-agents", "name": "prompt-engineer" })
```

Returns `passed: true` when all blocking gates pass.

### Step 5: Score

```
tfc_score({ "category": "ai-agents", "name": "prompt-engineer" })
```

Returns 0-100 with breakdown. A well-authored skill scores above 70.

### Step 6: Install

```
tfc_install({ "category": "ai-agents", "name": "prompt-engineer" })
```

Creates two symlinks — one in `~/.claude/skills/`, one in `~/.spawner/skills/`.

### Step 7: Verify

```
tfc_list({ "brokenOnly": false })
```

Your skill appears with `claudeLinkState: "ok"` and `spawnerLinkState: "ok"`.

---

## Migrate an existing skill

From a spawner skill:

```
tfc_migrate({
  "sourcePath": "~/.spawner/skills/ai-code-generation/skill.yaml",
  "sourceType": "spawner",
  "category": "ai-agents",
  "name": "code-reviewer",
  "dryRun": false
})
```

From a gstack skill:

```
tfc_migrate({
  "sourcePath": "~/.claude/skills/my-skill/SKILL.md",
  "sourceType": "gstack",
  "category": "ai-agents",
  "name": "my-skill",
  "dryRun": false
})
```

Returns an authoring prompt with a **density contract** — the prompt requires at least as many
named patterns and anti-patterns as the source skill had. Source files are never modified.

---

## CLI

The `tfc` CLI provides the same operations outside of a Claude session:

```bash
tfc list                                    # list all installed TFC skills
tfc validate --category ai-agents --name prompt-engineer
tfc score --category ai-agents --name prompt-engineer
tfc install --category ai-agents --name prompt-engineer
```

---

## Design principles

**No API key.** `tfc_brainstorm` and `tfc_generate` return prompt templates for Claude to
execute in the same session. The server has no external HTTP calls — no `fetch`, no
`anthropic`, no `openai` anywhere in `src/`.

**Result envelope.** Every tool returns `{ ok: true, data: T }` or
`{ ok: false, error: { code, message, hint? } }`. The MCP boundary never throws.

**Validate-first gate.** `tfc_install` runs `tfc_validate` internally. Blocking gates must
pass before any symlink is created.

**Idempotent installs.** Running `tfc_install` twice returns `exists` on the second call.
A symlink pointing to the wrong target returns `LINK_CONFLICT` and is never repointed silently.

**Path safety.** `safeJoin` rejects any segment containing `..`, a leading `/`, or a null byte.
All writes are checked against three allowed roots: `~/.future-code`, `~/.claude/skills`,
`~/.spawner/skills`.

---

## Failure codes

| Code | Meaning |
|------|---------|
| `BAD_INPUT` | Zod parse failed or slug contains invalid characters |
| `NOT_FOUND` | Skill dir or source file does not exist |
| `EXISTS` | Scaffold guard: skill dir already exists |
| `VALIDATION_FAILED` | Blocking gates failed; message names the gate IDs |
| `LINK_CONFLICT` | Symlink at target path points to a different target |
| `INCOMPLETE_SWAP` | Token placeholder remained in file after scaffold |
| `PATH_ESCAPE` | Path segment contains `..`, leading `/`, or null byte |
| `UNKNOWN_TOOL` | Tool name not in registry |

---

## Tests

```bash
npm test          # 221 tests across 33 suites
npm run typecheck # TypeScript strict mode
npm run lint      # ESLint
```

Test suites: unit tests per core module + full e2e lifecycle + security suite (4 threat cases:
path traversal, planted-symlink escape, system-file migrate, null byte injection).

---

## Per-tool reference

See [`docs/TOOLS.md`](docs/TOOLS.md) for the complete input schema, output shape, example
call, and all failure codes for each of the 37 tools.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT — see [LICENSE](LICENSE).
