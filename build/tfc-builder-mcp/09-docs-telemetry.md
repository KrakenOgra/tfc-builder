# 09 — DOCS + TELEMETRY — README, tool reference, the learnings loop

> The MCP that builds learning skills should itself learn. Wire the TFC learnings + telemetry
> pattern into the server so each tool run appends to a jsonl, the same loop TFC skills use.
>
> `ENVOKE: development/docs-engineer` (primary).
> `ENVOKE: creative/documentation-that-slaps`, `ai-agents/agent-observability` (support).

---

# CONTEXT
Project:        tfc-builder MCP (see 00-PROJECT.md)
Stack:          TypeScript strict + core lib + jsonl
Current state:  All tools + tests done. No README, no usage telemetry.
User persona:   Builder + future-self who needs to register the MCP and read what each tool does.
Reference:      ~/.future-code/runtime/learnings-log.sh + preamble.sh (the loop to mirror)
Code target:    README.md + docs/TOOLS.md + src/core/telemetry.ts + ~/.mcp.json snippet

# ACTION
DOCUMENT the MCP (README + per-tool reference + install/registration steps) and INSTRUMENT it with a telemetry + learnings jsonl loop.

# TARGET
Files to create or modify:
  ~/.future-code/mcp/tfc-builder/README.md          (what it is, install, the 9 tools, the no-API-key design)
  ~/.future-code/mcp/tfc-builder/docs/TOOLS.md      (per-tool: input schema, output, example call, failure modes)
  ~/.future-code/mcp/tfc-builder/src/core/telemetry.ts (recordRun(tool, durationMs, outcome) -> analytics jsonl)
  src/server.ts                                     (wrap dispatch: time each tool, record outcome)
  docs/mcp-json-snippet.json                        (the ~/.mcp.json entry to add tfc-builder)

Do NOT modify:
  src/core engines                                  (telemetry wraps at the dispatch layer, not inside engines)

# CONSTRAINTS
- telemetry wraps at the server dispatch boundary: every tool call records `{tool, duration_ms, outcome: ok|error|blocked, ts}` to `~/.future-code/analytics/tfc-builder.jsonl`. Mirror the TFC telemetry block format.
- A failed write to the analytics file NEVER fails the tool. Telemetry is best-effort, wrapped in try/catch, no rethrow.
- README leads with the wedge (one MCP builds TFC skills, no API key), then the 9 tools as a table, then install/registration, then the lifecycle quickstart that matches the 08 e2e test exactly.
- docs/TOOLS.md has one section per tool with: zod input shape, output shape, one example MCP call, and the named failure codes (BAD_INPUT, NOT_FOUND, EXISTS, VALIDATION_FAILED, LINK_CONFLICT, INCOMPLETE_SWAP).
- The `~/.mcp.json` snippet shows the local stdio command (`node dist/server.js`), matching how kraken-mcp is registered.
- Voice: no em dashes, no AI vocabulary. The README is builder-to-builder.

# QUALITY
- README quickstart is copy-pasteable and produces a real installed skill.
- TOOLS.md examples are valid against the zod schemas (a reader can paste and run).
- telemetry.ts is unit-tested: a forced write failure does not propagate.
- Every documented failure code actually exists in the code (grep cross-check).

# QUALITY WRAP

## Scope limiters
- Telemetry records run metadata only. No skill content, no PII, no paths outside the analytics line.
- Docs describe v1 surface only. No roadmap promises that are not built.
- Do not instrument inside engines — one wrap at dispatch keeps engines pure.

## Anti-pattern guards
- AVOID: telemetry that can fail a tool — best-effort, swallowed, logged once.
- AVOID: doc drift — the quickstart IS the e2e test; keep them in sync.
- AVOID: AI vocabulary in the README (the project bans it).
- AVOID: documenting tools that do not exist or codes never returned.

## VERIFY
After implementation, run:
- `npm run lint` (voice gate) — no em dash, no banned words in README/TOOLS.md
- `npm run test src/core/telemetry` — write-failure isolation passes
- Cross-check: every failure code in TOOLS.md appears in `src/`; every tool in README appears in registry.ts
- Manual: add the mcp-json snippet to a test ~/.mcp.json, restart the host, confirm tfc-builder lists 9 tools
