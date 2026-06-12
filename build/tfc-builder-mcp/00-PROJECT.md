# 00 — PROJECT CONTEXT — tfc-builder MCP

> The global context file. Every later CATCQ file pulls CONTEXT from here.
> Feed this to the LLM FIRST (before 01-architecture.md) so it holds the whole picture.

---

## GROUNDED CRUX (PASS 0.0)

**Actor:** A builder maintaining the TFC skill ecosystem at `~/.future-code/skills/`.

**Cost today:** Every TFC skill is hand-assembled. The 4-layer contract (spec.yaml / SKILL.md / learnings.jsonl / ROUTE) and the 6 intelligence layers (Identity / Principles / Patterns / Anti-Patterns / Quick Wins / Handoffs) get dropped or half-filled because no tool enforces them. Migration from spawner or gstack is a 10-step manual checklist (see `docs/migration-guide.md`) that no one runs the same way twice.

**Evidence it is real:** `THE_FUTURE_CODE.md` Phase 2 names a `tfc` CLI (`install`, `register`, `validate`, `new`) as required and unbuilt. The intelligence-context-guide exists precisely because migrations were losing the expert brain. This is a known, documented gap, not a guess.

**The wedge:** spawner_skill_* builds spawner skills. This MCP builds TFC skills with the same richness, against the TFC template, with zero API keys (Claude is the generation engine). One MCP closes the Phase 2 gap.

`ENVOKE: office-hours` (builder mode) — confirm the wedge is the MCP, not a thinner CLI. The MCP wins because it is callable from inside any Claude session the same way spawner is, and it can return prompt-templates that Claude executes in-session.

---

## WHO — the user

A solo builder/operator running the Kraken OS stack who creates and migrates skills weekly. Comfortable in a terminal, runs local MCP servers (kraken-mcp, mind), values one source of truth and refuses API-key dependencies for core tooling. Wants to type `tfc_new` mid-session and get a correct, installed, discoverable TFC skill in one pass.

## JTBDs — jobs to be done

1. Scaffold a new TFC skill directory from `_template/` with placeholders swapped, in one call.
2. Generate the intelligence layers (Identity / Principles / Patterns / Anti-Patterns / Quick Wins / Handoffs / Stack) without an API key, using Claude in the current session.
3. Validate any TFC skill against `validations.yaml` gates (structural + voice + trigger-length) before it goes live.
4. Score a skill 0-100 on intelligence density (the migration-guide test) and see exactly what is missing.
5. Migrate a spawner or gstack skill to TFC, preserving all six intelligence layers one-to-one.
6. Install a skill (both symlinks) and register it in the spawner index so it is invocable AND discoverable.
7. List every installed TFC skill and spot dangling symlinks.

## Capabilities required

- Template scaffolding engine (copy `_template/`, swap `SKILL_ID_PLACEHOLDER` / `CATEGORY_PLACEHOLDER`).
- Prompt-template authoring engine (return structured prompts for Claude to execute; no LLM calls).
- Validation engine (parse `validations.yaml`, run each check, report blocking vs warning).
- Scoring engine (intelligence-density count: patterns + anti-patterns in source must match output).
- Migration engine (read spawner/gstack source, map the six layers into the TFC SKILL.md sections).
- Install + register engine (two symlinks, spawner index entry, verification).
- Inventory engine (list skills, detect broken symlinks).

## NOT building (via-negativa)

- No direct Anthropic/OpenAI API calls. Claude in-session is the generation engine. This is a hard line.
- No multi-agent orchestration. One MCP, deterministic handlers.
- No agent cost optimization. There is no LLM spend to optimize.
- No hosted deployment in v1. Local stdio server only, like kraken-mcp.
- No GUI. MCP tools + an optional `tfc` CLI sharing the same core lib.
- No skill-content quality judgement by the MCP itself. The MCP enforces STRUCTURE; Claude judges CONTENT.

---

## STACK (decided, not defaulted)

| Concern | Pick | Why (one line) |
|---|---|---|
| Language | TypeScript (strict) | Matches kraken-mcp + spawner; best MCP SDK support |
| Runtime | Node 20+ | Standard MCP stdio host; no Bun-only deps |
| MCP framework | `@modelcontextprotocol/sdk` (stdio transport) | The official server SDK, same as kraken-mcp |
| Input validation | `zod` | Tool input schemas + runtime parse at every boundary |
| YAML | `yaml` (eemeli) | Read/write spec.yaml + validations.yaml losslessly |
| Templating | Native string replace + a tiny token map | `_template/` uses `X_PLACEHOLDER` tokens; no heavy engine needed |
| CLI (co-deliverable) | `commander` | `tfc new/validate/install/migrate` over the SAME core lib |
| Tests | `vitest` | Fast, TS-native, good fs-mock story |
| Lint/format | `eslint` + `prettier` | Voice + style gate parity with the rest of the stack |

**Architecture rule:** the MCP server and the `tfc` CLI are two thin adapters over ONE `core/` library. Tool handlers and CLI commands both call `core/` functions. No logic lives in the adapter layer.

---

## DOMAIN MATRIX (P2)

| Domain | Module | Stack-pick | Serves capability |
|---|---|---|---|
| Server shell | `src/server.ts` | MCP SDK stdio | tool registration, dispatch |
| Core lib | `src/core/*` | TS + zod + yaml | all 7 engines, shared by MCP + CLI |
| Scaffold | `core/scaffold.ts` | fs + token map | tfc_new |
| Authoring | `core/authoring.ts` | prompt-template strings | tfc_brainstorm, tfc_generate |
| Validation | `core/validate.ts` + `core/score.ts` | yaml + regex checks | tfc_validate, tfc_score |
| Migration | `core/migrate.ts` | yaml read + section mapper | tfc_migrate |
| Install | `core/install.ts` | symlink + spawner index | tfc_install, tfc_register, tfc_list |
| CLI | `src/cli.ts` | commander | terminal access to core |
| Tests | `test/*` | vitest | every engine |
| Docs/telemetry | `README.md` + `core/telemetry.ts` | md + jsonl | docs + learnings loop |

## Cross-cutting concerns

- **Path safety:** every tool input that names a skill/category is sanitized (kebab-case, no `..`, no absolute escape). One `core/paths.ts` owns this. Tested directly.
- **Error envelope:** every tool returns `{ ok: boolean, data?, error?: { code, message, hint } }`. No throw crosses the MCP boundary.
- **Idempotency:** tfc_install / tfc_register are safe to re-run (existing-symlink is success, not error).
- **Dry-run:** tfc_new, tfc_install, tfc_migrate accept `dryRun: true` and report planned writes without touching disk.
- **No secrets:** the MCP reads/writes only under `~/.future-code`, `~/.claude/skills`, `~/.spawner/skills`. Refuse paths outside.

---

## ENVOKE INDEX (skill-per-phase)

Each build file below names the `vibeship-x-kraken/skills` skill to load before working that phase. Load with `spawner_skills(action="local", name="<skill>")` then `Read` the returned path, or `spawner_load`.

| File | Phase | ENVOKE (primary) | ENVOKE (support) |
|---|---|---|---|
| 00-PROJECT | P0 Validate wedge | `office-hours` | `strategy/platform-strategy` |
| 01-architecture | P1 MCP architecture | `ai-agents/mcp-builder` | `mind/system-designer`, `backend/api-designer`, `development/sdk-development` |
| 02-core-lib | P2 Stack setup | `frameworks/typescript-strict` | `development/cli-development`, `development/dependency-management` |
| 03-tool-new | P3 Scaffolding engine | `development/code-generation` | `creative/regex-whisperer`, `ai-agents/agent-tool-builder` |
| 04-tool-author | P4 Prompt-template engine | `ai/prompt-engineering` | `ai/llm-architect`, `ai-tools/ai-code-generation` |
| 05-tool-validate-score | P5 Validation + scoring | `testing/test-architect` | `security/input-validation`, `backend/error-handling`, `mind/code-quality` |
| 06-tool-migrate | P6 Migration engine | `mind/refactoring-guide` | `creative/legacy-archaeology` |
| 07-tool-install | P3/P5 Install surface | `ai-agents/agent-tool-builder` | `security/secrets-handling` |
| 08-tests | P7 Tests | `testing/unit-testing` | `testing/integration-testing` |
| 09-docs-telemetry | P8 Docs + telemetry | `development/docs-engineer` | `creative/documentation-that-slaps`, `ai-agents/agent-observability` |
| 10-ship-gate | P9 Ship gate | `scanner_scan` + `cso` | `security/secrets-handling` |

---

## TOOL SURFACE (9 tools — the contract every file builds toward)

| Tool | Input (zod) | Output | Owner module |
|---|---|---|---|
| `tfc_new` | `{category, name, dryRun?}` | created paths | scaffold.ts |
| `tfc_brainstorm` | `{name, category, intent}` | prompt-template string | authoring.ts |
| `tfc_generate` | `{category, name, layers[]}` | prompt-template string | authoring.ts |
| `tfc_validate` | `{category, name}` | `{passed, blocking[], warnings[]}` | validate.ts |
| `tfc_score` | `{category, name}` | `{score, breakdown, gaps[]}` | score.ts |
| `tfc_migrate` | `{sourcePath, sourceType, category, name, dryRun?}` | mapping report + prompt-template for intelligence layers | migrate.ts |
| `tfc_install` | `{category, name, dryRun?}` | symlink results | install.ts |
| `tfc_register` | `{category, name}` | spawner index result | install.ts |
| `tfc_list` | `{brokenOnly?}` | skills[] + dangling[] | install.ts |

**Code target (documented, not built this session):** `~/.future-code/mcp/tfc-builder/`.
