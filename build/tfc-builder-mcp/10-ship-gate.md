# 10 — SHIP GATE — security audit before the MCP goes live

> The MCP writes symlinks and reads/writes across three home roots. Audit the path-safety
> and symlink surface before anyone wires it into ~/.mcp.json.
>
> `ENVOKE: scanner_scan` + `cso` (primary).
> `ENVOKE: security/secrets-handling` (support).

---

# CONTEXT
Project:        tfc-builder MCP (see 00-PROJECT.md)
Stack:          TypeScript strict + the full built MCP
Current state:  All tools, tests, docs, telemetry done. Not yet registered in ~/.mcp.json.
User persona:   Builder about to make a symlink-writing MCP callable from every session.
Code target:    the whole repo at ~/.future-code/mcp/tfc-builder/

# ACTION
AUDIT the MCP for path-traversal, symlink-escape, and unsafe-write surfaces, then gate the install on a clean result.

# TARGET
Surfaces to audit (no new files; this is a review + fix pass):
  src/core/paths.ts        (safeJoin, the three-root allowlist — the single chokepoint)
  src/core/scaffold.ts     (dir creation, rollback)
  src/core/install.ts      (symlink creation, conflict + escape handling)
  src/core/migrate.ts      (source read-only guarantee)
  src/server.ts            (dispatch — does any unparsed input reach the fs?)

# ACTION DETAIL
- Run `scanner_scan` on the repo (push it to a GitHub repo or scan locally per the scanner flow). Pull the master prompt and fix every high/critical.
- Run `/cso` daily-mode on the codebase: focus on path traversal, symlink following, and the three-root allowlist.
- Manual threat cases to prove closed:
  1. `tfc_new {name: "../../etc/cron.d/x"}` -> BAD_INPUT, nothing written outside skills root.
  2. `tfc_install` where the source resolves (via a planted symlink) outside `~/.future-code` -> refused.
  3. `tfc_migrate {sourcePath: "/etc/passwd"}` -> rejected by sourceType + path checks, source never written.
  4. A skill name with a null byte or unicode dot-dot -> rejected at the zod layer.

# CONSTRAINTS
- The three-root allowlist in `paths.ts` is the ONLY sanctioned write surface. Any write resolving outside `~/.future-code`, `~/.claude/skills`, `~/.spawner/skills` is refused with a coded error.
- Symlink creation checks the RESOLVED real path of the target parent, not just the string, to defeat planted-symlink escapes.
- No tool reads input that bypasses zod. Every fs-touching handler parses first.
- Install stays gated on validate (from 07). The ship gate does not loosen it.

# QUALITY
- scanner_scan: zero high/critical findings, or each documented with a justification and a fix.
- The four threat cases above have a passing test in `test/security/` proving each is closed.
- No secret, token, or PII is ever read or logged (secrets-handling review confirms).

# QUALITY WRAP

## Scope limiters
- This pass fixes security findings only. No feature work, no refactors beyond what a finding requires.
- Do not weaken any existing gate to pass a scan — fix the cause.

## Anti-pattern guards
- AVOID: string-only path checks — resolve real paths before trusting them.
- AVOID: TOCTOU on symlink creation — check-and-create as tightly as the fs API allows; prefer atomic ops.
- AVOID: shipping with an open high/critical finding.
- AVOID: logging the contents of any file the MCP touches.

## VERIFY
After implementation, run:
- `scanner_scan` -> `scanner_master_prompt` -> fixes -> re-scan clean
- `/cso` daily mode -> no open path/symlink findings
- `npm run test test/security` — all four threat cases closed
- Manual: attempt each of the four threat cases by hand against a tmp HOME, confirm refusal
- ONLY THEN add the ~/.mcp.json snippet from 09 and go live
