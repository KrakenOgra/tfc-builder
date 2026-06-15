# 08 — TFC v3 "The Living Lane" — Agent Build Handoff

> **Audience:** an autonomous coding agent (LLM) with no prior context on TFC.
> **Purpose:** everything required to implement v3 *without asking a human* — exact paths, exact
> signatures, exact schemas, exact VERIFY commands, and the invariants that must not break.
> **Authority:** full breaking-change authority on `mcp/tfc-builder/` per the standing TFC charter —
> EXCEPT the v2 invariants INV-1..INV-6, which are load-bearing and carry forward unchanged.
> **Source of this plan:** `docs/forge/07-V2-SKILL-EVOLUTION-OS.md` (the v2 build) + a fresh
> disk re-ground of the *as-built* system on **2026-06-15** (see §1 and §7).
> **Written:** 2026-06-15. **Ground-truth verified against disk the same day** (every number below
> was recomputed via `tfc_list` / `tfc_doctor` / `find`, not quoted from the v2 doc).

---

## 0 — HOW AN AGENT SHOULD READ THIS DOC

1. Read this section, then `## CURRENT STATE`, then `## INVARIANTS` **before writing any code**.
   Breaking an invariant is the only way to fail this build; everything else is recoverable.
2. Pick the **lowest-numbered unfinished wave** in `## WAVE PLAN`. Waves are strictly ordered and
   each is independently shippable. Do **not** start Wave N+1 before Wave N's VERIFY passes.
3. For the wave you picked, the spec gives you: **GOAL · VECTORS · FILES · SIGNATURES · ALGORITHM ·
   DOGFOOD · VERIFY · ROLLBACK · DONE**. Implement top-to-bottom.
4. **Re-ground before trusting any number.** §1 and §7 give the exact commands. **Never quote a lane,
   a score, or a count you did not just recompute from disk** — this rule is itself a v2 deletion
   (07 §6 #10), dogfooded again here: this doc's v2-era "5 skills" became **7** when re-grounded.
5. When done, run the wave's VERIFY commands, paste their output into your PR/commit body, and append
   one line to `analytics/waves.jsonl` (schema in 07 §9.1 — `exit_gate.target` is a **lane/artifact**
   target, never `tfc_score ≥ N`).

**The single mental model — what changed from v2 to v3:**

> **v2 proved the loop CAN run** (one skill went `authored → eval_proven → evolution_proven`, with
> the proof on disk and recomputable after restart). **v3 makes the loop run CONTINUOUSLY and at
> PORTFOLIO SCALE.** The lane stops being a badge a skill earns once and becomes a *living* state:
> fed by every real invocation, blocked when a skill is unreachable, and *perishable* — proof has a
> freshness horizon, because good-once is not good-now.

If a change does not help the *whole portfolio* of skills *stay* in a provably-current lane, it is
out of scope for v3.

---

## CURRENT STATE

**Re-grounded 2026-06-15 from `~/.future-code` (do not trust; re-run §7's commands).**

### The system is built and the v2 CRUX is dissolved

All six v2 waves shipped. The flagship loop has run end-to-end on a real skill, leaving proof on
disk that a stranger can recompute after a restart:

| Fact | Value (disk-recomputed 2026-06-15) | Source |
|---|---|---|
| MCP tools registered | **15** | `grep -oE 'tfc_[a-z_]+' src/tools/registry.ts \| sort -u` |
| Skills on disk | **7** (was 5 at v2 write-time) | `tfc_list` |
| Lane distribution | **4 `authored` · 2 `eval_proven` · 1 `evolution_proven`** | `tfc_list` |
| `eval-report.json` files | 3 (genius-ai, vague-to-system, intent-to-goal) | `find skills -name eval-report.json` |
| `CHANGELOG.jsonl` files | 2 (genius-ai, vague-to-system) | `find skills -name CHANGELOG.jsonl` |
| Non-empty `learnings.jsonl` | **1** (vague-to-system only) | `find skills -name learnings.jsonl -size +0c` |
| Lane-cache drift / stray state | **0 / 0** (INV-6 holds) | `tfc_doctor` |

**The 15 tools** (the v3 surface to extend, never replace): `tfc_brainstorm`, `tfc_compile`,
`tfc_doctor`, `tfc_eval`, `tfc_evolve`, `tfc_generate`, `tfc_install`, `tfc_lane`, `tfc_list`,
`tfc_migrate`, `tfc_new`, `tfc_pack_bridge`, `tfc_register`, `tfc_score`, `tfc_validate`.

**The 7 skills and their disk-recomputed lanes:**

```
ai/ai-code-generation      authored          claudeLink: ok
ai/genius-ai               eval_proven       claudeLink: CONFLICT   ← route broken
ai-video/video-prompting   authored          claudeLink: MISSING    ← route broken
learning/learn-itr         authored          claudeLink: ok
pattern/genesis            authored          claudeLink: MISSING    ← route broken
pattern/intent-to-goal     eval_proven       claudeLink: ok
pattern/vague-to-system    evolution_proven  claudeLink: ok         ← the closed arc
```

**The proof the arc closed** — `vague-to-system/CHANGELOG.jsonl` (verbatim):
```json
{"ts":"2026-06-14T22:33:30Z","from_version":"1.0.0","to_version":"1.1.0","learnings_consumed":["e441716c9283","014c39ef842e","83e4f32797a6"],"pre_eval_score":0.75,"post_eval_score":1.0,"delta":0.25,"sections_touched":["Phase 1 — CLASSIFY","Phase 4 — ROUTE"]}
```
A real, measured +0.25 improvement that consumed three learnings and bumped the version. This is the
v2 definition-of-done, satisfied.

### As-built divergences from the v2 plan (07) — read these before coding

The shipped system is **richer than 07 described**. Do not assume 07's `src/` tree is current:

- **`core/` has 23 modules**, including ones 07 never specified: `telemetry.ts` (a `RunRecord`
  `{skill,tool,duration_ms,outcome,ts}` appended to `analytics/`), `tokens.ts` (placeholder
  substitution for scaffolds), `authoring.ts` (composes **8** prompt fragments: voice, identity,
  principles, patterns, antipatterns, quick-wins, handoffs, stack), plus `compile.ts`, `packbridge.ts`,
  `scaffold.ts`, and a `mappers/` subdir.
- **Prompt fragments moved into `core/prompts/`** (07 expected a top-level `src/prompts/`; that path
  is empty). Look in `core/prompts/*.fragment.ts`.
- **`runtime/` is populated** (`preamble.sh`, `learnings-log.sh`) — 07's ground-truth G5 said it was
  empty; that was true at v2 write-time, false now.
- **7 skills, not 5** — `ai/genius-ai` and `pattern/intent-to-goal` were authored after the v2 doc.

### The three open gaps v3 exists to close (each disk-grounded, not asserted)

1. **The loop's INPUT side is effectively dead.** `analytics/runs.jsonl` is empty and only **1 of 7**
   skills has a non-empty `learnings.jsonl` — and that one was seeded for the v2 dogfood, not produced
   by accumulated real invocations. The runtime hooks (`preamble.sh`, `learnings-log.sh`) exist but
   are not firing on real use. **Consequence:** six of seven skills have nothing to evolve *from*, so
   `evolution_proven` cannot scale past the single dogfooded skill. (This is v2's CRACK-A, still open.)
2. **The ROUTE layer is broken for 3 of 7 skills.** `tfc_doctor` flags `skill-symlinks` for
   `genius-ai` (conflict), `video-prompting` (missing), `genesis` (missing). A skill that is not
   reachable from `~/.claude/skills` cannot be invoked → cannot accumulate learnings → cannot evolve.
   Link rot silently strangles the loop. Note `genius-ai` is `eval_proven` yet **unreachable** — a
   lane that lies about usefulness.
3. **The lane is a one-time badge with no decay.** Once a skill reaches `eval_proven`, it stays there
   until a human bumps `spec.version`. There is no freshness horizon, no scheduled re-proof, no
   portfolio-level view of which proofs are aging. `evolution_proven` is minted once and never
   re-earned. **Good-once is treated as good-forever.**

These three gaps ARE the v3 mandate. Everything in `## ENHANCEMENT VECTORS` and `## WAVE PLAN` traces
to one of them.

---

## ENHANCEMENT VECTORS

v3 carries forward v2's five vectors (V1 earned-lane, V2 loop-is-the-spine, V3 local-first proof, V4
deterministic recompute, V5 one currency) and **sharpens each into a continuous, portfolio-scale
form.** Cite the matching `Wnn` vector in every wave.

- **W-V1 — Continuous capture over one-shot dogfood.** `learnings.jsonl` must grow because skills
  *run*, not because a builder seeded it during a wave. The loop's input side fires on every real
  invocation. *(Closes gap #1. Builds on v2 V2.)*

- **W-V2 — Route integrity is a lane PRECONDITION.** A skill that is not reachable cannot earn or keep
  a lane. `unreachable` is a lane-blocking state surfaced by `doctor` and repairable in one command.
  Evidence that a skill is *invokable* is part of the proof it is good. *(Closes gap #2. New in v3.)*

- **W-V3 — Proof is perishable; lanes decay.** `eval_proven` and `evolution_proven` carry a freshness
  horizon. A proof older than its horizon is reported `stale` and the *effective* lane drops toward
  `authored` until re-proven. Decay is computed at READ time from recorded timestamps vs an explicit
  `as-of` — **never baked into the core verdict** (that would break V4 determinism — see INV-7).
  *(Closes gap #3. New in v3.)*

- **W-V4 — Portfolio currency, not per-skill badge.** The ecosystem reads ONE rollup: lane histogram,
  decay pressure, evolve-readiness, and pack-floor violations — a single disk-recomputed health
  surface. Extends `packbridge` + `doctor` from per-skill flags to a portfolio verdict. *(Sharpens
  v2 V5.)*

- **W-V5 — Stability of the JUDGED run, not just the gate.** The eval *gate* (`lane-gate.sh`) is
  already deterministic, but the eval *run* is Claude-driven and therefore non-deterministic. v3 adds
  N-sample replay so a single lucky/unlucky run cannot mint or revoke a lane — promotion requires the
  behavioral score to be *stable* across samples, not high in one. *(Hardens v2 V3 against
  eval-theater's twin, eval-variance.)*

Every vector preserves **INV-1 (no API key)**: capture is a bash append, decay is timestamp math,
replay is Claude-as-engine N times with bash aggregating variance, portfolio is a disk rollup. None
reach for a model API.

---

## NEW TOOLS

Five new tools, each added by the **exact v2 "add a tool" recipe** (07 §4.1 — reproduced in
`## HANDOFF CONTEXT`): schema → core fn returning `Result<T>` → handler (`safeParse` → core) →
`registry.ts` `ToolDef` → mirrored `cli.ts` command → `npm run build` → restart Claude Code. Every
core fn returns `Result<T>` (INV-2) and routes disk paths through `safeJoin`/`skillDir`.

### 1. `tfc_capture` — wire + verify continuous learnings capture *(Wave 1, W-V1)*
- **Core:** `core/capture.ts` → `wireCapture({category,name})` → `Result<{injected:boolean, hookPath:string}>`
  and `auditCapture()` → `Result<{skill:string, neverInvoked:boolean, learningsCount:number}[]>`.
- **What it does:** confirms (and, if missing, re-injects) the `runtime/preamble.sh` hook into each
  installed `SKILL.md` so a real invocation appends one `learnings.jsonl` line + one `runs.jsonl` row.
  `auditCapture` reports which skills have `neverInvoked: true` (empty `learnings.jsonl` AND zero
  `runs.jsonl` rows). **It never writes a learning itself** (INV-8) — it only wires the path.
- **INV-1:** pure bash hook + file append; no API.

### 2. `tfc_relink` — repair route integrity in bulk *(Wave 2, W-V2)*
- **Core:** `core/relink.ts` → `repairLinks({category?,name?,dryRun?})` → `Result<{repaired:string[], conflicts:string[]}>`.
- **What it does:** turns `doctor`'s `skill-symlinks` finding into one action — recreate missing
  `~/.claude/skills/<name>` and `~/.spawner/skills/<cat>/<name>` links, and report (never silently
  overwrite) `conflict` cases for human decision. Keeps `dryRun` (INV-3).
- **Lane coupling:** `recomputeLane` gains a `reachable` input; an unreachable skill is reported with
  `effectiveLane: "blocked"` while its *earned* lane is preserved on disk (truth is not destroyed —
  the skill is just gated from being *counted* until reachable).

### 3. `tfc_decay` — perishable-proof read overlay *(Wave 3, W-V3)*
- **Core:** `core/decay.ts` → `laneAsOf({category,name, asOf:string})` → `Result<{lane, effectiveLane, ageDays, horizonDays, stale:boolean}>`.
- **What it does:** reads the **recorded** `eval-report.json.ts` (and latest `CHANGELOG.jsonl.ts`),
  compares against an **explicit `asOf` timestamp the caller passes in** and a `freshness_horizon`
  declared in `spec.yaml`, and reports whether the proof is `stale`. If stale, `effectiveLane` drops
  one rung (`evolution_proven → eval_proven → authored`); the on-disk earned lane is untouched.
- **INV-7 (critical):** `core/lane.ts::recomputeLane` stays a **pure function with no `Date.now()`**.
  Decay is a *separate, as-of* computation layered on top — never inside the core verdict. This keeps
  v2's V4 determinism guarantee (two runs are byte-identical) intact.

### 4. `tfc_replay` — N-sample eval stability *(Wave 4, W-V5)*
- **Core:** `core/replay.ts` → `buildReplayPrompt({category,name, samples:number})` →
  `Result<{prompt, reportGlob, aggregateCmd}>`; `runtime/replay-aggregate.sh` reduces N
  `eval-report.*.json` to `{mean, stdev, min, stable:boolean}` (`stable` = `stdev ≤ 0.05` AND
  `min ≥ pass_threshold`).
- **What it does:** Claude runs the same golden-task eval prompt `samples` times (Claude is the engine
  — INV-1), bash aggregates variance. Promotion to `eval_proven`/`evolution_proven` may require
  `stable: true`, so one lucky run can't mint a lane and one unlucky run can't revoke it.
- **Eval-theater note:** still scores ONLY observable `must`/`must_not` strings (07 §6 #4); replay
  guards *variance*, not *vibes*.

### 5. `tfc_portfolio` — the one-currency rollup *(Wave 5, W-V4)*
- **Core:** `core/portfolio.ts` → `rollup({asOf?})` → `Result<{histogram, decayPressure, evolveReady, belowFloor}>`.
- **What it does:** one disk-recomputed surface: lane histogram across all skills, count of `stale`
  proofs (decay pressure), skills with ≥3 unconsumed learnings (`evolveReady`), and pack pairings
  below their declared `min_lane` (reusing `packbridge`, read-only). Replaces "eyeball `tfc_list`"
  with a portfolio verdict. May surface as `tfc_doctor --portfolio` rather than a separate tool if the
  builder prefers fewer entry points — that is a judgment call left to the implementing agent.
- **INV-6:** reads only existing contract files + Mind; introduces **no new state store**.

---

## MARKDOWN-AS-CODE

This is the doctrine that makes everything above safe — and the rule every new v3 artifact must obey.

**The principle:** in TFC, a skill's *behavior contract and its evidence ARE plain-text files* —
`spec.yaml`, `SKILL.md`, `evals.yaml`, `eval-report.json`, `CHANGELOG.jsonl`, `learnings.jsonl`. There
is no compiled binary state, no opaque database, no score cached in a service. The lane is a **pure
function over these text files** (`core/lane.ts::recomputeLane`), so "is this skill good?" is answered
by *reading and recomputing*, not by *trusting a stored number*. The files are the program; the tools
are just deterministic readers and disciplined writers of them.

**Why it matters for v3:** every gap in `## CURRENT STATE` is a gap in a *file*, visible and diffable:
an empty `learnings.jsonl` literally *is* the dead loop; a missing symlink *is* the broken route; an
old `eval-report.json.ts` *is* the perishing proof. Because the evidence is markdown/yaml/jsonl, the
fixes are auditable line-by-line and reversible by `git revert`.

**The five rules every v3 artifact MUST follow (enforced in review):**

1. **Plain text or it doesn't exist.** New evidence is `.yaml` / `.json` / `.jsonl` / `.md` in the
   skill directory — never a `.db`, `.sqlite`, or in-memory cache (INV-6).
2. **Recomputable, not asserted.** A lane, a decay state, a portfolio rollup must be *derivable* from
   files by a pure function. If you can't recompute it from disk after a restart, it's not real.
3. **Append-only truth, computed views.** `learnings.jsonl` and `CHANGELOG.jsonl` are append-only and
   never hand-edited; *views* (lane, decay, portfolio) are recomputed on demand and stored nowhere
   authoritative (`spec.yaml.lane.state` is a CACHE only — `doctor` flags drift).
4. **Empty is a valid, honest value.** An empty `learnings.jsonl` means "the loop didn't run" and must
   show as exactly that — never backfilled or faked to look alive (INV-8, extends 07 §6 #6).
5. **The doc executes.** This handoff, the wave VERIFY blocks, and the golden tasks in `evals.yaml`
   are themselves markdown-as-code: an agent runs them verbatim and a bash gate judges the result.
   The spec is the test is the proof.

**Concretely, v3 adds two plain-text contract extensions — and nothing else:**
```yaml
# spec.yaml — new optional block (back-compat; absent → no decay pressure)
freshness_horizon:
  eval_days: 30            # eval_proven is "fresh" for 30 days from eval-report.ts
  evolution_days: 60       # evolution_proven is "fresh" for 60 days from latest CHANGELOG.ts
```
```jsonl
// analytics/runs.jsonl — one row per REAL invocation (written by runtime/preamble.sh, W-V1)
{"ts":"2026-06-15T...","skill":"pattern/vague-to-system","tool":"invoke","outcome":"ok","duration_ms":1820}
```
Both are readable, diffable, recomputable, and carry no hidden state. That is the whole architecture.

---

## WAVE PLAN

Build in order. The loop's input + route (W1–W2) precede the lane-maturity work (W3–W5); authoring
polish is LAST (W6), per the v2 sequence guard that authoring-creep is the original sin. Each wave is
independently shippable and verifiable. For every wave: cite its vectors, run VERIFY, append a
`waves.jsonl` line.

### WAVE 1 — Continuous capture wired live · Vectors: W-V1 · risk: LOW
- **GOAL:** make `learnings.jsonl` + `runs.jsonl` grow because skills *actually run* — close gap #1.
- **FILES:**
  - CREATE `core/capture.ts` — `wireCapture(...)` + `auditCapture()` (signatures in `## NEW TOOLS`).
  - EDIT `core/install.ts` — ensure the compile/install step injects `runtime/preamble.sh` into the
    installed `SKILL.md` (07 Wave 3 specified this; verify it actually fires — it currently does not).
  - EDIT `core/doctor.ts` — add a `neverInvoked` check (empty `learnings.jsonl` AND 0 `runs.jsonl` rows).
  - Wire `tfc_capture` via the §4.1 recipe (schema/handler/registry/cli).
- **ALGORITHM:** `auditCapture` walks all skills, counts `learnings.jsonl` lines and matching
  `runs.jsonl` rows; `wireCapture` re-injects the preamble hook where missing. The hook appends one
  §4.3 learnings line on real invocation. **No learning is ever synthesized** (INV-8).
- **DOGFOOD (INV-5):** invoke a reachable skill (`learn-itr` or `vague-to-system`) for real once;
  confirm its `learnings.jsonl` AND `runs.jsonl` each gained a row produced by the invocation.
- **VERIFY:**
  ```bash
  cd mcp/tfc-builder && npm run typecheck && npm test
  node dist/cli.js capture --audit | grep -o '"neverInvoked": *true' | wc -l   # baseline (expect ~6)
  # after a real invocation of one skill:
  test $(wc -l < ../../skills/learning/learn-itr/learnings.jsonl) -ge 1 && echo "CAPTURE LIVE ✓"
  wc -l < analytics/runs.jsonl   # > 0 (was 0)
  ```
- **ROLLBACK:** remove `core/capture.ts`, revert the install injection + doctor check. No data loss.
- **DONE WHEN:** at least one skill gains a learnings + runs row from a real invocation, and
  `tfc_capture --audit` reports the true `neverInvoked` set.

### WAVE 2 — Route repair + reachability as a lane precondition · Vectors: W-V2 · risk: LOW
- **GOAL:** fix the 3 broken links; make `unreachable` block a skill from being *counted* in a lane.
- **FILES:**
  - CREATE `core/relink.ts` — `repairLinks({category?,name?,dryRun?})`.
  - EDIT `core/lane.ts` — add a `reachable: boolean` INPUT (from link state); when false, the verdict
    carries `effectiveLane: "blocked"` while preserving the earned `lane` field (truth not destroyed).
  - EDIT `core/doctor.ts` — `skill-symlinks` finding gains an auto-fix pointer to `tfc relink`.
  - Wire `tfc_relink` via the §4.1 recipe; keep `dryRun` (INV-3).
- **DOGFOOD:** run `tfc_relink` on `pattern/genesis` (currently MISSING); confirm `doctor` clears it.
- **VERIFY:**
  ```bash
  node dist/cli.js doctor | grep -c "broken/missing symlinks"     # baseline > 0
  node dist/cli.js relink --dryRun | grep -E "repaired|conflicts" # plan renders
  node dist/cli.js relink                                          # apply
  node dist/cli.js doctor | grep "skill-symlinks" | grep "✓" && echo "ROUTE CLEAN ✓"
  node dist/cli.js lane ai genius-ai | grep -o '"effectiveLane": *"[a-z_]*"'  # blocked until relinked
  ```
- **ROLLBACK:** `dryRun` first; link creation is reversible (`rm` the link); revert the lane input.
- **DONE WHEN:** `doctor` reports zero broken links; an unreachable skill recomputes `effectiveLane:
  blocked` without losing its earned `lane`.

### WAVE 3 — Perishable proof (decay overlay) · Vectors: W-V3 · risk: MED (determinism)
- **GOAL:** lanes carry a freshness horizon; stale proofs report `stale` and drop *effective* lane —
  WITHOUT touching the pure core verdict (INV-7).
- **FILES:**
  - CREATE `core/decay.ts` — `laneAsOf({category,name,asOf})` (signature in `## NEW TOOLS`).
  - EDIT `core/types.ts` — add optional `freshness_horizon?: {eval_days?:number; evolution_days?:number}`
    to `SpecYaml`.
  - EDIT `_template/spec.yaml` + the 7 skills' `spec.yaml` — add a `freshness_horizon` block (default
    eval 30 / evolution 60).
  - Wire `tfc_decay` via the §4.1 recipe (the only NEW INPUT is `asOf` — it must be passed, never
    `Date.now()` inside the verdict).
- **ALGORITHM:** read `eval-report.json.ts` and latest `CHANGELOG.jsonl.ts`; `ageDays = asOf − ts`;
  `stale = ageDays > horizonDays`; if stale, `effectiveLane` drops one rung. On-disk lane untouched.
- **DOGFOOD:** call `tfc_decay --as-of 2099-01-01` on `vague-to-system`; confirm `stale:true` and
  `effectiveLane: eval_proven` (one rung down from `evolution_proven`).
- **VERIFY:**
  ```bash
  grep -L "Date.now" dist/core/lane.js && echo "LANE STAYS PURE (INV-7) ✓"   # lane.ts must NOT use Date.now
  node dist/cli.js decay pattern vague-to-system --as-of 2099-01-01 | grep -o '"stale": *true'
  # determinism unchanged: core lane still byte-identical across two runs
  node dist/cli.js lane pattern vague-to-system > /tmp/a; node dist/cli.js lane pattern vague-to-system > /tmp/b; diff /tmp/a /tmp/b && echo "CORE STILL DETERMINISTIC ✓"
  ```
- **ROLLBACK:** delete `core/decay.ts`, revert the horizon blocks + type. Core verdict never changed,
  so rollback is total.
- **DONE WHEN:** a far-future `as-of` reports `stale` and a dropped `effectiveLane`, while
  `recomputeLane` remains pure and deterministic.

### WAVE 4 — Eval replay / stability quorum · Vectors: W-V5 · risk: MED (variance theater)
- **GOAL:** promotion requires a *stable* behavioral score across N samples, not a high single run.
- **FILES:**
  - CREATE `core/replay.ts` — `buildReplayPrompt({category,name,samples})`.
  - CREATE `runtime/replay-aggregate.sh` — reduce N `eval-report.*.json` → `{mean,stdev,min,stable}`.
  - EDIT `core/evaluate.ts` (or `lane.ts` inputs) — optionally require `stable:true` for promotion.
  - Wire `tfc_replay` via the §4.1 recipe.
- **DOGFOOD:** replay `vague-to-system` with `samples: 3`; produce 3 reports + an aggregate.
- **VERIFY:**
  ```bash
  node dist/cli.js replay pattern vague-to-system --samples 3   # emits prompt + glob + aggregate cmd
  bash runtime/replay-aggregate.sh skills/pattern/vague-to-system/eval-report.*.json | grep -o '"stable": *true'
  ```
- **ROLLBACK:** delete `replay.ts` + aggregate script; promotion falls back to single-report (v2).
- **DONE WHEN:** an aggregate over ≥3 samples reports `stable`, and an artificially high-variance set
  reports `stable:false` (proving the quorum bites).

### WAVE 5 — Portfolio currency rollup · Vectors: W-V4 · risk: MED (coupling / INV-6)
- **GOAL:** one disk-recomputed health surface for the whole skill portfolio.
- **FILES:**
  - CREATE `core/portfolio.ts` — `rollup({asOf?})` (histogram, decayPressure, evolveReady, belowFloor).
  - REUSE `core/packbridge.ts` (read-only `min_lane` floor) for `belowFloor`.
  - Surface as `tfc_portfolio` OR `tfc_doctor --portfolio` (implementer's call — fewer entry points
    is fine).
- **DOGFOOD:** run the rollup over all 7 skills; confirm the histogram matches `tfc_list`.
- **VERIFY:**
  ```bash
  node dist/cli.js portfolio | grep -E "histogram|decayPressure|evolveReady|belowFloor"
  node dist/cli.js portfolio | grep -o '"evolution_proven": *[0-9]*'   # matches tfc_list count
  ```
- **ROLLBACK:** delete `core/portfolio.ts` + the tool entry. No state created (INV-6).
- **DONE WHEN:** the rollup reproduces the lane histogram and flags any pack paired below its
  `min_lane`, reading only existing contract files.

### WAVE 6 — Authoring polish (LAST) · Vectors: W-V1 · risk: LOW (sequence guard)
- **GOAL:** only now — every NEW skill is born decay-aware and observability-wired.
- **FILES:** EDIT `core/compile.ts` + `core/prompts/skillcard.fragment.ts` so an emitted SkillCard
  carries `lane: authored`, a `freshness_horizon` block, AND the preamble capture hook by default.
- **VERIFY:**
  ```bash
  node dist/cli.js compile --intent "..." | grep -E "lane: *authored"
  node dist/cli.js compile --intent "..." | grep -E "freshness_horizon"   # born perishable
  ```
- **DONE WHEN:** `tfc_compile` emits a SkillCard born with a lane, a freshness horizon, and a wired
  capture hook — so a brand-new skill enters the *living* loop with zero manual steps.

---

## INVARIANTS

v2's INV-1..INV-6 **carry forward unchanged and still bind** — they are reproduced here in brief
because v3 code must satisfy them too. Two new invariants (INV-7, INV-8) protect the v3 additions.

| ID | Invariant | Check |
|---|---|---|
| **INV-1** | Local-first / **no API key**. Capture = bash append; decay = timestamp math; replay = Claude-as-engine ×N; portfolio = disk rollup. No `fetch`/SDK to a model anywhere. | `grep -rE "anthropic\|openai\|fetch\(.+api" src/core/{capture,relink,decay,replay,portfolio}.ts` → **0 hits** |
| **INV-2** | `Result<T>` envelope + `safeJoin`/`skillDir` path safety on every new core fn. | `grep -L "Result<" src/core/{capture,relink,decay,replay,portfolio}.ts` → empty |
| **INV-3** | Strict TS + `dryRun` + reversible mutation; tmp-`TFC_ROOT` test isolation. | `npm run typecheck && npm test` clean; `relink`/`evolve` keep `dryRun` |
| **INV-4** | The layer contract is **EXTENDED, never replaced**. v3 adds an **OBSERVE** facet (`runs.jsonl` + live `learnings.jsonl`) alongside SPEC/EXECUTE/LEARN/ROUTE/PROVE — removes none. | `_template/` still has spec.yaml + SKILL.md + evals.yaml + learnings.jsonl; now also a horizon block |
| **INV-5** | **Dogfood gate** — a feature ships only after the builder runs it on a real skill. | each wave's VERIFY shows a real artifact from the new tool |
| **INV-6** | **Via-negativa: no second store.** Decay/portfolio/replay read existing contract files + Mind only. No new `.db`/`.sqlite`/cache-of-record. | `doctor` `state-contract` check passes; no new state file outside the contract |
| **INV-7** | **Lane purity (NEW).** `core/lane.ts::recomputeLane` stays a **pure function of disk contents with NO `Date.now()`**. All time-dependence lives in `core/decay.ts` and takes an explicit `asOf` — never inside the core verdict. Protects v2's V4 determinism. | `grep -L "Date.now" dist/core/lane.js` non-empty (lane.ts free of it); two `lane` runs byte-identical |
| **INV-8** | **No synthetic learnings (NEW).** `learnings.jsonl` only grows from real invocations. `tfc_capture` wires the *path*; it never writes a learning. Empty stays empty — the dead-loop truth must show. | `core/capture.ts` has no write to `learnings.jsonl`; an un-invoked skill's file stays empty after `tfc_capture` |

> **INV-1 and INV-7 are the hard lines.** If any wave reaches for a model API, **stop and redesign** —
> the system must "survive on a plane." If decay logic creeps into `recomputeLane`, the determinism
> guarantee that makes a lane *recomputable by a stranger* is gone. Both are non-negotiable.

The evidence-lane semantics are **unchanged**: `authored → eval_proven → evolution_proven`, recomputed
from disk. v3 adds a READ-time `effectiveLane` overlay (decay + reachability) and an OBSERVE facet — it
never alters how the three earned lanes are computed.

---

## HANDOFF CONTEXT

### How to re-ground (run these from `~/.future-code` before trusting any number)
```bash
CLI=mcp/tfc-builder/dist/cli.js
node $CLI list                                              # 7 skills + disk-recomputed lanes + link state
node $CLI doctor                                            # symlink health, cacheDrift, state-contract, lanes
grep -oE 'tfc_[a-z_]+' mcp/tfc-builder/src/tools/registry.ts | sort -u   # the 15 registered tools
find skills -name learnings.jsonl -size +0c                 # how many skills have a LIVE loop (today: 1)
find skills -name eval-report.json                          # eval'd skills (today: 3)
find skills -name CHANGELOG.jsonl                           # evolved skills (today: 2)
cat mcp/tfc-builder/analytics/runs.jsonl                    # live invocation telemetry (today: empty)
```
If your run differs from `## CURRENT STATE`, **trust your run** and update that section. The v2 doc's
"5 skills" is already stale — proof that this rule is real (07 §0 rule 4 / §6 #10).

### The corpus (what v3 operates on)
Seven skills: `ai/ai-code-generation` · `ai/genius-ai` · `ai-video/video-prompting` ·
`learning/learn-itr` · `pattern/genesis` · `pattern/intent-to-goal` · `pattern/vague-to-system`.
The dogfood target for the loop is `pattern/vague-to-system` (already `evolution_proven`); the route
repair targets are `genius-ai`, `video-prompting`, `genesis`.

### The "add a tool" recipe (from 07 §4.1 — follow exactly)
1. **schema** → `export const tfcXInput = z.object({...})` in `src/tools/schemas.ts`.
2. **core** → pure fn in `src/core/x.ts` returning `Result<T>` (use `ok`/`fail`, `skillDir`, `safeJoin`).
3. **handler** → in `src/tools/index.ts`: `const p = tfcXInput.safeParse(input); if(!p.success) return fail("BAD_INPUT", p.error.message); return xFn(p.data);`
4. **register** → add a `ToolDef` (description + JSON `inputSchema` + handler) to `src/tools/registry.ts`.
5. **cli** → add a `program.command(...)` in `src/cli.ts` calling the same handler (CLI == MCP).
6. **rebuild** → `npm run build`; **Claude Code must be restarted** to pick up new MCP tools (the CLI
   works immediately — `node dist/cli.js <cmd>` — so dogfood via CLI, no restart needed mid-wave).

### Sharp edges (learned the hard way; from prior TFC builds)
- **New MCP tools need a Claude Code RESTART** to appear as `mcp__tfc-builder__*`. The CLI does not —
  verify every wave through `node dist/cli.js`, not the MCP surface.
- **`npm`/`tail` wrappers have been unreliable in this environment** — invoke `node dist/cli.js` and
  the linters via `./node_modules/.bin/*` directly.
- **`readText`/`readYaml` in the reference impls return a `Result`** — unwrap `.data` before use (a
  recurring v2 trap).
- **Eval scoring 1.0 leaves no evolve headroom** — `vague-to-system` already hit `post_eval_score:1.0`,
  so a *fresh* dogfood skill (or a harder golden task) is needed to exercise W4 replay headroom.
- **Analytics live at `analytics/` under `mcp/tfc-builder/`**, not the repo root; tests live in `test/`.

### Definition of done for the whole v3
On a fresh clone, after W1–W6 ship:
- Every reachable skill's `learnings.jsonl` grows from real invocations (W1) and `runs.jsonl` is
  non-empty;
- `tfc_doctor` reports **zero** broken links and any unreachable skill recomputes `effectiveLane:
  blocked` (W2);
- a far-future `tfc_decay --as-of` reports `stale` + a dropped `effectiveLane` while `recomputeLane`
  stays pure and byte-deterministic (W3, INV-7);
- a ≥3-sample `tfc_replay` reports `stable` and a noisy set reports `stable:false` (W4);
- `tfc_portfolio` reproduces the lane histogram and flags below-floor pack pairings from disk alone
  (W5);
- `tfc_compile` emits new skills born with a lane, a freshness horizon, and a wired capture hook (W6).

At that point the lane is **living**: every skill is continuously measured, route-checked, and
freshness-tracked — "this skill is good" becomes "this skill is *provably good right now*," a fact on
disk that a stranger can recompute after a restart, with no API key in sight.

### Provenance
Grounded via `/kraken-flow` (GROUND gate passed: ACTOR/COST/EVIDENCE all disk-recomputed 2026-06-15).
Bound pack **P05 «Greenfield Builder»** (personas architect/builder/scientist; frameworks
first-principles + 5-step-algorithm) — re-bound by meaning off the hook's misfired P23. Builds directly
on `docs/forge/07-V2-SKILL-EVOLUTION-OS.md`. Respects INV-1 (no API in any proposal) and the
disk-recomputed evidence-lane semantics (`authored → eval_proven → evolution_proven`). No TFC source or
tool was modified in producing this handoff — it is a planning document only.
