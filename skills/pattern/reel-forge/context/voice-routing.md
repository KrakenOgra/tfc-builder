---
last_verified: 2026-06-24
freshness_clock: 2026-06-24
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.9"
forge_domain: "reel-forge"
---

## Routing Rules
source: reel-forge/SKILL.md

**Signal → VOICE routing table (auto-match precedence: first match wins):**

| Input signal | VOICE selected | Routing reason |
|---|---|---|
| Named VOICE in input ("Hormozi voice", "Naval style") | Named VOICE | Explicit — honor directly |
| Contains a number + result + time period | HORMOZI | Proof-first structure is demanded by the data |
| Contains "I" + specific failure/mistake | BUILDER | First-person failure = earned principle arc |
| Contains "[belief] is wrong" or "nobody talks about" | CONTRARIAN | Pre-built hook signal |
| Contains a product name + "launch" or "reveal" | JOBS | Reveal cadence is needed |
| Topic is a timeless principle (no steps, no CTA candidate) | NAVAL | Aphorism stack is the correct container |
| Topic is about identity, community, or belonging | GODIN | Story-empathy arc is the correct container |
| No strong signal (topic only) | FAST-LANE auto-match | Default — ship without negotiation |
| Single word / no specifics | BLOCKED / NEEDS_CONTEXT | Cannot route without a concrete signal |

**Override rules:**
- Creator names NAVAL but provides a result-driven topic → flag the tension; offer both NAVAL (philosophical) and HORMOZI (proof-first) outputs.
- Creator names HORMOZI but topic has no measurable outcome → emit NEEDS_CONTEXT asking for a number or result. Do not invent one.
- Multiple strong signals → pick the strongest (explicit number beats everything; "I" + story beats generic topic signal).
