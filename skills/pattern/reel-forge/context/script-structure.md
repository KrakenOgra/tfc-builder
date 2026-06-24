---
last_verified: 2026-06-24
freshness_clock: 2026-06-24
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.9"
forge_domain: "reel-forge"
---

## Script Structure
source: reel-forge/eval-report.json + reel-forge/SKILL.md

**[0-3s] HOOK**
Must contain: one concrete specific (number, name, place, or admission). Must open the curiosity gap. The viewer decides to stay or scroll in this window.
BOUND VOICE line appears before the first timestamped line: `BOUND VOICE: [NAME]`
Forbidden at this timestamp: "In today's video", "Welcome back", "I'm going to talk about."

**[3-30s] HOLD**
The mechanism section. Delivers the 2-3 beats that pay toward the HOOK's promise. Each beat is one claim + one evidence. The audience's commitment grows here — they are invested but not yet satisfied.
GODIN and NAVAL: the full SCRIPT may live in this window (dense, no flip needed).
HORMOZI and BUILDER: this section is the "how" — the system, steps, or story beats.

**[30-45s] FLIP / PAYOFF**
The open loop closes here, not at the end. The main mechanism lands at this timestamp. Eval task "foundation-open-loop-paid-at-flip" confirms this timestamp is load-bearing — paying the loop at the end produces drop-off before the close.
CONTRARIAN: the mechanism that explains WHY the belief was wrong lands here.
HORMOZI: the specific outcome evidence (the number that proves the method) lands here.

**[45-60s] CLOSE + CTA**
Short. 1-2 sentences. The SCRIPT does not introduce new claims after the flip. CTA (if VOICE allows) is the final line. Delivery note in this section: lower energy, slower pace — the close is a landing, not a sprint.

**Full SCRIPT emits these ## sections (full pipeline):**
```
VOICE:      BOUND VOICE: [NAME]
SCRIPT:     [0-3s] ... | [3-30s] ... | [30-45s] ... | [45-60s] ...
SHOTS:      (cut grammar, delivery notes, B-roll flags)
ON-SCREEN:  (overlay text per timestamp)
REPURPOSE:  (carousel + thread — full pipeline only)
```
FAST-LANE omits ## REPURPOSE. Abbreviated SHOTS & EDIT is always included.

**VOICE-specific structure constraints:**
- NAVAL: SCRIPT is dense aphorism stack — the [30-45s] flip is built into the final aphorism, not a structural break. No CTA line in [45-60s].
- HORMOZI: the number that proves the method must appear in [30-45s], not earlier. Front-loading the proof in [3-30s] kills the flip.
- CONTRARIAN: the HOOK names the belief; [30-45s] delivers the mechanism that disproves it. The Reel BLOCKED without this mechanism — a CONTRARIAN SCRIPT that only contradicts without explaining is incomplete.
- BUILDER: the GODIN-adjacent storytelling arc means [3-30s] carries the failure detail. The flip at [30-45s] is the "what I learned" moment.
- JOBS: context ([3-15s]) → contrast ([15-30s]) → reveal ([30-45s]). The talking-head slows to a full stop before the reveal line. EDIT cuts to a close-up at the reveal.
- GODIN: the SCRIPT may be entirely in [3-30s] with a quiet close. No hard flip needed — the empathy close is the payoff.

**BLOCKED and DONE states in SCRIPT output:**
- BLOCKED / NEEDS_CONTEXT: emitted when no concrete specific exists in the input. No timestamped SCRIPT generated.
- DONE: emitted as the final line of the output when all required ## sections are complete. Signals the packet is film-ready.
- STOP: emitted mid-generation only if the VOICE contract is about to be violated (e.g., a CTA line discovered in a NAVAL SCRIPT). Generation halts and the violation is named.
