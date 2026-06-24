---
last_verified: 2026-06-23
freshness_clock: 2026-06-23
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.9"
forge_domain: "autovibe"
---

## In Scope

source: autovibe/SKILL.md + autovibe/spec.yaml

autovibe owns:
- Vague-intent-to-prompt-pack compilation (PACK backend)
- ULTRA prompt compilation for transforming an existing system (ULTRA backend)
- Ambition amplification: GROUND + RECON + TRANSCEND charter
- Pre-ship quality gating of generated prompts (COMPILE REPORT gate checks)
- Writing artifacts to `~/prompt-packs/` only

## Out of Scope

source: autovibe/SKILL.md + autovibe/eval-report.json #trivial-defer + #skill-cap-enforced

autovibe does NOT own:
- Writing code to the user's project repo (any path outside `~/prompt-packs/`)
- Executing the compiled prompt
- Implementing the system described in the PACK or ULTRA
- Single-file operations (rename, move, delete, format)
- Refactoring or code review
- Debugging existing code
- Database migrations
- Infrastructure changes
- Documentation generation

**The boundary:** autovibe produces an artifact that DESCRIBES what to build. It never builds it.

## STOP Triggers

source: autovibe/spec.yaml + autovibe/eval-report.json

| Trigger | STOP message |
|---------|-------------|
| Single-file operation | "Single-file [rename/move/delete] is out of autovibe scope. Use editor refactor or ask Claude directly." |
| Greenfield + `--ultra` both present | "Conflicting BACKEND signals (greenfield + --ultra). Which? PACK for new system, ULTRA for existing." |
| Compound intent with unresolvable order | "Cannot determine dependency order between [A] and [B]. Which ships first?" |
| No system-level scope (trivial) | "Task has no system-level scope. No PACK or ULTRA to compile." |
| GROUND produces no falsifiable crux | "Cannot ground this intent to a falsifiable crux. Provide more context: what is broken or missing?" |
| Intent names a maintenance task | "Maintenance (bug fix, patch, upgrade) is not a compile target. Use the task directly." |

**STOP format:**
```
STOP — NEEDS_CONTEXT

[One sentence explaining why STOP fired]
[One sentence redirect: what the user should do instead]
No COMPILE REPORT emitted.
```
