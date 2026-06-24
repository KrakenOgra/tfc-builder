---
last_verified: 2026-06-24
freshness_clock: 2026-06-24
synthesized: true
source_basis: "reel-forge/spec.yaml (tfc_context_forge)"
confidence: "0.8"
forge_domain: "reel-forge"
---

## Platform Rules
source: reel-forge/spec.yaml

**Instagram Reels:**
- Duration: 15-90 seconds. reel-forge SCRIPT targets 60s by default (the [0-3s]/[3-30s]/[30-45s]/[45-60s] structure).
- CTA: "Comment X" performs best over "link in bio" (algorithmic friction on link CTAs).
- on-screen text safe zone: keep text within 15% margin from edges (UI overlays). Center and upper third are safe.
- Caption: First line is the HOOK text verbatim. Hooks algorithm into understanding the content.

**TikTok:**
- Duration: 15-60 seconds optimal (60-90s for established creators only).
- HOOK window is 2 seconds, not 3 — reel-forge SCRIPT must front-load the concrete specific even tighter.
- CTA: "Comment X" and "Duet this" are platform-native. "Link in bio" is deprioritized by algorithm.
- Caption: Short (under 150 characters). Keywords, not sentences.

**YouTube Shorts:**
- Duration: under 60 seconds hard limit.
- HOOK must start in the first frame — no title card, no intro.
- CTA: "Subscribe" is the primary native CTA. "Comment" is secondary.
- on-screen text: auto-captions are critical (Shorts are frequently watched without sound at higher rates than Reels).

**Cross-platform SCRIPT rule:**
reel-forge SCRIPT is platform-agnostic by default (60s talking-head). Platform-specific CTA and caption adaptations are noted in ## SHOTS & EDIT when the creator specifies a platform.

**TODO(unsourced): exact safe-zone pixel dimensions per platform** — the above are approximate rules, not verified pixel specs. If pixel precision is needed for motion graphics, consult current platform creator guides.
