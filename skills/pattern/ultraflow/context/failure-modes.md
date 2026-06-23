---
last_verified: 2026-06-23
fill_hint: "Symptom -> cause -> prompt-level fix for each."
---

## Refusals
source: ultraflow/SKILL.md#identity + ultraflow/SKILL.md#anti-patterns

- GROUND halt (deliberate refusal): actor/cost/evidence UNKNOWN or fabricated -> emit `Verdict: NO` and `HALTED` before compile. No stage runs downstream of a fabricated field. A forge with a 100% completion rate has a GROUND gate that never fired.
- Refuse to forge a one-off: a trigger naming one specific task, not a class of tasks, is skill-proliferation. tfc_capture --audit later shows it neverInvoked. Route to build and ship the prompt-pack instead.
- Refuse to absorb proven skills: absorbing kraken-flow or autovibe discards their earned lanes and breaks every pack that routes to them. kraken-flow is called as stage 1, autovibe as stage 3 -- compose, not absorb.
- Refuse to assert a lane: spec.yaml lane field is set to `authored` at birth. tfc_lane recomputes from disk (eval-report.json). Hand-stamping a higher lane lies to every pack that reads it via tfc_pack_bridge (INV-6).
- Refuse to forge without tfc_new: tfc_migrate throws EISDIR on existing trees. The forge path scaffolds with tfc_new; tfc_migrate is only for an explicit re-home of a skill directory.

## Hallucination Triggers
source: ultraflow/SKILL.md#sharp-edges + ultraflow/SKILL.md#principles

- Lane assertion (sharp edge: lane-asserted-not-earned): writing `lane: eval_proven` into spec.yaml by hand. tfc_lane recomputes from the eval-report; a fabricated lane corrupts the pack trust graph. Fix: set lane authored, earn it from disk.
- Fabricated learnings (sharp edge: fabricated-evolution-inv8, INV-8): writing fake learnings.jsonl rows to unlock tfc_evolve's >=3-learnings guard. NOT_READY under 3 real learnings is the correct state. Never write a learning you did not observe.
- Dead MCP tool (sharp edge: mcp-tool-needs-restart): claiming a just-registered MCP tool is callable this session. It is not loaded until Claude Code restarts. Point the user at the CLI (`node dist/cli.js`) or the installed skill files.
- Ungrounded forge (sharp edge: ungrounded-forge): calling tfc_new in a run that printed `Verdict: NO`. Everything after GROUND amplifies a lie. A forged, installed, registered skill for a fabricated problem persists in the portfolio.
- Context fabrication (sharp edge: context-fill-no-sources): calling tfc_context_fill when a skill has no grounded inputs. It returns NO_SOURCES correctly. Do not invent content to bypass it; author grounded SKILL.md sections first.
- Enhance-as-forge (sharp edge: enhance-routes-to-build-not-forge): treating an "improve this skill" request as a forge route. Enhancing a proven skill in place is a build. Forging a duplicate bloats the portfolio.

## Truncation
source: ultraflow/SKILL.md#anti-patterns + ultraflow/SKILL.md#the-forge-spine

- Re-narration-chain-theater (sharp edge: re-narration-chain-theater): a full 7-stage run that calls no forge tool (no tfc_new, tfc_eval, tfc_install) and just re-narrates the kraken-flow -> autovibe handoff. If nothing is born, degrade openly: call kraken-flow --build directly and say "no forge needed".
- tfc_migrate EISDIR: tfc_migrate throws EISDIR on an existing skill directory. The default forge path uses tfc_new to scaffold from _template. tfc_migrate appears only for explicit re-homes.
- Native entry required (sharp edge: native-entry-required): a skill installed without a native `.claude/skills/<name>/` entry will not load as `/<name>`. The spec exists; the slash skill is dead. tfc_install creates the CLAUDE_SKILLS symlink; verify it resolves to a SKILL.md.
- Stage 7 context-seeding gap: using tfc_context_get before Stage 4 authoring is only useful when a proven skill in the SAME domain exists. When no prior skill exists in the domain, tfc_context_fill returns NO_SOURCES -- skip step 0 and author from the SKILL.md directly.
- Reachable-vs-proven gap (sharp edge: reachable-vs-proven): tfc_lane can return eval_proven but reachable:false if tfc_install has not yet created the CLAUDE_SKILLS symlink. A skill is not live until both lane and reachable are true.
