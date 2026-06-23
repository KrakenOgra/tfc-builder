---
last_verified: 2026-06-23
fill_hint: "The GROUND halt mechanism, the three required fields, and what fabricated vs real looks like."
---

## The Three Fields
source: ultraflow/SKILL.md#stage-1-ground-and-frame

- GROUND checks three real fields: ACTOR (named), COST (measured), EVIDENCE (observed). All three must be non-fabricated or the run halts.
- ACTOR: a named individual, team, or system that has the problem. "developers" is not a named actor. "the infra team at Corp X (5 engineers)" is named.
- COST: a measured quantity -- time, money, defect rate, missed revenue. "slow" is not measured. "3h per release spent manually writing changelogs" is measured.
- EVIDENCE: an observed signal. "it would be nice" is not evidence. "I have done this by hand 8 times in the last quarter" is observed.
- If any field is UNKNOWN or fabricated, emit `Verdict: NO` and `HALTED` and STOP the whole motion. Do not route, compile, or forge. Report BLOCKED with what is needed.

## GROUND Block Format
source: ultraflow/SKILL.md#the-output-contract

- A passing GROUND block emits exactly: `Verdict: YES actor+cost+evidence` with three sub-lines: `Actor / Cost / Evidence: <one line each>` plus `Crux:` and `Frame:`.
- A failing GROUND block emits: `Verdict: NO -> HALTED (needed: <missing field>)` and nothing else in the GROUNDED section.
- The `Evidence:` literal line is required -- the golden-task must[] check for `HALTED` and the behavioral gate both grep for it.
- `Crux:` is the ONE constraint that makes this intent hard. Not a list; one sentence. It is the thing kraken-flow's REFLECT node synthesizes after grounding.
- `Frame:` is the synthesized framing from kraken-flow's output. It names the leverage point, not a restatement of the problem.

## GROUND Gate Propagation
source: ultraflow/SKILL.md#the-forge-spine + ultraflow/SKILL.md#sharp-edges (ungrounded-forge)

- The GROUND gate propagates downstream: Stage 3 Compile and Stage 4 Forge only run if GROUND passed. A `Verdict: NO` halts the whole motion.
- Sharp edge (ungrounded-forge): calling tfc_new after `Verdict: NO` is the costliest failure -- a forged, installed, registered skill for a fabricated problem persists in the portfolio and misfires on future runs.
- Resume (`--resume <slug>`) reloads the crux from `~/.kraken/kraken-flow/runs/<slug>-<date>.md`. It does NOT re-derive the crux. Re-deriving on resume produces a different crux and invalidates everything downstream.
- The GROUND gate fires before the route classification. It does not matter that the intent sounds like a forge -- if GROUND fails, the route never prints.
