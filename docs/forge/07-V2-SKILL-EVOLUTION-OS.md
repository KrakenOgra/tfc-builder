# 07 — TFC v2 "Skill Evolution OS" — Agent Build Handoff

> **Audience:** an autonomous coding agent (LLM) with no prior context on TFC.
> **Purpose:** everything required to implement v2 *without asking a human* — exact paths,
> exact signatures, exact schemas, exact VERIFY commands, and the invariants that must not break.
> **Authority:** full breaking-change authority on `mcp/tfc-builder/` per the v2 charter.
> **Source of this plan:** `docs/forge/05-IMPROVEMENTS-AND-NEW-TOOLS.md` (tool contracts) +
> `THE_FUTURE_CODE.md` (manifesto) + the v2 ULTRA transformation (CRUX + charter, below).
> **Written:** 2026-06-14. **Ground-truth verified against disk the same day** (see §2).

---

## 0 — HOW AN AGENT SHOULD READ THIS DOC

1. Read §1 (the one job) and §3 (invariants) **before writing any code**. Breaking an invariant
   is the only way to fail this build; everything else is recoverable.
2. Pick the **lowest-numbered unfinished wave** in §7. Waves are strictly ordered and each is
   independently shippable. Do **not** start Wave N+1 before Wave N's VERIFY passes.
3. For the wave you picked, the spec gives you: **GOAL · VECTORS · FILES · SIGNATURES ·
   ALGORITHM · DOGFOOD · VERIFY · ROLLBACK · DONE**. Implement top-to-bottom.
4. Re-ground before trusting any number. §2 tells you the exact commands; **never quote a
   quality number you did not just recompute from disk** (this rule is itself a deletion — §6 #10).
5. When done, run the wave's VERIFY commands, paste their output into your PR/commit body, and
   append one line to `analytics/waves.jsonl` (schema in §9).

**The single mental model:** TFC v2 replaces *"a skill carries a 0-100 score someone computed"*
with *"a skill carries a LANE it graduated into by measurement, recomputable from files on disk."*
Three lanes: `authored → eval_proven → evolution_proven`. The loop that moves a skill between
lanes IS the product. Everything in this doc serves that.

---

## 1 — THE ONE JOB (irreducible)

> Turn an intent into a skill that is **proven, on disk, to work** and to **get better from its
> own runs** — locally, no API key, with the proof being files anyone can recompute.

If a change does not help a skill *earn or keep a lane by measurement*, it is out of scope for v2.

**CRUX being dissolved:** TFC v1 is a skill-*authoring* system whose one differentiating promise —
skills that measurably improve from their runs — has produced **0 `learnings.jsonl` files** and
**0 eval reports** across 6 commits and live telemetry through 2026-06-12. So "quality" today is a
compile-time score that proves *shape*, not *behavior*. Every wave must help dissolve THIS.

**Charter (north star):** *The only skill system where every skill carries an EARNED
evidence-lane it can be promoted into only by a deterministic, re-runnable, local measurement —
so "this skill is good" is a fact on disk, not a number a builder typed.*

**Design vectors (cite these in every wave):**
- **V1** — Earned-lane over asserted-score.
- **V2** — The loop is the spine, not a late wave. It ships before authoring polish.
- **V3** — Local-first proof or no proof (prompt-template + bash gate + Claude-as-engine).
- **V4** — Deterministic, re-runnable promotion (a lane recomputes identically from disk).
- **V5** — One quality currency across the ecosystem (Kraken packs / autovibe / chips read the same lane).

---

## 2 — GROUND TRUTH (verified 2026-06-14) + HOW TO RE-VERIFY

Run these from `~/.future-code` before you start. The right-hand column is what was true on
2026-06-14; if your run differs, **trust your run** and update this table.

| # | Command | Result on 2026-06-14 | Meaning |
|---|---|---|---|
| G1 | `find skills -name learnings.jsonl \| wc -l` | `0` | flagship loop has **never** run |
| G2 | `ls mcp/tfc-builder/src/core/ \| grep -E 'evaluate\|evolve'` | (empty) | eval/evolve **unbuilt** |
| G3 | `ls mcp/tfc-builder/src/core/doctor.ts` | exists | doctor core exists… |
| G4 | `grep -c tfc_doctor mcp/tfc-builder/src/tools/registry.ts` | `0` | …but is **NOT an MCP tool** (CLI-only, imported in `cli.ts`) |
| G5 | `ls mcp/tfc-builder/src/runtime/` | (empty) | `learnings-log.sh`/`preamble.sh` **do not exist** (capsule was wrong) |
| G6 | `cat mcp/tfc-builder/analytics/waves.jsonl \| wc -l` | `1` | only Wave 1 "archetypes" recorded |
| G7 | `grep -rniE 'lane\|graduat\|eval_proven' skills --include=spec.yaml \| wc -l` | `0` | **no lane field anywhere** |
| G8 | `tail -1 mcp/tfc-builder/analytics/tfc-builder.jsonl` | `…tfc_list…2026-06-12T09:01:52` | built, then idle |
| G9 | `find skills -name spec.yaml \| sed 's#/spec.yaml##'` | 5 skills + `_template` | the corpus to migrate |

The 5 real skills: `ai/ai-code-generation`, `ai-video/video-prompting`, `learning/learn-itr`,
`pattern/genesis`, `pattern/vague-to-system`.

**Correction log (capsule → disk):** capsule said "doctor is a tool" → it's CLI-only (G4);
capsule implied `runtime/{preamble,learnings-log}.sh` exist → `runtime/` is empty (G5); capsule
said "6 skills" → 5 + template (G9). These are *why* §0 rule 4 exists.

---

## 3 — INVARIANTS (do not break; each has a check command)

| ID | Invariant | How to keep it | Check |
|---|---|---|---|
| **INV-1** | Local-first / no API key. Eval & evolve are prompt-template + bash gate + Claude-as-engine. | A tool returns a *prompt string*; Claude runs it; bash validates the *report file*. No `fetch`/SDK to a model. | `grep -rE "anthropic\|openai\|fetch\(.+api" mcp/tfc-builder/src/core/{evaluate,evolve}.ts` → **0 hits** |
| **INV-2** | `Result<T>` envelope + `safeJoin` path safety. | Every new core fn returns `Result<T>` (see §4.1); every disk path goes through `safeJoin`/`skillDir`. | `grep -L "Result<" core/{lane,evaluate,evolve}.ts` → empty; new threat-case test passes |
| **INV-3** | Strict TS + dry-run + rollback on mutating tools; tmp-HOME test isolation. | `tfc_evolve` keeps `dryRun`; version bump is reversible; tests set `TFC_ROOT` to a tmp dir. | `cd mcp/tfc-builder && npm run typecheck && npm test` clean |
| **INV-4** | The 4-layer contract (SPEC/EXECUTE/LEARN/ROUTE) is EXTENDED, never replaced. | Add the **PROVE** lane (`evals.yaml`, `eval-report.json`, `CHANGELOG.jsonl`) alongside the four; don't remove any. | `_template/` still has spec.yaml + SKILL.md + learnings.jsonl; now also evals.yaml |
| **INV-5** | Dogfood gate. A feature ships only after the builder uses it on itself. | Each wave's DOGFOOD step runs the new tool on a real skill before the wave is "done". | wave's VERIFY shows a real artifact produced by the new tool |
| **INV-6** | Via-negativa: no second memory/vault. Reuse Mind + the in-contract files. | Lane *history* = `CHANGELOG.jsonl` + Mind `POST /v1/decisions/track` then `/outcome`. No new state DB. | `doctor` flags any state file outside the contract; no new `.db`/`.sqlite` |

> **INV-1 is the hard line.** If any wave reaches for a model API, **stop and redesign**. The
> system "dies on a plane" the moment scoring needs a server.

---

## 4 — ARCHITECTURE (target state)

### 4.1 The codebase seams (real, from disk)

```
mcp/tfc-builder/src/
├── core/                 # pure-ish logic; every fn returns Result<T>
│   ├── result.ts         # Result<T>, ok(data), fail(code,message,hint?)
│   ├── paths.ts          # TFC_HOME(=~/.future-code, override TFC_ROOT), skillDir(cat,name), safeJoin(root,...segs)
│   ├── types.ts          # SpecYaml interface  ← ADD `lane?` here
│   ├── checks.ts         # loadSkill / LoadedSkill{dirName,specYaml,skillMdText}, extractSection, count* helpers
│   ├── score.ts          # scoreSkill({category,name}) → Result<ScoreReport>   (structural; becomes the `authored` floor)
│   ├── validate.ts install.ts migrate.ts scaffold.ts doctor.ts
│   ├── lane.ts        ← NEW (Wave 1)   recomputeLane(dir) → Result<LaneVerdict>
│   ├── evaluate.ts    ← NEW (Wave 2)   buildEvalPrompt(...) → Result<{prompt,reportPath}>
│   └── evolve.ts      ← NEW (Wave 4)   buildEvolvePrompt(...) → Result<{prompt,...}>
├── tools/
│   ├── schemas.ts        # zod input schemas (one per tool)   ← add laneInput/evalInput/evolveInput
│   ├── index.ts          # handlers: zod.safeParse → core fn → Result   ← add handlers
│   └── registry.ts       # ToolDef map {description,inputSchema,handler}   ← register new tools
├── cli.ts                # commander dispatch (mirror every tool as a CLI command)
├── server.ts             # MCP stdio (reads registry)
├── runtime/              # EMPTY today  ← add preamble.sh + learnings-log.sh (Wave 3)
└── analytics/{tfc-builder.jsonl, waves.jsonl}
```

**The "add a tool" recipe (derived from the real code — follow it exactly):**
1. **schema** → add `export const tfcXInput = z.object({...})` to `tools/schemas.ts`.
2. **core** → add a pure fn in `core/x.ts` returning `Result<T>` (use `ok`/`fail`, `skillDir`).
3. **handler** → in `tools/index.ts`: `const parsed = tfcXInput.safeParse(input); if(!parsed.success) return fail("BAD_INPUT", parsed.error.message); return xFn(parsed.data);`
4. **register** → add a `ToolDef` entry to `tools/registry.ts` (description + JSON `inputSchema` + handler).
5. **cli** → add a `program.command(...)` in `cli.ts` calling the same handler (so CLI == MCP).
6. **rebuild** → `npm run build`; **Claude Code must be restarted** to pick up new MCP tools.

### 4.2 The evidence-lane state machine

```
                tfc_eval pass (≥3 tasks, score≥threshold, version match)
   authored ───────────────────────────────────────────────▶ eval_proven
      ▲                                                            │
      │  stale: eval-report.skill_version ≠ spec.version           │ tfc_evolve:
      │  OR eval fails on re-run                                   │  consume ≥3 learnings,
      └───────────────────────────────────────────────────────────┤  version bump,
      ▲                                                            ▼  re-eval beats prior by ≥0.05
      └──────────── regress (post-eval drops) ──────────── evolution_proven
```

- **`authored`** — `spec.yaml` + `SKILL.md` exist and pass the **structural floor** (the old
  `tfc_score`, now a gate not a headline). **Not a quality claim.**
- **`eval_proven`** — `eval-report.json` present AND `behavioral_score ≥ pass_threshold` over
  **≥3 golden tasks** on **observable must/must_not strings** AND `report.skill_version == spec.version`.
- **`evolution_proven`** — `eval_proven` AND `CHANGELOG.jsonl` has ≥1 entry that consumed ≥3
  learnings AND its `post_eval_score − pre_eval_score ≥ 0.05` AND the current eval-report matches
  the post state. **Improvement measured, never asserted.**

**The lane lives in two places, with one as truth:**
- `spec.yaml` → `lane.state` is a **CACHE** (human/tool readable).
- The contract files (`eval-report.json`, `CHANGELOG.jsonl`, `learnings.jsonl`, `spec.version`)
  are the **TRUTH**. `core/lane.ts::recomputeLane()` derives the verdict purely from them.
- `doctor` flags any drift between cache and recomputation. **Never trust the cache for a decision.**

### 4.3 Contract file schemas (authoritative)

**`spec.yaml` — new block** (add to the `SpecYaml` interface as optional, back-compat):
```yaml
lane:
  state: authored          # CACHE only — recomputed by core/lane.ts; doctor flags drift
```

**`evals.yaml`** (author input; seeded from the SkillCard or hand-written):
```yaml
pass_threshold: 0.8        # float 0..1; default 0.8 if absent
golden_tasks:              # MIN 3 required for eval_proven
  - id: task-shortname     # kebab-case, unique within file
    prompt: "the exact user input to run baseline-vs-skill-loaded"
    must:                  # OBSERVABLE strings that MUST appear in skill-loaded output
      - "literal substring or /regex/"
    must_not:              # OBSERVABLE strings that MUST NOT appear
      - "literal substring or /regex/"
```

**`eval-report.json`** (machine; written by Claude per the `tfc_eval` prompt, shape-validated by `lane-gate.sh`):
```json
{
  "skill_version": "1.0.0",
  "ts": "2026-06-14T00:00:00Z",
  "pass_threshold": 0.8,
  "behavioral_score": 0.86,
  "per_task": [
    { "id": "task-shortname", "pass": true, "delta_note": "baseline missed X; loaded produced X" }
  ]
}
```
`behavioral_score` = fraction of tasks where every `must` matched and no `must_not` matched.

**`CHANGELOG.jsonl`** (machine, append-only; written by `tfc_evolve`):
```json
{"ts":"2026-06-14T...","from_version":"1.0.0","to_version":"1.1.0","learnings_consumed":["<line-hash>","..."],"pre_eval_score":0.80,"post_eval_score":0.88,"delta":0.08,"sections_touched":["Patterns"]}
```

**`learnings.jsonl`** (append-only; written by the runtime on real invocation — Wave 3):
```json
{"ts":"...","type":"operational|sharp_edge|routing|timing","note":"what was learned","consumed_in":null}
```
`consumed_in` is set to a version string by `tfc_evolve` when the learning is folded in. The file
is otherwise never edited. **An empty/missing file means the loop did not run — that truth must
show, never be faked** (§6 #6).

---

## 5 — THE LANE RECOMPUTE FUNCTION (Wave 1 core — full reference)

`core/lane.ts` is the heart of V1+V4. It must be a **pure function of disk contents** — no
`Date.now()` in the verdict, inputs sorted, identical output across restarts. Reference impl:

```ts
import { ok, fail, type Result } from "./result.js";
import { skillDir } from "./paths.js";
import { exists, readText } from "./fs.js";
import { readYaml } from "./yamlio.js";
import * as nodePath from "node:path";
import type { SpecYaml } from "./types.js";

export type Lane = "authored" | "eval_proven" | "evolution_proven";

export interface LaneVerdict {
  lane: Lane;
  reasons: string[];        // why this lane, deterministic order
  cacheDrift: boolean;      // spec.yaml lane.state !== recomputed lane
  inputs: {                 // what the verdict was computed from (for auditability)
    specVersion: string;
    hasEvalReport: boolean;
    evalFresh: boolean;     // report.skill_version === spec.version
    evalPasses: boolean;    // score >= threshold && per_task.length >= 3
    qualifyingEvolution: boolean;
  };
}

export async function recomputeLane(
  category: string,
  name: string,
): Promise<Result<LaneVerdict>> {
  const dir = skillDir(category, name);
  if (!dir.ok) return fail(dir.error.code, dir.error.message);

  // 1. spec (truth = version; lane.state = cache only)
  const specPath = nodePath.join(dir.path, "spec.yaml");
  if (!(await exists(specPath))) return fail("NOT_FOUND", `no spec.yaml in ${dir.path}`);
  const spec = (await readYaml(specPath)) as SpecYaml & { lane?: { state?: Lane } };
  const specVersion = spec.version ?? "0.0.0";
  const cached = spec.lane?.state;

  const reasons: string[] = [];
  let lane: Lane = "authored";
  reasons.push("spec.yaml + SKILL.md present → authored");

  // 2. eval_proven?
  const evalPath = nodePath.join(dir.path, "eval-report.json");
  let hasEvalReport = false, evalFresh = false, evalPasses = false;
  let evalScore = 0;
  if (await exists(evalPath)) {
    hasEvalReport = true;
    const rep = JSON.parse(await readText(evalPath));
    const threshold = typeof rep.pass_threshold === "number" ? rep.pass_threshold : 0.8;
    evalScore = typeof rep.behavioral_score === "number" ? rep.behavioral_score : 0;
    evalFresh = rep.skill_version === specVersion;
    evalPasses = evalScore >= threshold && Array.isArray(rep.per_task) && rep.per_task.length >= 3;
    if (!evalFresh) reasons.push(`eval-report stale (report v${rep.skill_version} ≠ spec v${specVersion}) → stays authored`);
    else if (!evalPasses) reasons.push(`eval below threshold or <3 tasks (score ${evalScore}) → stays authored`);
    else { lane = "eval_proven"; reasons.push(`eval ${evalScore} ≥ threshold on ≥3 tasks, version match → eval_proven`); }
  } else {
    reasons.push("no eval-report.json → cannot exceed authored");
  }

  // 3. evolution_proven? (requires eval_proven first)
  let qualifyingEvolution = false;
  if (lane === "eval_proven") {
    const chPath = nodePath.join(dir.path, "CHANGELOG.jsonl");
    if (await exists(chPath)) {
      const entries = (await readText(chPath))
        .split("\n").filter(Boolean).map((l) => JSON.parse(l))
        .sort((a, b) => String(a.ts).localeCompare(String(b.ts))); // deterministic
      qualifyingEvolution = entries.some(
        (e) => Array.isArray(e.learnings_consumed) && e.learnings_consumed.length >= 3
          && typeof e.delta === "number" && e.delta >= 0.05,
      );
      if (qualifyingEvolution) { lane = "evolution_proven"; reasons.push("CHANGELOG has a ≥3-learning evolve with Δ≥0.05 → evolution_proven"); }
      else reasons.push("CHANGELOG present but no qualifying evolve (need ≥3 learnings & Δ≥0.05)");
    } else reasons.push("no CHANGELOG.jsonl → cannot exceed eval_proven");
  }

  return ok({
    lane,
    reasons,
    cacheDrift: cached !== undefined && cached !== lane,
    inputs: { specVersion, hasEvalReport, evalFresh, evalPasses, qualifyingEvolution },
  });
}
```

> In Wave 1 only the `authored` branch is exercised (no eval/CHANGELOG files exist yet). The
> function is written complete so Waves 2/4 light up the higher branches with zero changes to
> `lane.ts`. That is the V4 guarantee: the verdict is data-driven, not code-driven.

---

## 6 — THE DELETE LIST (what v2 refuses to carry; enforce these)

1. The single 0-100 score as the **headline** quality signal → demote to the `authored` floor.
2. The manifesto's "after 10 runs a skill is measurably better" **as prose** → replace with
   `evolution_proven`, false-until-earned.
3. "Wave 5" as the loop's home → the loop is Waves 1–4.
4. Eval-by-vibes / self-graded homework → observable `must`/`must_not` strings only.
5. Skill-**count** as a success metric → birth-rate + improvement-rate.
6. Any hand-edited `learnings.jsonl` → empty means "didn't run", never faked.
7. `doctor.ts` orphaned (CLI-only, not an MCP tool) → wire it lane-aware (Wave 5) or delete it.
8. `tfc_score ≥ N` as a **wave exit gate** (it's literally in `waves.jsonl` wave 1) → exit gates
   become **lane targets**.
9. `required_sections`-presence as a **quality proxy** → may gate `authored` only; never `eval_proven`.
10. Any **quoted** quality number as a trusted input → recompute from disk, always. (This doc
    caught its own stale numbers; that's the rule, dogfooded.)
11. `waves.jsonl` as the **record of progress** → progress is lane transitions on disk; the wave
    log is just a build journal.

---

## 7 — MIGRATION WAVES (build these in order)

Each wave = independently shippable + verifiable. The loop (W1–W4) precedes authoring polish (W6),
per V2. For every wave: cite its vectors, run its VERIFY, append a `waves.jsonl` line.

### WAVE 1 — Lane language + recompute   ·   Vectors: V1, V4   ·   risk: LOW, fully reversible

- **GOAL:** make the honest lane state *visible and recomputable from disk*, with zero eval
  machinery yet. Every existing skill becomes `lane: authored` (truthful — none are proven).
- **FILES:**
  - EDIT `core/types.ts` — add `lane?: { state: Lane }` to `SpecYaml`; export `type Lane` + `LANES` array (mirror the existing `ARCHETYPES` pattern).
  - CREATE `core/lane.ts` — the §5 reference impl.
  - EDIT `core/install.ts` (the `listSkills` fn) — include `lane` (call `recomputeLane`) in each `ListResult` row; **lane replaces score as the headline field** (keep score as a secondary field).
  - EDIT 5 × `skills/*/*/spec.yaml` — add `lane:\n  state: authored`.
  - CREATE `tests/lane.test.ts` — (a) a fixture skill recomputes to `authored`; (b) calling
    `recomputeLane` twice yields deep-equal verdicts (determinism / restart-amnesia guard).
  - OPTIONAL: expose a read-only `tfc_lane` tool via the §4.1 recipe (handy; not required for VERIFY).
- **ALGORITHM:** see §5. Wave 1 exercises only the `authored` branch.
- **DOGFOOD (INV-5):** run the recompute on all 5 real skills; confirm each prints `authored`.
- **VERIFY (paste output into the PR):**
  ```bash
  cd mcp/tfc-builder && npm run typecheck && npm test            # INV-3 clean
  # lane recomputes to authored for every real skill:
  for s in ai/ai-code-generation ai-video/video-prompting learning/learn-itr pattern/genesis pattern/vague-to-system; do
    node dist/cli.js lane ${s%/*} ${s#*/} | grep -o '"lane": *"[a-z_]*"'
  done            # expect: "lane": "authored" ×5
  # determinism: same verdict twice (V4 / no restart-amnesia)
  node dist/cli.js lane pattern vague-to-system > /tmp/a.json
  node dist/cli.js lane pattern vague-to-system > /tmp/b.json
  diff /tmp/a.json /tmp/b.json && echo "DETERMINISTIC ✓"
  ```
- **ROLLBACK:** delete `core/lane.ts`, revert the `lane:` blocks, revert `install.ts`. No data loss.
- **DONE WHEN:** typecheck+tests green; all 5 skills recompute to `authored`; verdict is byte-identical across two runs.

### WAVE 2 — `tfc_eval` + first eval-report   ·   Vectors: V2, V3   ·   risk: MED (eval-theater)

- **GOAL:** produce the first `eval-report.json` and promote one skill to `eval_proven` — locally.
- **FILES:**
  - CREATE `core/evaluate.ts` — `buildEvalPrompt({category,name,taskIds?})` → `Result<{prompt,reportPath}>`.
    Reads `evals.yaml` (NOT_FOUND hint: "seed evals.yaml from the SkillCard or hand-write 3 golden tasks").
  - CREATE `prompts/judge.fragment.ts` — the judge template: for each golden task, run **baseline
    (no skill) vs skill-loaded**, check each `must`/`must_not` as an **observable string match**,
    compute `behavioral_score` = passed_tasks / total, write `eval-report.json` per §4.3.
  - CREATE `_template/evals.yaml` (INV-4: the contract grows the PROVE lane).
  - CREATE `runtime/lane-gate.sh` — bash; validates an `eval-report.json` (has `behavioral_score`
    0..1, `per_task` length ≥3, each task has boolean `pass`, `skill_version` present) and exits
    non-zero on a malformed/short report. **This bash gate is the deterministic judge of the
    REPORT; Claude is the engine of the RUN (INV-1).**
  - Wire `tfc_eval` via the §4.1 recipe (schema/handler/registry/cli).
- **DOGFOOD:** write `skills/pattern/vague-to-system/evals.yaml` (3 real golden tasks), run
  `tfc_eval`, execute the returned prompt, write the report, run `lane-gate.sh`.
- **VERIFY:**
  ```bash
  find skills -name eval-report.json | wc -l          # ≥ 1  (a file that NEVER existed before)
  bash runtime/lane-gate.sh skills/pattern/vague-to-system/eval-report.json && echo "REPORT VALID ✓"
  node dist/cli.js lane pattern vague-to-system | grep -o '"lane": *"eval_proven"'   # promoted
  # STALE-DEMOTION proof: bump spec.version, lane must fall back to authored
  # (edit spec.yaml version 1.0.0 -> 1.0.1, then:)
  node dist/cli.js lane pattern vague-to-system | grep -o '"lane": *"authored"'      # stale → authored
  ```
- **EVAL-THEATER MITIGATION (mandatory):** the judge prompt scores **only** observable string
  matches from `evals.yaml`, never "does this look good". `lane-gate.sh` enforces report shape +
  threshold deterministically. If a task has no `must`/`must_not`, the gate rejects the file.
- **ROLLBACK:** delete `evaluate.ts`, the eval-report, unregister the tool.
- **DONE WHEN:** ≥1 eval-report on disk; one skill recomputes to `eval_proven`; a version bump
  demotes it to `authored` (proves the lane tracks freshness, not a stored opinion).

### WAVE 3 — Learnings capture wired live   ·   Vector: V2   ·   risk: LOW

- **GOAL:** make `learnings.jsonl` exist *because a skill ran* — close CRACK-A's input side.
- **FILES:**
  - CREATE `runtime/preamble.sh` + `runtime/learnings-log.sh` — appends one §4.3 line to the
    invoked skill's `learnings.jsonl` (and a row to `analytics/runs.jsonl`) on real use.
  - EDIT `core/install.ts` — the install compile step injects the preamble hook into the
    installed `SKILL.md` (or the `~/.claude/skills` link) so invocation triggers the log.
- **DOGFOOD:** invoke `vague-to-system` once for real → confirm a non-empty `learnings.jsonl`.
- **VERIFY:**
  ```bash
  find skills -name learnings.jsonl -size +0c | wc -l   # ≥ 1 — the manifesto's flagship file, FINALLY real
  ```
- **ROLLBACK:** remove the runtime scripts + the install injection.
- **DONE WHEN:** at least one skill has a non-empty `learnings.jsonl` produced by an actual run.

### WAVE 4 — `tfc_evolve` + `evolution_proven`   ·   Vectors: V2, V4   ·   risk: MED

- **GOAL:** close the loop — consume learnings, regenerate weakest sections, re-eval, and only
  reach `evolution_proven` if the new eval **beats** the old one.
- **FILES:**
  - CREATE `core/evolve.ts` — `buildEvolvePrompt({category,name,dryRun?})` → `Result<{prompt,learningsConsumed,targetSections}>`.
    Guard: refuse (`NOT_READY`) under 3 unconsumed learnings unless `force`. Clusters unconsumed
    learnings + eval failures → scoped regen prompt → version bump → `CHANGELOG.jsonl` append →
    re-validate/re-score/re-eval chain → mark consumed learnings `consumed_in: vX.Y.Z`.
  - REUSE Mind for the outcome signal (INV-6): after re-eval, `POST /v1/decisions/track` then
    `/outcome` with the behavioral delta. **Do not build a new history store.**
  - Wire `tfc_evolve` via the §4.1 recipe (keep `dryRun` — INV-3).
- **DOGFOOD:** evolve `vague-to-system` using its real Wave-3 learnings; produce CHANGELOG + a
  second eval-report.
- **VERIFY:**
  ```bash
  test $(wc -l < skills/pattern/vague-to-system/CHANGELOG.jsonl) -ge 1 && echo "CHANGELOG ✓"
  # two eval-reports with ascending behavioral_score (improvement MEASURED):
  node dist/cli.js lane pattern vague-to-system | grep -o '"lane": *"evolution_proven"'
  # determinism after restart: same lane recomputed from disk
  node dist/cli.js lane pattern vague-to-system > /tmp/x; node dist/cli.js lane pattern vague-to-system > /tmp/y; diff /tmp/x /tmp/y && echo "STABLE ✓"
  ```
- **REGRESSION MITIGATION:** `evolution_proven` requires `delta ≥ 0.05`. A non-improving evolve is
  allowed — it appends an honest CHANGELOG row and the lane stays `eval_proven`.
- **ROLLBACK:** `tfc_evolve --dryRun` first; version bump is revertable via git + CHANGELOG.
- **DONE WHEN:** one skill recomputes to `evolution_proven` from a real, measured improvement; the
  CRUX is dissolved (the loop has run and left proof on disk).

### WAVE 5 — One currency across the ecosystem   ·   Vector: V5   ·   risk: MED (coupling/INV-6)

- **GOAL:** export the lane as the single quality currency; wire `doctor` lane-aware.
- **FILES:**
  - CREATE `core/packbridge.ts` + `tfc_pack_bridge` tool — read Kraken `pairs_skill` blocks at
    `~/.spawner/skills/pattern/kraken-packs/packs.yaml`; let a pack declare `min_lane:`; **read-only**
    report of which paired skills are below floor. Never edits packs.yaml.
  - EDIT `core/doctor.ts` + **register it as `tfc_doctor`** (fixes G4/DELETE #7) — aggregate
    `lane` per skill, `cacheDrift`, `evalStale`, `evolvePending`, and flag any state file outside
    the contract (INV-6 enforcement).
  - Give the builder's own skills lanes (dogfood — the forge grades itself).
- **VERIFY:**
  ```bash
  node dist/cli.js pack-bridge | grep -E "min_lane|below_floor"      # report renders
  node dist/cli.js doctor | grep -E "cacheDrift|evalStale"           # doctor is lane-aware
  ```
- **DONE WHEN:** a pack requiring `min_lane: eval_proven` paired to an `authored` skill is flagged;
  `doctor` reports lanes + drift and is reachable as an MCP tool.

### WAVE 6 — Authoring polish (LAST)   ·   Vector: V1   ·   risk: LOW (sequence guard)

- **GOAL:** only now — archetype scaffolds, `tfc_compile` intent front door, `voicefix`. Every
  new skill is **born loop-ready**.
- **FILES:** `core/compile.ts` + `prompts/skillcard.fragment.ts` (per `05-IMPROVEMENTS` Tool 1);
  archetype variants in `_template/`; `prompts/voicefix.fragment.ts`.
- **VERIFY:**
  ```bash
  node dist/cli.js compile --intent "..." | grep -E "lane: *authored"   # SkillCard born with a lane
  # and the emitted SkillCard contains 3 eval seeds (evals.yaml stub)
  ```
- **DONE WHEN:** `tfc_compile` emits a SkillCard carrying `lane: authored` + 3 eval seeds.

---

## 8 — RISK MAP (per wave; mitigate vs accept)

| Wave | Hurdle | Decision |
|---|---|---|
| 1 | recompute non-determinism (map order, timestamps) → lane flickers | **Mitigate**: pure fn over sorted inputs; VERIFY diffs two runs |
| 2 | **eval-theater** (model grades itself kindly) | **Mitigate**: observable `must`/`must_not` only; `lane-gate.sh` validates shape+threshold |
| 2/4 | **restart-amnesia** (lane lives in session memory) | **Mitigate**: lane is recomputed from files, never held in memory; VERIFY re-runs after "restart" |
| 3 | preamble append fails silently → 0 files again | **Mitigate**: VERIFY asserts `-size +0c`; doctor flags `neverInvoked` |
| 4 | evolve regresses but claims improvement | **Mitigate**: `delta ≥ 0.05` required; **Accept**: honest no-improvement rows |
| 5 | cross-system coupling tempts a lane-history DB (breaks INV-6) | **Mitigate**: history = CHANGELOG + Mind; doctor flags stray state |
| 6 | authoring polish creeps earlier (original sin) | **Accept/guard**: W6 gated behind W1–W4 green |

---

## 9 — APPENDICES

### 9.1 `waves.jsonl` row schema (append one per shipped wave)
```json
{"wave":2,"name":"tfc_eval","ts":"2026-06-14T...","status":"complete","vectors":["V2","V3"],"exit_gate":{"target":"≥1 eval-report.json AND one skill eval_proven","result":"vague-to-system=eval_proven, report behavioral_score 0.86"},"tests":"NNN/NNN green","typecheck":"clean","touched":["core/evaluate.ts","prompts/judge.fragment.ts","runtime/lane-gate.sh","_template/evals.yaml"]}
```
> Note (DELETE #8): the `exit_gate.target` is a **lane/artifact** target, never `tfc_score ≥ N`.

### 9.2 Glossary
- **Lane** — earned evidence state: `authored | eval_proven | evolution_proven`. Recomputed, never asserted.
- **Golden task** — one `{prompt, must[], must_not[]}` row in `evals.yaml`; the unit of behavioral proof.
- **Behavioral score** — fraction of golden tasks where all `must` matched and no `must_not` matched.
- **Structural floor** — the old `tfc_score`, now gating `authored` only.
- **Dogfood** — the builder uses a new feature on a real skill before the wave is "done" (INV-5).
- **Stale demotion** — a `spec.version` bump invalidates an old eval-report; lane drops to `authored`.

### 9.3 Anti-slop rules (enforced in review)
- No god-modules; one core file per concern (`lane.ts`, `evaluate.ts`, `evolve.ts`).
- No vague names (`data`, `helper`, `manager`, `util`, `handler`-as-noun). Errors surface as `Result`, never swallowed.
- A behavioral check is an **observable** `must`/`must_not` string or a baseline-vs-loaded delta —
  never the model's vibe about its own output.
- Never quote a quality number you did not just recompute from disk (DELETE #10).

### 9.4 Definition of done for the whole v2
The CRUX is dissolved when, on a fresh clone:
`tfc_eval` then `tfc_evolve` move one skill `authored → eval_proven → evolution_proven`, leaving an
`eval-report.json`, a non-empty `learnings.jsonl`, and a `CHANGELOG.jsonl` on disk — and a stranger
can recompute the same lane after a restart. At that point "this skill is good" is a fact on disk,
not a number a builder typed.
