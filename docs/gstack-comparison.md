# gstack → TFC: What's Kept, What's Cut, What's Fixed

## What gstack does well (TFC keeps all of this)

### Preamble bash block
The most important gstack pattern. Before any skill logic: session tracking, branch detection,
learnings surface, config reads. Every gstack skill starts identically. TFC makes this a shared
runtime (`~/.future-code/runtime/preamble.sh`) rather than copy-pasted per skill.

### learnings.jsonl operational loop
The invention that makes skills compound over time. Every session, durable insights get logged.
Next session, they surface automatically. After 10 runs, the skill is measurably better.
TFC makes this mandatory for all skills (spawner never had it).

### Completion Status Protocol
DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT. Simple, unambiguous.
TFC makes this mandatory. A skill without it leaves Claude and the user without a signal.

### Voice guidelines
"Direct, concrete, builder-to-builder. No em dashes. No AI vocabulary."
This is gstack's most transferable rule. TFC inherits it verbatim and adds a validation
gate that fails on violations.

### Boil the Lake philosophy
When marginal cost is near-zero, do the complete thing. Never ship the 90% shortcut.
TFC adopts this as a core tenet. It belongs in every skill's default behavioral posture.

### Search Before Building
Layer 1 (tried-and-true) → Layer 2 (new-and-popular) → Layer 3 (first-principles).
First principles > borrowed solutions. Name the eureka moment when found.
TFC inherits this for all investigative and build skills.

### SKILL.md.tmpl template system
Generate SKILL.md from a template with `{{PLACEHOLDER}}` blocks filled at build time.
Keeps docs structurally sound — code drives docs, not the other way.
TFC supports this as an optional layer (SKILL.md is always the primary; .tmpl is an optimization).

### Telemetry (always-run, config-gated)
Not opt-in. Always-run. User can opt out, but the default is collection.
TFC inherits this model: telemetry block is mandatory in SKILL.md, config gates what gets sent.

---

## What gstack does poorly (TFC fixes)

### CLAUDE.md routing injection
gstack writes `## Skill routing` into the project's CLAUDE.md. Problems:
- Manually maintained (drifts)
- Project-specific (not portable — same routing rules needed in every project)
- Not machine-readable (can't be queried)
- Duplicates spec.yaml triggers (second source of truth)

**The fix:** spec.yaml `triggers` IS the routing. TFC generates the CLAUDE.md routing table
automatically from the TFC skill registry. One source.

### Skill vendoring in project repos
gstack supports vendoring — copying `~/.claude/skills/gstack/` into `.claude/skills/gstack/`
in the project repo. This is now deprecated but still causes confusion.

**The fix:** TFC uses symlinks only. `tfc install` creates `~/.claude/skills/{name}/SKILL.md →
~/.future-code/skills/{cat}/{name}/SKILL.md`. No copies. One source.

### Model overlay YAML per-model
gstack has `agents/openai.yaml` for model-specific behavioral patches. This is a separate
file per model, creating split routing logic.

**The fix:** `spec.yaml model_tier` declares the behavioral tier. TFC SKILL.md has one section:
`## Model Behavioral Notes` with inline model-specific guidance when needed (not a separate file).

### Feature discovery prompts (once each, but still annoying)
gstack prompts for: telemetry, proactive mode, routing rules, lake intro, writing style,
vendoring migration. Once each — but that's 6 prompts across sessions.

**The fix:** TFC ships with sensible defaults pre-configured. The ONLY first-run prompt is:
"TFC is installed. Telemetry is on (anonymous). Change? Y/N" — one prompt, done.

### Skill binary for browse (Bun compile required)
gstack's browse feature requires `bun build --compile` to produce a binary. This is a
build prerequisite that breaks in some environments.

**TFC note:** TFC inherits this ONLY for browse-type skills that need a compiled binary.
Pure-workflow skills (investigate, review, ship) have no build dependency.

---

## Migration checklist: gstack → TFC

For each gstack skill you want to migrate:

1. [ ] Read existing SKILL.md
2. [ ] Create `spec.yaml` from `_template/spec.yaml`
3. [ ] Extract triggers from CLAUDE.md routing table entry for this skill
4. [ ] Set `model_tier` (investigate → sonnet, research → opus, quick-lookup → haiku)
5. [ ] Extract preamble bash block from SKILL.md — replace with TFC standard preamble
       (update `_SKILL_ID` and `_SKILL_CAT` placeholders)
6. [ ] Move existing `~/.gstack/projects/*/learnings.jsonl` entries to
       `~/.future-code/skills/{cat}/{name}/learnings.jsonl`
7. [ ] Update telemetry block to TFC format (write to `~/.future-code/analytics/`)
8. [ ] Run validations.yaml checks
9. [ ] Symlink into `~/.claude/skills/` (replacing existing gstack symlink if present)
10. [ ] Remove the routing entry from CLAUDE.md (now served by spec.yaml triggers)

## The one gstack pattern NOT to migrate

**GBrain sync** — gstack's cross-machine memory sync (git-backed `~/.gstack/`).
This is gstack-specific infrastructure. TFC uses Mind v5 (`mind_remember`) for
cross-session memory. GBrain is a valid alternative for teams on the gstack platform.
Don't merge these — they serve the same purpose through different mechanisms.
