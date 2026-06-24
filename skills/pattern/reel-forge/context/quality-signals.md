---
last_verified: 2026-06-24
freshness_clock: 2026-06-24
synthesized: true
source_basis: "SKILL.md + eval-report.json (tfc_context_forge)"
confidence: "0.9"
forge_domain: "reel-forge"
---

## Quality Signals
source: reel-forge/eval-report.json

A DONE reel-forge output passes ALL of these. A weak output fails at least one.

**Must be present (DONE checklist):**
- `BOUND VOICE: [NAME]` line appears before the first SCRIPT line.
- HOOK ([0-3s]) contains at least one concrete specific: a number, named tool, place, or admission.
- SCRIPT has timestamped sections: [0-3s], [3-30s], [30-45s], [45-60s].
- Payoff / flip lands at or before [30-45s] — not only at the close.
- ## SHOTS & EDIT section present (even abbreviated).
- CTA matches the VOICE contract (NAVAL has none; HORMOZI has exactly one action).

**Must be absent (DONE anti-checklist):**
- "In today's fast-paced world" — generic opener, no pattern-interrupt.
- "It depends" — hedging that removes the concrete claim the HOOK promised.
- "Inspiring" — emotional label that substitutes for a mechanism.
- "Game-changer" — superlative without proof.
- Two or more CTAs in one SCRIPT.
- SCRIPT that blends two VOICEs without flagging the tension.

**Per-voice DONE signals (from eval tasks):**
- NAVAL: no "Sign up", "buy now", "link in bio" in the close.
- HORMOZI: opens on the number, not on setup context.
- BUILDER: HOOK admits the failure before teaching the lesson.
- CONTRARIAN: names the specific belief before contradicting it.
- GODIN: no listicle structure anywhere in the SCRIPT.
- JOBS: reveal is preceded by context and contrast — not dropped without setup.
