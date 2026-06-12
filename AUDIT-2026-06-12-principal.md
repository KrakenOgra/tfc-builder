# Principal Audit — The Future Code (.future-code)

**Date:** 2026-06-12 · **Auditor:** Claude (principal-engineer audit, analysis only — no code modified)
**Method:** every claim verified against files/commands; facts vs judgments labeled. P04 scaffold: `~/.kraken/think/20260612-084634-P04.md`.

---

## Executive Summary

**Overall health: B-.** The code itself is A-grade for a personal-tool prototype — strict TypeScript, Result-envelope error handling, genuine path-traversal security with a dedicated threat-case test suite, thoughtful scoring rubrics — but the system is **non-operational end-to-end today**: the MCP registration points at a dead path, the full test suite fails at global setup, and the runtime cannot see any of the 4 built skills, all from one root cause (the canonical home `~/.future-code` is an unmanaged convention that silently broke, sometime around 08:43 today). There is no version control anywhere in the tree, so this kind of drift is invisible and unrecoverable by design. Top 3 risks: (1) the split-brain home directory — everything depends on it and nothing verifies it; (2) zero git history for ~3,000 lines of source plus skills and a serious design-doc set; (3) docs that assert verifiable claims ("76+ tests, all green") which are currently false in this environment, eroding trust in the rest of the docs. Top 3 opportunities: (1) a one-hour heal (symlink + stray-file merge) restores the entire system; (2) a `tfc doctor` command turns this whole failure class into a 2-second check; (3) decoupling tests from the real home makes the suite environment-proof forever. The forge roadmap (tfc_compile, tfc_eval) is good thinking — but it should wait until the foundation stops being load-bearing on luck.

---

## Repo Map

**Purpose:** TFC ("The Future Code") is a unified skill operating system — one directory contract (`spec.yaml` + `SKILL.md` + `learnings.jsonl` + optional `validations.yaml`) that merges spawner-YAML discoverability with gstack-SKILL.md executability, plus `tfc-builder`, an MCP server + CLI that scaffolds, authors (via prompt templates, no API key), validates, scores, migrates, and installs these skills. Intended user: the repo owner (single-builder internal tooling). Maturity: **active prototype, wave 1 of a 6-wave roadmap shipped**, previously live-tested (telemetry through 2026-06-12 01:46).

**Stack:** TypeScript 5.5 (strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`), Node ESM/NodeNext, `@modelcontextprotocol/sdk` 1.12, zod, commander, yaml. Tests: vitest 1.6 + v8 coverage (90% line threshold on `src/core`). No CI, no lint config, no git.

```
.future-code/
├── THE_FUTURE_CODE.md           the spec/manifesto (588 lines): 4 layers SPEC/EXECUTE/LEARN/ROUTE
├── mcp/tfc-builder/             the implementation — MCP server + `tfc` CLI sharing one core lib
│   ├── src/server.ts            thin MCP stdio wrapper over the tool registry (63 lines)
│   ├── src/cli.ts               commander wrapper over the same handlers (139 lines)
│   ├── src/tools/               registry + zod schemas + handlers (9 tools)
│   ├── src/core/                scaffold/validate/score/migrate/install + paths/fs/result/yamlio
│   │   ├── mappers/             spawner.ts + gstack.ts source-format readers
│   │   └── prompts/             8 authoring writing-guide fragments
│   └── test/                    core unit + e2e lifecycle + security threat-case suites
├── skills/                      4 real skills + _template (ai-code-generation, vague-to-system,
│                                learn-itr, video-prompting) — data/ category is empty
├── runtime/                     preamble.sh + learnings-log.sh (shared bash for skills)
├── analytics/                   tfc-builder.jsonl (telemetry), waves.jsonl (build log)
├── build/tfc-builder-mcp/       the CATCQ prompt-pack that BUILT the MCP (RUN-ORDER + 11 files)
└── docs/ + docs/forge/          comparisons, migration guide, and a 6-doc audit/design/roadmap set
```

**Control flow:** MCP request → `server.ts` registry lookup → handler in `tools/index.ts` (zod parse) → pure-ish core function returning `Result<T>` → JSON envelope back; every call appends one telemetry line. The CLI hits the identical handlers. Authoring tools (`tfc_brainstorm`/`tfc_generate`/`tfc_migrate`) return **prompt templates** for Claude to execute in-session — the deliberate no-API-key design.

**What surprised me:** (1) The repo contains its own prior audit (`docs/forge/01-AUDIT.md`, 2026-06-11) that is honest and high quality — rare. (2) The canonical home `~/.future-code` that every doc and the MCP registration point to is *not this tree* — it's a near-empty directory created **today at 08:43**, holding one stray film-prompt file. (3) The project that exists to manage skill locations has no managed location itself: no git, no doctor check, no path verification.

---

## Audit Report

Severity-sorted within each dimension. **[F]** = verified fact, **[J]** = judgment.

### Architecture & design

Healthy in one sentence: clean three-layer separation (entry → tools/zod → core/Result), no circular imports, largest file 387 lines, CLI and MCP share one core — nothing to fix here. **[J, grounded in reading all 29 source files]**

- **CRITICAL — Split-brain canonical home; system non-operational.** **[F]**
  The runtime default is `~/.future-code` ([paths.ts:7-8](mcp/tfc-builder/src/core/paths.ts#L7-L8)); `~/.mcp.json` lines 64-66 register the server at `/home/roshish/.future-code/mcp/tfc-builder/dist/server.js`. That path does not exist — `~/.future-code` contains only `skills/ai-video/video-prompting/AWAKENING-2075-FILM.md` (dir ctime 2026-06-12 08:43). Verified consequences: (a) the MCP server cannot start (absent from this session's server list); (b) the entire test suite fails at global setup — `ENOENT lstat '~/.future-code/skills/_template'` from [test/setup.ts:22-27](mcp/tfc-builder/test/setup.ts#L22-L27), reproduced with `vitest run`, exit 1; (c) even if started from the repo's dist, the server would see **zero** of the 4 real skills and write telemetry to the wrong tree. Repo telemetry through 2026-06-12 01:46 proves the system worked against this tree until today — consistent with `~/.future-code` having been a symlink or copy that was clobbered. Root cause: the home is a convention four consumers hardcode and nothing verifies, versions, or repairs.

- **HIGH — No version control.** **[F]** No `.git` in `.future-code` or `vibeship-x-kraken`. ~3,000 lines of source, 4 authored skills, and the forge doc set have zero history. Concrete consequence: today's directory-clobber event cannot be diagnosed or reverted, and the next one can't either.

- **LOW — `pairs_with.direction: "parallel"` exists in data but not in the type.** **[F]** [skills/pattern/vague-to-system/spec.yaml:50-52](skills/pattern/vague-to-system/spec.yaml#L50-L52) uses `direction: parallel`; [types.ts:33](mcp/tfc-builder/src/core/types.ts#L33) allows only `"before" | "after"`, and no validation gate checks `pairs_with` shape — silent schema drift that will bite whichever tool first consumes the field.

### Code quality

Healthy overall: `tsc --noEmit` exits 0 under a maximally strict config; error handling is uniform Result envelopes; no dead code found; duplication is minimal (CLI/MCP share handlers; score reuses CHECK_REGISTRY). **[F for typecheck; J for the rest]**

- **MEDIUM — `extractSection` is substring-based, not line-anchored.** **[F as written / J on impact]** [checks.ts:34-41](mcp/tfc-builder/src/core/checks.ts#L34-L41): `text.indexOf("## " + heading)` matches *inside* `### Patterns` (offset 1) and inside prose that merely quotes "## Patterns". Scores and the gstack mapper ([mappers/gstack.ts:86-87](mcp/tfc-builder/src/core/mappers/gstack.ts#L86-L87)) both build on it, so a skill with the wrong heading depth gets silently mis-scored rather than flagged.
- **LOW — MCP boundary can still throw.** **[F]** [server.ts:43](mcp/tfc-builder/src/server.ts#L43) awaits `entry.handler` with no try/catch; README line 36 promises "The MCP boundary never throws." Zod + Result envelopes cover expected failures, but an unexpected exception (e.g., a yaml-lib edge case) breaks the contract.
- **LOW — copy-paste typo in shipped spec.** **[F]** [skills/pattern/vague-to-system/spec.yaml:8-9](skills/pattern/vague-to-system/spec.yaml#L8-L9): "builder skills (autovibe, think-pipeline, autovibe)" — autovibe twice.

### Security

Genuinely strong — this is the repo's standout dimension. `safeJoin` rejects `..`/absolute/null-byte segments and verifies the resolved prefix ([paths.ts:21-51](mcp/tfc-builder/src/core/paths.ts#L21-L51)); install realpath-checks planted symlinks before any read ([install.ts:122-133](mcp/tfc-builder/src/core/install.ts#L122-L133)); migrate refuses sources outside `$HOME` ([migrate.ts:158-168](mcp/tfc-builder/src/core/migrate.ts#L158-L168)); symlinks are never silently repointed ([install.ts:103-108](mcp/tfc-builder/src/core/install.ts#L103-L108)); and all four threat cases from the ship-gate doc have real behavioral tests ([test/security/path-traversal.test.ts](mcp/tfc-builder/test/security/path-traversal.test.ts)). No hardcoded secrets in the project. **[F]**

- **MEDIUM (adjacent, outside this repo) — plaintext API key in `~/.mcp.json`.** **[F]** The same file that registers tfc-builder carries a third-party search API key in plaintext env config. Not a `.future-code` defect, but it sits in the blast radius of any tooling that reads/edits `~/.mcp.json`; consider an env-var reference instead.
- **LOW — dependency freshness.** **[F]** eslint 8.57 (EOL since 2024) and vitest 1.6 are pinned in devDependencies; no known-CVE exposure verified for the 4 runtime deps (not checked against an advisory DB — stating, not guessing).

### Testing

- **CRITICAL (shared root cause with the split-brain) — suite cannot run.** **[F]** `node node_modules/vitest/vitest.mjs run` → exit 1, `Error during global setup: ENOENT ... '~/.future-code/skills/_template'`. The isolation design itself is right (tmp HOME + env-var root redirection); the defect is that [test/setup.ts:22-27](mcp/tfc-builder/test/setup.ts#L22-L27) sources `_template` from the **real** home instead of the repo, so the suite has a hidden dependency on exactly the environment state that just broke.
- Test *quality* is high: assertions are behavioral (error codes, disk side-effects checked, e2e lifecycle mirrors the README quickstart, security tests verify nothing was written to `/etc`). 12 test files; waves.jsonl records 105/105 green on 2026-06-11. **[F for content; J for "high"]**
- **LOW — coverage threshold covers `src/core` only.** **[F]** [vitest.config.ts:11-16](mcp/tfc-builder/vitest.config.ts#L11-L16) excludes `src/tools`, `cli.ts`, `server.ts` from the 90% gate. Tools are thin zod wrappers, so this is defensible — flagging, not prescribing. **[J]**

### Performance

Healthy in one sentence: all I/O is async, no N+1 patterns, no unbounded growth except append-only JSONL files which the learnings helper already caps at 1000 lines ([runtime/learnings-log.sh:27-29](runtime/learnings-log.sh#L27-L29)); `analytics/tfc-builder.jsonl` has no cap but grows one line per tool call — irrelevant at this scale. **[F/J]**

### Dependencies

- **MEDIUM — `lint` script with no lint config.** **[F]** [package.json:16](mcp/tfc-builder/package.json#L16) defines `"lint": "eslint src --ext .ts"`, but no `.eslintrc*`/`eslint.config.*` exists anywhere in the package — `npm run lint` cannot work, and eslint + both @typescript-eslint packages are dead weight in devDependencies. Either ship a config or delete the script and deps.
- Lockfile present and consistent; 4 runtime deps, all mainstream and appropriately light. **[F]**

### DevEx & operations

- **HIGH — no CI or pre-commit gate of any kind.** **[F]** No `.github/`, no CI config, no hook. Typecheck, tests, and the (broken) lint run only when someone remembers. For a repo whose docs make precise verifiable claims ("105/105 green"), there is no mechanism keeping the claims true. Calibrated for a solo prototype: this doesn't need GitHub Actions, it needs *one* `npm run check` script and the habit (or a wave exit-gate) of running it — the waves.jsonl convention shows the habit already half-exists.
- `start.sh` runs `npm install && npm run build` on every server start ([start.sh:4-6](mcp/tfc-builder/start.sh#L4-L6)) — slow-start but self-healing; the actual `~/.mcp.json` registration bypasses it and points directly at `dist/server.js`, so the self-healing never runs. **[F]**

### Documentation

The doc set is unusually good (manifesto, comparisons, a 6-doc forge design set with reading order, a build prompt-pack with dependency graph). The defects are accuracy, not effort:

- **HIGH — every operational path in the docs is wrong for this tree.** **[F]** THE_FUTURE_CODE.md:11 ("Where: `~/.future-code/skills/...`"), README.md:51 (`cd ~/.future-code/mcp/tfc-builder`), forge README's orientation map (all 8 rows) — all reference the canonical home that is currently a husk. Anyone (including a future Claude session) following the docs hits ENOENT or, worse, recreates the split-brain by writing to the manifesto path — which is plausibly exactly what produced today's stray `AWAKENING-2075-FILM.md`. This matches the known `ported-skill path fossilization` failure pattern already in project memory.
- **MEDIUM — README references files that don't exist.** **[F]** README.md:58 → `docs/mcp-json-snippet.json`; README.md:182 → `docs/TOOLS.md`. `mcp/tfc-builder/` has no `docs/` directory. RUN-ORDER.md row 9 says wave 09 produces TOOLS.md — that wave is incomplete.
- **MEDIUM — README claims currently false in this environment.** **[F]** README.md:76: "76+ tests, all green. 93%+ line coverage" — the suite cannot run today (see Testing). True when written; false now; no mechanism noticed.
- **LOW — the manifesto's "Learning Loop is Non-Optional" has never run.** **[F]** THE_FUTURE_CODE.md:529-533 declares learnings.jsonl the core differentiator; zero `learnings.jsonl` files exist under `skills/`. Not a defect at this maturity — but the flagship claim is aspirational, and the forge docs admit it ("Nobody closes the loop"). **[J on severity]**
- **LOW — skill-tree hygiene.** **[F]** `skills/data/` is an empty category; `skills/ai-video/video-prompting/` contains a non-contract film artifact (`AWAKENING-2075-FILM.md`) and a stray `.claude/settings.local.json`.

### Strengths (preserve these)

1. **Result-envelope discipline** — every core function returns `Result<T>`; error codes are enumerated and documented in the README failure table. ([result.ts](mcp/tfc-builder/src/core/result.ts), README:187-198)
2. **Real security engineering with tests to prove it** — threat model in the build pack (10-ship-gate), implemented in paths/install/migrate, asserted in a dedicated suite.
3. **Strictest-practical TypeScript** — `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`; passes clean.
4. **Test isolation architecture** — tmp-HOME global setup + env-var root redirection ([paths.ts:5-12](mcp/tfc-builder/src/core/paths.ts#L5-L12)) is the right pattern; it needs one fix, not a redesign.
5. **Dry-run on every mutating tool, rollback on partial failure** ([scaffold.ts:139-142](mcp/tfc-builder/src/core/scaffold.ts#L139-L142), [install.ts:163-171](mcp/tfc-builder/src/core/install.ts#L163-L171)), and a source-mutation proof check in migrate ([migrate.ts:267-276](mcp/tfc-builder/src/core/migrate.ts#L267-L276)).
6. **Scoring rubrics that teach** — every gap message names the exact fixing tool ("run tfc_brainstorm", "see intelligence-context-guide.md"); archetype dispatch defaults safely for v1 specs ([score.ts:333-345](mcp/tfc-builder/src/core/score.ts#L333-L345)).
7. **Self-documenting build history** — waves.jsonl + RUN-ORDER + the forge audit are a real engineering log.

---

## Improvement Strategy

Five themes explain ~90% of the findings:

**1. The canonical home is a convention, not a managed artifact.** *(explains both Criticals + the doc staleness)*
Target state: exactly one physical tree (this repo) and one canonical path (`~/.future-code` as a symlink to it), verified mechanically. Principle: *a path four systems depend on must be checkable in one command*. Done = `tfc doctor` (or a 20-line bin script) exits 0; vitest green; tfc-builder appears in the MCP server list; `tfc_list` shows 4 skills.

**2. Nothing is versioned.** *(explains why today's breakage is undiagnosable)*
Target state: `git init` + initial commit; commit at each wave exit-gate (the waves.jsonl habit already exists — attach git to it). Principle: *history is the cheapest insurance there is*. Done = `git log` shows the initial commit and one commit per subsequent wave.

**3. Tests depend on the environment they're supposed to be isolated from.** Target state: the suite passes on a machine where `~/.future-code` doesn't exist. Principle: *fixtures come from the repo, never from the host*. Done = `rm -rf ~/.future-code && vitest run` is green (in a sandbox).

**4. Claims and reality have no enforcement loop.** *(explains the false README claims, dead doc refs, lint-without-config)*
Target state: one `npm run check` = typecheck + lint + test; run it at every wave exit; docs reference only files that exist. Principle: *every verifiable claim in a doc needs a command that verifies it*. Done = `npm run check` exits 0 and is referenced in RUN-ORDER's exit-gate convention.

**5. Schema drift between contract, types, and data.** *(pairs_with "parallel", missing learnings loop, empty category)*
Target state: validation gates cover spec-shape, not just SKILL.md prose. Done = `tfc_validate` fails on a `pairs_with.direction` outside the enum.

**Explicitly NOT recommending:** GitHub Actions/CI server (solo prototype; a check script + habit is the right weight); eslint 9 migration (do it when adding the config, not as its own project); upgrading vitest/MCP SDK (no felt pain); building `tfc_evolve`/`tfc_eval` from the forge roadmap *before* the foundation heals (amplifying on an ungrounded base is the exact anti-pattern this audit found); fixing the coverage exclusion of `src/tools` (thin wrappers, low payoff); writing learnings.jsonl machinery beyond what exists (activate it by *using* a skill, not by building more plumbing).

---

## Task Plan

### Milestone 0 — Safety net (before touching anything)

| ID | Task | Files/areas | Acceptance | Effort | Risk | Deps |
|----|------|------------|-----------|--------|------|------|
| T0 | `git init` + initial commit of `.future-code` (exclude `node_modules`, `coverage`, `dist` via .gitignore) | repo root | `git log` shows commit; `git status` clean | **S** | None | — |
| T1 | Snapshot the stray `~/.future-code` (it's 1 file) before healing; diff `AWAKENING-2075-FILM.md` against the repo copy | `~/.future-code` | both copies confirmed identical or merged | **S** | None | — |

### Milestone 1 — Critical fixes (restore operation)

| ID | Task | Files/areas | Acceptance | Effort | Risk | Deps |
|----|------|------------|-----------|--------|------|------|
| T2 | **Heal the split-brain**: remove stray `~/.future-code` (after T1), create symlink `~/.future-code` → `~/vibeship-x-kraken/.future-code`; restart Claude host | `~/.future-code`, `~/.mcp.json` (path now resolves unchanged) | tfc-builder in MCP list; `tfc_list` → 4 skills, symlink states reported | **M** | Low (reversible; T1 snapshot exists) | T0, T1 |
| T3 | **Decouple tests from the host home**: setup.ts copies `_template` from the repo (`nodePath.resolve(__dirname, "../../../skills/_template")`), not `os.homedir()` | [test/setup.ts:22-27](mcp/tfc-builder/test/setup.ts#L22-L27) | `vitest run` green even with `~/.future-code` absent | **S** | Low | T0 |
| T4 | **`tfc doctor`**: new CLI command checking (a) TFC_HOME resolves + `_template` exists, (b) `~/.mcp.json` registration path exists, (c) dist newer than src, (d) per-skill symlink states (reuse `listSkills`) | `src/cli.ts`, new `src/core/doctor.ts`, test | running with a brok3–5en home prints each failing check + exact fix; exit ≠ 0 | **M** | Low (additive) | T2, T3 |

### Milestone 2 — High-leverage

| ID | Task | Files/areas | Acceptance | Effort | Risk | Deps |
|----|------|------------|-----------|--------|------|------|
| T5 | `npm run check` = `typecheck && lint && test`; add eslint flat config (or drop lint + the 3 dead devDeps — decide once) | package.json, eslint.config.js | `npm run check` exits 0; RUN-ORDER exit-gate text references it | **M** | Low | T3 |
| T6 | Doc-path sweep: README/THE_FUTURE_CODE/forge README state the repo as physical source of truth + `~/.future-code` as the symlinked canonical path; fix dead refs (write `docs/TOOLS.md` + `mcp-json-snippet.json` or delete the references); refresh test-count claim | README.md:51,58,76,182; THE_FUTURE_CODE.md:11; docs/forge/README.md map | zero references to nonexistent files; paths match reality | **M** | None | T2 |
| T7 | Line-anchor `extractSection` (regex `^##\s+heading\s*$` multiline) + regression tests for `### Patterns` and quoted-marker cases | [checks.ts:34-41](mcp/tfc-builder/src/core/checks.ts#L34-L41), test/core | new tests pass; existing 105 unchanged | **S** | Medium (scoring behavior may shift on edge cases — diff scores of the 4 real skills before/after) | T3 |
| T8 | Wrap `entry.handler` in try/catch → `fail("INTERNAL", ...)` envelope; add `"parallel"` to `PairsWith.direction` (or fix the spec data) + a spec-shape validation gate | [server.ts:43](mcp/tfc-builder/src/server.ts#L43), [types.ts:33](mcp/tfc-builder/src/core/types.ts#L33), validate.ts | thrown handler error returns Result envelope; `tfc_validate` catches bad direction | **S** | Low | T3 |

### Milestone 3 — Quality & polish

| ID | Task | Files/areas | Acceptance | Effort | Risk | Deps |
|----|------|------------|-----------|--------|------|------|
| T9 | Skills-tree hygiene: remove empty `skills/data/`, move `AWAKENING-2075-FILM.md` + `.claude/` out of the skill dir, fix the autovibe typo in vague-to-system | skills/ | `tfc_list` clean; contract-only files in skill dirs | **S** | None | T2 |
| T10 | Activate the learning loop once for real: run one skill end-to-end so a `learnings.jsonl` exists, or soften the manifesto claim | skills/, THE_FUTURE_CODE.md:529-533 | ≥1 real learnings.jsonl entry, or doc updated | **M** | None | T2 |
| T11 | Move the plaintext API key in `~/.mcp.json` to an env-var reference | ~/.mcp.json | no plaintext key in the file | **S** | Low | — |

### Quick wins (do immediately, all S-effort)

- **T1+T2 core move** — the symlink heal itself is minutes of work and un-breaks three systems at once.
- **T3** — one-line-ish change in setup.ts; permanently environment-proofs the suite.
- **Drop-or-config lint** (half of T5) — stop shipping a script that can't run.
- **T9 typo + empty dir** — trivial.

### Implementation sketches — top 3

**T2 (heal split-brain):** (1) `diff ~/.future-code/skills/ai-video/video-prompting/AWAKENING-2075-FILM.md` against the repo copy — if identical, delete the stray tree; if not, merge into the repo first. (2) `rmdir`/`rm -rf ~/.future-code` then `ln -s ~/vibeship-x-kraken/.future-code ~/.future-code`. (3) Restart the Claude host so `~/.mcp.json` re-resolves. (4) Verify: server listed, `tfc_list` shows 4 skills. **Gotchas:** anything else that writes to `~/.future-code` will now write into the repo through the symlink — that's the *desired* single-tree behavior, but it makes T0 (git) mandatory first so writes are visible. Also confirm `paths.ts` `startsWith` checks behave with the symlinked root (they compare the unresolved `TFC_HOME` string, so they do — `realpath` is only applied to skill dirs in install.ts).

**T3 (test independence):** In setup.ts, replace the `os.homedir()`-based `realTemplate` with a path derived from the test file: `nodePath.resolve(nodePath.dirname(fileURLToPath(import.meta.url)), "../../..", "skills", "_template")` (repo root relative to `mcp/tfc-builder/test/`). **Gotcha:** `import.meta.url` in globalSetup runs under vitest's node process — `fileURLToPath` is required, bare `.pathname` breaks on spaces; the e2e test already models the correct pattern at [lifecycle.test.ts:35-38](mcp/tfc-builder/test/e2e/lifecycle.test.ts#L35-L38) (it uses `.pathname` — consider fixing that too while there).

**T4 (tfc doctor):** New `src/core/doctor.ts` returning `Result<DoctorReport>` with one entry per check `{id, passed, detail, fix}`; reuse `exists`, `listSkills`, and read `~/.mcp.json` (read-only, parse, find `tfc-builder.args[0]`, `exists()` it). Wire as `program.command("doctor")` in cli.ts + optionally a 10th MCP tool. **Gotchas:** don't make doctor depend on TFC_HOME being healthy to *run* (it must diagnose the broken state, so no `safeJoin` over the skills root before checking the root exists); dist-freshness check = max mtime of `src/**` vs `dist/server.js`, fs-only, no build tooling.

---

## Open Questions (need a human decision)

1. **Which location is canonical going forward?** Recommendation embedded above (repo = physical truth, `~/.future-code` = symlink), but the inverse (move the tree to `~/.future-code`, leave a pointer in vibeship-x-kraken) is equally valid if you want TFC independent of the vibeship repo. Pick one; the task plan assumes the symlink direction.
2. **What wrote `~/.future-code/skills/ai-video/.../AWAKENING-2075-FILM.md` at ~08:43 today?** If it was a session following THE_FUTURE_CODE.md's paths, the doc sweep (T6) is the prevention; if it was a script, it needs the same fix. I could not determine this from the filesystem alone.
3. **Should `.future-code` be its own git repo or part of a vibeship-x-kraken repo?** Affects T0 only.
4. **Forge roadmap waves 2-6 (tfc_compile, tfc_eval, tfc_evolve):** proceed after Milestone 1, or is the priority elsewhere? The roadmap is well-sequenced; it just shouldn't run on a broken foundation.
5. **Is `skills/data/` a planned category or leftover?** (T9 assumes leftover.)
6. **Lint: keep or kill?** T5 needs the decision — adding an eslint 9 flat config is ~1h; deleting the script + 3 devDeps is 2 minutes.
