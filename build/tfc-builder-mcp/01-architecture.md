# 01 — ARCHITECTURE — scaffold the tfc-builder MCP skeleton

> FIRST file to paste into Claude/Cursor after 00-PROJECT.md.
> Produces a runnable empty MCP server that registers all 9 tools as stubs.
>
> `ENVOKE: ai-agents/mcp-builder` (primary) — load the MCP server patterns first.
> `ENVOKE: mind/system-designer`, `backend/api-designer`, `development/sdk-development` (support).
> Load each with `spawner_skills(action="local", name="<skill>")` then Read the path. Inject each
> skill's conventions into the CONSTRAINTS below before generating code.

---

# CONTEXT
Project:        tfc-builder MCP (see 00-PROJECT.md for full context)
Stack:          TypeScript strict + Node 20 + @modelcontextprotocol/sdk (stdio) + zod + yaml
Runtime:        Node 20, stdio transport (launched by a Claude MCP host, like kraken-mcp)
Current state:  Empty directory at ~/.future-code/mcp/tfc-builder/. Nothing built.
User persona:   Solo builder running local MCP servers, refuses API-key core tooling.
Code target:    ~/.future-code/mcp/tfc-builder/

# ACTION
SCAFFOLD the MCP server skeleton: project tooling, the stdio server, the tool registry, and 9 tool stubs that validate input with zod and return the standard error envelope.

# TARGET
Files to create:
  ~/.future-code/mcp/tfc-builder/package.json          (deps + bin + scripts)
  ~/.future-code/mcp/tfc-builder/tsconfig.json         (strict)
  ~/.future-code/mcp/tfc-builder/.eslintrc.cjs         (voice + style gate)
  ~/.future-code/mcp/tfc-builder/src/server.ts         (MCP stdio server + tool registration)
  ~/.future-code/mcp/tfc-builder/src/tools/registry.ts (tool name -> {schema, handler} map)
  ~/.future-code/mcp/tfc-builder/src/tools/index.ts    (9 stub handlers, each returns NOT_IMPLEMENTED)
  ~/.future-code/mcp/tfc-builder/src/core/result.ts    (Result<T> envelope + helpers ok()/fail())
  ~/.future-code/mcp/tfc-builder/src/core/paths.ts      (TFC_HOME, CLAUDE_SKILLS, SPAWNER_SKILLS roots + safe-join)
  ~/.future-code/mcp/tfc-builder/src/cli.ts             (commander entry, calls same core — stubs for now)
  ~/.future-code/mcp/tfc-builder/start.sh               (build + run, mirrors kraken-mcp/start.sh)

Do NOT create yet (later files own these):
  src/core/scaffold.ts | authoring.ts | validate.ts | score.ts | migrate.ts | install.ts | telemetry.ts

# CONSTRAINTS
- Stack-strict: only the deps named in 00-PROJECT.md. No express, no http, no API client.
- Every tool is registered through `registry.ts` — server.ts never hardcodes a tool inline.
- Every handler signature is `(input: unknown) => Promise<Result<T>>`. Input is zod-parsed INSIDE the handler; a parse failure returns `fail("BAD_INPUT", ...)`, never throws across the MCP boundary.
- `core/paths.ts` is the ONLY place that resolves filesystem roots. No other file reads `process.env.HOME` or hardcodes `~/.future-code`.
- `safeJoin(root, ...segments)` rejects any segment containing `..`, a leading `/`, or a null byte. Return a typed error, do not throw.
- The stub handlers return `fail("NOT_IMPLEMENTED", "tfc_x lands in file 0N")` so the server runs and lists tools immediately.
- `cli.ts` registers the same 9 commands via commander, each calling the same (stubbed) core function. One logic path, two adapters.
- Match kraken-mcp conventions: `start.sh` does `npm install && npm run build && node dist/server.js`.

# QUALITY
- Full TypeScript types, strict mode, no `any`. Tool inputs typed from their zod schema via `z.infer`.
- The error envelope is the single return shape: `{ ok: true, data } | { ok: false, error: { code, message, hint? } }`.
- `tsconfig`: `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`.
- Server announces name `tfc-builder`, version from package.json, and lists all 9 tools with their zod-derived JSON schemas.
- Smoke: server boots over stdio, responds to `tools/list` with 9 tools, each call returns NOT_IMPLEMENTED cleanly.

# QUALITY WRAP

## Scope limiters
- Do not implement any engine logic in this file. Stubs only. The engines land in 03-10.
- Do not add dependencies beyond 00-PROJECT.md.
- Do not put filesystem-root resolution anywhere except `core/paths.ts`.

## Anti-pattern guards
- AVOID: god server.ts — registration delegates to `registry.ts`; server.ts stays under 80 lines.
- AVOID: throwing across the MCP boundary — every handler returns a Result, never throws to the host.
- AVOID: vague names — banned: data, result, handler-generic; name handlers `tfcNewHandler` etc.
- AVOID: scattered path logic — one `paths.ts`, imported everywhere.

## VERIFY
After implementation, run:
- `npm run typecheck` — must pass (strict)
- `npm run lint` — must pass
- `bash start.sh` then send a `tools/list` request — must return exactly 9 tools
- Manual smoke: call `tfc_new` with junk input — must return `{ ok:false, error:{ code:"BAD_INPUT" }}`, server stays up
