# 04 — tfc_brainstorm + tfc_generate — the prompt-template engine (no API key)

> The heart of the no-API-key design. These tools DO NOT call an LLM. They return a
> structured prompt-template string; Claude (the session this MCP runs inside) executes it
> and writes the resulting content back into the skill files. This is the spawner_skill_brainstorm
> and idearalph pattern exactly.
>
> `ENVOKE: ai/prompt-engineering` (primary — template quality lives or dies here).
> `ENVOKE: ai/llm-architect`, `ai-tools/ai-code-generation` (support).

---

# CONTEXT
Project:        tfc-builder MCP (see 00-PROJECT.md)
Stack:          TypeScript strict + zod + core lib
Current state:  tfc_new scaffolds a skill with empty intelligence sections. They need filling.
User persona:   Builder who wants expert-grade Identity/Patterns without writing a paragraph by hand.
Reference:      ~/.future-code/docs/intelligence-context-guide.md (the six layers + voice rules)
Code target:    src/core/authoring.ts + wire two handlers

# ACTION
IMPLEMENT tfc_brainstorm and tfc_generate as prompt-template builders: each composes a precise instruction block (CONTEXT + the exact section spec + voice rules + output contract) for Claude to execute in-session. No network, no API key.

# TARGET
Files to create or modify:
  src/core/authoring.ts        (buildBrainstormPrompt(input), buildGeneratePrompt(input))
  src/core/prompts/            (the static template fragments as .ts string consts)
    identity.fragment.ts       (how to write a hard-won Identity section)
    principles.fragment.ts     (imperative-only principles rule)
    patterns.fragment.ts       (named pattern: When + Why + BAD/GOOD example)
    antipatterns.fragment.ts   (Signal + Why it fails + Instead)
    voice.fragment.ts          (no em dash, no AI vocabulary, builder-to-builder)
  src/tools/schemas.ts         (tfcBrainstormInput, tfcGenerateInput)
  src/tools/index.ts           (wire tfcBrainstormHandler, tfcGenerateHandler)

Do NOT modify:
  src/core/scaffold.ts         (separate concern)

# CONSTRAINTS
- tfc_brainstorm input `{name, category, intent}` -> returns a prompt that asks Claude to produce: spec.yaml `id`, `triggers[]` (each >= 4 words, situation phrases), `description`, and SKILL.md `## Identity` + `## Principles`.
- tfc_generate input `{category, name, layers[]}` where layers subset of `["patterns","anti-patterns","quick-wins","handoffs","stack"]` -> returns a prompt to produce exactly those sections.
- Every returned prompt embeds: (a) the current spec.yaml/SKILL.md content read from disk as CONTEXT, (b) the matching fragment(s), (c) the voice rules verbatim, (d) an OUTPUT CONTRACT telling Claude to write to the exact file + section markers.
- The prompt MUST instruct Claude to preserve the intelligence-density rule: a named pattern is never collapsed to a bullet; each has When + Why + example.
- The tool returns the prompt as `data.prompt` (a string) plus `data.writeTargets` (the files/sections Claude should edit). The MCP does not write content itself — it hands Claude the assignment.
- Voice fragment bans: em dash, delve, crucial, robust, comprehensive, nuanced, multifaceted. The generated prompt tells Claude these are forbidden in output.
- If the named skill does not exist on disk, `fail("NOT_FOUND", ..., "run tfc_new first")`.

# QUALITY
- Full types, no `any`. `AuthoringResult = { prompt: string, writeTargets: { file: string, section: string }[] }`.
- The prompt is deterministic for the same input (snapshot-testable).
- Unit test: buildBrainstormPrompt includes the skill's current description AND the voice ban list AND a 4-word-trigger instruction.
- Unit test: buildGeneratePrompt with `layers:["patterns"]` includes ONLY the patterns fragment, not anti-patterns.
- Snapshot test: the assembled prompt for a fixed skill matches a committed snapshot (catches accidental template drift).

# QUALITY WRAP

## Scope limiters
- These tools return PROMPTS, never generated prose. The MCP must never embed an API client.
- Do not score or validate here — that is 05. Authoring only assembles the assignment.
- Do not invent skill content in the template; the template tells Claude HOW to write, not WHAT.

## Anti-pattern guards
- AVOID: API calls — there is no fetch/anthropic import anywhere in this file. A grep for `fetch(` returns nothing.
- AVOID: vague output contract — the prompt names exact files + section headers Claude must write.
- AVOID: voice drift — the voice fragment is included in EVERY authoring prompt, no exceptions.
- AVOID: bullet-collapse — the patterns fragment explicitly forbids reducing a pattern to a bullet.

## VERIFY
After implementation, run:
- `npm run typecheck` && `npm run lint` — must pass
- `grep -rn "fetch(\|anthropic\|openai" src/core/authoring.ts src/core/prompts/` — MUST return nothing (no-API-key invariant)
- `npm run test src/core/authoring` — snapshots + content assertions pass
- Manual smoke: call tfc_brainstorm on a scaffolded skill, read `data.prompt`, confirm it is a runnable assignment Claude could execute to fill Identity + Principles
