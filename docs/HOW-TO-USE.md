# How to Use TFC — All 20 Tools

TFC gives you 20 tools across three phases: Build, Evolve, and Maintain. `tfc_compile` alone handles 80% of workflows. Reach for the lower-level tools only when you need control at a specific step.

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

## Phase 3 — Evolve tools

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

### `tfc_compile` (again, as evolution tool)
Describe what's changed about your needs and TFC rebuilds the skill from scratch with the new context baked in. Most useful when the original build was for a different purpose than the skill now serves.

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

## V3 Tools — The Living Lane (advanced)

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
