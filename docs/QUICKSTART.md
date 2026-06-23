# TFC Quickstart

One command from plain English to a deployed, self-improving Claude skill. Here's the exact path.

---

## Add tfc-builder to Claude

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

Restart Claude. 32 tools load. You only need one to start.

---

## Build your first skill

Pick something you do with Claude more than three times — "debug Python errors", "review PRs for security issues", "write copy in a specific voice".

**In Claude:**

```
tfc_compile("I want a skill for debugging Python errors — finds root cause fast, explains what went wrong, gives the fix")
```

TFC scaffolds the 4-file skill package, runs it through blocking quality gates, and tells you the intelligence density score. If it passes, you install it. If it doesn't, the gate tells you exactly what's missing.

---

## Install it

```
tfc_install("skills/debugging/python-debug-expert")
```

Type `/python-debug-expert` in Claude Code. The skill loads.

---

## What you just built

```
skills/debugging/python-debug-expert/
├── spec.yaml          → routing map — what this skill handles, when Claude loads it
├── SKILL.md           → the exact instructions Claude reads at invoke time
├── validations.yaml   → the gates that blocked this from installing if the content was thin
└── learnings.jsonl    → empty now, auto-written after every real invocation
```

The last file is what makes this different from a prompt. After 5 real uses, run `tfc_evolve` — it reads `learnings.jsonl` and proposes targeted improvements based on what actually worked. After 10+, the skill has adapted to your patterns without you doing anything for that to happen.

Here's what nobody tells you: the skill that ran 10 times is not the skill you installed. It's better. That's the mechanism.

---

## Next

- [How to Use TFC](./HOW-TO-USE.md) — all 32 tools and when to reach for each
- [When to Use TFC](./WHEN-TO-USE.md) — skill vs prompt vs tool: the decision guide
- [Architecture](./ARCHITECTURE.md) — how the 4-layer system works
