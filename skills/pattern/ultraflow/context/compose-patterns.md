---
last_verified: 2026-06-23
fill_hint: "Compose-over-absorb, kraken-flow x autovibe composition, when to delegate vs own."
---

## Compose Over Absorb
source: ultraflow/SKILL.md#patterns (Compose-Do-Not-Re-Implement) + ultraflow/SKILL.md#anti-patterns (Absorb-and-Break)

- Ultraflow owns exactly: stages 4-7 (Forge, Prove, Install, Close). It does NOT own stages 1-3.
- Stage 1-2 (Ground + Frame + Route): kraken-flow owns this. ultraflow calls kraken-flow, it does not re-derive the crux or re-implement the spine's 8 nodes.
- Stage 3 (Compile): autovibe owns this. ultraflow calls autovibe --build or --ultra, it does not re-implement the compiler or its gate.
- Absorb-and-Break anti-pattern: absorbing kraken-flow or autovibe into ultraflow discards their earned lanes (kraken-flow is eval_proven, autovibe is evolution_proven) and breaks every pack that routes to them. There are 8 pack skill_chains that reference these skills.
- The correct upgrade model: when kraken-flow or autovibe improve, ultraflow gets the improvement for free because it calls them. There is no version dependency to maintain.

## kraken-flow Composition Contract
source: ultraflow/SKILL.md#stage-1-ground-and-frame + ultraflow/spec.yaml#pairs_with

- ultraflow calls kraken-flow for stages 1-2 and receives: the grounded crux (actor/cost/evidence), the synthesized frame (the leverage point), and the one constraint.
- ultraflow does NOT re-run the 8-node spine internally. It passes the intent to kraken-flow and reads the GROUND block output.
- spec.yaml pairs_with entry: `{skill: kraken-flow, direction: parallel, reason: "ultraflow calls kraken-flow for stages 1-2 (ground crux + synthesized frame); it does not re-implement the spine"}`.
- kraken-flow is listed in ultraflow's Receives-from handoff table with: "what arrives: the grounded crux + the synthesized frame".
- If kraken-flow is unavailable, ultraflow cannot proceed past stage 1. It must halt with BLOCKED, not attempt to re-derive the crux inline.

## autovibe Composition Contract
source: ultraflow/SKILL.md#stage-3-compile + ultraflow/spec.yaml#pairs_with

- ultraflow calls autovibe for stage 3 and receives: a directory under `~/prompt-packs/<slug>/` with the compiled pack or ULTRA prompt.
- autovibe runs its own P0.0 GROUND check and its own gate (bin/autovibe-gate.sh). If autovibe's gate exits 2, ultraflow is BLOCKED at stage 3. It cannot forge below the floor.
- spec.yaml pairs_with entry: `{skill: autovibe, direction: parallel, reason: "ultraflow calls autovibe for stage 3 (compile the framed intent into a pack or ULTRA prompt); shared outcome ledger"}`.
- autovibe is evolution_proven. Calling it keeps its earned evidence. Re-implementing its compiler inline would fork a copy that drifts and loses the gate.
- For the forge route: autovibe produces the pack that seeds tfc_compile's SkillCard at stage 4. The autovibe pack is not the final skill; it is the intermediate compile artifact.
