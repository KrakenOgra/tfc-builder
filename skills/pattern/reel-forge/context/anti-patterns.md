---
last_verified: 2026-06-24
freshness_clock: 2026-06-24
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.5"
forge_domain: "reel-forge"
fill_hint: "The 5-8 most common domain failures; each: the failure pattern -> why it fails -> the corrected version."
---

## Failure Modes
source: reel-forge/SKILL.md

**1. Voice blending**
Pattern: Mixing HORMOZI urgency with NAVAL calm in a single SCRIPT.
Why it fails: Voice is argument structure, not vocabulary — two structures cancel each other's trust signal. Per SKILL.md, blending tested below baseline; splitting into two single-voice scripts doubled the save rate.
Fix: BOUND one VOICE per Reel. If the topic warrants both, ship two separate scripts.

**2. Mode negotiation before the SCRIPT**
Pattern: Asking the user to pick a voice, a framework, and a HOOK type before writing a single line.
Why it fails: A 22-module system that demands three picks before output produced zero shipped reels for months (SKILL.md). The decision overhead becomes the trap.
Fix: auto-match the VOICE from topic signal and ship the FAST-LANE RECIPE. Let the user redirect after seeing the output, not before.

**3. Generic HOOK**
Pattern: Opening with "In today's fast-paced world" or "Have you ever wondered…"
Why it fails: Generic hooks get scrolled past in under 3 seconds — no pattern-interrupt fires. The CONTRARIAN and BUILDER formats both require a concrete specific (number, place, named tool, or admission) in line one.
Fix: HOOK must name one concrete specific. If none exists in the input, emit NEEDS_CONTEXT and ask for it — never fabricate a specific.

**4. NAVAL with a CTA**
Pattern: Adding "follow me for more" or a link CTA to a NAVAL SCRIPT.
Why it fails: NAVAL's conversion mechanism is trust-through-density. A CTA signals a sales intent that breaks the aphorism contract and reads as inauthenticity.
Fix: NAVAL carries zero CTA. If the creator insists on a CTA, switch to HORMOZI or BUILDER voice.

**5. Thin topic → full SCRIPT**
Pattern: Generating a complete SCRIPT when the input topic has no concrete specific.
Why it fails: A script built on a generic topic ("habits", "mindset") produces the generic outputs the system was built to prevent. The eval task "thin-topic-guard" confirms BLOCKED output is correct here.
Fix: Report NEEDS_CONTEXT, ask for one concrete specific, and emit no SCRIPT until it arrives.

**6. EDIT grammar omitted on full pipeline**
Pattern: Delivering HOOK + SCRIPT but no SHOTS & EDIT section.
Why it fails: A talking-head Reel without edit direction leaves the creator guessing at cut points, on-screen text timing, and delivery pacing. The packet is not film-ready without SHOTS & EDIT.
Fix: On any full-pipeline run, always emit ## SHOTS & EDIT and ## REPURPOSE. The FAST-LANE recipe includes abbreviated edit notes by default.

**7. JOBS voice with hedging**
Pattern: Adding qualifiers ("it depends", "in some cases") to a JOBS reveal script.
Why it fails: JOBS cadence relies on theatrical certainty — context → contrast → reveal. Hedging collapses the contrast and removes the reveal's impact.
Fix: Remove all qualifiers. If the claim cannot be made with certainty, the topic is wrong for JOBS voice — switch to GODIN.
