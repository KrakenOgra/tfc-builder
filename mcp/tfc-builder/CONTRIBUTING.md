# Contributing to tfc-builder

## Setup

```bash
git clone https://github.com/vibeship/tfc-builder
cd tfc-builder
npm install
npm run build
npm test        # all 111 tests must pass
```

## Project structure

```
src/
  server.ts         MCP server entry — registers 9 tools
  cli.ts            CLI entry (tfc command)
  core/
    paths.ts        Path safety: safeJoin + three-root allowlist (the security chokepoint)
    scaffold.ts     tfc_new — creates skill dir from _template
    validate.ts     tfc_validate — gate checks
    score.ts        tfc_score — 0-100 intelligence density
    install.ts      tfc_install — creates ~/.claude/skills + ~/.spawner/skills symlinks
    migrate.ts      tfc_migrate — converts spawner/gstack → TFC format
    authoring.ts    tfc_brainstorm + tfc_generate — returns prompt templates
    checks.ts       Low-level structural checks used by validate
    ...
test/
  core/             Unit tests per module
  e2e/              Full skill lifecycle (scaffold → validate → score → install)
  security/         4 threat cases from ship-gate.md (path traversal, symlink escape, etc.)
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

## Adding a tool

1. Add a handler in `src/core/` with the same result-envelope pattern.
2. Register it in `src/server.ts` (see existing `registerTool` calls).
3. Add a `test/core/<tool>.test.ts` with unit coverage.
4. Update `docs/TOOLS.md` with input schema, output shape, example, and failure codes.

## Pull requests

- One logical change per PR.
- Include a test for any new behavior.
- Security-touching changes (paths, install, scaffold) require explicit sign-off in the PR description.
