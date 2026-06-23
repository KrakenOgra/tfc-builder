# tfc-builder — Tool Reference

One section per tool. Each section covers: input schema, output shape, one example MCP call, and the named failure codes that can come back.

Failure envelope: `{ ok: false, error: { code: string, message: string, hint?: string } }`

Named codes used across tools:
- `BAD_INPUT` — zod parse failed or slug validation failed
- `NOT_FOUND` — skill dir or source file does not exist
- `EXISTS` — dir already exists (scaffold guard)
- `VALIDATION_FAILED` — blocking validation gates failed; message lists which gate ids
- `LINK_CONFLICT` — symlink at target path points to wrong target
- `INCOMPLETE_SWAP` — token placeholder remained after scaffold (template drift)
- `PATH_ESCAPE` — path segment contains `..`, a leading `/`, or null byte
- `UNKNOWN_TOOL` — tool name not in registry

---

## tfc_new

Scaffold a new TFC skill directory from `_template/` with all placeholders swapped.

**Input**
```json
{
  "category": "ai-agents",
  "name": "prompt-engineer",
  "dryRun": false
}
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "dir": "~/.future-code/skills/ai-agents/prompt-engineer",
    "files": [
      "~/.future-code/skills/ai-agents/prompt-engineer/SKILL.md",
      "~/.future-code/skills/ai-agents/prompt-engineer/spec.yaml",
      "~/.future-code/skills/ai-agents/prompt-engineer/validations.yaml"
    ],
    "dryRun": false
  }
}
```

**Failure codes:** `BAD_INPUT`, `EXISTS`, `NOT_FOUND` (template missing), `INCOMPLETE_SWAP`

---

## tfc_brainstorm

Return a prompt-template for Claude to brainstorm Identity and Principles for a skill. No API key. Claude executes the template in-session.

**Input**
```json
{
  "category": "ai-agents",
  "name": "prompt-engineer",
  "intent": "write type-safe prompt templates for structured LLM output"
}
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "prompt": "# tfc_brainstorm — ...",
    "writeTargets": [
      { "file": "~/.future-code/skills/ai-agents/prompt-engineer/spec.yaml", "section": "description+triggers" },
      { "file": "~/.future-code/skills/ai-agents/prompt-engineer/SKILL.md", "section": "## Identity" },
      { "file": "~/.future-code/skills/ai-agents/prompt-engineer/SKILL.md", "section": "## Principles" }
    ]
  }
}
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`

---

## tfc_generate

Return a prompt-template for Claude to generate specific intelligence layers. No API key. Claude executes the template in-session.

**Input**
```json
{
  "category": "ai-agents",
  "name": "prompt-engineer",
  "layers": ["patterns", "anti-patterns"]
}
```

Valid layer values: `patterns`, `anti-patterns`, `quick-wins`, `handoffs`, `stack`

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "prompt": "# tfc_generate — Patterns ...",
    "writeTargets": [
      { "file": "...", "section": "## Patterns" },
      { "file": "...", "section": "## Anti-Patterns" }
    ]
  }
}
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`

---

## tfc_validate

Validate a TFC skill against its `validations.yaml` gates. Returns blocking, warning, and info gate results.

**Input**
```json
{
  "category": "ai-agents",
  "name": "prompt-engineer"
}
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "passed": true,
    "blocking": [
      { "id": "preamble-present", "severity": "blocking", "passed": true, "message": "..." }
    ],
    "warnings": [],
    "info": []
  }
}
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`, `PARSE_ERROR`

---

## tfc_score

Score a TFC skill 0-100 on intelligence density. Returns breakdown by section and exact gap list.

**Input**
```json
{
  "category": "ai-agents",
  "name": "prompt-engineer"
}
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "score": 72,
    "breakdown": {
      "identity": 15,
      "principles": 12,
      "patterns": 20,
      "antiPatterns": 15,
      "quickWins": 5,
      "handoffs": 5,
      "voiceClean": 0
    },
    "gaps": ["voice-em-dash: em dash found in Patterns section"]
  }
}
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`

---

## tfc_migrate

Migrate a spawner or gstack skill to TFC format. Reads source read-only. Returns an authoring prompt and a density contract (minimum named item count).

**Input**
```json
{
  "sourcePath": "~/.spawner/skills/ai-code-generation/skill.yaml",
  "sourceType": "spawner",
  "category": "ai-agents",
  "name": "code-reviewer",
  "dryRun": false
}
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "specFields": { "id": "code-reviewer", "triggers": ["..."] },
    "densityBaseline": { "patterns": 3, "antiPatterns": 2 },
    "authoringPrompt": "# tfc_migrate — ...",
    "writeTargets": [...],
    "layersFound": ["patterns", "anti-patterns"],
    "dryRun": false
  }
}
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`, `PATH_ESCAPE`

---

## tfc_install

Install a TFC skill: creates `~/.claude/skills/{name}/SKILL.md` and `~/.spawner/skills/{category}/{name}-tfc` symlinks. Validate-first gate: blocks on any blocking validation failure. Idempotent.

**Input**
```json
{
  "category": "ai-agents",
  "name": "prompt-engineer",
  "dryRun": false
}
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "claudeLink": "created",
    "spawnerLink": "created",
    "validated": true
  }
}
```

Link state values: `created`, `exists` (idempotent), `planned` (dryRun), `conflict`

**Failure codes:** `BAD_INPUT`, `VALIDATION_FAILED`, `LINK_CONFLICT`, `PATH_ESCAPE`

---

## tfc_register

Register a TFC skill in the spawner index without validating. Creates the `-tfc` spawner symlink only. Idempotent.

**Input**
```json
{
  "category": "ai-agents",
  "name": "prompt-engineer"
}
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "spawnerLink": "~/.spawner/skills/ai-agents/prompt-engineer-tfc",
    "hint": "Run: spawner_skills(action=\"search\", query=\"prompt-engineer\") to confirm discovery"
  }
}
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`, `LINK_CONFLICT`, `PATH_ESCAPE`

---

## tfc_list

List every installed TFC skill. Reports symlink health for both claude and spawner links.

**Input**
```json
{
  "brokenOnly": false
}
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "skills": [
      {
        "category": "ai-agents",
        "name": "prompt-engineer",
        "dir": "~/.future-code/skills/ai-agents/prompt-engineer",
        "claudeLinkState": "ok",
        "spawnerLinkState": "ok"
      }
    ]
  }
}
```

Link state values: `ok`, `missing`, `dangling` (target gone), `conflict` (wrong target)

---

## tfc_lane

Recompute a skill's EARNED evidence lane (`authored | eval_proven | evolution_proven`) purely from disk. Never trusts cached or asserted values.

**Input**
```json
{ "category": "ai-agents", "name": "prompt-engineer" }
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "lane": "eval_proven",
    "effectiveLane": "eval_proven",
    "reasons": [],
    "cacheDrift": false
  }
}
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`

---

## tfc_eval

Return a local prompt-template for Claude to evaluate a skill behaviorally against `evals.yaml` golden tasks. Claude executes the template and writes `eval-report.json`. No API key.

**Input**
```json
{ "category": "ai-agents", "name": "prompt-engineer", "live": false }
```

**Output** (success)
```json
{ "ok": true, "data": { "prompt": "# tfc_eval — ...", "source": "seeds" } }
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`

---

## tfc_evolve

Return a local prompt-template to fold ≥3 unconsumed learnings into the weakest SKILL.md sections, bump version, and re-eval. Refuses with `NOT_READY` if fewer than 3 unconsumed learnings exist (unless `force`). No API key.

**Input**
```json
{ "category": "ai-agents", "name": "prompt-engineer", "force": false, "dryRun": false }
```

**Output** (success)
```json
{ "ok": true, "data": { "prompt": "# tfc_evolve — ...", "learningsConsumed": 3 } }
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`, `NOT_READY` (< 3 unconsumed learnings)

---

## tfc_pack_bridge

Read-only: for each Kraken pack that declares a paired TFC skill and evidence floor (`min_lane`), recompute the skill's earned lane and flag pairings below their floor. Never edits `packs.yaml`.

**Input**
```json
{ "packsFile": "/optional/override/path/packs.yaml" }
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "pairs": [
      { "packId": "P05", "skill": "pattern/autovibe", "minLane": "eval_proven", "earnedLane": "eval_proven", "belowFloor": false }
    ]
  }
}
```

**Failure codes:** `NOT_FOUND` (packs.yaml missing)

---

## tfc_doctor

System health check: TFC home, MCP registration, dist freshness, skill symlinks, per-skill earned lanes with `cacheDrift`, `evalStale`, `evolvePending`, and INV-6 stray-state flags.

**Input**
```json
{}
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "home": "ok",
    "mcpRegistered": true,
    "distFresh": true,
    "skills": [
      { "id": "pattern/autovibe", "lane": "eval_proven", "cacheDrift": false, "evalStale": false }
    ]
  }
}
```

**Failure codes:** none (returns partial results with per-check status)

---

## tfc_compile

The intent front door. Turns a one-line job description into a prompt that makes Claude search-before-building, infer the archetype, and emit a `SkillCard` born with `lane: authored` and 3 eval seeds. No API key. Rejects inputs under 5 words.

**Input**
```json
{ "intent": "help founders write cold emails that get replies", "context": "B2B SaaS" }
```

**Output** (success)
```json
{ "ok": true, "data": { "prompt": "# tfc_compile — SkillCard Assignment\n..." } }
```

**Failure codes:** `BAD_INPUT` (intent < 5 words)

---

## tfc_capture

Wire the continuous learnings capture hook into a skill's `SKILL.md` so real invocations append to `learnings.jsonl`. With `audit: true`, returns a read-only portfolio of every skill's `learningsCount`, `runsCount`, `hookWired`, `neverInvoked`. Never writes a learning itself (INV-8).

**Input**
```json
{ "category": "ai-agents", "name": "prompt-engineer", "dryRun": false }
```

**Output** (success — audit mode)
```json
{
  "ok": true,
  "data": {
    "skills": [
      { "id": "pattern/autovibe", "learningsCount": 3, "runsCount": 7, "hookWired": true, "neverInvoked": false }
    ]
  }
}
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`

---

## tfc_relink

Repair missing or dangling skill symlinks. Recreates `~/.claude/skills` and `~/.spawner/skills` links. De-dups a byte-identical regular file into the canonical symlink. Never overwrites different-content files (returns in `conflicts`).

**Input**
```json
{ "category": "ai-agents", "name": "prompt-engineer", "dryRun": false }
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "repaired": ["~/.claude/skills/prompt-engineer"],
    "conflicts": [],
    "skipped": []
  }
}
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`

---

## tfc_decay

Read-only decay overlay. Compares a skill's proof timestamp against `freshness_horizon` in `spec.yaml`. If stale, the effective lane drops one rung (`evolution_proven → eval_proven → authored`). The earned on-disk lane is never modified.

**Input**
```json
{ "category": "ai-agents", "name": "prompt-engineer", "asOf": "2026-06-22" }
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "earnedLane": "eval_proven",
    "effectiveLane": "eval_proven",
    "proofAge": "14d",
    "verdict": "fresh"
  }
}
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`

---

## tfc_replay

Return a prompt-template that runs a skill's behavioral eval N times (default 3) as independent samples, then aggregates variance via `runtime/replay-aggregate.sh`. `stable = stdev ≤ 0.05 AND min ≥ pass_threshold`. No API key.

**Input**
```json
{ "category": "ai-agents", "name": "prompt-engineer", "samples": 3 }
```

**Output** (success)
```json
{ "ok": true, "data": { "prompt": "# tfc_replay — Stability Quorum\n..." } }
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`

---

## tfc_portfolio

Whole-portfolio health surface: histogram of earned lanes, `decayPressure` (stale proofs), `evolveReady` (eval_proven with ≥3 unconsumed learnings), `belowFloor` (pack pairings under `min_lane`), `unreachable` (broken symlinks). Read-only.

**Input**
```json
{ "asOf": "2026-06-22" }
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "histogram": { "authored": 4, "eval_proven": 3, "evolution_proven": 1 },
    "decayPressure": [],
    "evolveReady": ["pattern/autovibe"],
    "belowFloor": [],
    "unreachable": []
  }
}
```

**Failure codes:** none (returns partial data on missing files)

---

## tfc_behavioral

Deterministic, zero-model contract QA. Checks that a skill's declared contract is internally executable: scaffold template covers every `required_section`, `SKILL.md` covers every `required_section`, and every `spec.phases` acceptance criterion is machine-shaped. No API call (INV-3).

**Input**
```json
{ "category": "ai-agents", "name": "prompt-engineer" }
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "passed": true,
    "checks": [
      { "id": "scaffold_covers_required_sections", "passed": true },
      { "id": "skill_md_covers_required_sections", "passed": true },
      { "id": "phases_criteria_machine_shaped", "passed": true }
    ]
  }
}
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`, `BEHAVIORAL_FAIL`

---

## tfc_integrate

Write a validated integration contract into a skill's `spec.yaml` and re-validate. A system id ending in `-mcp` → `requires`; any other id → `pairs_with` (direction + reason are mandatory).

**Input**
```json
{
  "category": "ai-agents",
  "name": "prompt-engineer",
  "system": "spawner-mcp",
  "dryRun": false
}
```

**Output** (success)
```json
{
  "ok": true,
  "data": { "specUpdated": true, "added": "requires: spawner-mcp", "validationPassed": true }
}
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`, `VALIDATION_FAILED`

---

## tfc_context

Scaffold a skill's `context/` directory from `context-taxonomy.yaml` — writes empty section stubs with `fill_hint` + `last_verified` frontmatter. A human fills the knowledge; this tool never calls a model (INV-3).

**Input**
```json
{ "category": "content/social", "name": "reel-forge", "dryRun": false }
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "dir": "~/.future-code/skills/content/social/reel-forge/context/",
    "files": ["hooks.md", "platform-rules.md"],
    "dryRun": false
  }
}
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND` (taxonomy missing), `EXISTS`

---

## tfc_context_audit

Read-only: for each skill with a `context/` directory, report file count, `last_verified` age, any empty sections, and overall fill ratio.

**Input**
```json
{ "category": "content/social", "name": "reel-forge" }
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "files": [
      { "file": "hooks.md", "fillRatio": 0.8, "lastVerified": "2026-06-01", "emptySections": [] }
    ]
  }
}
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`

---

## tfc_context_update

Re-stamp `last_verified` on a context file after a human reviews and updates it.

**Input**
```json
{ "category": "content/social", "name": "reel-forge", "file": "hooks.md", "asOf": "2026-06-22" }
```

**Output** (success)
```json
{ "ok": true, "data": { "file": "hooks.md", "lastVerified": "2026-06-22" } }
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`

---

## tfc_context_get

Return the rendered content of one or all context files for a skill, ready to paste into a prompt.

**Input**
```json
{ "category": "content/social", "name": "reel-forge", "file": "hooks.md" }
```

**Output** (success)
```json
{ "ok": true, "data": { "content": "## Emotional Hooks\n...", "sources": ["hooks.md"] } }
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`

---

## tfc_context_fill

Return a local prompt-template for Claude to fill a skill's context stubs using only grounded sources (existing `SKILL.md`, real docs). Fails with `NO_SOURCES` if no grounded material exists — never fabricates (INV-4, INV-5). No API key.

**Input**
```json
{ "category": "content/social", "name": "reel-forge", "domain": "content/social" }
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "prompt": "# tfc_context_fill — Knowledge Fill Assignment\n...",
    "sources": [{ "label": "reel-forge/SKILL.md", "excerpt": "..." }],
    "angles": [{ "file": "hooks.md", "sections": ["## Emotional Hooks"] }]
  }
}
```

**Failure codes:** `BAD_INPUT`, `NOT_FOUND`, `NO_SOURCES` (no grounded material — refuses to fabricate)

---

## tfc_context_discover

Surface skills that have a `context/` directory with unfilled or stale stubs — the "fill queue."

**Input**
```json
{ "staleDays": 30 }
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "unfilled": ["content/social/reel-forge"],
    "stale": ["pattern/autovibe"]
  }
}
```

**Failure codes:** none (returns empty arrays if nothing found)

---

## tfc_context_coverage

Coverage heatmap: for each taxonomy domain, how many skills have context/, what fraction are filled, and which files are most-often empty.

**Input**
```json
{}
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "domains": [
      { "domain": "content/social", "skillCount": 3, "filledRatio": 0.67, "coldestFile": "platform-rules.md" }
    ]
  }
}
```

**Failure codes:** `NOT_FOUND` (taxonomy missing)

---

## tfc_compose

Return a multi-skill composition plan: given a goal, suggest which TFC skills to chain (order, rationale, handoff points). Read-only; returns a prompt-template for Claude to execute.

**Input**
```json
{ "goal": "help a founder write and ship a cold-email campaign" }
```

**Output** (success)
```json
{ "ok": true, "data": { "prompt": "# tfc_compose — Composition Plan\n...", "candidates": ["pattern/autovibe", "ai-agents/prompt-engineer"] } }
```

**Failure codes:** `BAD_INPUT`

---

## tfc_graph

Build and return the skill dependency graph: `pairs_with` edges from all `spec.yaml` files in `TFC_HOME`. Useful for visualising the skill ecosystem.

**Input**
```json
{}
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "nodes": ["pattern/autovibe", "ai-agents/prompt-engineer"],
    "edges": [
      { "from": "pattern/autovibe", "to": "ai-agents/prompt-engineer", "direction": "after", "reason": "..." }
    ]
  }
}
```

**Failure codes:** none (returns empty graph if no skills installed)

---

## tfc_recommend

Given a goal or task description, recommend which installed TFC skills to use and in what order. Read-only; returns a ranked list with rationale.

**Input**
```json
{ "goal": "debug a slow API endpoint", "context": "Node.js, production issue" }
```

**Output** (success)
```json
{
  "ok": true,
  "data": {
    "recommendations": [
      { "skill": "pattern/realthink", "rank": 1, "reason": "Find the real problem first before diving into code" },
      { "skill": "ai-agents/prompt-engineer", "rank": 2, "reason": "Generate targeted debug prompts" }
    ]
  }
}
```

**Failure codes:** `BAD_INPUT`

**Failure codes:** `BAD_INPUT`
