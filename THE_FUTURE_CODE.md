# The Future Code (TFC)
# A Unified Skill Operating System

**What:** A single skill format that is simultaneously machine-discoverable (spawner),
human-executable (gstack), and self-improving (learnings loop).

**Why:** Skills currently exist in two incompatible formats — spawner YAML (findable, composable,
but not executable) and gstack SKILL.md (executable, self-improving, but not composable or
machine-searchable). Every builder must choose one system. TFC eliminates the choice.

**Where:** `~/.future-code/skills/{category}/{name}/` — the canonical home for all skills.

---

## The Core Insight

A skill needs exactly four layers:

```
SPEC     — machine-readable identity    (spawner's strength, kept)
EXECUTE  — human-readable instructions  (gstack's strength, kept)
LEARN    — operational feedback loop    (gstack's learnings.jsonl, kept)
ROUTE    — declarative model/chain      (neither system nailed this, fixed)
```

Spawner only has SPEC. gstack only has EXECUTE + LEARN + partial ROUTE.
TFC merges all four into one directory contract.

---

## Directory Contract (every skill, no exceptions)

```
~/.future-code/skills/{category}/{skill-name}/
├── spec.yaml          REQUIRED — machine-readable metadata
├── SKILL.md           REQUIRED — executable instructions for Claude
├── learnings.jsonl    AUTO     — written by runtime after each run (never hand-edit)
└── validations.yaml   OPTIONAL — quality gates (required for P18+ complexity skills)
```

`SKILL.md.tmpl` + code-gen is allowed for generated skills (gstack pattern). The compiled
`SKILL.md` is always the source of truth at runtime.

---

## SPEC Layer (`spec.yaml`)

What spawner does well. Every field has a JOB — nothing decorative.

```yaml
# spec.yaml — machine-readable identity
id: skill-name              # kebab-case, globally unique
name: Human Readable Name
version: 1.0.0
category: ai | backend | design | devops | data | pattern | ...

description: |
  One paragraph. What this skill does and when to use it.
  Written for the routing layer, not the user — answer "when should I load this?"

# === ROUTING ===
triggers:
  - "exact phrase user might say"   # used by spawner_skills(search) and tier-0 hook
  - "another trigger phrase"

model_tier: opus | sonnet | haiku   # default model for this skill's work
  # opus    = strategic, research, L3/L4 thinking, KM synthesis
  # sonnet  = implementation, code, standard features (DEFAULT)
  # haiku   = tactical, quick lookups, summarization

# === COMPOSITION ===
owns:
  - domain-responsibility-slug      # what this skill is authoritative for

pairs_with:
  - skill-id: other-skill           # which skills this naturally chains with
    direction: before | after | parallel
    reason: "one line why"

requires:
  - mcp-server-name                 # MCP servers needed (spawner, mind, etc.)

# === QUALITY ===
sharp_edges:                        # inline (for 1-3 edges); else use validations.yaml
  - id: gotcha-slug
    summary: "One line: what goes wrong"
    severity: critical | high | medium
    situation: "when this fires"
    why: "root cause"
    solution: "fix"
    symptoms:
      - "observable signal"
    red_flags:
      - "pattern to watch for"

# === SKILL CHAIN (level-gated) ===
skill_chain:
  - skill: realthink
    min_level: L3
  - skill: think-pipeline
    min_level: L4

# === MNEP (Model-Native Execution Protocol) ===
required_sections:
  - SECTION_HEADER_1    # sections that MUST appear in Claude's response output
  - SECTION_HEADER_2

scaffold_template: |
  ## PHASE 1 — REPRODUCE
  ## HYPOTHESIS (falsifiable):
  ## ROOT CAUSE:
  ## FIX DESIGN:

# === METADATA ===
tags:
  - searchable-tag

can_execute_without_mcp: true | false
```

### What NOT to put in spec.yaml

- Instructions for Claude (those go in SKILL.md)
- Examples or code patterns (those go in SKILL.md)
- Operational learnings (those go in learnings.jsonl — never hand-edit)
- Long descriptions of HOW to do the work (that's SKILL.md's job)

---

## EXECUTE Layer (`SKILL.md`)

What gstack does well. The executable instructions Claude reads at skill load time.

### Required sections (in order)

```markdown
---
name: skill-name          # must match spec.yaml id
preamble-tier: 1 | 2      # 1 = always run, 2 = run if session needs it
version: 1.0.0
description: |
  One-line description for CLAUDE.md routing table
---

## Preamble (run first)

[BASH BLOCK — MANDATORY]
Session state check. Always includes:
- Session ID generation
- Learnings file load (surface top 3 recent)
- Branch detection
- Config reads (proactive, model_overlay, etc.)

## [Skill-specific workflow sections]

[The actual instructions. Ordered steps. Stop points. Quality gates.]

## Voice

Direct, concrete, builder-to-builder. Name the file, function, command, and
user-visible impact. No filler.

No em dashes. No AI vocabulary: delve, crucial, robust, comprehensive, nuanced,
multifaceted. Short paragraphs. End with what to do.

## Completion Status Protocol

Report using one of:
- DONE — completed with evidence.
- DONE_WITH_CONCERNS — completed, list concerns.
- BLOCKED — cannot proceed; state blocker and what was tried.
- NEEDS_CONTEXT — missing info; state exactly what is needed.

## Operational Self-Improvement

Before completing, if you discovered a durable project quirk or command fix
that saves 5+ minutes next time, log it:

[TFC_LEARNINGS_LOG command — see Runtime section]

## Telemetry (run last)

[TFC_TELEMETRY command — see Runtime section]
```

### What makes a GOOD SKILL.md (gstack's hard-won lessons)

1. **Preamble always runs** — session state before ANY skill logic
2. **Stop points are real** — `STOP. Wait for user.` means stop, not "suggest stopping"
3. **Voice is non-negotiable** — no em dashes, no AI vocabulary, no filler
4. **Operational learnings log themselves** — never ask user to document; the skill does it
5. **Completion status is explicit** — DONE/DONE_WITH_CONCERNS/BLOCKED/NEEDS_CONTEXT
6. **Boil the Lake** — if marginal cost is near-zero, do the complete thing every time
7. **Search Before Building** — Layer 1 (tried-and-true) → Layer 2 (new-and-popular) → Layer 3 (first-principles)

### What makes a BAD SKILL.md (patterns to delete)

❌ **Skill with no preamble** — no session tracking, no learnings surface, blind to context
❌ **Instructions that say "consider doing X"** — skills give orders, not suggestions
❌ **Missing Completion Status** — leaves Claude and user without a clear signal
❌ **Model routing injected into CLAUDE.md** — use spec.yaml model_tier instead
❌ **Vendored skill copy in project repo** — use registry symlinks
❌ **Telemetry as optional afterthought** — always-run block, gated by config

---

## LEARN Layer (`learnings.jsonl`)

gstack's best invention. Auto-written by the runtime after every run. Never hand-edited.

### Schema

```jsonl
{"ts":"2026-06-10T16:31:33Z","skill":"skill-name","type":"operational","key":"SHORT_KEY","insight":"What happened and what to do instead","confidence":0.8,"source":"observed","project":"project-slug"}
```

**Types:**
- `operational` — command that failed, wrong approach, project quirk
- `sharp_edge` — a spec.yaml sharp_edge that actually fired
- `timing` — duration data for planning estimates
- `routing` — model_tier was wrong for this task (override signal)

**How skills surface learnings:**
```bash
# In preamble bash block:
_LEARN_FILE="${TFC_HOME:-$HOME/.future-code}/skills/${CATEGORY}/${SKILL_NAME}/learnings.jsonl"
if [ -f "$_LEARN_FILE" ]; then
  _LEARN_COUNT=$(wc -l < "$_LEARN_FILE" 2>/dev/null | tr -d ' ')
  echo "LEARNINGS: $_LEARN_COUNT entries loaded"
  if [ "$_LEARN_COUNT" -gt 3 ] 2>/dev/null; then
    tail -5 "$_LEARN_FILE" | jq -r '.insight' 2>/dev/null | head -3 || true
  fi
fi
```

**How skills write learnings (in Operational Self-Improvement section):**
```bash
echo '{"ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","skill":"SKILL_NAME","type":"operational","key":"SHORT_KEY","insight":"DESCRIPTION","confidence":0.8,"source":"observed","project":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo unknown)'"}' \
  >> "${TFC_HOME:-$HOME/.future-code}/skills/CATEGORY/SKILL_NAME/learnings.jsonl"
```

---

## ROUTE Layer (inside spec.yaml)

Neither spawner nor gstack fully nailed this. TFC does.

### Model tier routing

Declared in spec.yaml, honored by the runtime preamble:

```yaml
model_tier: sonnet    # default for this skill
```

The preamble reads `model_tier` and emits:
```
MODEL_TIER: sonnet
```
Claude reads this and adjusts reasoning depth accordingly (not model switching — behavioral signal).

### Skill chain routing

Level-gated in spec.yaml, emitted by the tier-0 hook (same mechanism as Kraken packs):

```yaml
skill_chain:
  - skill: realthink
    min_level: L3   # only fires when task is graded L3 or higher
```

When the hook grades the task at L3+, it emits:
```
→ SKILL-CHAIN [L3]: /realthink
```
Claude MUST invoke `Skill(skill:"realthink")` as its first tool call.

### Why CLAUDE.md injection is DEAD (gstack's bad pattern, deleted)

gstack's `## Skill routing` section in CLAUDE.md was:
- Manually maintained (drifts from actual skill availability)
- Project-specific (not portable)
- Non-machine-readable (can't be queried)
- A second source of truth (spec.yaml's `triggers` already does this job)

TFC routing: spec.yaml `triggers` → spawner index → tier-0 hook emission. One source, always current.

---

## What TFC Deletes (the decisive NO)

### From Spawner (kept the good, cut the bad)

| Kept | Deleted | Why deleted |
|------|---------|-------------|
| spec.yaml YAML structure | Skills with no SKILL.md | Discovery-only ghosts — useless at L3+ |
| triggers array | Vague triggers that collide | "build" matches 200 skills; be specific |
| sharp_edges | Sharp edges without `solution` | A warning without a fix is noise |
| pairs_with | — | Kept entirely — best spawner pattern |
| validations.yaml | — | Kept for complex skills |

### From gstack (kept the good, cut the bad)

| Kept | Deleted | Why deleted |
|------|---------|-------------|
| Preamble bash block | CLAUDE.md routing injection | spec.yaml triggers replaces it |
| learnings.jsonl loop | Vendoring in project repos | Registry symlinks replace it |
| Completion Status Protocol | Model overlay YAML per-model | spec.yaml model_tier replaces it |
| Voice guidelines | Verbose feature-discovery prompts | Annoying after first time; gate it |
| Telemetry | Optional telemetry | Always-run, config-gated (opt-out not opt-in) |
| SKILL.md.tmpl + codegen | Build step as prerequisite | SKILL.md is primary; .tmpl is optional |
| Boil the Lake principle | — | Core philosophy, kept |
| Search Before Building | — | Core philosophy, kept |

---

## The Unified Preamble (standard block all TFC skills share)

Every TFC skill's SKILL.md starts with this:

```bash
# TFC Preamble v1 — runs before any skill logic
_TFC_HOME="${TFC_HOME:-$HOME/.future-code}"
_SKILL_ID="SKILL_ID_PLACEHOLDER"
_SKILL_CAT="CATEGORY_PLACEHOLDER"
_SESSION_ID="$$-$(date +%s)"
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
_PROJECT=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")

# Load model tier from spec
_MODEL_TIER=$(grep 'model_tier:' "$_TFC_HOME/skills/$_SKILL_CAT/$_SKILL_ID/spec.yaml" 2>/dev/null | awk '{print $2}' || echo "sonnet")
echo "MODEL_TIER: $_MODEL_TIER"
echo "BRANCH: $_BRANCH | PROJECT: $_PROJECT | SESSION: $_SESSION_ID"

# Surface recent learnings
_LEARN_FILE="$_TFC_HOME/skills/$_SKILL_CAT/$_SKILL_ID/learnings.jsonl"
if [ -f "$_LEARN_FILE" ]; then
  _LC=$(wc -l < "$_LEARN_FILE" 2>/dev/null | tr -d ' ')
  echo "LEARNINGS: $_LC entries"
  [ "$_LC" -gt 0 ] && tail -3 "$_LEARN_FILE" 2>/dev/null | python3 -c "import sys,json;[print('  •',json.loads(l)['insight'][:120]) for l in sys.stdin if l.strip()]" 2>/dev/null || true
else
  echo "LEARNINGS: 0"
fi

# Check for skill updates (non-blocking)
_SPEC_VER=$(grep '^version:' "$_TFC_HOME/skills/$_SKILL_CAT/$_SKILL_ID/spec.yaml" 2>/dev/null | awk '{print $2}')
echo "SKILL_VERSION: ${_SPEC_VER:-unknown}"
```

---

## Example: Converting a Spawner Skill to TFC

**Before (spawner-only):** `~/.spawner/skills/ai/ai-code-generation/skill.yaml`
- Has: id, triggers, provides, patterns (code examples), sharp_edges
- Missing: SKILL.md, preamble, learnings loop, model routing, telemetry

**After (TFC):** `~/.future-code/skills/ai/ai-code-generation/`
```
spec.yaml         ← the existing skill.yaml, with model_tier + skill_chain added
SKILL.md          ← new — TFC preamble + the `patterns` section as executable workflow
learnings.jsonl   ← auto-created on first run
validations.yaml  ← from existing validations.yaml if present
```

**What changes in spec.yaml:** Add `model_tier: sonnet`, add `skill_chain: []`, convert `patterns` to `provides` (patterns become SKILL.md workflow content).

---

## Example: Converting a gstack Skill to TFC

**Before (gstack-only):** `~/.claude/skills/gstack/investigate/SKILL.md`
- Has: preamble, workflow, learnings, telemetry, voice
- Missing: spec.yaml, machine-readable triggers, model_tier declaration, composition graph

**After (TFC):** `~/.future-code/skills/dev/investigate/`
```
spec.yaml         ← new — extract triggers from CLAUDE.md routing table, add sharp_edges
SKILL.md          ← existing SKILL.md, preamble updated to TFC standard
learnings.jsonl   ← existing ~/.gstack/projects/*/learnings.jsonl entries, migrated
validations.yaml  ← optional, add if complexity warrants
```

---

## Discovery: How spawner_skills Works with TFC

The spawner registry reads `~/.spawner/skills/` today. TFC skills at `~/.future-code/skills/`
need to be indexed. Two options:

**Option A: Symlink (recommended for now)**
```bash
# Register a TFC skill into spawner's index
ln -s ~/.future-code/skills/ai/ai-code-generation ~/.spawner/skills/ai/ai-code-generation-tfc
```
Spawner reads the spec.yaml from the symlinked path — it's the same format.

**Option B: TFC CLI (future)**
```bash
tfc register ~/.future-code/skills/ai/ai-code-generation
# Adds to ~/.spawner/registry.yaml, updates triggers index
```

---

## Invocation: How Skill("X") Works with TFC

Claude Code's `Skill(skill:"X")` looks up `~/.claude/skills/X/SKILL.md`.
TFC skills need a symlink in the Claude skills directory:

```bash
# Register TFC skill for Claude Code invocation
ln -s ~/.future-code/skills/ai/ai-code-generation/SKILL.md \
      ~/.claude/skills/ai-code-generation/SKILL.md
```

Or use the TFC install script:
```bash
tfc install ai/ai-code-generation   # creates symlink, registers in spawner
```

---

## Installing a TFC Skill

Two registrations are required for a skill to be fully operational.

```bash
# Step 1: Register for Claude Code invocation (Skill("name") lookup)
#          Claude Code reads ~/.claude/skills/{name}/SKILL.md
mkdir -p ~/.claude/skills/{name}
ln -s ~/.future-code/skills/{category}/{name}/SKILL.md \
      ~/.claude/skills/{name}/SKILL.md

# Step 2: Register for spawner indexing (spawner_skills search)
#          Spawner reads spec.yaml from the symlinked directory
ln -s ~/.future-code/skills/{category}/{name} \
      ~/.spawner/skills/{category}/{name}-tfc
```

Both steps in one block (set CATEGORY and NAME first):

```bash
CATEGORY=ai
NAME=ai-code-generation

mkdir -p ~/.claude/skills/$NAME
ln -s ~/.future-code/skills/$CATEGORY/$NAME/SKILL.md ~/.claude/skills/$NAME/SKILL.md
ln -s ~/.future-code/skills/$CATEGORY/$NAME ~/.spawner/skills/$CATEGORY/$NAME-tfc
```

Verify both registrations:

```bash
ls -la ~/.claude/skills/$NAME/SKILL.md           # symlink → ~/.future-code/...
ls -la ~/.spawner/skills/$CATEGORY/$NAME-tfc     # symlink → ~/.future-code/...
spawner_skills search "$NAME"                    # should show skill in results
```

A skill with only Step 1 can be invoked but not discovered. A skill with only Step 2 can be discovered but not invoked. Both steps are required.

---

## Quality Gates (validations.yaml)

For skills rated `complexity: high` or `model_tier: opus`, add `validations.yaml`:

```yaml
version: 1.0.0
skill_id: skill-name

validations:
  - id: preamble-runs
    check: "SKILL.md contains '## Preamble (run first)'"
    severity: blocking
    message: "TFC preamble is mandatory"

  - id: required-sections-present
    check: "SKILL.md contains all sections listed in spec.yaml required_sections"
    severity: blocking
    message: "Required sections missing — MNEP not satisfied"

  - id: learnings-writeback
    check: "SKILL.md contains learnings.jsonl write command"
    severity: warning
    message: "Operational self-improvement loop missing"

  - id: voice-compliance
    check: "SKILL.md does not contain: em dash, 'delve', 'crucial', 'robust', 'comprehensive', 'nuanced', 'multifaceted'"
    severity: warning
    message: "Voice guideline violations found"

  - id: triggers-specific
    check: "spec.yaml triggers have no entry shorter than 4 words"
    severity: warning
    message: "Vague triggers cause routing collisions"
```

---

## TFC vs Spawner vs gstack: Decision Matrix

| Need | Use |
|------|-----|
| Find a skill by topic | `spawner_skills(search="...")` — reads TFC spec.yaml triggers |
| Invoke a skill | `Skill(skill:"X")` — reads TFC SKILL.md |
| Check what a skill owns | TFC spec.yaml `owns` array |
| Chain skills together | TFC spec.yaml `pairs_with` + `skill_chain` |
| See what went wrong last time | TFC learnings.jsonl (auto-surfaced in preamble) |
| Override model for this task | Set `model_tier` in spec.yaml (not CLAUDE.md) |
| Add a gotcha warning | TFC spec.yaml `sharp_edges` |
| Run quality gates | TFC validations.yaml |
| Create a new skill | Copy `~/.future-code/skills/_template/` |
| Migrate a spawner skill | Add SKILL.md + update spec.yaml `model_tier` |
| Migrate a gstack skill | Add spec.yaml + move CLAUDE.md routing to triggers |

---

## The Philosophy (inherited from both systems, synthesized)

### From gstack's Boil the Lake
> When AI makes marginal cost near-zero, do the complete thing every time.
> A TFC skill with 90% coverage is not a skill — it's a draft.

### From spawner's composition model
> Skills are not islands. Every skill should know what it pairs with and why.
> `pairs_with` is not a suggestion — it's a composition contract.

### TFC's addition: The Learning Loop is Non-Optional
> A skill that doesn't learn from its runs is frozen at its initial quality.
> `learnings.jsonl` is not a log — it's the mechanism by which skills improve
> without being rewritten. After 10 runs, a TFC skill should be measurably
> better than after run 1.

### The Decisive Voice (from gstack, mandatory in TFC)
> Direct, concrete, builder-to-builder. Name the file, function, command.
> No em dashes. No AI vocabulary. Short paragraphs. End with what to do.
> The user has context you do not. Cross-model agreement is a recommendation.
> The user decides.

---

## Migration Roadmap

### Phase 1 — Foundation (now)
- [ ] `~/.future-code/skills/_template/` — the canonical template (built in this session)
- [ ] `~/.future-code/THE_FUTURE_CODE.md` — this document
- [ ] Pick 3 high-value spawner skills, add SKILL.md → migrate to TFC
- [ ] Pick 3 gstack skills, add spec.yaml → migrate to TFC

### Phase 2 — Wiring (next session)
- [ ] `tfc` CLI: `tfc install`, `tfc register`, `tfc validate`, `tfc new`
- [ ] TFC preamble as a shared bash include (not copy-pasted per skill)
- [ ] Spawner registry indexing of TFC skills
- [ ] Claude Code symlink automation

### Phase 3 — Migration (ongoing)
- [ ] Priority: P04 (debug), P05 (build), P07 (research) skills — migrate to TFC
- [ ] gstack QA, ship, investigate, review skills — add spec.yaml
- [ ] Spawner top-50 by search hits — add SKILL.md
- [ ] Retire the split: all NEW skills must be TFC from day one

### Phase 4 — The Network Effect
- [ ] `spawner_validate` validates TFC format (not just spawner YAML)
- [ ] `Skill(skill:"X")` falls through to spawner registry if not in `~/.claude/skills/`
- [ ] learnings.jsonl surfaced in tier-0 hook for matching skills
- [ ] TFC skills can declare `model_tier: opus` and the hook emits the right routing signal

---

## Files in This Repo

```
~/.future-code/
├── THE_FUTURE_CODE.md           ← this document (the spec)
├── docs/
│   ├── spawner-comparison.md    ← what TFC keeps vs deletes from spawner
│   ├── gstack-comparison.md     ← what TFC keeps vs deletes from gstack
│   └── migration-guide.md       ← step-by-step migration for each system
├── runtime/
│   ├── preamble.sh              ← shared TFC preamble (source this, don't copy)
│   └── learnings-log.sh         ← TFC learnings write helper
└── skills/
    └── _template/
        ├── spec.yaml            ← canonical spec template
        ├── SKILL.md             ← canonical executable template
        └── validations.yaml     ← canonical quality gates template
```
