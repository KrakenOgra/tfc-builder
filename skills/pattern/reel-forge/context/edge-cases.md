---
last_verified: 2026-06-24
freshness_clock: 2026-06-24
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.5"
forge_domain: "reel-forge"
fill_hint: "Boundary situations where the default principles break; each: the case, why default fails, the adjustment."
---

## Edge Cases
source: reel-forge/SKILL.md

**E1. Creator names a VOICE but the topic contradicts it**
Case: Input says "write in NAVAL voice" but the topic is "how I got 47 clients in 90 days" (a result-driven claim).
Why default fails: NAVAL voice with a result-driven claim requires a CTA-free aphorism stack — but the result demands proof-first structure. Forcing NAVAL onto a tactical outcome produces a thin, unconvincing script.
Adjustment: Honor the VOICE name but flag the structural tension. Offer two outputs: one in NAVAL (philosophical framing of the result) and one in HORMOZI (proof-first). Let the creator choose.

**E2. Topic has no concrete specific and creator resists providing one**
Case: Input is "write a reel about mindset" with no number, story, or specific claim.
Why default fails: The NEEDS_CONTEXT STOP is correct, but if the creator pushes back ("just write something"), generating a generic SCRIPT breaks the honesty gate.
Adjustment: Remain BLOCKED. Offer three concrete-specific prompts as examples ("e.g. 'I used to spend 3 hours a day on mindset content and shipped nothing' — does something like this fit?"). Do not generate a generic SCRIPT.

**E3. Creator wants REPURPOSE without a SCRIPT**
Case: "Turn my existing caption into a carousel."
Why default fails: reel-forge's REPURPOSE step is a downstream derivation of a SCRIPT — it extracts the argument beats, not the raw text. A raw caption has no timestamped structure to derive from.
Adjustment: Treat the caption as the SCRIPT and reconstruct the argument beats manually. Label the carousel slides as derived from "inferred structure" and note the source.

**E4. Very short topic (one word or phrase)**
Case: Input is "crypto" or "AI."
Why default fails: auto-match cannot determine VOICE from a one-word signal. Fast-lane recipe would fire the CONTRARIAN default, which may misfire.
Adjustment: Do not auto-match on single-word inputs. Emit NEEDS_CONTEXT with a pointed question: "What's the one thing about [topic] you believe that most people in your space get wrong?" This guides the creator toward a CONTRARIAN or BUILDER hook without demanding they name a voice.

**E5. Creator wants multiple voices in one session**
Case: "Write the same topic in HORMOZI and NAVAL."
Why default fails: The one-VOICE-per-SCRIPT principle applies to each Reel, not to the session. Two voices in two separate scripts is correct. Two voices in one script is forbidden.
Adjustment: Generate two complete packets — BOUND VOICE: HORMOZI and BOUND VOICE: NAVAL — as separate outputs. Label clearly. Do not merge them or produce a "blended" version.

**E6. Input is a long-form piece to repurpose**
Case: "Turn my 2,000-word blog post into reels."
Why default fails: reel-forge extracts one argument beat per Reel. A 2,000-word post may contain 5-8 distinct beats, each needing its own VOICE selection and HOOK.
Adjustment: First extract the 3-5 strongest argument beats (each with one concrete specific). Then treat each beat as a separate reel-forge input. Do not try to compress the full post into one Reel.
