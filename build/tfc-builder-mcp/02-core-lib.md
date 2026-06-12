# 02 — CORE LIB — shared TFC types + fs primitives

> The library both adapters (MCP server + CLI) call. Build this before any tool engine.
>
> `ENVOKE: frameworks/typescript-strict` (primary).
> `ENVOKE: development/cli-development`, `development/dependency-management` (support).

---

# CONTEXT
Project:        tfc-builder MCP (see 00-PROJECT.md)
Stack:          TypeScript strict + zod + yaml
Current state:  Skeleton from 01 exists: server, registry, stubs, result.ts, paths.ts.
User persona:   Builder who wants the CLI and MCP to behave identically.
Code target:    ~/.future-code/mcp/tfc-builder/src/core/

# ACTION
IMPLEMENT the core type model and filesystem primitives that every engine reuses: the TFC skill model, the template token map, and safe fs read/write/symlink helpers.

# TARGET
Files to create or modify:
  src/core/types.ts        (TfcSkill, SpecYaml, ValidationResult, ScoreResult, MigrationPlan types)
  src/core/paths.ts        (extend from 01: skillDir(), claudeLink(), spawnerLink(), templateDir())
  src/core/fs.ts           (readText, writeText, ensureDir, exists, copyDir, listDirs — all Result-returning)
  src/core/yamlio.ts       (readYaml<T>, writeYaml — lossless, comment-preserving where possible)
  src/core/tokens.ts       (TOKEN_MAP: SKILL_ID_PLACEHOLDER -> id, CATEGORY_PLACEHOLDER -> category, etc.)

Do NOT modify:
  src/server.ts            (adapter — unchanged)
  src/tools/*              (handlers wire to core in their own files)

# CONSTRAINTS
- `types.ts` mirrors the contract in THE_FUTURE_CODE.md and `_template/spec.yaml`. A `SpecYaml` type has: id, name, version, category, description, triggers[], model_tier, priority, owns[], does_not_own[], pairs_with[], requires[], sharp_edges[], skill_chain[], required_sections[], scaffold_template, can_execute_without_mcp, tags[], layer, complexity.
- Every fs helper returns `Result<T>` — no raw throws. A missing file is `fail("NOT_FOUND", ...)`, not an exception.
- `tokens.ts` defines the full placeholder set used by `_template/`: `SKILL_ID_PLACEHOLDER`, `CATEGORY_PLACEHOLDER`, plus frontmatter `name`, `version`. The map is data, not code, so the scaffold engine in 03 stays trivial.
- `yamlio` round-trips `_template/spec.yaml` without losing field order or comments where the `yaml` lib allows it.
- All filesystem roots come from `paths.ts`. `templateDir()` returns `~/.future-code/skills/_template`.
- Zod schemas for tool inputs live next to the engine that uses them, NOT in core (core is types + io only).

# QUALITY
- Full TypeScript types, no `any`. `readYaml<T>` is generic and the caller passes the expected shape.
- `safeJoin` from 01 is used by every path builder; no raw template-string path concatenation.
- Unit test: `tokens.ts` swap produces zero remaining `*_PLACEHOLDER` strings on the template SKILL.md.
- Unit test: `fs.copyDir` copies `_template/` (3 files) and `exists` reports all three at the target.
- Performance: all core ops are sync-or-fast; no engine is allowed to hold the stdio loop > 50ms for a local fs op.

# QUALITY WRAP

## Scope limiters
- Core holds types + io ONLY. No tool logic, no prompt strings, no validation rules here.
- Do not import the MCP SDK in `core/` — core must be usable by the CLI with zero MCP dependency.
- Keep `types.ts` aligned to the template; if the template changes, this file is the single update point.

## Anti-pattern guards
- AVOID: leaking exceptions — every io helper returns Result.
- AVOID: duplicate path logic — paths.ts owns all roots.
- AVOID: stringly-typed model — `model_tier` is `"opus" | "sonnet" | "haiku"`, not string.
- AVOID: premature abstraction — no generic "FileManager" class; plain functions.

## VERIFY
After implementation, run:
- `npm run typecheck` — must pass
- `npm run test src/core` — types + tokens + fs round-trip pass
- Manual smoke: in a node REPL, `readYaml(templateDir()+'/spec.yaml')` returns a typed SpecYaml with `id === 'skill-name'`
