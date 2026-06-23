---
last_verified: 2026-06-21
fill_hint: "Symptom -> cause -> prompt-level fix for each."
---

## Refusals

- The GROUND gate is a deliberate refusal: actor/cost/evidence unknown -> Verdict NO -> HALT before compile. A forge with a 100% completion rate has a keystone gate that never fired.
- Refuse to forge a one-off. A trigger naming one specific task, not a class of tasks, is skill-proliferation. Route it to build and ship the prompt-pack instead.
- Refuse to absorb. Composing two proven skills (call them as stages) beats swallowing them and discarding their earned lanes.

## Hallucination Triggers

- Asserting a lane in spec.yaml instead of earning it from disk. tfc_lane recomputes from the eval-report; a hand-stamped lane lies to every pack that reads it through tfc_pack_bridge.
- Fabricating learnings to unlock evolve. INV-8: never write a learning you did not observe. NOT_READY under three real learnings is the correct state, not a blocker to route around.
- Claiming a just-registered MCP tool is callable this session. It is not. Point the user at the CLI or the installed files and tell them to restart.

## Truncation

- A forge run that prints all 7 stages but calls no forge tool (no tfc_new, tfc_eval, tfc_install) is re-narration theater. kraken-flow already hands off to autovibe; if nothing is born, degrade openly and say "no forge needed".
- tfc_migrate throws EISDIR on an existing tree. The forge path uses tfc_new to scaffold; migrate is only for an explicit re-home.
- A skill installed without a native .claude/skills/<name>/ entry will not load as /<name>. The spec exists, the slash skill is dead. Verify the entry resolves to a SKILL.md.
