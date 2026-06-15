# How to Use TFC — All 20 Tools Explained

TFC (The Future Code) gives you 20 tools split across three phases: **Build**, **Evolve**, and **Maintain**. You don't need all 20 to start — `tfc_compile` alone covers 80% of use cases.

---

## The One-Command Path (Start Here)

```
tfc_compile("describe the skill you want in plain English")
```

This is the smart front door. It figures out the right scaffold, runs validation, and hands you a ready-to-install skill. Use this whenever you want to build something new without thinking about which tools to chain.

---

## Phase 1 — Build Tools (create a new skill from scratch)

### `tfc_compile`
The front door. Converts a plain-English intent into a complete skill package.
```
tfc_compile("a skill that reviews React components for accessibility issues")
```
Use this by default. Only go lower-level if you need fine-grained control.

### `tfc_new`
Scaffolds an empty skill directory from the template. Use when you want to write the skill content yourself.
```
tfc_new("react-a11y-reviewer", category="frontend")
```

### `tfc_brainstorm`
Returns a prompt template for authoring the Identity + Principles sections of a skill. Run after `tfc_new` if you want Claude's help writing the core thinking layer.
```
tfc_brainstorm("react-a11y-reviewer")
```

### `tfc_generate`
Returns a prompt template for authoring Patterns, Anti-Patterns, Quick Wins, and Handoffs. Run after `tfc_brainstorm`.
```
tfc_generate("react-a11y-reviewer")
```

**Note:** `tfc_brainstorm` and `tfc_generate` return prompt **templates** — Claude executes the template and writes the actual content. They are not AI responses themselves.

---

## Phase 2 — Quality Tools (before installing)

### `tfc_validate`
Gate-check against `validations.yaml`. Shows every blocking issue and warning. A skill cannot install if blocking checks fail.
```
tfc_validate("skills/frontend/react-a11y-reviewer")
```
Run this before every install. It catches: missing required sections, weak principles, empty anti-patterns, no handoffs.

### `tfc_score`
Scores the skill 0–100 on intelligence density. Returns an exact gap list — which sections are thin and what would push the score higher.
```
tfc_score("skills/frontend/react-a11y-reviewer")
```
A score below 60 means the skill will underperform. Above 85 means it's production-grade.

### `tfc_lane`
Shows the skill's current **lane** — the earned evidence tier:

| Lane | Meaning |
|------|---------|
| `authored` | Written but never tested |
| `eval_proven` | Passed behavioral evaluation |
| `evolution_proven` | Improved via real feedback loop |

```
tfc_lane("skills/frontend/react-a11y-reviewer")
```

---

## Phase 3 — Evolve Tools (make skills smarter over time)

### `tfc_eval`
Runs behavioral evaluation against the skill's `evals.yaml`. Proves the skill actually does what it claims — not just that it's well-written.
```
tfc_eval("skills/frontend/react-a11y-reviewer")
```
Passing eval moves the skill from `authored` → `eval_proven`.

### `tfc_evolve`
Analyzes `learnings.jsonl` (real usage feedback) and proposes targeted improvements to SKILL.md. This is how skills compound over time.
```
tfc_evolve("skills/frontend/react-a11y-reviewer")
```
A skill with 5+ real invocations has enough signal for `tfc_evolve` to be useful. Running it earlier produces shallow suggestions.

### `tfc_compile` (again)
`tfc_compile` also works as an evolution tool — describe what's changed about your needs and it rebuilds the skill from scratch with that context baked in.

---

## Phase 4 — Install & Maintain

### `tfc_install`
Installs the skill by creating symlinks in `~/.claude/skills/` and `~/.spawner/skills/`. The skill becomes invocable as `/skill-name` in Claude Code.
```
tfc_install("skills/frontend/react-a11y-reviewer")
```

### `tfc_register`
Spawner-only registration without the validate gate. Use when you want to register a skill quickly without it being invocable from Claude Code directly.
```
tfc_register("skills/frontend/react-a11y-reviewer")
```

### `tfc_list`
Lists all TFC skills and detects dangling symlinks (skills that were deleted but whose symlinks remain).
```
tfc_list()
```

### `tfc_doctor`
Lane-aware health check across all installed skills. Shows which skills are `authored` (never tested), which have stale learnings, and which are ready for evolution.
```
tfc_doctor()
```
Run this weekly if you maintain a large skill library.

### `tfc_migrate`
Converts a skill from an older format (spawner, gstack) to the current TFC 4-file format.
```
tfc_migrate("skills/legacy/old-skill")
```

---

## V3 Tools — The Living Lane (advanced)

These tools manage the skill lifecycle at scale.

### `tfc_pack_bridge`
Reads `packs.yaml` and enforces that registered packs reference skills at or above a minimum lane (`eval_proven`). Prevents packs from linking to unproven skills.

### Capture / Decay / Relink / Replay / Portfolio
These are the V3 "Living Lane" tools — they run automatically in the background:

- **capture** — writes to `learnings.jsonl` after real invocations
- **decay** — marks stale learnings that are no longer relevant
- **relink** — deduplicates identical skills into symlinks to save space
- **replay** — replays historical learnings to find patterns
- **portfolio** — cross-skill analytics: which skills get used, which don't, which have evolved

You don't invoke these directly — they're wired into the runtime scripts in `mcp/tfc-builder/runtime/`.

---

## The Smart Path (genius-level usage)

```
# 1. Start with intent
tfc_compile("skill description")

# 2. Validate before trusting it
tfc_validate("skills/category/name")
tfc_score("skills/category/name")

# 3. Install only after score > 70
tfc_install("skills/category/name")

# 4. After 5+ real uses, evolve it
tfc_evolve("skills/category/name")

# 5. Run eval to lock in the improvement
tfc_eval("skills/category/name")

# 6. Audit the whole library monthly
tfc_doctor()
```

This loop is why TFC skills compound while generic Claude prompts plateau.
