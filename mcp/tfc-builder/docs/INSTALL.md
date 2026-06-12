# Installation Guide

Three ways to install tfc-builder as an MCP server. Pick the one that fits your workflow.

---

## Option A — npx (recommended, zero setup)

No build step. npx downloads and runs the latest version on first call.

### Claude Code

Edit `~/.claude/settings.json` and add to the `mcpServers` object:

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

Restart Claude Code (`/restart` or reopen the terminal). Confirm:

```
Ask Claude: "List the tfc-builder tools."
```

Claude should respond with all 9 tools.

### Claude Desktop (Mac)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

Quit and reopen Claude Desktop. Check Settings → Developer → MCP Servers for a green status dot.

### Claude Desktop (Windows)

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

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

---

## Option B — npm global install

Install once, runs without npx latency:

```bash
npm install -g tfc-builder
```

Verify:

```bash
tfc-builder --version
```

MCP config (same for Claude Code and Claude Desktop):

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

## Option C — clone and build (for contributors or offline use)

```bash
git clone https://github.com/Cyperphycho/tfc-builder
cd tfc-builder
npm install
npm run build
npm test          # all 111 tests must pass
```

MCP config — use the absolute path to your clone:

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

## Custom skill roots (optional)

By default, tfc-builder stores skills at `~/.future-code/skills/` and installs symlinks into
`~/.claude/skills/` and `~/.spawner/skills/`. Override any of these:

```json
{
  "mcpServers": {
    "tfc-builder": {
      "command": "npx",
      "args": ["tfc-builder"],
      "env": {
        "TFC_ROOT": "/path/to/your/skill-root",
        "CLAUDE_SKILLS_DIR": "/path/to/claude/skills",
        "SPAWNER_SKILLS_DIR": "/path/to/spawner/skills"
      }
    }
  }
}
```

---

## Verify the installation

Once registered, ask Claude in any session:

```
List the tfc-builder tools.
```

Expected response: a table of 9 tools (tfc_new, tfc_brainstorm, tfc_generate, tfc_validate,
tfc_score, tfc_migrate, tfc_install, tfc_register, tfc_list).

If tools don't appear:
1. Check the MCP config JSON is valid (no trailing commas).
2. Make sure you restarted Claude after editing the config.
3. For global install: confirm `tfc-builder` is in your PATH (`which tfc-builder`).
4. For clone install: confirm `npm run build` completed and `dist/server.js` exists.
