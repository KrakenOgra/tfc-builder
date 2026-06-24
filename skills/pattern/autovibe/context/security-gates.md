---
last_verified: 2026-06-23
freshness_clock: 2026-06-23
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.9"
forge_domain: "autovibe"
---

## When to Add Scanner Gate

source: autovibe/eval-report.json #scanner-gate-security + autovibe/spec.yaml

A `scanner_scan` gate is required in the COMPILE REPORT when the DECOMPOSE list or GROUND crux contains any of:

| Trigger | Reason |
|---------|--------|
| Authentication / authorization | Tokens, sessions, permissions — primary attack surface |
| Payment processing (Stripe, etc.) | PCI scope; webhook replay attacks |
| Webhooks (any provider) | Signature verification required; SSRF surface |
| User-submitted data stored in DB | SQL injection, XSS, stored payload vectors |
| File upload / download | Path traversal, MIME confusion |
| External API calls with user-controlled input | SSRF surface |
| Admin / privileged routes | Privilege escalation surface |

**Rule:** If ANY of these are present in the DECOMPOSE list — add the gate. Do not wait for the user to ask.

## Gate Language in COMPILE REPORT

source: autovibe/eval-report.json #scanner-gate-security

The gate line must appear in the `## COMPILE REPORT` section, not in the CATCQ body. Exact language:

```
## COMPILE REPORT
Pack written to ~/prompt-packs/<name>/

scanner_scan gate: REQUIRED before RECEIPT
Run: scanner_scan(repo_url=<url>) after executor builds the system.
Gate blocks RECEIPT submission until scan returns clean.
```

For ULTRA backend:
```
## COMPILE REPORT
ULTRA prompt written to ~/prompt-packs/<name>/ULTRA-PROMPT.md

scanner_scan gate: REQUIRED before RECEIPT
The enhancement touches [auth/payments/webhooks]. Scan before shipping.
```

**Missing gate = COMPILE REPORT incomplete.** The RECEIPT loop cannot close cleanly if the security gate was never stated — `tfc_evolve` will treat the outcome as ambiguous.
