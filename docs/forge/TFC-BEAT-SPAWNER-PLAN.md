c# TFC BEAT SPAWNER — Plan

> Plan only. No TFC skill or source is modified by this document.
> Thesis: TFC cannot and should not beat spawner on **breadth** (476 vs 7).
> It beats spawner on **provenance** — an *earned, disk-recomputed* lane ladder
> (`authored → eval_proven → evolution_proven`) that spawner has **zero** of.
> Every number below was measured on disk on 2026-06-15 and cites the command that produced it.

---

## CURRENT STATE

Measured facts (each line ends with the command that produced it):

- **TFC = 7 functional skills** (+1 `_template/` scaffold = 8 dirs).
  `find ~/.future-code/skills -name spec.yaml -not -path '*/_template/*' | wc -l` → `7`
- **TFC builder = 17 distinct `tfc_*` symbols** (compile → eval → evolve loop).
  `grep -rhoE 'tfc_[a-z]+' ~/.future-code/mcp/tfc-builder | sort -u | wc -l` → `17`
- **Only 1/7 skills carry a populated `lane:`** — `genius-ai` (`lane: authored`); the other 6 have an empty `lane:` field.
  `grep -rl '^lane: [a-z]' ~/.future-code/skills --include=spec.yaml | wc -l` → `1`
- **3/7 skills have on-disk eval evidence** (`eval-report.json`, `behavioral_score: 1.0`, threshold `0.8`): `genius-ai`, `intent-to-goal`, `vague-to-system`.
  `find ~/.future-code/skills -name eval-report.json | wc -l` → `3`
- **2/7 skills have evolution evidence** (`CHANGELOG.jsonl`): `genius-ai`, `vague-to-system`.
  `find ~/.future-code/skills -name CHANGELOG.jsonl | wc -l` → `2`
- **The stale-lane bug:** `genius-ai` has an eval-report (score 1.0) **and** a CHANGELOG, yet its lane still reads `authored`. The provenance machinery (`tfc_lane`, `tfc_eval`, `tfc_evolve`) and the disk evidence both exist — but the lane field is **not recomputed from that evidence**.
  `grep -rl '^lane: authored' ~/.future-code/skills --include=spec.yaml` → `.../genius-ai/spec.yaml`
- **spawner = 476 skills** — breadth is unwinnable; do **not** compete on count.
  `find ~/.spawner/skills -name skill.yaml -type f | xargs -n1 dirname | sort -u | wc -l` → `476`
- **spawner has 0 provenance** — no `lane:`, no `eval_proven`, no `evolution_proven` anywhere in its corpus. This is the open moat.
  `grep -rl 'eval_proven\|evolution_proven\|^lane:' ~/.spawner/skills | wc -l` → `0`
- **Build velocity:** all 7 TFC skills authored across **2 days** (2026-06-14 → 2026-06-15).
  `find ~/.future-code/skills -name spec.yaml -not -path '*/_template/*' -printf '%TY-%Tm-%Td\n' | sort -u`

**One-sentence read:** TFC already owns the only axis where it can win (earned provenance), but the lane ledger is wired to a schema, not to the disk — so the moat reads `1/7` instead of the `3/7` the evidence already supports.

---

## SCORECARD

Three dimensions × {TFC now · spawner · target}. Every cell is a number or a disk-checkable command — no unfilled placeholders.

| Dim | Metric | TFC (now) | spawner | Target | Disk command (re-runnable) |
|---|---|---|---|---|---|
| **Quality** | Eval coverage (skills w/ `eval-report.json`) | **3/7** | **0/476** | **7/7** | `find ~/.future-code/skills -name eval-report.json \| wc -l` · `find ~/.spawner/skills -name eval-report.json \| wc -l` |
| **Quality** | Behavioral pass score (eval'd skills) | **1.0** (bar 0.8) | **n/a — 0 harnesses** | **≥0.9 held** | `python3 -c "import json;print(json.load(open(F))['behavioral_score'])"` per `eval-report.json` |
| **Quality** | Per-skill validation gate (`validations.yaml`) | **6/7** | **0/476** | **7/7** | `find ~/.future-code/skills -name validations.yaml -not -path '*/_template/*' \| wc -l` · `find ~/.spawner/skills -name validations.yaml \| wc -l` |
| **Velocity** | Compiler tool surface (born→ship→eval→evolve) | **17** | **0 disk-native gen tools** | **17 (hold — deepen, don't widen)** | `grep -rhoE 'tfc_[a-z]+' ~/.future-code/mcp/tfc-builder \| sort -u \| wc -l` |
| **Velocity** | Build loop dated/throughput | **7 skills / 2 days** | **static corpus (no dated loop)** | **1-cmd `tfc_compile` born-with-lane** | `find ~/.future-code/skills -name spec.yaml -not -path '*/_template/*' -printf '%TY-%Tm-%Td\n' \| sort -u` |
| **Provenance** | Populated `lane:` | **1/7** | **0/476** | **7/7** | `grep -rl '^lane: [a-z]' ~/.future-code/skills --include=spec.yaml \| wc -l` |
| **Provenance** | Lane↔evidence consistency (lane matches on-disk eval/evolution proof) | **0/3** | **0 (no lane concept)** | **3/3 → 7/7** | compare: `grep -rl '^lane: authored' …` (1) vs `find … -name eval-report.json` (3) → 2 under-graded |
| **Provenance** | Earned-lane ladder exists at all | **yes (`authored→eval_proven→evolution_proven`)** | **no (0 matches)** | **yes + self-healing** | `grep -rl 'eval_proven\|evolution_proven\|^lane:' ~/.spawner/skills \| wc -l` → `0` |

**Where TFC already wins:** every Provenance and Quality row — spawner scores `0` on each.
**Where TFC must not fight:** breadth (476 vs 7) — absent from this scorecard by design.
**The one red cell:** Provenance row 2 — lane↔evidence consistency `0/3`. The moat is built but un-wired.

---

## ENHANCEMENT WAVES

Plan only — these are proposed moves, not executed here. Ordered by leverage (close the red cell first).

- **Wave 1 — Recompute lanes from disk (un-stale the moat).**
  Run `tfc_lane` (recompute mode) so each skill's `lane:` is derived from on-disk evidence, not hand-set: `genius-ia` → `evolution_proven` (has eval-report **and** CHANGELOG); `intent-to-goal` + `vague-to-system` → `eval_proven` (have eval-report).
  Moves Provenance: populated lane `1/7 → 3/7`, consistency `0/3 → 3/3`.
  Verify: `grep -rl '^lane: [a-z]' ~/.future-code/skills --include=spec.yaml | wc -l` → `3`.

- **Wave 2 — Backfill the eval harness to all 7 (raise the quality floor).**
  Add `evals.yaml` to the 4 skills missing it (`evals.yaml` coverage is `3/7` today: `find ~/.future-code/skills -name evals.yaml -not -path '*/_template/*' | wc -l`), run `tfc_eval`, let earned lanes promote.
  Moves Quality: eval coverage `3/7 → 7/7`; Provenance: populated lane `3/7 → 7/7`.

- **Wave 3 — Make lane recomputation automatic (self-healing provenance).**
  Wire `tfc_doctor` / install-time check to recompute `lane:` from disk on every `tfc_install` / `tfc_validate`, so a lane can never again drift from its evidence (the bug that produced `1/7`).
  Moves Provenance: consistency target `7/7` and *stays* there without manual runs.

- **Wave 4 — Surface the moat in the product (positioning, not breadth).**
  Have `tfc_list` render the lane ladder and badge `evolution_proven` skills — the one thing spawner's 476 cannot display (`grep … ~/.spawner/skills → 0`). Compete on "every skill here is proven," not "we have more."

---

## SUCCESS BAR

"TFC beats spawner" is **not** count parity. It is provenance the corpus of 476 cannot show. Beaten = all of:

1. **Provenance coverage 7/7.** Every functional skill carries an earned, populated lane.
   `grep -rl '^lane: [a-z]' ~/.future-code/skills --include=spec.yaml | wc -l` == `find ~/.future-code/skills -name spec.yaml -not -path '*/_template/*' | wc -l` (both `7`).
2. **Lane↔evidence consistency = 100%.** No skill claims a lane its disk evidence doesn't support (and none under-claims, like `genius-ai` does today).
   Every `lane: eval_proven`+ skill has a matching `eval-report.json`; every `evolution_proven` also has a `CHANGELOG.jsonl`.
3. **≥3 skills at `evolution_proven`.** The top rung spawner has zero of.
   `grep -rl '^lane: evolution_proven' ~/.future-code/skills --include=spec.yaml | wc -l` ≥ `3`.
4. **Spawner gap held open.** The moat is only a moat while spawner stays at zero.
   `grep -rl 'eval_proven\|evolution_proven\|^lane:' ~/.spawner/skills | wc -l` == `0`.
5. **Self-healing.** Re-running `tfc_doctor` after any edit returns lane consistency to `7/7` with no manual `tfc_lane` call (Wave 3 landed).

When criteria 1–4 hold simultaneously and 5 is wired, TFC wins the only contest it can win — and the win is a command anyone can re-run, not a claim.
