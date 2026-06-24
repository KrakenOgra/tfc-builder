---
last_verified: 2026-06-24
freshness_clock: 2026-06-24
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.9"
forge_domain: "reel-forge"
---

## Recipes
source: reel-forge/SKILL.md

**Recipe 1: CONTRARIAN (default auto-match)**
Topic signal: Generic topic with no strong result or first-person story.
VOICE: CONTRARIAN
HOOK type: "[Common belief] is wrong."
Output: BOUND VOICE + SCRIPT with one concrete mechanism refuting the belief.
Time to DONE: One pass, no questions.

**Recipe 2: RESULT-BUILDER**
Topic signal: Creator provides a number + result ("I got X in Y days").
VOICE: HORMOZI
HOOK type: "[Number] in [time]. Here's exactly how."
Output: BOUND VOICE + proof-first SCRIPT + single-action CTA.
Time to DONE: One pass.

**Recipe 3: STORY-ADMISSION**
Topic signal: Input contains "I" + a specific mistake, failure, or realization.
VOICE: BUILDER
HOOK type: "I [specific failure] so you don't have to."
Output: BOUND VOICE + personal arc SCRIPT + soft CTA or none.
Time to DONE: One pass.

**Recipe 4: PRINCIPLE-STACK**
Topic signal: Input is a timeless principle or philosophy with no tactic.
VOICE: NAVAL
HOOK type: Single aphorism as the opening line.
Output: BOUND VOICE + 3-4 aphorism SCRIPT + no CTA.
Time to DONE: One pass.

**Recipe 5: LAUNCH-REVEAL**
Topic signal: Input contains a product name, "launch", or "new thing I built."
VOICE: JOBS
HOOK type: "[Old way] was [limitation]. [Today], [the reveal]."
Output: BOUND VOICE + context/contrast/reveal SCRIPT + product CTA.
Time to DONE: One pass.

**BLOCKED state (not a recipe):**
Trigger: Topic arrives with no concrete specific and no VOICE signal.
Output: NEEDS_CONTEXT + one pointed question asking for the concrete specific.
Time to DONE: Requires one user response before any SCRIPT is generated.
