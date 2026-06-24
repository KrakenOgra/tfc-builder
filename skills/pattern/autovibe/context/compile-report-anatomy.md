---
last_verified: 2026-06-23
freshness_clock: 2026-06-23
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.9"
forge_domain: "autovibe"
---

## Required Sections

source: autovibe/SKILL.md

Every COMPILE REPORT must contain these sections in order:

1. `## BACKEND` — Declares `Chosen: pack` or `Chosen: ultra`. First section, always present.
2. `## GROUND` — One falsifiable crux sentence. Present in every compile except STOP.
3. `## RECON` — (PACK + named product only) Weakness scan of the inspiration product. Precedes TRANSCEND.
4. `## TRANSCEND` — (PACK + named product only) Differentiation charter with at least one `NOT:` line.
5. `## DECOMPOSE` — List of build domains / subsystems derived from the crux. Present in PACK only.
6. Security gate line — (security-adjacent only) `scanner_scan gate: required before RECEIPT`. Inline in REPORT.
7. `## COMPILE REPORT` — Summary: where the artifact was written, what the executor must do next.

For ULTRA: sections 3-5 collapse into the ULTRA prompt body. COMPILE REPORT still required at the end.
For STOP: only emit the STOP reason. No BACKEND section, no GROUND, no REPORT.

## Section Order

source: autovibe/SKILL.md

```
BACKEND → GROUND → [RECON → TRANSCEND] → [DECOMPOSE] → [CATCQ] → [ULTRA prompt] → COMPILE REPORT
```

Brackets = conditional. RECON + TRANSCEND only when named product detected. DECOMPOSE + CATCQ only for PACK. ULTRA prompt replaces CATCQ for ULTRA backend.

## Gate Checks

source: autovibe/eval-report.json + autovibe/spec.yaml

| Gate | Check | Fail action |
|------|-------|------------|
| BACKEND present | First section is `## BACKEND / Chosen: pack` or `Chosen: ultra` | Block COMPILE |
| GROUND crux | Contains one falsifiable sentence (has a yes/no test) | Block COMPILE |
| TRANSCEND NOT list | If named product: charter has at least one `NOT:` line | Re-run TRANSCEND |
| Scope check | Not a single-file / trivial operation | Emit STOP before BACKEND |
| Security gate | If auth/payments/webhooks in DECOMPOSE: gate line present in REPORT | Add gate line |
| Write target | All writes go to `~/prompt-packs/` only | Block any other write |
| REPORT present | Last section of every non-STOP compile | Emit REPORT before stopping |
