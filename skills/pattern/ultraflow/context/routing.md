---
last_verified: 2026-06-23
fill_hint: "The four route shapes, their stop points, and the misclassification traps."
---

## Four Route Shapes
source: ultraflow/SKILL.md#stage-2-route + ultraflow/SKILL.md#modes

- decision: the move is a choice, not a system. Stop after stage 2 with the move. No compile, no forge. Example: "Should I use Postgres or DynamoDB?"
- build: a one-shot system or artifact that will not recur. Compile a pack (stage 3), stop. Do not forge -- it will run once. Example: "Compile a landing page for our launch next week, just this once."
- forge: a pattern that recurs and should become a reusable skill. Run the full 7-stage motion. Example: "I keep hand-writing the same changelog step every release."
- govern: no new build. Audit and tend the existing portfolio. Run tfc_graph, tfc_pack_bridge, tfc_capture --audit, tfc_decay, tfc_portfolio. Example: "Audit the whole skill portfolio: what is never invoked?"

## Route Classification Rules
source: ultraflow/SKILL.md#stage-2-route + ultraflow/SKILL.md#anti-patterns

- Print the `## ROUTE` block before acting on the route. Shape is exactly one of decision|build|forge|govern. A typo or synonym fails the must[] check.
- Skill-proliferation gate: if the shape is forge but the pattern will run only once, DOWNGRADE to build and say so. This is the guard against skills that stay neverInvoked.
- Enhance-routes-to-build: an "improve this existing skill" request is a `build` route, not `forge`. The skill already exists; enhancing it in place does not birth a new portfolio member.
- Route by intent shape BEFORE doing any work. Never run the full motion on a one-shot intent (anti-pattern: forge theater).
- Govern route skips stages 3-5. It runs only governance tools: tfc_graph, tfc_recommend, tfc_compose, tfc_context, tfc_capture, tfc_pack_bridge, tfc_decay, tfc_replay, tfc_portfolio, tfc_list, tfc_doctor, tfc_relink.

## Common Misclassifications
source: ultraflow/SKILL.md#anti-patterns + ultraflow/SKILL.md#sharp-edges

- "Make this better" -> build (enhance-in-place), not forge. Forging a variant of a proven skill bloats the portfolio and discards the original's earned lane.
- "Audit and fix the portfolio" -> govern, even if fixes are needed. Govern tends; forge births.
- "One-off script for X" -> build. If the user cannot name a second time it will run, it is build.
- "Turn this pattern into a skill" -> forge (the textbook case). The recurring pattern, the explicit reuse intent, the named class of tasks.
- "What should I use for X?" -> decision. A technology or architecture choice is a decision that stops at the move.
