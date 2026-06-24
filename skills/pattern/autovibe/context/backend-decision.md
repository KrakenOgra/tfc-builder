---
last_verified: 2026-06-23
freshness_clock: 2026-06-23
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.9"
forge_domain: "autovibe"
---

## Decision Tree

source: autovibe/SKILL.md + autovibe/spec.yaml

```
Intent received
    |
    v
[Scope check] ─── trivial op (rename, single file) ──> STOP
    |
    v
[BACKEND ambiguity?]
    |── both greenfield + --ultra named ──> STOP (ask which)
    |── compound intent (system A + system B) ──> split, run decision per system
    |
    v
Does intent reference an EXISTING system?
    |── YES: "make X great", "1000x X", "--ultra", "--one", "enhance X" ──> ULTRA
    |── NO: vague intent, no prior system named ──> PACK
    |── MAYBE: "build something like X" (named product as inspiration) ──> PACK + TRANSCEND
```

**Rule:** BACKEND is declared before depth grading. Depth (lite/full/deep) is applied after BACKEND is fixed, not before.

## Signals

source: autovibe/spec.yaml #triggers

| Signal | BACKEND | Notes |
|--------|---------|-------|
| Vague intent, no system named | PACK | Standard greenfield path |
| "make X great" | ULTRA | Transformation signal |
| "next-level X" | ULTRA | Transformation signal |
| "1000x X" | ULTRA | Transformation signal |
| "overhaul X" | ULTRA | Transformation signal |
| `--ultra` or `--one` flag | ULTRA | Explicit override |
| "build something like X" | PACK + TRANSCEND | Named product = RECON + charter required |
| "enhance my X and build Y" | ULTRA (X) then PACK (Y) | Compound: split and order by dependency |
| Single-file / trivial op | STOP | Scope check fires before BACKEND |
| Greenfield + `--ultra` both present | STOP | Ambiguous; ask user |
