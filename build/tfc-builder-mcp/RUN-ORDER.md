# RUN-ORDER — tfc-builder MCP prompt-pack

> Feed these files to an LLM (Claude/Cursor) in this order. Each file is a CATCQ block.
> Load the file's `ENVOKE:` skill first (`spawner_skills(action="local", name="<skill>")` then Read),
> apply it, then paste the CATCQ block. Code target for every file: `~/.future-code/mcp/tfc-builder/`.

---

## ORDER

| # | File | Produces | Depends on | ENVOKE |
|---|------|----------|-----------|--------|
| 0 | `00-PROJECT.md` | Shared context (read, do not execute) | — | office-hours |
| 1 | `01-architecture.md` | Runnable empty MCP: server + registry + 9 stubs | 00 | ai-agents/mcp-builder |
| 2 | `02-core-lib.md` | Types + fs + yaml + tokens + paths | 01 | frameworks/typescript-strict |
| 3 | `03-tool-new.md` | tfc_new (scaffold) | 02 | development/code-generation |
| 4 | `04-tool-author.md` | tfc_brainstorm + tfc_generate (prompt engine, no API key) | 02 | ai/prompt-engineering |
| 5 | `05-tool-validate-score.md` | tfc_validate + tfc_score | 02 | testing/test-architect |
| 6 | `06-tool-migrate.md` | tfc_migrate | 02, 03, 04 | mind/refactoring-guide |
| 7 | `07-tool-install.md` | tfc_install + tfc_register + tfc_list | 02, 05 | ai-agents/agent-tool-builder |
| 8 | `08-tests.md` | unit consolidation + e2e lifecycle | 03-07 | testing/unit-testing |
| 9 | `09-docs-telemetry.md` | README + TOOLS.md + telemetry loop | 03-07 | development/docs-engineer |
| 10 | `10-ship-gate.md` | security audit + go-live | all | scanner_scan + cso |

## DEPENDENCY GRAPH

```
00 (context)
  └─ 01 (skeleton)
       └─ 02 (core lib)  ← everything below needs this
            ├─ 03 (new) ─────────────┐
            ├─ 04 (author) ──────────┤
            ├─ 05 (validate/score) ──┤
            │     └─ 07 (install) ────┤
            └─ 06 (migrate) ⟵ needs 03 + 04
                                      │
            (03,04,05,06,07) ─────────┴─ 08 (tests) + 09 (docs)
                                              └─ 10 (ship gate) ⟶ go live
```

## SEQUENTIAL vs PARALLELIZABLE

- **Strict sequence:** 00 -> 01 -> 02 -> (engines) -> 08/09 -> 10
- **PARALLELIZABLE after 02:** `03 || 04 || 05` can be built independently (no cross-imports).
- **06 (migrate)** must wait for 03 + 04 (it reuses scaffold + the authoring engine).
- **07 (install)** must wait for 05 (it calls validate before linking).
- **08 || 09** can run in parallel (tests and docs are independent), both after the engines.
- **10 is last, always.** It is the gate, not a feature. Do not register the MCP in `~/.mcp.json` until 10 is clean.

## SECURITY GATE

This MCP writes symlinks and reads/writes across three home roots -> **security-adjacent**.
File `10-ship-gate.md` runs `scanner_scan` + `/cso` and proves four path-traversal / symlink-escape threat cases closed BEFORE go-live. Do not skip it. Do not weaken a gate to pass a scan.

## THE NO-API-KEY INVARIANT (do not violate)

`tfc_brainstorm` and `tfc_generate` return PROMPT TEMPLATES; Claude executes them in-session.
There is no `fetch`, no `anthropic`, no `openai` anywhere in `src/`. File 04 and file 08 both assert this with a grep. If a later change adds an API client, the design has drifted from the wedge.

---

## PACK QUALITY SCORE

**Score:** 89/100
**Threshold:** 80
**Status:** ✅ SHIPPED

### Category breakdown
| Category | Earned | Max |
|---|---|---|
| Groundedness | 10 | 10 |
| Decomposition Depth | 20 | 20 |
| Differentiation Strength | 10 | 20 (N/A — internal tooling, no competitor product; prorated) |
| Domain Coverage | 15 | 15 |
| CATCQ Quality | 14 | 15 |
| Quality Wrap Integrity | 10 | 10 |
| Run Order Coherence | 5 | 5 |
| Security Discipline | 5 | 5 |

### Why not 100
- Differentiation is N/A by design: this is internal tooling closing a documented gap (THE_FUTURE_CODE.md Phase 2), not a product competing with incumbents. The 10-point proration is the rubric's not-applicable handling, not a quality miss.
- CATCQ Quality −1: file 09 (docs) leans on prose targets more than path targets, inherent to a docs file.

### Gaps addressed
- Security-adjacent (symlinks + multi-root fs) → scanner_scan + /cso gate placed at step 10, four threat cases required closed.
- No-API-key invariant → asserted by grep in files 04 and 08.

### Next
Load `00-PROJECT.md` for context, then open `01-architecture.md`, ENVOKE `ai-agents/mcp-builder`, and paste. Follow this order.
To refine: `/autovibe --refine tfc-builder-mcp`.
When you know how the build went: `/autovibe --outcome tfc-builder-mcp good|bad ["signal"]`.
