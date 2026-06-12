# tfc-builder MCP

One MCP server builds, validates, migrates, and installs TFC (The Future Code) skills.
No API key. Claude in-session is the generation engine.

---

## What it does

TFC skills are 4-file packages (`spec.yaml`, `SKILL.md`, `validations.yaml`, `learnings.jsonl`) that load into Claude as structured context. A skill carries six intelligence layers: Identity, Principles, Patterns, Anti-Patterns, Quick Wins, Handoffs.

`tfc-builder` automates the build pipeline. You call a tool, Claude executes the returned prompt template in the same session, writes the result back to disk, then calls the next tool. No third-party API calls leave your machine.

---

## The 9 tools

| Tool | What it does |
|------|-------------|
| `tfc_new` | Scaffold a skill dir from `_template/` with placeholders swapped |
| `tfc_brainstorm` | Prompt-template for Identity + Principles authoring |
| `tfc_generate` | Prompt-template for any intelligence layer (Patterns, Anti-Patterns, Quick Wins, Handoffs, Stack) |
| `tfc_validate` | Gate-check against `validations.yaml` — structural, voice, trigger-length |
| `tfc_score` | Score 0-100 on intelligence density; returns breakdown and exact gaps |
| `tfc_migrate` | Migrate spawner or gstack skill to TFC format, preserving density |
| `tfc_install` | Create symlinks in `~/.claude/skills/` and `~/.spawner/skills/` |
| `tfc_register` | Spawner-only registration without validate gate |
| `tfc_list` | List all TFC skills and detect dangling symlinks |

---

## Design decisions

**No API key.** `tfc_brainstorm` and `tfc_generate` return prompt templates. Claude executes them in the same session window. The server has no `fetch`, no `anthropic`, no `openai` anywhere in `src/`.

**Result envelope.** Every tool returns `{ ok: true, data: T }` or `{ ok: false, error: { code, message, hint? } }`. The MCP boundary never throws.

**Validate-first gate.** `tfc_install` runs `tfc_validate` internally. Blocking gates must pass before any symlink is created. A failed validation returns `VALIDATION_FAILED` and leaves disk untouched.

**Idempotent installs.** Running `tfc_install` twice returns `exists` on the second call. A symlink pointing to the wrong target returns `LINK_CONFLICT` and is never repointed silently.

**Path safety.** `safeJoin` rejects any segment containing `..`, a leading `/`, or a null byte. All symlinks are checked against three allowed roots: `~/.future-code`, `~/.claude/skills`, `~/.spawner/skills`.

---

## Install

### 1. Build

`~/.future-code` is a symlink → `~/vibeship-x-kraken/.future-code` (the physical source tree).

```bash
cd ~/.future-code/mcp/tfc-builder
npm install
npm run build
```

### 2. Register in `~/.mcp.json`

Add to the `mcpServers` block (see `docs/mcp-json-snippet.json` for the exact entry):

```json
"tfc-builder": {
  "command": "node",
  "args": ["/home/<you>/.future-code/mcp/tfc-builder/dist/server.js"],
  "env": {}
}
```

Restart your Claude host. Confirm by asking Claude: "List the tfc-builder tools."

### 3. Verify

```bash
npm test
```

105 tests (103 passing, 2 skipped), all green. 93%+ line coverage on `src/core/`.

---

## Quickstart — build a skill end to end

This is the executable spec. The `test/e2e/lifecycle.test.ts` runs exactly this chain.

### Step 1: Scaffold

```
tfc_new({"category": "ai-agents", "name": "prompt-engineer"})
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

Returns a prompt. Claude executes it in-session and writes the Identity and Principles sections to `SKILL.md`, plus `description` and `triggers` to `spec.yaml`.

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
tfc_validate({"category": "ai-agents", "name": "prompt-engineer"})
```

Returns `passed: true` when all blocking gates pass. Fix any failures, re-run until clean.

### Step 5: Score

```
tfc_score({"category": "ai-agents", "name": "prompt-engineer"})
```

Returns 0-100 with breakdown. A well-authored skill scores above 70. Scores below 40 signal placeholder content still in place.

### Step 6: Install

```
tfc_install({"category": "ai-agents", "name": "prompt-engineer"})
```

Creates two symlinks. On success: `claudeLink: "created"`, `spawnerLink: "created"`.

### Step 7: Verify

```
tfc_list({"brokenOnly": false})
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

Returns an authoring prompt with a `DENSITY CONTRACT` — the prompt requires at least as many named patterns and anti-patterns as the source skill had. Source files are never modified.

---

## Telemetry

Every tool call appends one line to `~/.future-code/analytics/tfc-builder.jsonl`:

```json
{"skill":"tfc-builder","tool":"tfc_validate","duration_ms":34,"outcome":"ok","ts":"2026-06-11T..."}
```

Write failures are swallowed. Telemetry never fails a tool call.

---

## Per-tool reference

See `docs/TOOLS.md` for: input schema, output shape, example call, and all failure codes.

---

## Failure codes

| Code | Meaning |
|------|---------|
| `BAD_INPUT` | Zod parse failed or slug contains invalid characters |
| `NOT_FOUND` | Skill dir or source file does not exist |
| `EXISTS` | Scaffold guard: skill dir already exists |
| `VALIDATION_FAILED` | Blocking gates failed; message names the gate ids |
| `LINK_CONFLICT` | Symlink at target path points to a different target |
| `INCOMPLETE_SWAP` | Token placeholder remained in file after scaffold |
| `PATH_ESCAPE` | Path segment contains `..`, leading `/`, or null byte |
| `UNKNOWN_TOOL` | Tool name not in registry |
