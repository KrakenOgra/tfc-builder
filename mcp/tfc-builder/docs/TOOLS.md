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

**Failure codes:** `BAD_INPUT`
