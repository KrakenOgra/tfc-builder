# TFC Intelligence Context Guide
# Agent Action Doc — From Skill Shell to Domain Expert Brain
# Score: intent → execution. Read with /kraken-flow, then act.

---

## AT SESSION START — MANDATORY

**Before reading anything else in this doc, invoke `/kraken-flow`.**

Say exactly: `/kraken-flow "I am about to migrate spawner skills to TFC format and need to preserve all intelligence context — identity, principles, patterns, anti-patterns, handoffs. Think hard on what gets lost, what goes where, and plan the migration wave."`

The kraken-flow GROUND gate will surface the real constraint before you touch any file.
Do not skip this. A skill migration that ignores the GROUND gate will produce a prettier
shell around a dumber agent.

---

## THE PROBLEM — Grounded

**What spawner carries (reading accessibility-design/skill.yaml and angular/skill.yaml):**

A spawner skill.yaml is not a config file. It is a compressed domain expert with six
distinct intelligence layers:

| Layer | Field | What it carries | Lines in angular |
|-------|-------|-----------------|-----------------|
| Expert persona | `identity:` | First-person hard-won lessons, failure modes survived | 14 lines |
| Domain philosophy | `principles:` | 7 non-negotiable behavioral constraints | 7 lines |
| Known-good recipes | `patterns:` | Named patterns with `when:` + full working `example:` | ~200 lines |
| Battle scars | `anti_patterns:` | Named failure modes with root cause `why:` + exact `instead:` fix | ~130 lines |
| Boundary contracts | `does_not_own:` + `handoffs:` | What NOT to do, where to route, what to pass/receive | 20 lines |
| Quick action | `quick_wins:` | 10 immediate actions with zero ambiguity | 10 lines |

**What the current TFC SKILL.md template carries:**

- Preamble (session state, model tier, learnings surface)
- Workflow phases (steps to follow)
- Sharp Edges (2-3 bullet gotchas)
- Voice guidelines
- Completion Status Protocol
- Telemetry

**What is lost during migration:**

All six intelligence layers. Every named pattern, every anti-pattern with its root cause,
the expert persona, the domain principles, the handoff contracts. A TFC-migrated Angular
skill tells Claude "how to run the workflow" but not "how to think like an Angular expert."

That is the crux.

---

## THE DECISION — Where Each Intelligence Layer Lives

TFC axiom: "spec.yaml is the address. SKILL.md is the building."

| Intelligence Layer | Goes in | Reason |
|-------------------|---------|--------|
| `identity:` | SKILL.md `## Identity` | HOW the agent thinks — executable context |
| `principles:` | SKILL.md `## Principles` | Behavioral constraints the agent applies |
| `patterns:` | SKILL.md `## Patterns` | Named recipes the agent executes from |
| `anti_patterns:` | SKILL.md `## Anti-Patterns` | Named battle scars the agent avoids |
| `quick_wins:` | SKILL.md `## Quick Wins` | Immediate action list |
| `handoffs:` (context) | SKILL.md `## Handoffs` | What to provide and receive |
| `handoffs:` (routing) | spec.yaml `pairs_with:` + `does_not_own:` | Already covered — machine-readable routing |
| `stack:` | SKILL.md `## Stack Reference` | Tool inventory the agent references at runtime |
| `does_not_own:` | spec.yaml `does_not_own:` | Add this field to spec.yaml template |

---

## THE UPDATED SKILL.md TEMPLATE — New Intelligence Sections

Add these sections to `~/.future-code/skills/_template/SKILL.md`.

**Order in file (after preamble, before workflow):**

```
## Identity          ← WHO the agent is
## Principles        ← HOW the agent thinks
## [Skill Workflow]  ← WHAT the agent does (existing)
## Patterns          ← KNOWN-GOOD recipes
## Anti-Patterns     ← BATTLE SCARS
## Quick Wins        ← IMMEDIATE actions
## Handoffs          ← WHERE work goes next
## Stack Reference   ← TOOLS the agent uses
## Sharp Edges       ← GOTCHAS (existing, move here)
## Voice             ← existing
## Completion Status ← existing
## Operational Self-Improvement ← existing
## Telemetry         ← existing
```

### Section Templates (exact markdown to add to _template/SKILL.md)

```markdown
## Identity

You are [role with hard-won context]. You have [specific experience that shapes judgment].

Your hard-won lessons: [a specific failure you've seen — "The team that X couldn't Y"].
[Another lesson]. [A third]. These are not opinions — they are observations from
watching real projects succeed and fail on these exact decisions.

You advocate for [current best practice]. You respect [the legacy pattern] because
[why it still matters in real projects].

---

## Principles

Non-negotiable behavioral constraints. Apply every time, no exceptions:

1. "[Principle as an imperative statement]"
2. "[Principle as an imperative statement]"
3. "[Principle as an imperative statement]"
4. "[Principle as an imperative statement]"
5. "[Principle as an imperative statement]"

Add more as the skill's domain demands. Each principle must be a constraint, not a preference.

---
```

```markdown
## Patterns

Named, tested solutions. Each has a name, a `When:`, and a working example.
When the situation matches, use the pattern — do not invent a new approach.

### [Pattern Name]

**When:** [specific situation — not "always", not "sometimes"]

**Why this works:** [one sentence root cause]

```[language]
# BAD: [label — what not to do]
[bad code]

# GOOD: [label — what to do]
[good code]
```

Key rule: [one sentence that captures the decision gate for this pattern].

### [Second Pattern Name]

**When:** [specific situation]

**Why this works:** [root cause]

[example code]

---
```

```markdown
## Anti-Patterns

Named failure modes with root cause and exact fix. When you see the signal, name it
and apply the instead.

### [Anti-Pattern Name]

**Signal:** [what you see in the code/request that identifies this]

**Why it fails:** [root cause — what assumption is violated, what breaks at scale]

**Instead:**

```[language]
// WRONG
[bad code]

// RIGHT
[good code]
```

### [Second Anti-Pattern Name]

**Signal:** [observable identifier]

**Why it fails:** [root cause]

**Instead:** [fix]

---
```

```markdown
## Quick Wins

Immediate actions that unblock progress. Zero ambiguity. Each is completable in under
15 minutes and produces visible improvement.

- "[Concrete action — verb + object + expected outcome]"
- "[Concrete action]"
- "[Concrete action]"

---
```

```markdown
## Handoffs

What this skill passes to other skills and what it receives.

### Provides to

| Receives | When | What to pass |
|----------|------|-------------|
| [skill-name] | [trigger condition] | [what you hand over, specifically] |

### Receives from

| From | When | What arrives |
|------|------|-------------|
| [skill-name] | [trigger condition] | [what they hand you, specifically] |

### Does NOT own

Route these elsewhere immediately. Do not attempt:

- [scope] → [skill-id that owns it]
- [scope] → [skill-id that owns it]

---
```

```markdown
## Stack Reference

Tools this skill uses. Current as of spec.yaml `version:`.

| Tool | Version | When | Note |
|------|---------|------|------|
| [tool-name] | [version] | [when to use] | [hard-won note] |

---
```

---

## THE MIGRATION PROTOCOL — Intelligence Preservation

When migrating a spawner skill.yaml to TFC, apply this checklist in order.

### Step 1 — Read the source

```bash
cat ~/.spawner/skills/{category}/{name}/skill.yaml | less
# Or for vibeship-x-kraken skills:
cat ~/vibeship-x-kraken/skills/{category}/{name}/skill.yaml | less
```

Identify which intelligence layers exist. Not all skills have all layers. Mark what's present:
- [ ] `identity:` present
- [ ] `principles:` present
- [ ] `patterns:` present (count: ___)
- [ ] `anti_patterns:` present (count: ___)
- [ ] `handoffs:` present
- [ ] `quick_wins:` present
- [ ] `stack:` present
- [ ] `does_not_own:` present

### Step 2 — Extract identity

Copy the `identity:` block into `## Identity` in SKILL.md.

Do NOT copy verbatim if it uses AI vocabulary (delve, crucial, robust, comprehensive,
nuanced, multifaceted) or em dashes in prose. Rewrite in TFC voice: direct, concrete,
builder-to-builder. Keep the hard-won lessons — they are the most valuable part.

**The hard-won lessons are the battle scars.** They are the reason the identity section
exists. If the original has "The team that X couldn't Y" or "I've seen Z happen when..."
— preserve that. That is the calibration signal for the agent.

### Step 3 — Extract principles

Copy `principles:` as numbered list in `## Principles`. Each principle must read as
an imperative ("Use X before Y", "Always do Z", "Never A without B").

If the original has declarative principles ("Accessibility is a prerequisite") rewrite
as imperative ("Treat accessibility as a prerequisite — not a checklist added at the end").

### Step 4 — Extract patterns

For each entry in `patterns:`, create a `### [Name]` subsection with:

- **When:** from the `when:` field
- **Why this works:** inferred from the pattern — write one sentence if missing
- The `example:` block as-is (it already has BAD/GOOD markers)
- A key rule: pull the most important sentence from the description

Do not collapse patterns into bullet points. Each pattern is a named recipe.
A bullet point is a hint. A named pattern with an example is a repeatable solution.

### Step 5 — Extract anti-patterns

For each entry in `anti_patterns:`, create a `### [Name]` subsection with:

- **Signal:** the observable code/behavior that identifies this — from the description
- **Why it fails:** the `why:` field — keep the root cause reasoning, not just the conclusion
- **Instead:** the `instead:` field as a code block

The `why:` field is the most important part. It's what lets the agent recognize the
pattern in new situations, not just copy-paste the fix.

### Step 6 — Extract handoffs and does_not_own

- `handoffs:` (both `to:` entries and `receives_from:`) → `## Handoffs` section
- `does_not_own:` → add to `## Handoffs` under "Does NOT own" subsection
- Routing metadata (skill-id references) → also update spec.yaml `pairs_with:`

### Step 7 — Extract quick wins

Copy `quick_wins:` as bulleted list in `## Quick Wins`. Rewrite any that are vague:
"Ensure all images have alt text" → "Run `find . -name '*.html' | xargs grep '<img' | grep -v alt=` and add alt attributes to every result".

### Step 8 — Extract stack

Copy `stack:` as a `## Stack Reference` table. Add `when` and `note` from the source.

### Step 9 — Update spec.yaml

Add the `does_not_own:` field if it exists in the source skill.yaml:

```yaml
does_not_own:
  - visual-design-aesthetics -> ui-design   # format: scope -> skill-id
  - user-research-methodology -> ux-design
```

This belongs in spec.yaml because it is machine-readable routing metadata.

### Step 10 — Verify intelligence survived

Run this mental check: if a developer asks the TFC-migrated skill "what's the
single most important thing to know about [domain]?" — does the agent answer from
its `## Identity` and `## Principles` sections without being prompted? If yes, the
intelligence survived. If the agent gives a generic answer, the migration failed.

---

## QUALITY GATES — Intelligence Checklist

Before calling a migration complete:

- [ ] `## Identity` present and contains hard-won lessons (not just job description)
- [ ] `## Principles` present and each principle is an imperative (not a preference)
- [ ] `## Patterns` has named patterns (not bullets) — each with When + Example
- [ ] `## Anti-Patterns` has named anti-patterns (not bullets) — each with Why + Fix
- [ ] `## Quick Wins` present with zero-ambiguity actions
- [ ] `## Handoffs` present with at least one "Does NOT own" entry
- [ ] spec.yaml `does_not_own:` field added if source had it
- [ ] No pattern or anti-pattern collapsed to a bullet point
- [ ] Identity hard-won lessons are specific (name a failure, not a platitude)
- [ ] Voice clean: no em dashes, no AI vocabulary

**The intelligence density test:** Count named patterns + anti-patterns in source skill.yaml.
Count named patterns + anti-patterns in migrated SKILL.md. They must match (one-to-one).
If count decreased, you collapsed patterns to bullets. Undo that.

---

## APPLY THE TEMPLATE UPDATE — Action Steps

These are the immediate file edits this doc requires.

### Action 1 — Update `_template/SKILL.md`

Add the 6 intelligence sections to `~/.future-code/skills/_template/SKILL.md` in this
order (after preamble, before existing workflow section):

1. `## Identity`
2. `## Principles`

And after the workflow sections, before Sharp Edges:

3. `## Patterns`
4. `## Anti-Patterns`
5. `## Quick Wins`
6. `## Handoffs`
7. `## Stack Reference`

### Action 2 — Update `_template/spec.yaml`

Add `does_not_own:` field after `owns:`:

```yaml
does_not_own:
  # - scope-slug -> owning-skill-id    # what this skill explicitly does NOT own
  # - another-scope -> another-skill
```

### Action 3 — Update `docs/migration-guide.md`

Add Step 3a (intelligence extraction) to both Pattern A and Pattern B checklists in the
migration guide. Reference this doc.

### Action 4 — Run Pilot 1 with intelligence

When executing `~/.spawner/skills/ai/ai-code-generation/` migration, apply this protocol
to extract and preserve all intelligence layers before the standard Pattern A checklist.
The intelligence migration happens BEFORE the symlink installation — you need the
content right before you make it live.

---

## THE TELL — How to Know It Worked

Load the migrated skill and run this test without prompting the agent:

**For a code-generation skill:** Ask "should I use async/await or promises?" — a
skill with `## Anti-Patterns` for callback hell and `## Patterns` for async patterns
will answer with specific named advice. A skill without them will hedge.

**For a design skill:** Ask "is this a11y concern critical?" — a skill with
`## Principles` from the accessibility skill.yaml will answer "yes, always — inaccessible
design is broken design" not "it depends on your requirements."

**For any skill:** Ask "what should I NOT do here?" — a skill with `## Anti-Patterns`
and `## Does NOT own` will name them specifically. A skill without them will say
"it depends."

If the agent's answer is specific, named, and grounded in the skill's domain — the
intelligence survived migration.

---

## VOICE RULE (applies to all intelligence sections)

Direct, concrete, builder-to-builder. Hard-won lessons name a real failure:

- Bad: "Testing is important for reliability"
- Good: "The team that put business logic in components couldn't test anything"

Anti-patterns name the root cause:

- Bad: "Don't use manual subscriptions" 
- Good: "Every subscribe needs an unsubscribe. Forget one, you have a memory leak.
  Components with multiple subscriptions become a maintenance nightmare."

Principles are imperatives, not preferences:

- Bad: "Consider using OnPush change detection"
- Good: "Use OnPush change detection on all presentational components — default
  change detection checks every component on every event, which breaks at scale"
