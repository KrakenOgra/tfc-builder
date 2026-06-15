# When to Use TFC — Decision Guide

## The core question

**"Would I want Claude to do this the same way every time?"**

If yes — build a TFC skill. If the answer depends heavily on context each time — don't; just prompt Claude directly.

---

## Use TFC when...

### You repeat the same type of task more than 3 times
Every time you explain the same context, you're paying a cost. A TFC skill loads that context once and never forgets it.

Examples:
- "Review my code for security issues"
- "Write copy in Hormozi style"
- "Debug this Python error"
- "Summarize this meeting into action items"

### The task has a specific quality bar you care about
TFC skills carry `validations.yaml` — a machine-checkable quality gate. This means the skill either meets the bar or it blocks. No "good enough" drift.

### You want Claude to improve without you re-teaching it
The `learnings.jsonl` loop captures what worked. `tfc_evolve` turns that into concrete improvements. A skill used 10 times is smarter than a fresh prompt every time.

### You're building a team workflow
Skills are files. They version-control, share, fork, and merge like code. A team using the same skill stays consistent without meetings about prompting style.

### You're integrating Claude into a pipeline
Spawner and Claude Code can discover TFC skills automatically via `spec.yaml` routing triggers. If you're building something that orchestrates Claude, TFC skills are the unit of capability.

---

## Don't use TFC when...

### It's a one-off question
"What's the capital of France?" — just ask Claude.

### The task is fundamentally creative and variable
"Write me a poem" has no correct output structure. TFC skills excel at tasks with a defined process, not open-ended creative work.

### You're still figuring out what the skill should do
Build with plain prompts first. When you find yourself writing the same 3-paragraph context block repeatedly, that's the signal to extract it into a TFC skill.

### The task requires real-time data
TFC skills load context, not data. If the task needs live APIs, database reads, or fresh search results — that's a tool or integration, not a skill.

---

## Which tool for which situation

| Situation | Tool |
|-----------|------|
| "I want to build a new skill" | `tfc_compile` |
| "I want to build from scratch myself" | `tfc_new` → `tfc_brainstorm` → `tfc_generate` |
| "Is this skill good enough to use?" | `tfc_validate` + `tfc_score` |
| "What lane is this skill in?" | `tfc_lane` |
| "I want to make this skill smarter" | `tfc_evolve` |
| "I want to prove this skill actually works" | `tfc_eval` |
| "I have an old skill in a different format" | `tfc_migrate` |
| "Which of my skills are stale or broken?" | `tfc_doctor` |
| "What skills do I have installed?" | `tfc_list` |

---

## The lane system — how to read it

Every skill has a lane that tells you how much to trust it:

```
authored        → Written. Not tested. Use with caution.
eval_proven     → Passed behavioral eval. Safe to rely on.
evolution_proven → Improved from real feedback. Actively compounding.
```

**Rule of thumb:**
- Don't put `authored` skills in automated pipelines
- `eval_proven` is the minimum bar for daily-driver skills
- `evolution_proven` skills are the ones worth sharing and depending on

---

## When to run each lifecycle step

| When | Action |
|------|--------|
| First time building | `tfc_compile` or `tfc_new` |
| Before installing | `tfc_validate` + `tfc_score` (need > 70) |
| After installing | Use it for real, at least 5 times |
| After 5 real uses | `tfc_evolve` → review suggestions → `tfc_eval` |
| Monthly | `tfc_doctor` across all skills |
| When format changes | `tfc_migrate` |

---

## Skill vs Prompt vs Tool — when each wins

| Approach | Best for |
|----------|----------|
| Raw Claude prompt | One-off, exploratory, truly variable tasks |
| TFC skill | Repeatable tasks with a defined process and quality bar |
| MCP tool | Tasks needing external data, APIs, or file system access |
| Agent chain | Multi-step pipelines where skills hand off to each other |

TFC skills are the middle layer — more reliable than prompts, lighter than building full MCP tools.
