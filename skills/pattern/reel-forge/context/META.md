---
last_verified: 2026-06-24
freshness_clock: 2026-06-24
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.5"
forge_domain: "reel-forge"
fill_hint: "10-term domain glossary, recommended reading order of the artifacts, and a DOMAIN-AGNOSTIC 5-step bootstrap recipe."
---

## Glossary
source: reel-forge/SKILL.md

- **VOICE**: The argument structure that governs an entire SCRIPT — not vocabulary or tone. One VOICE per Reel.
- **HOOK**: The first 0-3 seconds of a talking-head Reel. Must contain one concrete specific and create a curiosity gap.
- **SCRIPT**: The full talking-head delivery text, timestamped by segment ([0-3s], [30-45s], [55-60s]).
- **BOUND**: The lock that sets a single VOICE for the session. Emitted as "BOUND VOICE: [NAME]" before any SCRIPT output.
- **CTA**: Call to action. NAVAL carries none. HORMOZI carries exactly one. BUILDER/CONTRARIAN may carry one soft CTA.
- **FAST-LANE**: The default execution mode — auto-matched VOICE + pre-wired HOOK + SCRIPT without pipeline negotiation.
- **REPURPOSE**: The Domino step: one SCRIPT becomes carousel slides + Twitter/X thread. Part of the full pipeline only.
- **on-screen text**: Text overlaid on the talking-head shot, timed to the SCRIPT. Used for emphasis, not redundancy.
- **SHOTS & EDIT**: The camera and editing grammar section — cut points, B-roll notes, delivery pacing.
- **NEEDS_CONTEXT / BLOCKED**: The STOP state emitted when the input has no concrete specific. No SCRIPT is generated until resolved.

## Reading Order
source: reel-forge/SKILL.md

1. `taxonomy.md` — understand the 8 voice/mode categories and when each fires
2. `principles.md` — the 5 falsifiable rules that govern every SCRIPT decision
3. `mechanisms.md` — the cause→effect chains an expert uses to route and generate
4. `anti-patterns.md` — the 7 failure modes to check against before shipping
5. `few-shots.md` — 3 worked examples showing the BOUND + HOOK + SCRIPT pattern in action
6. `edge-cases.md` — boundary situations where the default principles break

## Bootstrap Recipe
source: reel-forge/SKILL.md (domain-agnostic form)

1. **Identify the fundamental categories** in this domain: list the types of output the system produces and the conditions that select each type.
2. **Extract the default execution path**: what does the system do when no explicit configuration is provided? That path must ship output without negotiation.
3. **Find the honesty gate**: what input condition means the system must STOP and request more information rather than generating? Name the condition and the output state.
4. **Map the voice-to-structure contracts**: for each output type, name one thing it always does and one thing it never does. These are the falsifiable rules.
5. **Identify the repurpose step**: how does one primary output fan out into multiple formats? When does this step fire, and when is it suppressed?
