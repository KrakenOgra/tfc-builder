# When to Use TFC

## The question everyone asks is wrong.

"How do I prompt Claude better?" fails completely for repeatable work.

The right question: **does this task have a correct process, or just a correct output?**

If the process is repeatable — use TFC. If every run requires re-judging from scratch — just prompt Claude directly. The distinction sounds subtle. It isn't. It's the entire decision.

---

## Why "better prompting" breaks down for repeatable tasks

A better prompt solves for one session. It fails across sessions.

You still re-explain context every time. The results still drift across Claude versions. There's no quality gate — run 7 can be worse than run 2 with no signal. And nothing learns from what worked.

TFC is built for the thing prompting doesn't solve: repeatable tasks with a defined quality bar that needs to compound over time.

---

## Use TFC when...

### You explain the same context more than 3 times

Every re-explanation is waste. A TFC skill loads that context automatically when you type `/skill-name`.

- "Review my code for security issues"
- "Write copy in Hormozi style"
- "Debug this Python error"
- "Summarize this meeting into action items"

### The task has a specific quality bar

`validations.yaml` is a machine-checkable gate. The skill either meets the bar or it doesn't install. No "good enough" drift — the gate blocks it.

### You want Claude to improve without re-teaching it

The `learnings.jsonl` loop captures what worked after every real run. `tfc_evolve` turns that into concrete improvements. A skill at run 10 is demonstrably better than run 1 — not because you edited it, but because it observed its own outcomes.

### You're building a team workflow

Skills are files. They version-control, share, fork, and merge like code. A team on the same skill stays consistent without meetings about prompting style.

### You're integrating Claude into a pipeline

Spawner and Claude Code discover TFC skills via `spec.yaml` triggers automatically. Skills are the unit of Claude capability in any orchestration system.

---

## Don't use TFC when...

### It's a one-off question
"What's the capital of France?" — just ask Claude.

### The task has no correct process, only a correct output
"Write me a poem" has infinite valid outputs. TFC excels at tasks where a defined process produces the right result, not open-ended creative work.

### You're still figuring out what the skill should do
Build with plain prompts first. When you write the same 3-paragraph context block a third time, that's the extraction signal.

### The task needs live data
TFC skills load context, not data. Live APIs, database reads, fresh search results — that's a tool or integration, not a skill.

---

## Which tool, which situation

**Build:**

| Situation | Tool |
|-----------|------|
| Build a new skill from a plain-English description | `tfc_compile` |
| Build a skill section by section yourself | `tfc_new` → `tfc_brainstorm` → `tfc_generate` |
| Convert a spawner or gstack skill to TFC | `tfc_migrate` |

**Quality gates:**

| Situation | Tool |
|-----------|------|
| Check if a skill is structurally valid | `tfc_validate` |
| Run fast deterministic contract QA (no model call) | `tfc_behavioral` |
| Score intelligence density (0–100) | `tfc_score` |
| Check a skill's earned evidence tier | `tfc_lane` |

**Evidence and evolution:**

| Situation | Tool |
|-----------|------|
| Prove a skill actually works against defined scenarios | `tfc_eval` |
| Check eval stability across multiple runs | `tfc_replay` |
| Improve a skill from real usage data | `tfc_evolve` |
| Check which learnings are stale | `tfc_decay` |
| Wire the learnings capture hook into a skill | `tfc_capture` |

**Install and maintain:**

| Situation | Tool |
|-----------|------|
| Install a skill (invocable + discoverable) | `tfc_install` |
| Register for discovery only (no Claude Code invoke) | `tfc_register` |
| See what's installed and flag broken symlinks | `tfc_list` |
| Full lane-aware health check across all skills | `tfc_doctor` |
| Repair dangling symlinks after a skill move | `tfc_relink` |
| Portfolio health: lanes, decay, evolution candidates | `tfc_portfolio` |

**Context Engine:**

| Situation | Tool |
|-----------|------|
| Scaffold context stubs from taxonomy for a skill | `tfc_context` |
| Fill a context stub from a grounded source | `tfc_context_fill` |
| Load filled context into the active prompt | `tfc_context_get` |
| Re-stamp last_verified after reviewing a context file | `tfc_context_update` |
| Check fill ratio and staleness for a skill | `tfc_context_audit` |
| Find all skills with unfilled or stale context | `tfc_context_discover` |
| Heatmap: which taxonomy domains have coverage gaps | `tfc_context_coverage` |

**Ecosystem and composition:**

| Situation | Tool |
|-----------|------|
| Add a validated integration contract between two skills | `tfc_integrate` |
| Build a dependency graph from pairs_with edges | `tfc_graph` |
| Plan a multi-skill chain for a complex goal | `tfc_compose` |
| Find the best installed skill for a task | `tfc_recommend` |
| Enforce packs only reference eval_proven+ skills | `tfc_pack_bridge` |

---

## The lane system — how much to trust a skill

```
authored         → Written. Not tested. Good enough to start, not to depend on.
eval_proven      → Passed behavioral eval. Safe for daily use.
evolution_proven → Improved from real feedback. Actively compounding. Worth sharing.
```

The rule: don't put `authored` skills in automated pipelines. `eval_proven` is the minimum bar for anything you rely on. `evolution_proven` is the only lane worth sharing with your team.

Lane values compute from disk evidence. Never guessed.

---

## When to run each lifecycle step

| When | Action |
|------|--------|
| First build | `tfc_compile` or `tfc_new` |
| Before installing | `tfc_validate` + `tfc_score` — must be > 70 |
| After installing | Use it for real, at least 5 times |
| After 5 real uses | `tfc_evolve` → review suggestions → `tfc_eval` |
| Monthly | `tfc_doctor` across all installed skills |
| When format changes | `tfc_migrate` |

---

## Skill vs Prompt vs Tool — when each wins

| Approach | Best for |
|----------|----------|
| Raw Claude prompt | One-off, exploratory, variable tasks |
| TFC skill | Repeatable tasks with a defined process and quality bar |
| MCP tool | Tasks needing live data, APIs, or file system access |
| Agent chain | Multi-step pipelines where skills hand off to each other |

TFC skills are the middle layer — more reliable than prompts, lighter than building full MCP servers.
