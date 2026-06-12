# 02 — GSTACK DECODED: how it routes the model and keeps quality high
# 14 mechanisms, traced in the actual install at ~/.claude/skills/gstack/ (v1.1.x)

gstack's skills feel "smart" not because the markdown is good but because gstack is a
**compiler + runtime + routing system** that happens to emit markdown. This doc names
every mechanism, shows where it lives on this machine, and states what the Forge adopts.

---

## The big picture

```
AUTHOR TIME                       COMPILE TIME                    RUN TIME
SKILL.md.tmpl ──┐
{{PREAMBLE}} ───┤  bun run gen:skill-docs                  preamble bash runs
model-overlays/─┼──────────────────► SKILL.md (artifact) ──► emits ~20 STATE lines
routing rules ──┘   "AUTO-GENERATED                          ► SKILL.md if-handlers
                     do not edit"                            react to each state
                                                             ► model behaves
```

Three routing layers stack on top of that artifact:
harness description routing → master routing table → per-project CLAUDE.md injection.

---

## Mechanism 1 — Description-text routing (the real router)

**What it is:** Claude Code injects every skill's frontmatter `description:` into the
system prompt. gstack engineers that text as a routing program with a fixed grammar:

- `"Use when asked to 'X', 'Y', or 'Z'"` — exact-phrase intent matching
- `"Proactively invoke this skill (do NOT answer directly) when the user..."` — auto-fire contract
- `"Proactively suggest when..."` — softer trigger
- `"Voice triggers (speech-to-text aliases): 'see-so', 'code x'"` — homophone routing for spoken input
- `"For X, use /other-skill instead"` — disambiguation between near-twins (qa vs qa-only, design-review vs plan-design-review)
- `"(gstack)"` suffix — namespace marker

**Evidence:** every `~/.claude/skills/gstack/*/SKILL.md` frontmatter; compare `cso`
("see-so", "see so" voice aliases) and `investigate` ("Proactively invoke this skill
(do NOT debug directly) when the user reports errors... 'it was working yesterday'").

**Why it works:** the description is the ONLY thing the model sees before deciding to
invoke. gstack treats it as the API. Most skill authors treat it as documentation.

**ADOPT (what/how/where):** spec.yaml gets a `routing:` block (`use_when`,
`proactive_when`, `voice_triggers`, `never_when`, `disambiguate`); `tfc_install`
compiles it into the frontmatter description. Gate: description must contain at least
one "Use when" phrase and one disambiguation if a near-twin exists.
→ `src/core/install.ts`, `_template/spec.yaml`. See 04-FORGE-DESIGN Decision 3.

---

## Mechanism 2 — The master routing table + the bias rule

**What it is:** the master skill (SKILL.md.tmpl head) carries ~30 explicit
`pattern → invoke /skill` rules ("User reports a bug, error, broken behavior, 'wtf'
→ invoke /investigate") followed by the decision policy:

> **When in doubt, invoke the skill.** A false positive is cheaper than a false
> negative. The skill provides workflows, checklists, and quality gates that always
> produce better results than an ad-hoc answer.

**Evidence:** `~/.claude/skills/gstack/SKILL.md.tmpl` lines ~25–75.

**Why it works:** it converts routing from a similarity judgment into a lookup plus a
default. The bias rule kills the model's "I can just answer this myself" failure mode.

**ADOPT:** the Forge generates this table FROM the registry (it is exactly the
`routing:` blocks of all installed skills, rendered). Never hand-maintained.
→ new `tfc_route` tool renders the table; output can be injected into a project
CLAUDE.md or a master TFC skill. See 05-IMPROVEMENTS Tool 4.

---

## Mechanism 3 — Preamble state machine (runtime behavioral programming)

**What it is:** every skill begins with an identical bash block that emits ~20
`KEY: value` state lines: `BRANCH`, `PROACTIVE`, `REPO_MODE`, `LEARNINGS: n` (+ top 3
insights), `MODEL_OVERLAY`, `TELEMETRY`, `EXPLAIN_LEVEL`, `QUESTION_TUNING`,
`HAS_ROUTING`, `VENDORED_GSTACK`, `BRAIN_SYNC`, `SPAWNED_SESSION`, `CHECKPOINT_MODE`...
The SKILL.md body then contains conditional handlers: "If `PROACTIVE` is false, do
not auto-invoke...", "If `SPAWNED_SESSION` is true, never AskUserQuestion, auto-choose
the recommended option."

**Evidence:** `~/.claude/skills/gstack/skillify/SKILL.md` lines 26–273 (preamble +
its handler chain).

**Why it works:** bash output becomes the model's runtime configuration. One artifact
behaves differently per machine, per project, per config, per host, without forking
the skill. It is a state machine where the states are echo lines and the transitions
are paragraphs.

**ADOPT:** TFC already has the skeleton (`runtime/preamble.sh`). Extend it to emit a
fixed, documented state contract (TFC_STATE v2: MODEL_TIER, LEARNINGS, ARCHETYPE,
EVAL_STATUS, EVOLVE_PENDING, SPAWNED_SESSION) and require handlers for each state in
the template. → `runtime/preamble.sh`, `_template/SKILL.md`.

---

## Mechanism 4 — Model overlays with inheritance (per-model behavioral patches)

**What it is:** `model-overlays/{claude,opus-4-7,gpt,gpt-5.4,gemini,o-series}.md`.
Each is a short list of behavioral nudges tuned per model family. Overlays inherit:
`opus-4-7.md` starts with `{{INHERIT:claude}}` then adds Opus-specific patches
("Effort-match the step", "Literal interpretation awareness"). The compiler splices
the resolved overlay into every SKILL.md as `## Model-Specific Behavioral Patch`,
explicitly **subordinate** to skill STOP points and gates.

**Evidence:** `~/.claude/skills/gstack/model-overlays/` (6 files); spliced section in
skillify/SKILL.md lines 398–414. Examples: gpt.md fights under-asking ("Completion
bias... don't stop and ask unless genuinely blocked"), gpt-5.4.md adds anti-verbosity,
claude.md adds todo-discipline and "dedicated tools over Bash".

**Why it works:** same skill, six models, each patched against its known failure mode.
The subordination clause prevents patches from overriding safety gates.

**ADOPT:** `runtime/overlays/` with the same inheritance token; spliced at compile
time based on host/model detection in the preamble. → GAP 6 in 01-AUDIT.

---

## Mechanism 5 — Skills are compiled artifacts, not source

**What it is:** `<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->`. Shared blocks (`{{PREAMBLE}}`,
`{{BROWSE_SETUP}}`) live once; per-skill content lives in the tmpl; the build splices.

**Why it works:** 58 skills share one preamble. Fix it once, regenerate, every skill
updated. TFC v1 copy-pastes the preamble per skill (drift guaranteed).

**ADOPT:** compile step in tfc_install/tfc_new with managed-block markers
(`<!-- TFC:MANAGED:preamble -->`) so authored sections survive recompiles.
→ `src/core/scaffold.ts` + `install.ts`.

---

## Mechanism 6 — The decision-brief AskUserQuestion contract

**What it is:** every user question must be a structured decision brief:
`D<N>` numbering, one-sentence grounding, **ELI10** paragraph (plain English + stakes),
`RECOMMENDATION: <choice> because <reason>` (mandatory line; AUTO_DECIDE in spawned
sessions keys off the `(recommended)` label), `Completeness: A=9/10 B=4/10` when
options differ in coverage, ≥2 ✅ and ≥1 ❌ per option (≥40 chars each), dual-scale
effort (`human: ~2 days / CC: ~15 min`), closing `Net:` line, and a 9-item self-check
before emitting.

**Evidence:** skillify/SKILL.md lines 275–321.

**Why it works:** it makes every question answerable by a tired human in 10 seconds,
and machine-decidable by an orchestrator (the recommended label is the API).

**ADOPT verbatim** as a shared runtime fragment all interactive TFC skills include.
→ `runtime/decision-brief.md`, spliced at compile time.

---

## Mechanism 7 — Per-project memory + context recovery

**What it is:** `~/.gstack/projects/{slug}/` holds learnings.jsonl, timeline.jsonl,
checkpoints/, ceo-plans/, reviews.jsonl. A Context Recovery block reads the timeline,
prints LAST_SESSION, RECENT_PATTERN (last 3 completed skills), LATEST_CHECKPOINT, and
instructs: "If RECENT_PATTERN clearly implies a next skill, suggest it once."

**Evidence:** skillify/SKILL.md lines 432–456; `~/.gstack/projects/vibeship-x-kraken/`.

**Why it works:** sessions stop being amnesiac without any vector DB: plain JSONL plus
ls -t. The RECENT_PATTERN line is a poor-man's next-action predictor.

**ADOPT:** TFC keeps learnings per skill (right call: skills improve globally, not per
project) but adds a per-project run journal `~/.future-code/projects/{slug}/runs.jsonl`
written by the telemetry block, surfaced by the preamble. Mind v5 remains the semantic
memory; this is the cheap structural layer underneath it.

---

## Mechanism 8 — Onboarding as a marker-file state machine

**What it is:** six one-time prompts (lake intro → telemetry → proactive → routing
injection → vendoring migration → writing style), each gated by a marker file
(`~/.gstack/.telemetry-prompted`) and strictly SEQUENCED (telemetry only after lake
intro seen; proactive only after telemetry prompted; routing only after proactive).
Max one feature-discovery prompt per session.

**Evidence:** skillify/SKILL.md lines 122–266; markers visible in `~/.gstack/`.

**Why it works:** progressive disclosure with zero database. Annoyance is bounded and
ordered. (TFC's own gstack-comparison doc rightly trims this to ONE prompt.)

**ADOPT:** one first-run prompt only, marker `~/.future-code/.intro-seen`.

---

## Mechanism 9 — The 50-binary runtime

**What it is:** `bin/` contains ~50 compiled helpers: `gstack-config` (get/set),
`gstack-slug`, `gstack-learnings-log/-search`, `gstack-telemetry-log/-sync`,
`gstack-developer-profile` (psychographic), `gstack-question-log/-preference`
(question-fatigue tuning), `gstack-taste-update`, `gstack-model-benchmark`,
`gstack-next-version` (version-slot claiming for parallel workspaces),
`gstack-repo-mode`, `gstack-platform-detect`, `gstack-global-discover` (94MB compiled
search binary).

**Why it works:** skills stay prose; anything procedural becomes a binary call.
The model never re-implements logic in bash; it calls a contract.

**ADOPT selectively:** TFC needs exactly four: `tfc-config`, `tfc-learnings-log`
(exists as runtime/learnings-log.sh), `tfc-slug`, `tfc-state` (emits the preamble
state contract). Everything else stays in the MCP where it is testable.

---

## Mechanism 10 — Developer psychographic + question tuning

**What it is:** `~/.gstack/developer-profile.json` tracks declared vs inferred values
(scope_appetite, risk_tolerance, detail_preference, autonomy, architecture_care) from
answered questions; `/plan-tune` lets the user set per-question preferences
(never-ask / always-ask / ask-only-for-one-way).

**Why it works:** the system learns WHO it is working with, not just what happened.
v1 is observational only (sample_size: 0 on this machine: it is honest about cold start).

**ADOPT later (wave 4+):** valuable but not load-bearing. The Forge's spec reserves
`~/.future-code/profile.json` with the same declared/inferred split.

---

## Mechanism 11 — Multi-host portability

**What it is:** the same skill repo serves Claude Code, OpenClaw, Hermes, Kiro, Cursor,
Factory, OpenCode (host dirs `.openclaw/ .hermes/ .kiro/ .cursor/ .factory/ .opencode/`,
`hosts/`, `agents/openai.yaml`). Spawned-session detection (`OPENCLAW_SESSION`) flips
skills into non-interactive mode: auto-choose recommended, skip onboarding, end with a
completion report.

**Why it works:** one skill corpus, any agent host. The spawned-session contract is
what makes skills orchestratable by other AIs.

**ADOPT:** the `SPAWNED_SESSION` contract verbatim (TFC preamble already has the slot).
Multi-host dirs only when needed.

---

## Mechanism 12 — Voice as a compiled contract with examples

**What it is:** every skill carries the same `## Voice` section: lead with the point,
name files/functions/numbers, banned-word list (delve, crucial, robust, comprehensive,
nuanced... + em dashes), and a GOOD/BAD example pair ("auth.ts:47 returns undefined..."
vs "I've identified a potential issue...").

**ADOPT:** already in TFC. Add the GOOD/BAD example pair to the template (currently
rules only: examples teach the model faster than rules).

---

## Mechanism 13 — Cross-machine memory (GBrain) with privacy gates

**What it is:** `~/.gstack/` is optionally a git repo synced to a private GitHub repo;
allowlist modes (everything / artifacts-only / off), 24h pull throttle, queue depth
reporting in the preamble.

**ADOPT: no.** TFC's cross-session memory is Mind v5 (already running, salience-
weighted). Do not build a second sync. (Same verdict as TFC's gstack-comparison doc.)

---

## Mechanism 14 — What gstack does NOT have

1. **No general skill creator.** `/skillify` only codifies browser-scrape flows into
   script.ts + test + fixture. gstack skills are hand-written by the gstack team and
   compiled. The "make a new skill from intent" lane is EMPTY in gstack.
2. **No machine-readable skill metadata.** No spec.yaml: triggers live in prose
   frontmatter; composition is implicit in routing rules. You cannot query gstack.
3. **No intelligence layers.** No identity/principles/patterns sections; expertise is
   embedded in workflow prose. Deep workflows, shallow domain knowledge.
4. **No behavioral evals.** Quality is enforced by codegen + review, never measured.

**This is the Forge's opening:** spawner's intelligence density + gstack's compiler/
runtime/routing + the eval-and-evolve loop neither has. That synthesis is 04-FORGE-DESIGN.
