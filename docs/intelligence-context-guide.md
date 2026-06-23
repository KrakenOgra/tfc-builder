# TFC Intelligence Context Guide
# From Skill Shell to Domain Expert Brain

---

## The uncomfortable truth

You can migrate a skill perfectly — right format, all four files, validation passing, score at 72 — and have a worse agent than you started with.

Here's what happens: you convert the YAML structure, move the workflow steps, write a clean SKILL.md. The skill validates. You install it. You use it. And it hedges. It gives generic answers. It says "it depends" instead of naming the pattern. It misses the thing that makes a domain expert different from a well-prompted assistant.

What you lost was the intelligence. Not the structure — the intelligence. The named patterns with their "when" and root causes. The anti-patterns with their "why it fails" explained. The hard-won lessons in the identity section that say "the team that X couldn't Y." That is calibration. That is what makes the agent behave like a domain expert instead of a generic workflow runner.

An existing skill.yaml is not a config file. It is a compressed domain expert with six distinct intelligence layers. When you migrate it, you are transplanting that expert's brain into a new container. Done wrong, the container validates and the brain is gone.

---

## What an existing skill actually carries

Reading any production skill.yaml reveals the layers:

| Layer | Field | What it carries | Lines in a typical skill |
|-------|-------|-----------------|--------------------------|
| Expert persona | `identity:` | First-person hard-won lessons, failure modes survived | 10–20 lines |
| Domain philosophy | `principles:` | Non-negotiable behavioral constraints | 5–10 lines |
| Known-good recipes | `patterns:` | Named patterns with `when:` + full working `example:` | 50–200+ lines |
| Battle scars | `anti_patterns:` | Named failure modes with root cause `why:` + exact `instead:` fix | 50–150+ lines |
| Boundary contracts | `does_not_own:` + `handoffs:` | What NOT to do, where to route, what to pass/receive | 10–25 lines |
| Quick action | `quick_wins:` | Immediate actions with zero ambiguity | 5–15 lines |

**What a basic TFC SKILL.md template carries without the intelligence sections:**
Preamble, workflow phases, sharp edges, voice guidelines, completion status, telemetry.

Every intelligence layer is missing. The skill tells Claude "how to run the workflow" but not "how to think like a domain expert."

That is the crux.

---

## Where each intelligence layer goes

TFC axiom: "spec.yaml is the address. SKILL.md is the building."

| Intelligence Layer | Goes in | Reason |
|-------------------|---------|--------|
| `identity:` | SKILL.md `## Identity` | HOW the agent thinks — executable context |
| `principles:` | SKILL.md `## Principles` | Behavioral constraints the agent applies |
| `patterns:` | SKILL.md `## Patterns` | Named recipes the agent executes from |
| `anti_patterns:` | SKILL.md `## Anti-Patterns` | Named battle scars the agent avoids |
| `quick_wins:` | SKILL.md `## Quick Wins` | Immediate action list |
| `handoffs:` (context) | SKILL.md `## Handoffs` | What to provide and receive |
| `handoffs:` (routing) | spec.yaml `pairs_with:` + `does_not_own:` | Machine-readable routing |
| `stack:` | SKILL.md `## Stack Reference` | Tool inventory at runtime |
| `does_not_own:` | spec.yaml `does_not_own:` | Add this field to spec.yaml |

---

## The updated SKILL.md section order

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

### Section templates (exact markdown)

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

Each principle must be a constraint, not a preference.

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

---
```

```markdown
## Anti-Patterns

Named failure modes with root cause and exact fix. When you see the signal, name it
and apply the fix.

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

---
```

```markdown
## Quick Wins

Immediate actions that unblock progress. Zero ambiguity. Each completable in under 15 minutes.

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

## The migration protocol — intelligence preservation

When migrating an existing skill.yaml to TFC, apply this checklist in order.

### Step 1 — Read the source

```bash
cat {source-path}/{category}/{name}/skill.yaml | less
```

Identify which intelligence layers exist. Mark what's present:
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

Do NOT copy verbatim if it uses AI vocabulary (delve, crucial, robust, comprehensive, nuanced, multifaceted) or em dashes in prose. Rewrite in TFC voice: direct, concrete, builder-to-builder.

**Keep the hard-won lessons — they are the most valuable part.** If the original has "The team that X couldn't Y" or "I've seen Z happen when..." — preserve that exactly. That is the calibration signal. It is why the identity section exists.

### Step 3 — Extract principles

Copy `principles:` as a numbered list in `## Principles`. Each principle must read as an imperative: "Use X before Y", "Always do Z", "Never A without B".

If the original has declarative principles ("Accessibility is a prerequisite"), rewrite as imperative: "Treat accessibility as a prerequisite — not a checklist added at the end".

### Step 4 — Extract patterns

For each entry in `patterns:`, create a `### [Name]` subsection with:
- **When:** from the `when:` field
- **Why this works:** inferred from the pattern — write one sentence if missing
- The `example:` block as-is (already has BAD/GOOD markers)
- A key rule: the most important sentence from the description

Do not collapse patterns into bullet points. A bullet point is a hint. A named pattern with an example is a repeatable solution.

### Step 5 — Extract anti-patterns

For each entry in `anti_patterns:`, create a `### [Name]` subsection with:
- **Signal:** the observable code/behavior that identifies this
- **Why it fails:** the `why:` field — keep the root cause reasoning, not just the conclusion
- **Instead:** the `instead:` field as a code block

The `why:` field is the most important part. It's what lets the agent recognize the pattern in new situations, not just copy-paste the fix.

### Step 6 — Extract handoffs and does_not_own

- `handoffs:` (both `to:` and `receives_from:`) → `## Handoffs` section
- `does_not_own:` → `## Handoffs` under "Does NOT own" subsection
- Routing metadata (skill-id references) → also update spec.yaml `pairs_with:`

### Step 7 — Extract quick wins

Copy `quick_wins:` as bulleted list in `## Quick Wins`. Rewrite any that are vague:
- Vague: "Ensure all images have alt text"
- Specific: "Run `find . -name '*.html' | xargs grep '<img' | grep -v alt=` and add alt attributes to every result"

### Step 8 — Extract stack

Copy `stack:` as a `## Stack Reference` table. Add `when` and `note` columns from the source.

### Step 9 — Update spec.yaml

Add the `does_not_own:` field if it exists in the source:

```yaml
does_not_own:
  - visual-design-aesthetics -> ui-design   # format: scope -> skill-id
  - user-research-methodology -> ux-design
```

### Step 10 — Verify intelligence survived

Mental check: if a developer asks the migrated skill "what's the single most important thing to know about [domain]?" — does the agent answer from its `## Identity` and `## Principles` sections without being prompted?

If yes, the intelligence survived. If the agent gives a generic answer, the migration failed.

---

## Quality gates — intelligence checklist

Before calling a migration complete:

- [ ] `## Identity` present with hard-won lessons (not just a job description)
- [ ] `## Principles` with imperative constraints (not preferences)
- [ ] `## Patterns` has named patterns (not bullets) — each with When + Example
- [ ] `## Anti-Patterns` has named anti-patterns (not bullets) — each with Why + Fix
- [ ] `## Quick Wins` with zero-ambiguity actions
- [ ] `## Handoffs` with at least one "Does NOT own" entry
- [ ] spec.yaml `does_not_own:` field added if source had it
- [ ] No pattern or anti-pattern collapsed to a bullet point
- [ ] Identity hard-won lessons are specific — name a real failure, not a platitude
- [ ] Voice clean: no em dashes, no AI vocabulary

**The count test:** Named patterns + anti-patterns in source must equal named patterns + anti-patterns in migrated SKILL.md. Any decrease means you collapsed content. Undo it.

---

## How to know it worked

Load the migrated skill and run this test:

**For a code-generation skill:** Ask "should I use async/await or promises?" — a skill with `## Anti-Patterns` for callback hell and `## Patterns` for async patterns will answer with specific named advice. A skill without them will hedge.

**For a design skill:** Ask "is this a11y concern critical?" — a skill with `## Principles` will answer "yes, always — inaccessible design is broken design". A skill without them will say "it depends on your requirements."

**For any skill:** Ask "what should I NOT do here?" — a skill with `## Anti-Patterns` and `## Does NOT own` will name them specifically. A skill without them will say "it depends."

Specific, named, grounded in the domain — the intelligence survived. Generic, hedging, "it depends" — the migration failed.

---

## Voice rule (applies to all intelligence sections)

Direct, concrete, builder-to-builder. Hard-won lessons name a real failure:

- Bad: "Testing is important for reliability"
- Good: "The team that put business logic in components couldn't test anything"

Anti-patterns name the root cause:

- Bad: "Don't use manual subscriptions"
- Good: "Every subscribe needs an unsubscribe. Forget one, you have a memory leak. Components with multiple subscriptions become a maintenance nightmare."

Principles are imperatives, not pDocumentation
Doc	What's in it
Quickstart	Up and running in 5 minutes
How to Use	Full walkthrough of all 32 tools
When to Use	Decision guide — which tool, which situation
Architecture	How TFC works under the hood
What is TFC	The philosophy and format in depth
Migration Guide	Migrate your existing skills to TFC
Intelligence Context Guide	Writing SKILL.md sections that workreferences:

- Bad: "Consider using OnPush change detection"
- Good: "Use OnPush change detection on all presentational components — default change detection checks every component on every event, which breaks at scale"
