# 08 — TESTS — unit + integration for every engine

> `ENVOKE: testing/unit-testing` (primary).
> `ENVOKE: testing/integration-testing` (support).

---

# CONTEXT
Project:        tfc-builder MCP (see 00-PROJECT.md)
Stack:          TypeScript strict + vitest + core lib + all engines
Current state:  All 9 tools implemented. Per-file unit tests exist (03-07). No end-to-end test.
User persona:   Builder who will not ship an MCP that has not survived a full lifecycle run.
Code target:    test/ (unit consolidation) + test/e2e/lifecycle.test.ts

# ACTION
IMPLEMENT the integration test that exercises the full skill lifecycle end-to-end against a temp HOME, plus a fixtures harness, and consolidate per-engine unit coverage.

# TARGET
Files to create or modify:
  test/setup.ts                  (tmp HOME fixture: fake ~/.future-code/skills/_template + roots)
  test/fixtures/spawner-skill/   (a minimal spawner skill.yaml for migrate tests)
  test/fixtures/gstack-skill/    (a minimal gstack SKILL.md + CLAUDE.md routing snippet)
  test/e2e/lifecycle.test.ts     (new -> brainstorm prompt -> simulate author -> validate -> score -> install -> list -> migrate)
  vitest.config.ts               (tmp-HOME env, coverage thresholds)

Do NOT modify:
  src/core/*                     (tests observe, they do not change production code)

# CONSTRAINTS
- The e2e test runs against an isolated tmp HOME so it never touches the real `~/.future-code` / `~/.claude` / `~/.spawner`. `core/paths.ts` reads roots from env so the test can redirect them.
- Lifecycle test asserts the real chain: tfc_new creates the dir -> tfc_brainstorm returns a prompt naming the right write targets -> the test writes plausible authored content (standing in for Claude) -> tfc_validate passes -> tfc_score rises above the un-authored baseline -> tfc_install creates both symlinks -> tfc_list shows it healthy.
- A second e2e path: tfc_migrate from each fixture (spawner + gstack) -> densityBaseline matches the fixture's pattern counts -> source files unchanged.
- Authoring tools are tested for the no-API-key invariant: grep the built bundle for `fetch(`/`anthropic`/`openai` and assert absent.
- Coverage thresholds: core/ >= 90% lines. The adapters (server.ts, cli.ts) are smoke-tested, not coverage-gated.

# QUALITY
- Deterministic: no test depends on network, wall-clock, or the real home dir.
- Every tool has at least: 1 happy path, 1 rejected-input path, 1 idempotency-or-readonly path where applicable.
- The e2e test is the executable spec of the README's "quickstart" — if the README quickstart changes, this test changes with it.
- `npm run test` is green and `npm run test:coverage` meets the core threshold.

# QUALITY WRAP

## Scope limiters
- Tests redirect roots via env; they never write outside the tmp HOME.
- Do not test Claude's content quality (out of scope — the MCP enforces structure). Test that the PROMPT is well-formed, not that the prose is good.
- No flaky timing assertions.

## Anti-pattern guards
- AVOID: tests that hit the real ~/.future-code — tmp HOME only.
- AVOID: mocking fs for symlink tests — use real links in tmp (07 already requires this).
- AVOID: a single mega-test — one test per lifecycle stage plus the chained e2e.
- AVOID: asserting on prose content of generated prompts beyond structure markers.

## VERIFY
After implementation, run:
- `npm run test` — all green
- `npm run test:coverage` — core/ >= 90% lines
- `npm run test test/e2e/lifecycle.test.ts` — the full chain passes against tmp HOME
- Manual: delete the tmp HOME assertion env var and confirm tests REFUSE to run against real home (safety check)
