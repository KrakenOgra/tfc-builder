---
last_verified: 2026-06-23
freshness_clock: 2026-06-23
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.9"
forge_domain: "autovibe"
---

## Receipt Flow

source: autovibe/SKILL.md #self-tracking

The RECEIPT feedback loop has four actors:

1. **autovibe** — compiles the PACK or ULTRA prompt artifact; writes to `~/prompt-packs/`. Stops here.
2. **Executor** — runs the compiled prompt (user or agent). Produces observable build output.
3. **RECEIPT** — the observed build outcome: did the crux get resolved? Was the build clean? Security scan result?
4. **tfc_evolve** — ingests the RECEIPT via `learnings.jsonl` (one candidate row per real failure). Adjusts the COMPILE logic for future invocations.

```
autovibe COMPILE → ~/prompt-packs/<name>/ → [executor runs prompt] → build output
                                                                           |
                                                                     RECEIPT observed
                                                                           |
                                                              learnings.jsonl (if failure)
                                                                           |
                                                                     tfc_evolve ingests
                                                                           |
                                                              autovibe SKILL.md updated
```

## What Feeds tfc_evolve

source: autovibe/SKILL.md

- A **real failure** during prompt execution: the build broke, the crux was not resolved, the PACK produced out-of-scope output.
- The failure appends one candidate row to `learnings.jsonl` with `no consumed_in` — not yet folded.
- `tfc_evolve` folds it into the SKILL.md on the next evolution cycle.
- The skill never writes a learning it did not actually observe — fabricated learnings are prohibited.

## What Does Not

source: autovibe/SKILL.md

- autovibe does NOT produce the RECEIPT itself.
- autovibe does NOT execute the compiled prompt.
- autovibe does NOT write to `learnings.jsonl` on success (only on real observed failure).
- autovibe does NOT call `tfc_evolve` — that is triggered by the evolution cycle, not the compile cycle.
- autovibe does NOT write any build output to the user's project repo.

**The compiler's job ends when the COMPILE REPORT is emitted.** Everything after that is the executor's domain.
