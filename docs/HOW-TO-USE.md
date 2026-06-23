# How to Use TFC — All 32 Tools

TFC gives you 32 tools across five groups: Build, Evidence, Context Engine, Quality, and Portfolio. `tfc_compile` alone handles 80% of workflows. Reach for the lower-level tools only when you need control at a specific step.

---

## The one-command path (start here)

```
tfc_compile("describe the skill you want in plain English")
```

Smart front door. Scaffolds the 4-file package, runs blocking validation, scores it, hands you something installable. Use this by default. Only go lower-level when you need to author a specific section yourself.

---

## Phase 1 — Build tools

### `tfc_compile`
Plain English → complete skill package.
```
tfc_compile("a skill that reviews React components for accessibility issues")
```
Output: a scored, validated 4-file package ready for `tfc_install`. Covers the entire build path in one call.

### `tfc_new`
Empty skill scaffold from the template. Use when you want to write the content yourself.
```
tfc_new("react-a11y-reviewer", category="frontend")
```
Output: 4 files with placeholders, nothing filled in. Write Identity, Principles, and workflow. Run `tfc_validate` before installing.

### `tfc_brainstorm`
Generates the Identity + Principles sections. Run after `tfc_new`.
```
tfc_brainstorm("react-a11y-reviewer")
```
Returns a prompt template — Claude executes it and writes the actual content. These two sections are the "expert brain" of the skill. A skill without them scores in the 40s and behaves generically.

### `tfc_generate`
Generates Patterns, Anti-Patterns, Quick Wins, and Handoffs. Run after `tfc_brainstorm`.
```
tfc_generate("react-a11y-reviewer")
```
Returns a prompt template — Claude executes it. This is where the named recipes, battle scars, and composition contracts live. The difference between a skill that works once and one that compounds.

### `tfc_migrate`
Converts an existing skill in any prior format to the current TFC 4-file format.
```
tfc_migrate("skills/legacy/old-skill")
```
Read `docs/migration-guide.md` and `docs/intelligence-context-guide.md` before migrating. Speed-running this loses the intelligence layers — the skill validates, but the domain expertise is gone.

---

### `tfc_behavioral`
Deterministic, zero-model contract QA. Checks behavioral artifacts (phase headers, output markers, gate blocks) without a model call — fast and CI-safe.
```
tfc_behavioral("skills/frontend/react-a11y-reviewer")
```
Fails-closed on unknown gate IDs. Run before `tfc_eval` to catch structural gaps before spending session tokens on behavioral evaluation.

---

## Phase 2 — Quality tools

### `tfc_validate`
Gate-check against `validations.yaml`. Shows every blocking issue and warning.
```
tfc_validate("skills/frontend/react-a11y-reviewer")
```
Blocking checks prevent install. Common blocks: missing Identity section, fewer than 3 principles, no handoffs defined. Warnings let you proceed but flag gaps. Run this before every install.

### `tfc_score`
Intelligence density score: 0–100 with an exact gap list.
```
tfc_score("skills/frontend/react-a11y-reviewer")
```
What the thresholds mean:
- Below 60: inconsistent Claude behavior. Do not install.
- 60–84: functional, not production-grade. Consider evolving before depending on it.
- 85+: production-grade. Safe for daily use and pipelines.

The gap list names exactly which sections are thin and what would push the score higher.

### `tfc_lane`
Shows the skill's current earned evidence tier.
```
tfc_lane("skills/frontend/react-a11y-reviewer")
```

| Lane | What it means | How to advance |
|------|---------------|----------------|
| `authored` | Written, not tested | Run `tfc_eval` |
| `eval_proven` | Passed behavioral eval | Use 5+ times, then `tfc_evolve` + `tfc_eval` |
| `evolution_proven` | Improved from real feedback | Keep using it — the lane holds |

---

## Phase 3 — Evidence lane tools

### `tfc_eval`
Behavioral evaluation against `evals.yaml`. Proves the skill works — not just that it's well-written.
```
tfc_eval("skills/frontend/react-a11y-reviewer")
```
Runs the skill against defined input-output scenarios, checks that outputs meet behavioral criteria. Pass → lane updates from `authored` to `eval_proven`. Fail → exact criteria that weren't met.

### `tfc_evolve`
Analyzes `learnings.jsonl` (real usage data) and proposes targeted improvements to SKILL.md.
```
tfc_evolve("skills/frontend/react-a11y-reviewer")
```
Minimum signal: 5 real invocations. Below that, proposals are thin. At 10+ invocations, patterns are meaningful — you'll see which approaches worked and which got corrected. Accept the proposals you agree with, then run `tfc_eval` to confirm the improvement held.

### `tfc_replay`
Stability quorum — runs N eval samples and checks variance. Confirms the skill is consistent, not just passing on a good day.
```
tfc_replay("skills/frontend/react-a11y-reviewer", { "samples": 5 })
```
Use before promoting a skill to `evolution_proven` if you want confidence the eval score is stable across runs.

### `tfc_decay`
Read-only proof staleness overlay. Shows which learnings in `learnings.jsonl` are older than 90 days or low-signal.
```
tfc_decay("skills/frontend/react-a11y-reviewer")
```
Returns a staleness report without modifying anything. When staleness is high, `tfc_evolve` on fresh signal is better than promoting stale evidence.

### `tfc_capture`
Wires the learnings capture hook into SKILL.md so outcomes write to `learnings.jsonl` after real invocations.
```
tfc_capture("skills/frontend/react-a11y-reviewer")
```
Run once after `tfc_install` if the skill was built before V3 Living Lane. New skills from `tfc_compile` already have capture wired.

---

## Phase 4 — Install & Maintain

### `tfc_install`
Registers the skill in `~/.claude/skills/` (invocable) and the skill registry (discoverable). Both registrations required — missing one leaves the skill half-live.
```
tfc_install("skills/frontend/react-a11y-reviewer")
```
After install: type `/react-a11y-reviewer` in Claude Code to invoke it.

### `tfc_register`
Spawner-only registration without the validate gate. Use for skills you want discoverable in the registry but not directly invocable from Claude Code.
```
tfc_register("skills/frontend/react-a11y-reviewer")
```

### `tfc_list`
Lists all TFC skills and flags dangling symlinks — skills deleted but whose symlinks remain.
```
tfc_list()
```

### `tfc_doctor`
Lane-aware health check across all installed skills. Shows which are `authored` (never tested), which have stale learnings, and which have enough signal to evolve.
```
tfc_doctor()
```
Run monthly if you maintain a large skill library.

### `tfc_migrate`
Converts a skill from an older format to the current TFC 4-file format.
```
tfc_migrate("skills/legacy/old-skill")
```

---

## Phase 5 — Context Engine

The Context Engine prevents skills from running on empty context stubs. A skill can have a perfectly structured SKILL.md and still produce generic output when its `context/` directory is unfilled. These tools close that gap.

### `tfc_context`
Scaffolds `context/` stubs from the taxonomy. Stubs are empty files — human fills them (INV-4: no model fills context automatically).
```
tfc_context("skills/frontend/react-a11y-reviewer")
```
Creates `context/failure-modes.md`, `context/model-selection.md`, `context/prompt-patterns.md`, etc. based on the skill's category and taxonomy mapping.

### `tfc_context_fill`
Returns a prompt template for Claude to fill a specific context stub from grounded sources only. No guessing — the template requires you to cite the source.
```
tfc_context_fill("skills/frontend/react-a11y-reviewer", { "file": "context/failure-modes.md" })
```
Returns a fill prompt. Claude executes it in-session and writes the content. The source constraint is what keeps context stubs from becoming hallucinated filler.

### `tfc_context_get`
Returns rendered context files ready to inject into a prompt.
```
tfc_context_get("skills/frontend/react-a11y-reviewer")
```
Used by the skill invocation path to load context into the session automatically.

### `tfc_context_update`
Re-stamps `last_verified` after a human review of a context file.
```
tfc_context_update("skills/frontend/react-a11y-reviewer", { "file": "context/failure-modes.md" })
```
Context files go stale. This marks a file as freshly reviewed without requiring a full refill.

### `tfc_context_audit`
Reports fill ratio and stale sections across the skill's context directory.
```
tfc_context_audit("skills/frontend/react-a11y-reviewer")
```
Returns: how many stubs exist, how many are filled, which are stale (last_verified > 90 days). Run before promoting a skill to `eval_proven`.

### `tfc_context_discover`
Surfaces skills across your library that have unfilled or stale context.
```
tfc_context_discover()
```
Returns a ranked list: most context-debt first. Run monthly alongside `tfc_doctor`.

### `tfc_context_coverage`
Coverage heatmap per taxonomy domain. Shows which context categories are well-filled vs empty across your entire skill library.
```
tfc_context_coverage()
```

---

## Phase 6 — Portfolio and Ecosystem

### `tfc_portfolio`
Whole-portfolio health surface. Shows lanes, decay status, and evolution candidates across all installed skills.
```
tfc_portfolio()
```

### `tfc_relink`
Repairs missing or dangling skill symlinks. Run after a skill directory move.
```
tfc_relink()
```

### `tfc_integrate`
Writes validated integration contracts into `spec.yaml` `pairs_with` entries. Validates that the paired skill exists and the direction is set.
```
tfc_integrate("skills/frontend/react-a11y-reviewer", { "pairsWith": "skills/frontend/code-reviewer" })
```

### `tfc_graph`
Builds a skill dependency graph from all `pairs_with` edges across your skill library.
```
tfc_graph()
```
Returns a directed graph showing skill chains. Reveals orphaned skills and over-connected hubs.

### `tfc_compose`
Multi-skill composition plan for a goal. Given a task description, returns which skills to chain and in what order.
```
tfc_compose("I need to review a React PR for accessibility, security, and performance")
```
Returns: ordered skill chain with handoff contracts between each.

### `tfc_recommend`
Ranks installed skills for a given task. Semantic match against `spec.yaml` descriptions and triggers.
```
tfc_recommend("debug a Python memory leak")
```
Returns: ranked list with match reason per skill.

---

## V3 Tools — The Living Lane (runtime-managed)

These run automatically. You don't invoke them directly.

| Module | What it does | When it runs |
|--------|-------------|-------------|
| `capture` | Writes outcome to `learnings.jsonl` | After every real invocation |
| `decay` | Marks stale learnings (>90 days, low signal) as inactive | On schedule |
| `relink` | Deduplicates identical skills to symlinks | When duplicates detected |
| `replay` | Surfaces cross-session patterns | On demand |
| `portfolio` | Cross-skill analytics: usage, lane distribution, evolution candidates | On demand |

`tfc_pack_bridge` is the one V3 tool you call manually: reads `packs.yaml` and enforces that packs only reference skills at `eval_proven` or higher — no pack pulls in an untested skill.

---

## The complete path (production-grade)

```
# 1. Start with intent
tfc_compile("skill description")

# 2. Validate and score before trusting it
tfc_validate("skills/category/name")    ← must pass all blocking checks
tfc_score("skills/category/name")       ← must score > 70

# 3. Install only after passing
tfc_install("skills/category/name")

# 4. After 5+ real uses, evolve it
tfc_evolve("skills/category/name")

# 5. Confirm the improvement held
tfc_eval("skills/category/name")        ← lane advances to eval_proven

# 6. Audit the full library monthly
tfc_doctor()
```

This loop is why TFC skills compound while generic prompts plateau.
