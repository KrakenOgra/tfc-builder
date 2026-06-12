# 03 — tfc_new — the scaffolding engine

> `ENVOKE: development/code-generation` (primary).
> `ENVOKE: creative/regex-whisperer`, `ai-agents/agent-tool-builder` (support).

---

# CONTEXT
Project:        tfc-builder MCP (see 00-PROJECT.md)
Stack:          TypeScript strict + zod + core lib from 02
Current state:  Core types, fs, tokens, paths exist. tfc_new is a NOT_IMPLEMENTED stub.
User persona:   Builder who wants a correct skill directory in one call, mid-session.
Code target:    src/core/scaffold.ts + wire src/tools/index.ts:tfcNewHandler

# ACTION
IMPLEMENT tfc_new: copy `_template/` into `~/.future-code/skills/{category}/{name}/`, swap every placeholder token, and report the created paths. Support dryRun.

# TARGET
Files to create or modify:
  src/core/scaffold.ts                 (scaffoldSkill({category, name, dryRun}) -> Result<CreatedPaths>)
  src/tools/schemas.ts                 (zod: tfcNewInput = {category, name, dryRun?})
  src/tools/index.ts                   (replace tfcNewHandler stub -> calls scaffoldSkill)

Do NOT modify:
  ~/.future-code/skills/_template/*    (the template is the source of truth — read-only)
  src/core/paths.ts | tokens.ts | fs.ts (consume, do not change)

# CONSTRAINTS
- Input is validated: `name` and `category` are kebab-case, 2-40 chars, no `..`, no slashes. Reject otherwise with `fail("BAD_INPUT", ..., hint)`.
- Refuse to overwrite: if `skillDir(category,name)` already exists, return `fail("EXISTS", ..., "use tfc_migrate or pick a new name")`. Never clobber.
- Copy the three template files (spec.yaml, SKILL.md, validations.yaml) via `core/fs.copyDir`.
- Swap tokens using `core/tokens.ts`: `SKILL_ID_PLACEHOLDER -> name`, `CATEGORY_PLACEHOLDER -> category`, frontmatter `name: skill-name -> name`, and set `id:` + `category:` in spec.yaml.
- After swap, assert zero remaining `*_PLACEHOLDER` strings. If any remain, roll back the created dir and `fail("INCOMPLETE_SWAP", ...)`.
- `dryRun: true` returns the list of files that WOULD be written and the token map, touching no disk.
- The created spec.yaml `id` MUST equal the directory name (validations.yaml gate `spec-id-matches-directory`).

# QUALITY
- Full types, no `any`. `CreatedPaths = { dir, files: string[], dryRun: boolean }`.
- Atomic-ish: on any failure after the dir is made, remove the partial dir so a retry is clean.
- Unit test: scaffold `data/foo` -> dir exists, 3 files present, zero placeholders, spec.id === "foo".
- Unit test: scaffold into an existing dir -> `EXISTS`, no mutation.
- Unit test: dryRun -> no dir created, report lists 3 target paths.
- Unit test: name `../evil` -> `BAD_INPUT`, no fs touched.

# QUALITY WRAP

## Scope limiters
- Do not generate intelligence-layer CONTENT here. tfc_new produces a STRUCTURE with placeholders filled by identity (id/category), nothing more. Content is 04's job.
- Do not modify the template.
- Do not add a `learnings.jsonl` (it is AUTO, created on first run by the skill itself).

## Anti-pattern guards
- AVOID: partial writes left on error — roll back the dir.
- AVOID: clobbering — existing dir is a hard stop.
- AVOID: regex placeholder swap that matches inside words — match the exact token strings from tokens.ts only.
- AVOID: silent failure — every reject returns a coded Result with a hint.

## VERIFY
After implementation, run:
- `npm run typecheck` && `npm run lint` — must pass
- `npm run test src/core/scaffold` — all cases green
- Manual smoke: call tfc_new {category:"data", name:"demo-skill"} -> inspect `~/.future-code/skills/data/demo-skill/`, grep for `PLACEHOLDER` (must be empty), then `rm -rf` it
