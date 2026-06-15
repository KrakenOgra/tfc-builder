# TFC Quickstart — Up and Running in 5 Minutes

## Step 1 — Add tfc-builder to Claude

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

Restart Claude after adding. You now have 20 new tools.

---

## Step 2 — Build your first skill (~10 minutes)

Pick something you do repeatedly with Claude — "debug Python errors", "write landing page copy", "review PRs".

**In Claude, type:**

```
tfc_compile("I want a skill for debugging Python errors — finds root cause fast, explains what went wrong, gives the fix")
```

`tfc_compile` is the front door. It scaffolds the skill, opens it for editing, and gives you an installable package in one command.

---

## Step 3 — Install and invoke

```
tfc_install("skills/debugging/python-debug-expert")
```

Type `/python-debug-expert` in Claude Code — your skill loads instantly.

---

## What just happened

You created a **4-file skill package**:

```
skills/debugging/python-debug-expert/
├── spec.yaml          → how Claude discovers and routes to this skill
├── SKILL.md           → the instructions Claude reads when invoked
├── validations.yaml   → quality gates that block weak skills from installing
└── learnings.jsonl    → auto-written feedback after each real use
```

The skill improves automatically — `learnings.jsonl` captures what worked after every real invocation without you doing anything.

---

## Next steps

- [How to Use TFC](./HOW-TO-USE.md) — full walkthrough of all 20 tools
- [When to Use TFC](./WHEN-TO-USE.md) — which tool for which situation
- [Architecture](./ARCHITECTURE.md) — how TFC works under the hood
