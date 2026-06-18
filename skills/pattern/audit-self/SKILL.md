---
name: audit-self
version: "3.1.0"
description: |
  7-block pre-execution self-audit that forces the Kraken-OS orchestration layer to fire BEFORE any file edit or execution command.
  Built from a 5-whys + via-negativa analysis of an observed bypass (2026-05-12, source: audit.md, think sessions 1778598541307 + 1778598577720).
  Forces inventory-first then terse-execution: verbose during BLOCKS 1–6, terse from BLOCK 7 onward.
  Treats read-only discovery (agent_registry, list_frameworks, kraken_list_personas, spawner_skills.search, mind_retrieve) as ALWAYS-ON — they cost one tool call each and are not subagent spawns.
  Use before any non-trivial task or whenever the user invokes "kraken os" / "use the system" / a ≥2-domain request.
argument-hint: '"the user task to audit before executing"'
user-invocable: true
triggers:
  - "audit yourself"
  - "kraken os"
  - "use the system"
  - "think before you act"
  - "fix all"
  - "go through whole system"
  - "what should I do about"
---

<!-- TFC:PREAMBLE-HOOK START -->
## TFC Runtime Hook (managed — do not edit; tfc_install regenerates this block)

Run this first. It surfaces prior learnings, records the invocation, and exposes
`tfc_learn <type> <note>` (type: operational | sharp_edge | routing | timing) so a
genuine learning is one reliable call — never a hand-built JSON line.

```bash
_TFC_RT="${TFC_HOME:-$HOME/.future-code}/mcp/tfc-builder/runtime"
[ -f "$_TFC_RT/preamble.sh" ] && source "$_TFC_RT/preamble.sh" "pattern" "audit-self"
```
<!-- TFC:PREAMBLE-HOOK END -->

# AUDIT-SELF — Discovery Gate for Kraken-OS

> The orchestration layer has every part it needs. What was missing is a GATE
> that forces inventory before execution. This skill IS the gate.
>
> **Axiom:** Discovery is the gate, not a phase. Terseness applies during execution, not during discovery.

## Preamble (run first)

Before BLOCK 1, load the state the audit reasons over. This runs first, every invocation:

- **Route state:** read `~/.kraken/current-route.json` (what the hooks computed this prompt: level, pack, agent, capability). BLOCK 3 reconciles against it, so load it now to give the reconciliation a baseline.
- **Live map reachability:** confirm this skill's own `bin/discover-system.sh` resolves relative to this SKILL.md's directory, not a hardcoded project tree. If absent, BLOCK 2 degrades to targeted MCP only and says so.
- **Identity:** this is the P20 discovery gate. It precedes domain-pack execution; it does not replace it.

## When to invoke

- User says "kraken os", "launch kraken", "use the system", "go through whole system", "fix all", "what should I do about", "audit yourself"
- Any task spanning ≥2 domains (code-fix + ops, design + frontend, security + data, etc.)
- Any task with destructive blast radius (push, deploy, drop, delete, write-to-shared-infra)
- Any task touching auth, secrets, trust boundaries, event validation, memory writes
- Start of any session where the user hands a multi-step request

Do **not** invoke for L1 trivia (single-file rename, single-line tweak, a one-off lookup).

## The protocol — 7 blocks, run in order

### BLOCK 1 — INTENT DECODE
Quote the user's request **verbatim**, then name:
- **(a) Primary domain** — `code-fix | new-feature | debugging | research | content | design | security | data | ops | docs | strategy`
- **(b) Secondary domain** if mixed
- **(c) Verb-class** — `build | fix | audit | explore | decide | ship | verify | synthesize`

→ output `BLOCK_1_DONE: domain=[X], verb=[Y]` before continuing.

### BLOCK 2 — INVENTORY SWEEP (live map first, then targeted MCP)
**Step 1 — run the live system map (one command, read-only, ~instant):**

```bash
# resolve bin/ relative to THIS skill's own dir; never hardcode a sibling project (the old ~/comeback path fossilized)
AUDIT_SELF_DIR="${AUDIT_SELF_DIR:-$HOME/vibeship-x-kraken/.claude/skills/audit-self}"
bash "$AUDIT_SELF_DIR/bin/discover-system.sh"
```

This prints the CURRENT system **from disk** — every MCP server, pack, hook, skill,
persona, Spark module, bin, route-state, and service, with a one-line CENSUS at the top.
It cannot fossilize: a count that looks wrong is a disk fact that changed, not a stale edit
in this file. **Quote the CENSUS line + the sections relevant to this task.** Never
hand-maintain tool counts in this SKILL.md — that is the exact failure v3.0 deletes.

**Step 2 — targeted MCP deep-dive (only the calls THIS task needs):**

```python
mcp__spawner__spawner_skills(action="search", query="<domain keywords>")          # the right skill
mcp__mind__mind_retrieve(user_id="550e8400-e29b-41d4-a716-446655440000", query="<request>")
mcp__kraken__agent_registry(action="recommend", taskDescription="<request>")       # [kraken — opt-in]
```

These are **read-only discovery calls** — one tool call each, not a subagent spawn. The
"be terse / don't spawn agents" prior does NOT apply here.

**Evidence:** paste the one-line CENSUS from the live map plus the search hit that named your route. No CENSUS quoted means BLOCK 2 did not actually run.

→ output `BLOCK_2_DONE: inventory surveyed ([N] MCP · [N] packs · [N] hooks from live map)` before continuing.

### BLOCK 3 — ROUTE (gate → router: the routing decision, not just a plan)
This is what makes v3.0 a **router**, not just a gate. Using the live map (BLOCK 2) + the
ROUTING SHAPE, emit the concrete routing decision for THIS task — and reconcile it with the
route the hooks already computed.

**Step 1 — read what the hooks already decided this prompt:**
```bash
jq -r '"hook route → L=\(.level) pack=\(.pack_id) \(.pack_title) agent=\(.agent) cap=\(.capability_tier) chain=\(.chain_skill_first) autoskill=\(.pairs_skill)"' ~/.kraken/current-route.json
```

**Step 2 — emit the ROUTE TABLE** (match the pack by MEANING against the live PACKS list; the hook's `pack_id` is a HINT that can misfire — see CLAUDE.md "pack is a GUESS"):
```
ROUTE: P## <title>   — <agree with hook | OVERRIDE: reason>   # ← this literal `ROUTE: P##` line is the token kraken-route-grade.sh measures for adoption — never omit it
  TASK          = "<one-line task>"
  SKILL-CHAIN   = [/skillA @Lx, /skillB @Ly]      (from the pack's skill_chain, level-gated)
  PERSONA       = <persona>      FRAMEWORK = <framework>
  AGENT · MODEL = <agent> · <Opus|Sonnet|Haiku>   (why this tier)
  MCP / BINS    = <exact MCP tools / kraken-* bins this task calls>
  HOOKS FIRING  = <which of the 14 hooks gate this work — wave-guard on first L2+ edit, skill-gate if AUTO-SKILL, route-grade on close>
  SCANNER       = yes/no   (yes if any trust/auth/secrets/event-validation path — see BLOCK 4)
  SUPPORTING    = [skills/subagents]   PARALLEL VERIFIER = <optional subagent>
```

**Reconcile rule (the honest-router contract):** if your ROUTE disagrees with the hook's
`current-route.json` pack, say so in one line and state which you follow and why. The model
routes by *meaning*; the hook is a *regex hint*. Agreement is logged; an override is the
system working as designed, not a violation.

**Evidence:** quote the `current-route.json` line you read in Step 1 next to your chosen ROUTE, so agreement or override is visible rather than asserted.

→ output `BLOCK_3_DONE: routed → P##, [N]-skill chain, <agent>·<model>` before continuing.

### BLOCK 4 — RISK + SCOPE GATES
Name destructive blast-radius operations in scope:
- `push | force-push | deploy | drop | delete | write-to-shared-infra | post-to-Slack/GitHub | scanner-against-prod`

For each: do I have **explicit authorization** in the user's message, or do I **confirm first**?

**STOP** if a destructive op has no authorization: surface it and get explicit sign-off before BLOCK 5 plans it. An unauthorized destructive op never reaches the plan.

Name security-adjacent paths in scope:
- auth, secrets, trust boundaries, event validation, memory writes

If any security path is touched → `scanner_scan` goes in BLOCK 5.

→ output `BLOCK_4_DONE: risks named, [N] destructive ops, [N] security paths` before continuing.

### BLOCK 5 — PLAN
2–8 numbered steps. Each step names the tool/skill/agent.
State which steps are **independent (parallel-eligible)** vs **sequential**.
State stopping/verification criteria for each step.

→ output `BLOCK_5_DONE: [N] steps, [P] parallel, [S] sequential` before continuing.

### BLOCK 6 — MEMORY PRECOMMIT (+ close the routing loop)
State what you will **WRITE to memory after success**:

- `mcp__mind__mind_remember(...)` — outcome-weighted, with `content_type` and `temporal_level` chosen
- `mcp__spawner__spawner_remember(...)` — project decision + issue + session_summary
- `mcp__kraken__memory_remember(...)` — ONLY IF entity-graph relationships are involved

Write **all three** when they each carry distinct information. Never substitute one for another.

**Close the routing loop (V4 — the route must learn from its own outcome):**
- `mind_decide(user_id=…, memory_ids=[…the BLOCK 2 mind_retrieve memories…], decision_summary="routed → P##", outcome_quality=<-1..1>, outcome_signal="task_completed")` — reuse the `retrieval_id` from BLOCK 2 so the memories that informed the route gain/lose salience.
- `~/vibeship-x-kraken/bin/kraken-outcome --task "<task>" --quality <-1..1> --notes "…"` — appends the decisions ledger (pack/level auto-filled from `current-route.json`).
- The **adoption** signal is automatic: because BLOCK 3 emits a `ROUTE: P##` line, `kraken-route-grade.sh` (Stop hook) already writes one graded row to `route-outcomes.jsonl` this turn — do NOT write it yourself (one row per turn by design).

→ output `BLOCK_6_DONE: memory writes precommitted + loop-close named` before continuing.

### BLOCK 7 — CONFIRM
End with the literal string:

```
Audit complete. Proceed?
```

**STOP.** Do not start executing until the user confirms or overrides. This is the gate: the audit produces a plan, never an edit.

→ output `BLOCK_7_DONE: awaiting confirmation` and halt.

---

## After execution — POST-AUDIT block

Once execution finishes, append:

- **Honored / skipped:** which blocks did you actually honor? Which did you skip and why?
- **Anti-pattern fallen into:** name one anti-pattern from the table below you fell into (or "none observed").
- **ROUTE CLOSE (V4 — the loop):** fire the BLOCK 6 outcome calls now — `mind_decide(...)` on the BLOCK 2 memories + `bin/kraken-outcome --quality <-1..1>`. State the `outcome_quality` and why. (Adoption was already graded by the Stop hook from your `ROUTE: P##` line.)
- **Feedback artifact:** if you found a new anti-pattern, save `feedback_*.md` to `~/.claude/projects/-home-roshish-vibeship-x-kraken/memory/`.

---

## Completion status

Every run ends in exactly one declared state:

- **DONE:** the 7 blocks ran (or were honestly skipped for an L1 task) and BLOCK 7 halted for confirmation; after execution the POST-AUDIT loop-close fired. Emit `SKILL_COMPLETE` (see Completion token below).
- **BLOCKED:** discovery could not complete. The live map script is missing, the Mind API is down, or a required MCP is unreachable. Say which, run whatever discovery still works, and route the task without the missing layer rather than abandoning the gate.
- **NEEDS_CONTEXT:** the task is too ambiguous to route (no clear domain or verb after BLOCK 1). Ask exactly one grounding question, then resume at BLOCK 1.

## Telemetry (run last)

The route learns from its own outcome. After execution the loop-close writes three surfaces:

- `route-outcomes.jsonl`: one graded adoption row per turn, written automatically by `kraken-route-grade.sh` (the Stop hook) because BLOCK 3 emitted the literal `ROUTE: P##` line. Do not write it yourself.
- `mind_decide(...)` on the BLOCK 2 memories, plus `bin/kraken-outcome --quality <-1..1>`: the BLOCK 6 outcome calls, fired in POST-AUDIT.
- a `learnings.jsonl` row when a new anti-pattern surfaces, also saved as `feedback_*.md` to the project memory dir.

Telemetry is always-run and config-gated (opt-out, not opt-in): the gate measures itself, so a misroute becomes a graded signal instead of a silent miss.

---

## WHY THIS WORKS — design rationale

**Root cause (from 5-whys session `think_1778598541307`):** CLAUDE.md describes WHAT the system has but not the WHEN of orchestration — and it described it with *frozen counts that fossilized* (it said "60+ tools / 6 frameworks" while disk now holds 10 MCP servers, 24 packs, 14 hooks). The Kraken trigger words gate vault/memory only; the THINK/PERSONA/AGENT_REGISTRY layer has no documented trigger. Combined with the strong "be terse / don't spawn agents" prior, direct execution wins by default — even when the user clearly invokes the system. **v3.0 fix:** BLOCK 2 no longer *describes* the system from memory; it *discovers* it from disk every run (`bin/discover-system.sh`), so the map can never drift from reality.

**Most leveraged behavioral flip (from via-negativa session `think_1778598577720`):** Invert "be terse from the first tool call" → "discovery-first, then terse execution." One flip unlocks every downstream tool because the inventory pass auto-surfaces the right agent/framework/skill.

---

## 8 ANTI-PATTERNS THIS PROMPT KILLS

| # | Anti-pattern | Success principle |
|---|--------------|-------------------|
| 1 | "Pre-digested input ⇒ skip orchestration" | Even with a perfect audit/plan, persona/agent choice still matters |
| 2 | "Be terse from word one" | Terseness applies during execution, not during discovery |
| 3 | "Don't spawn agents unless asked" applied to READ-ONLY discovery | `agent_registry`, `list_*`, `get_persona_capabilities` cost one tool call each — not a subagent spawn |
| 4 | Kraken DEFAULT-OFF mistakenly applied to think/persona/registry | DEFAULT-OFF gates vault/affine/life-OS only; orchestration tools are always-on once invoked |
| 5 | Abandon a tool family on first error | Tool errors trigger lookup (find the UUID, fix the schema), not abandonment |
| 6 | Skip scanner because "it's just a fix, not a /ship" | Any commit on trust/security/auth/event-validation paths gets a scanner pass |
| 7 | Linear single-thread execution when checks are independent | Subagent verification while you run tests = free parallelism |
| 8 | Substitute spawner_remember for mind_remember when UUID is blocked | Mind = outcome-weighted temporal salience; Spawner = project state. Both, not one |

---

## ROUTING SHAPE — durable method, live tools

> The exhaustive "which tools/skills exist" lists used to live here and **fossilized** —
> they implied ~6 MCP servers and 0 packs while disk holds 10 servers, 24 packs, 14 hooks.
> That inventory now comes from BLOCK 2's live map. What stays here is the **durable method
> shape**: domain → reasoning mode + agent tier + first move. The *current* tools/skills/packs
> behind each cell are in the live map — read it, don't trust a frozen list.

| Domain | Framework (method) | Agent · tier | First move | Live surface → discover map |
|---|---|---|---|---|
| code-fix / debugging | 5-whys | scientist · Opus | /investigate | PACKS(P04) · scanner if trust-path |
| new-feature / build | 5-step-algorithm | architect→builder · Opus→Sonnet | /office-hours → /plan-eng-review | PACKS(P05) · MCP(idearalph) |
| research / synthesize | first-principles | research/deep · Sonnet | /knowledge-pipeline | PACKS(P08) · MCP(exa, duckduckgo) |
| design / content | — | UX/UI · Sonnet | /design-consultation | PACKS(P13) · /design-* skills |
| security / pre-ship | via-negativa | scientist · Opus | /cso | PACKS(P18) · MCP(vibeship-scanner) · /careful /guard |
| decide / strategy | swot / pros-cons | oracle/ultrathink · Opus | /realthink | PACKS(P15) · /think-pipeline |
| ops / health | — | status · Haiku | /health | bins(kraken-*) · /retro |
| learn / teach | first-principles | deep · Sonnet | /deep-understanding | PACKS(P16) |
| multi-domain / vague | decode first | per kraken-flow | /kraken-flow | PACKS(P00/P09) · the **ROUTE block** below |

Framework reference (6 core + 5 KM live in `packs.yaml meta.valid_frameworks`):
5-whys (root-cause) · via-negativa (remove>add) · 5-step-algorithm (Question→Delete→Simplify→Accelerate→Automate, ORDER matters) · first-principles (rethink) · swot (multi-option) · pros-cons (low-stakes).

Agent tiers (live registry: `agent_registry`): Opus = ultrathink/architect/scientist/oracle · Sonnet = builder/workflow/deep/research · Haiku = tactical/status. Escalate tactical→scientist/architect/builder; delegate ultrathink→architect→builder.

---

## KNOWN GOTCHAS

- **Mind UUID format:** if `mind_retrieve(user_id="krakenogra@gmail.com")` errors with "badly formed hexadecimal UUID string", look up the canonical UUID via the Mind API or earlier `mind_remember` records — do not abandon the tool family. Cached UUID is documented in `memory/project_mind_postgres_degraded.md` when present.
- **Spawner skills index is 3219 lines** — never call `action="list"` without a `query` filter; the response will exceed token limits. Always use `action="search"` with a domain keyword.
- **Kraken DEFAULT-OFF in CLAUDE.md** applies to vault / affine / life-OS / entity-graph tools only. `kraken__think_*`, `kraken__kraken_*persona*`, `kraken__agent_registry`, `kraken__list_*`, `kraken__memory_remember` for insights are ALWAYS-ON once orchestration is invoked.

---

## Completion token

When BLOCK 7 has fired and the user has confirmed (or you have proceeded under explicit prior authorization), continue with the named PLAN and at the end output:

```
SKILL_COMPLETE: audit-self | [domain] [verb] — [N] BLOCKS honored, POST-AUDIT logged
```

---

## Orchestrator Interface
> When loaded by an orchestrator (kraken-os, kraken-unified), execute ONLY this section.

**Purpose:** Run the 7-block pre-execution self-audit as a sub-protocol of a larger pipeline.
**Trigger:** When kraken-os Phase 0 fires on an L2+ task, OR when any orchestrator detects a multi-domain user request.

**Condensed audit (compressed for orchestrator):**
1. BLOCK 1 — name domain + verb
2. BLOCK 2 — fire 5 read-only inventory calls in parallel
3. BLOCK 3 — ROUTE: pack + skill-chain + agent·model + hooks-firing + scanner-if-trust (reconcile vs `current-route.json`)
4. BLOCK 4 — list destructive ops + security paths
5. BLOCK 5 — 2–8 step plan with parallel/sequential markers
6. BLOCK 6 — precommit mind_remember + spawner_remember + (maybe) kraken_memory_remember
7. BLOCK 7 — "Audit complete. Proceed?" and halt

**Inputs:** Raw user request from orchestrator context.
**Outputs:** A named orchestration choice + a 2–8 step plan + an explicit confirmation gate.
**Context overhead:** ~60 lines (this section only — do not load full SKILL.md).

---

*Source: audit.md (2026-05-12), generated from think sessions `think_1778598541307` (5-whys) + `think_1778598577720` (via-negativa). Installed into Kraken-OS as the missing discovery gate.*
