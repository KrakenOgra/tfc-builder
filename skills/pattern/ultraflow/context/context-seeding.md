---
last_verified: 2026-06-23
fill_hint: "CCE v2 context tools: when, why, and how to use each at the right stage."
---

## CCE v2 Tool Surface
source: ultraflow/SKILL.md#the-tfc-tool-map (Context Seeding row, added v1.2.0)

CCE v2 added 4 context tools that ultraflow wires into Stage 4 (seeding) and Stage 6 (govern):

| Tool | Stage | Model-free | Returns |
|------|-------|-----------|---------|
| tfc_context_get | 4 (seed) | yes (INV-4) | Ranked grounded prose body, per-section source: provenance |
| tfc_context_fill | 6 (govern) | yes (INV-4) | Fill PROMPT template Claude executes offline |
| tfc_context_discover | 6 (govern) | yes (INV-4) | All known domains (taxonomy + manifest origins) |
| tfc_context_coverage | 6 (govern) | yes (INV-4) | answered/declared angle ratio; fails-closed without _angles.yaml |

All 4 are deterministic and model-free (INV-4): identical inputs produce identical bytes. No API key.

## Stage 4 Context Seeding (tfc_context_get)
source: ultraflow/SKILL.md#stage-4-forge

- Call `tfc_context_get(name=<similar_skill>, task=<new_skill_intent>)` BEFORE authoring SKILL.md when a proven skill in the same domain exists.
- The tool reads the target skill's context/*.md files, scores each (file x section) against the task string lexically, assembles the top-K within a token budget (default topK=8, tokenBudget=2000).
- Each returned section carries a `source:` provenance line -- it is grounded, not fabricated. Seed from it directly into the new SKILL.md.
- Empty corpus: when the domain has no prior proven skill with context files, tfc_context_get returns `{coverage:0, healthy:false}` and never `[]`. In this case, skip step-0 and author from grounded sources (SKILL.md + spec.yaml).
- domain parameter is optional but narrows the angle manifest: pass `domain=ai/prompting` when the new skill operates in that taxonomy. The domain is echoed and selects the angle manifest in tfc_context_fill later.
- The `--context <skill>` mode overlay on ultraflow triggers this step. Without `--context`, Stage 4 skips seeding.

## Coverage Audit (tfc_context_coverage)
source: ultraflow/SKILL.md#the-tfc-tool-map (Context Seeding row) + this session (2026-06-23)

- tfc_context_coverage reads `context/_angles.yaml` manifest (domain + angles[] + depth_target). Without the manifest, it returns NOT_FOUND -- author the manifest FIRST.
- Coverage = angles ANSWERED (file exists AND clears depth_target lines of real content) / angles DECLARED. One filled file out of five is 20%, not done.
- Depth bar: default depth_target is 15 lines of real content (not frontmatter, not blank lines). The manifest can override per-skill.
- ultraflow's manifest (skill-forge domain) declares 5 angles: eval, failure-modes, model-selection, prompt-patterns, context-seeding. All 5 were filled 2026-06-23 to well above the depth bar.
- After filling, verify with: `node dist/cli.js context-audit | grep -A3 "ultraflow"` -- filled files drop out of the "shallow" list. A file still listed as shallow is empty, unsourced, or below depth_target.

## Offline Fill Flow (tfc_context_fill)
source: ultraflow/SKILL.md#the-tfc-tool-map (Context Seeding row) + ultraflow/spec.yaml#requires_context

- tfc_context_fill harvests grounded sources (SKILL.md, spec.yaml, eval-report.json, imported skill's SKILL.md) and returns a fill PROMPT with the angle set, section headers, and hard rules.
- Hard rules enforced by the fill prompt (the depth audit fails-closed on violations):
  1. Draw every claim from the harvested sources. Do not invent.
  2. Each ## section must carry a `source:` line directly under its header.
  3. If a section cannot be grounded, write `TODO(unsourced): <what is missing>`. Never fabricate to make it pass.
  4. Keep sections concrete: formulas, examples, numbers -- not prose filler.
- domain must match the taxonomy (content/social, developer/engineering, business/strategy, ai/prompting). A skill-local domain (like skill-forge) is discovered from its _angles.yaml manifest but is NOT accepted by tfc_context_fill -- use the closest taxonomy domain and let the angles manifest specialize.
- tfc_context_fill returns NO_SOURCES when a skill has no grounded inputs. This is correct: author grounded SKILL.md sections first, then re-run fill.
