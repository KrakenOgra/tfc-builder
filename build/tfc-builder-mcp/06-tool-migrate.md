# 06 — tfc_migrate — spawner / gstack -> TFC, intelligence preserved

> The hardest tool. It must not lose the expert brain. Pairs the deterministic file mapping
> (MCP) with a prompt-template (returned for Claude to execute) for the prose-heavy layers.
>
> `ENVOKE: mind/refactoring-guide` (primary).
> `ENVOKE: creative/legacy-archaeology` (support — reading old skill formats).

---

# CONTEXT
Project:        tfc-builder MCP (see 00-PROJECT.md)
Stack:          TypeScript strict + zod + yaml + core lib + authoring engine from 04
Current state:  New skills can be built/validated. Existing spawner + gstack skills cannot be ported.
User persona:   Builder migrating top spawner + gstack skills into TFC without dropping intelligence.
Reference:      ~/.future-code/docs/migration-guide.md (Pattern A + Pattern B),
                ~/.future-code/docs/intelligence-context-guide.md (the six-layer extraction protocol)
Code target:    src/core/migrate.ts + handler

# ACTION
IMPLEMENT tfc_migrate: read a spawner skill.yaml OR a gstack SKILL.md, map every present intelligence layer to the TFC structure deterministically, and return a migration plan PLUS an authoring prompt for the prose layers that need Claude's judgement.

# TARGET
Files to create or modify:
  src/core/migrate.ts          (migrateSkill({sourcePath, sourceType, category, name, dryRun}))
  src/core/mappers/spawner.ts  (spawner skill.yaml -> {spec fields, intelligence layers found})
  src/core/mappers/gstack.ts   (gstack SKILL.md + CLAUDE.md routing -> {triggers, sections found})
  src/tools/index.ts           (wire tfcMigrateHandler)

Do NOT modify:
  the source skill files       (migration is read-only on the source — never mutate the original)

# CONSTRAINTS
- `sourceType` is `"spawner" | "gstack"`. Pick the matching mapper. Reject unknown types.
- Spawner mapper extracts: id, triggers, model implications, sharp_edges, does_not_own, AND counts `patterns` + `anti_patterns` (the density baseline). gstack mapper extracts: preamble, workflow, learnings path, triggers from the CLAUDE.md routing entry.
- Run tfc_new internally (or reuse scaffold) to create the target TFC dir, then OVERWRITE spec.yaml fields from the mapped values. Deterministic fields (id, triggers, model_tier, sharp_edges, does_not_own) are written by the MCP directly.
- Prose layers (Identity, Principles, Patterns, Anti-Patterns, Quick Wins, Handoffs, Stack) are NOT auto-written. Instead, migrate returns an authoring prompt (built via 04's authoring engine) that embeds the SOURCE content and instructs Claude to rewrite it in TFC voice, preserving every named pattern one-to-one.
- Enforce the density contract in the report: `report.densityBaseline = { patterns: N, antiPatterns: M }` from source. The returned prompt tells Claude the output MUST match these counts.
- `dryRun: true` returns the mapping plan + baseline counts + the prompt, writing nothing.
- Migration NEVER mutates the source skill. Read-only on input, always.

# QUALITY
- Full types, no `any`. `MigrationPlan = { specFields: Partial<SpecYaml>, densityBaseline: {patterns:number, antiPatterns:number}, authoringPrompt: string, writeTargets: [...] }`.
- Unit test (spawner): a fixture skill.yaml with 3 patterns + 2 anti_patterns -> densityBaseline {3,2}, spec triggers carried over.
- Unit test (gstack): a fixture SKILL.md -> triggers extracted from a CLAUDE.md routing fixture, preamble detected.
- Unit test: source files are byte-identical before and after migrate (read-only proof).
- Unit test: dryRun writes nothing.

# QUALITY WRAP

## Scope limiters
- The MCP maps STRUCTURE deterministically; Claude rewrites PROSE via the returned prompt. Do not try to auto-translate identity prose with regex.
- Do not mutate the source skill, ever.
- Do not install as part of migrate — that is an explicit separate tfc_install call after the author + validate pass.

## Anti-pattern guards
- AVOID: density loss — the baseline counts are carried into the prompt and checked by tfc_score later.
- AVOID: source mutation — migrate opens source read-only.
- AVOID: one giant mapper — spawner and gstack mappers are separate files, each single-responsibility.
- AVOID: silent field drops — the plan lists every source field and where it landed (or that it was skipped, with reason).

## VERIFY
After implementation, run:
- `npm run typecheck` && `npm run lint` — must pass
- `npm run test src/core/migrate src/core/mappers` — all green, including the read-only proof
- Manual smoke: tfc_migrate {sourceType:"spawner", sourcePath:"~/.spawner/skills/ai/ai-code-generation/skill.yaml", category:"ai", name:"ai-code-generation"} with dryRun -> inspect plan, confirm densityBaseline is non-zero and the authoring prompt names every pattern
