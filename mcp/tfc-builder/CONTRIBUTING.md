# Contributing to tfc-builder

## Setup

```bash
git clone https://github.com/Cyperphycho/tfc-builder
cd tfc-builder
npm install
npm run build
npm test        # all 193+ tests must pass
```

## Project structure

```
src/
  server.ts         MCP server entry — delegates to tools/registry.ts
  cli.ts            CLI entry (tfc command)
  tools/
    registry.ts     Tool registry — 32 tool definitions (name, schema, handler)
    index.ts        Re-exports all handler functions
    schemas.ts      Shared zod input schemas
  core/
    paths.ts        Path safety: safeJoin + three-root allowlist (the security chokepoint)
    scaffold.ts     tfc_new — creates skill dir from _template
    validate.ts     tfc_validate — gate checks
    score.ts        tfc_score — 0-100 intelligence density
    install.ts      tfc_install — creates ~/.claude/skills + ~/.spawner/skills symlinks
    migrate.ts      tfc_migrate — converts spawner/gstack → TFC format (prompt-template)
    authoring.ts    tfc_brainstorm + tfc_generate — returns prompt templates
    checks.ts       Low-level structural checks used by validate and score
    lane.ts         tfc_lane — recomputes earned evidence lane from disk
    evaluate.ts     tfc_eval — prompt-template for behavioral evaluation
    evolve.ts       tfc_evolve — prompt-template for skill improvement loop
    compile.ts      tfc_compile — intent front door (one-line → SkillCard prompt)
    capture.ts      tfc_capture — wires learnings capture into SKILL.md
    relink.ts       tfc_relink — repairs missing/dangling skill symlinks
    decay.ts        tfc_decay — read-only proof staleness overlay
    replay.ts       tfc_replay — stability quorum (N-sample eval variance)
    portfolio.ts    tfc_portfolio — whole-portfolio health surface
    behavioral.ts   tfc_behavioral — deterministic, zero-model contract QA
    integrate.ts    tfc_integrate — writes integration contracts into spec.yaml
    packbridge.ts   tfc_pack_bridge — cross-ecosystem pack↔skill floor check
    doctor.ts       tfc_doctor — system health + per-skill lane audit
    context.ts      tfc_context — scaffold context/ stubs from taxonomy (v4 W1)
    context-retrieve.ts  load and render a skill's context/ files
    context-depth.ts     score context depth per file
    context-fill.ts      tfc_context_fill — prompt-template to fill context stubs
    context-discover.ts  tfc_context_discover — surface skills with unfilled context
    context-coverage.ts  tfc_context_coverage — coverage heatmap per taxonomy domain
    graph.ts        tfc_graph — build skill dependency graph
    compose.ts      tfc_compose — multi-skill composition plan
    fragments.ts    Fragment text constants (imported by authoring.ts)
    preamble.ts     tfc_preamble fragment builder
    telemetry.ts    Append-only runs.jsonl telemetry writer
    result.ts       Result<T> / ok() / fail() envelope
    types.ts        Shared TypeScript types (SpecYaml, SourceType, etc.)
    fs.ts           Thin async fs wrappers (writeText, readText, ensureDir)
    yamlio.ts       readYaml / writeYaml with Result<T>
    tokens.ts       Token/placeholder handling for scaffold
    mappers/
      spawner.ts    Map spawner skill.yaml → TFC structure
      gstack.ts     Map gstack SKILL.md → TFC structure
    prompts/
      voice.fragment.ts        Voice-layer fragment for authoring prompts
      patterns.fragment.ts     Patterns-layer fragment
      antipatterns.fragment.ts Anti-patterns-layer fragment
      (+ 6 more *.fragment.ts files)
test/
  core/             Unit tests — one file per core module (27 files)
  e2e/              Full skill lifecycle (scaffold → validate → score → install)
  security/         4 threat cases (path traversal, symlink escape, null byte, unicode)
```

## Rules

**Security:** `paths.ts` is the single write-surface chokepoint. Any change to `safeJoin`,
`ALLOWED_ROOTS`, or `isUnderAllowedRoot` requires a reviewer and a new test case.

**Result envelope:** Every tool returns `{ ok: true, data: T }` or `{ ok: false, error: { code, message } }`.
Never throw across the MCP boundary.

**No API calls:** `tfc_brainstorm` and `tfc_generate` return prompt templates for Claude to
execute in-session. The server has no external HTTP calls.

**Tests must pass:** All 111 tests must pass before a PR is merged. The security suite
(`test/security/`) is non-negotiable — do not skip or modify threat cases to pass.

## Invariants

These rules must not be violated. Each one has a test case listed:

| ID | Rule | Enforcement |
|----|------|-------------|
| INV-1 | No API calls — all `tfc_brainstorm`, `tfc_generate`, `tfc_eval`, `tfc_evolve`, `tfc_compile`, `tfc_context_fill` return prompt templates; Claude is the engine | No HTTP client in `src/` |
| INV-3 | `model-free` — `tfc_behavioral` is deterministic artifact-presence checks, zero model invocation | `test/core/behavioral.test.ts` |
| INV-4 | `fill-as-prompt` — `tfc_context_fill` emits a prompt for Claude to execute offline; it never writes context files itself | `test/core/context-fill.test.ts` — INV-4 case |
| INV-5 | `source-grounded` — `tfc_context_fill` fails with `NO_SOURCES` when no grounded material exists; never fabricates | `test/core/context-fill.test.ts` |
| INV-7 | Lane purity — the score gate uses `>=` comparison, never floating-point `===`; lane state is recomputed from disk, never from cache alone | `test/core/lane.test.ts` |
| INV-8 | No synthetic learnings — `tfc_evolve` refuses with `NOT_READY` when fewer than 3 real unconsumed learnings exist (unless `force`) | `test/core/evolve.test.ts` |

**[NO TEST — add one]** INV-2: No state mutation across calls (all tools are stateless except for explicit disk writes).

## Adding a tool

1. Add a handler in `src/core/` with the same result-envelope pattern.
2. Export it from `src/tools/index.ts` and register it in `src/tools/registry.ts`.
3. Add a `test/core/<tool>.test.ts` with unit coverage.
4. Update `docs/TOOLS.md` with input schema, output shape, example, and failure codes.

## Pull requests

- One logical change per PR.
- Include a test for any new behavior.
- Security-touching changes (paths, install, scaffold) require explicit sign-off in the PR description.
