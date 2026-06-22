---
name: autovibe
version: 0.9.0
description: >
  Vibe-coding compiler. Takes a vague intent ("health app for a bodybuilder") and emits an
  executable, quality-gated prompt artifact: a CATCQ prompt-pack (greenfield build) or one
  self-contained ULTRA prompt (transformation of an existing system). Dual-backend on one
  front-end IR (GROUND crux, DECOMPOSE lists, TRANSCEND charter). Pure markdown plus Claude,
  no API keys. It compiles prompts; it never executes them and writes only to ~/prompt-packs/.
---

<!-- TFC:PREAMBLE-HOOK START -->
## TFC Runtime Hook (managed — do not edit; tfc_install regenerates this block)

Run this first. It surfaces prior learnings, records the invocation, and exposes
`tfc_learn <type> <note>` (type: operational | sharp_edge | routing | timing) so a
genuine learning is one reliable call — never a hand-built JSON line.

```bash
_TFC_RT="${TFC_HOME:-$HOME/.future-code}/mcp/tfc-builder/runtime"
[ -f "$_TFC_RT/preamble.sh" ] && source "$_TFC_RT/preamble.sh" "pattern" "autovibe"
```
<!-- TFC:PREAMBLE-HOOK END -->

# AUTOVIBE: Vibe-Coding Compiler

> Intent in. Prompt artifact out. World-class system follows.

## Preamble (run first)

Before compiling anything, do these four in one batch:

1. Read `spec.yaml` (identity, sharp edges, the runtime output contract) so detection is primed.
2. `mind_retrieve(query=<intent>)` for past similar packs and their outcomes.
3. Grade complexity (spawner_orchestrate is PRE-1): L1-L2 => lite, L3 => full, L4 => deep.
4. Pick the BACKEND before any depth decision (see `## BACKEND`). The two artifacts are not
   interchangeable: a greenfield build is a pack, a transformation of an existing system is an
   ULTRA prompt.

This skill self-tracks. Every invocation appends one row to `~/.future-code/analytics/runs.jsonl`
via the capture hook, and any real failure appends one candidate row to `learnings.jsonl`
(no `consumed_in`) so `tfc_evolve` can later fold it in. The skill never writes a learning it
did not actually observe.

## When to invoke

- `/autovibe <intent>`, `vibe code <X>`, "build me a prompt-pack for <X>", "compile prompts for <X>".
- Transformation of an existing system ("make X great", "next-level X", "1000x X", "overhaul X")
  or `--ultra` / `--one` => the ULTRA backend.
- If the user names a target system in vague form, invoke this skill BEFORE writing any code
  yourself. The skill produces the spec the user actually wanted.

## Phase 1: PREAMBLE and BACKEND SELECT

Run the Preamble batch, grade complexity, then choose the backend and emit the `## BACKEND` block.

- Backend: a transformation verb-class on an EXISTING system, or `--ultra`/`--one`, compiles ULTRA (one self-contained prompt). A greenfield build compiles a PACK (a directory of CATCQ files).
- Misuse guard: greenfield intent plus `--ultra` is a misuse. Ambiguous single intent: ask the one disambiguating question; never guess the fork.
- Compound intent: when one request carries BOTH an enhance-existing part AND a build-new part (for example "make my CLI faster and also build a dashboard"), do not collapse to one fork. Split the intent and sequence BOTH backends: ULTRA for the existing part, PACK for the new part. Emit one `## BACKEND` block per sub-intent, each with its own `Chosen:` line, in dependency order.
- Depth: from the L1-L4 grade. `--ambitious` forces deep and forces P1.5 TRANSCEND.

### ## BACKEND

State `Chosen: pack | ultra`, one line of `Why`, and `Depth: lite | full | deep`. For a compound
intent emit one such block per sub-intent: `Chosen: ultra` for the existing-system part and
`Chosen: pack` for the new-build part, then compile each in order.

Evidence: the `## BACKEND` block is printed before any compile step; a compound intent prints two.
If the fork is ambiguous or a misuse, ask the one question and **STOP.** Do not guess the fork.

## Phase 2: GROUND

Run P0.0 GROUND and emit the `## GROUND` block.

### ## GROUND

State `Verdict: grounded | ungrounded` with one line each for actor, cost, and evidence.

Evidence: the `## GROUND` block carries a verdict plus actor, cost, and evidence lines.
If ungrounded, write 00-UNGROUNDED.md and **STOP.** Do not compile a pack for a possibly-unreal problem.

## Phase 3: COMPILE

Pack backend runs P1 to P5; ultra backend runs PΩ (which replaces P2-P5).

| Pass | Name | Output | Fires when |
|------|------|--------|-----------|
| P0.0 | GROUND | 00-PROJECT.md crux header, or 00-UNGROUNDED.md on halt | Always, unless arrived grounded |
| P0 | RECONNAISSANCE | 00-RECON.md (refs, weaknesses, white-space) | Intent names existing products |
| P1 | DECOMPOSE | 00-PROJECT.md (who, JTBDs, via-negativa) | Always |
| P1.5 | TRANSCEND | 00-TRANSCEND.md (charter, superpowers, design vectors) | P0 ran, or --ambitious, or deep |
| PΩ | ULTRA-COMPILE | ULTRA-PROMPT.md + COMPILE-REPORT.md | Ultra backend only |
| P2 | DOMAIN-MAP | domain x stack matrix | Pack backend |
| P3 | CATCQ-FILL | one CATCQ block per domain | Pack backend |
| P4 | COMBO-ASSEMBLE | 01-architecture.md + RUN-ORDER.md | Pack backend |
| P5 | QUALITY-WRAP | scope limiters, quality modifiers, VERIFY on every file | Pack backend |

Evidence: each pass writes its output file (00-RECON.md, 00-TRANSCEND.md, the CATCQ files and
RUN-ORDER.md, or ULTRA-PROMPT.md). P0 plus P1.5 are the ambition engine: when intent names
existing products, autovibe finds the cracks and designs beyond them instead of cloning.

## Phase 4: GATE and SHIP

Run `bin/autovibe-gate.sh` in the backend's mode, then emit the `## COMPILE REPORT` block.

### ## COMPILE REPORT

State the output path under `~/prompt-packs/<slug>/`, the file list, the 0-100 quality score,
the skills loaded (cap 3 per domain), and the recommended next paste-target. For ULTRA, the
two files are `ULTRA-PROMPT.md` and `COMPILE-REPORT.md`; for PACK, at least 8 files.

Evidence: the gate exits 0 and the `## COMPILE REPORT` lists path, file count, and the score.
If the gate exits 2, the run is BLOCKED. **STOP.** Fix the named gap; do not ship below the floor.

## Handoff

autovibe compiles; it does not execute. Route the user to the next step: paste the first pack
file (or the ULTRA prompt) into any LLM to build, then `/cso` for a security pass on
security-adjacent code, and `/ship` to land. The outcome row closes via `/autovibe --outcome <slug>`.

## Build Receipt (return edge - W1, all backends)

Every compiled artifact MUST end with a `## BUILD RECEIPT` block that tells the downstream
executor, after building and running the artifact's VERIFY probe, to emit one line back to
autovibe's sensor. Emit this block verbatim into the LAST pack file (and the ULTRA prompt tail),
with `<slug>` filled in:

```
## BUILD RECEIPT (close autovibe's loop with a REAL outcome)
After you build this and run the VERIFY checks above, report the result so autovibe learns
from what actually built (not a taste verdict). Run ONE line:

  ~/.kraken/outcomes/receipt-ingest.sh --slug <slug> --result pass|fail|partial \
    --probe "<the VERIFY check you ran>" --sections "<files/sections you touched>"

If you cannot run it, paste the result back and a human fires `/autovibe --outcome <slug> good|bad`.
```

Why: it flips the pending ledger row and emits the `mind_decide` that adjusts prior salience by
what actually built. Without it the run is write-only (route-outcomes.correct was null in 276/276
rows; see `~/prompt-packs/autovibe-1000x/REDESIGN-ANSWER.md`). The receipt is the v_next signal;
the `sections` field is what W3 (per-section credit) will read.

## Simulate (pre-ship dry run - W2, all backends)

A real receipt only lands after a downstream build, and ambiguous / non-software intents may never
get one. So before declaring an artifact ship-ready, autovibe runs ONE dry-run pass: the model,
offline (no API call, same engine basis as the BUILD RECEIPT instruction), role-plays the
downstream executor against each VERIFY probe and PREDICTS the outcome, emitting a labelled
simulated receipt per probe:

```
~/.kraken/outcomes/receipt-ingest.sh --slug <slug> --result pass|partial|fail --kind sim \
  --probe "<the VERIFY check predicted>" --sections "<sections it exercises>" \
  --detail "predicted: <why it passes/fails as written>"
```

Rules: `--kind sim` stores `kind:"sim", predicted:true` and NEVER bridges a ledger row or fires
`mind_decide` - real always wins. A predicted fail/partial means fix the artifact BEFORE ship.
`~/.kraken/outcomes/sim-calibrate.sh` scores each prediction against the real receipt that lands
later and reports the agreement rate; a judge that keeps missing reality is decayed in W4.

## Attribute (per-section credit - W3, all backends)

Receipts name which grammar sections were in play; `~/.kraken/outcomes/grammar-attribute.sh` turns
that into SIGNED CREDIT per section, so the loop learns which parts of the grammar drive build
success - not just whether a whole pack was good. It diffs winning vs losing artifacts within an
intent-class (derived from the slug, or set with `receipt-ingest.sh --class <name>`):

- Contrastive where possible: `credit(section) = mean(quality|present) - mean(quality|absent)` in
  that class; absolute (`mean|present`) when no absent peer exists yet.
- Real always wins: a class with any real receipt is scored from real only; a sim-only class is
  tagged `basis:"sim-bootstrap"` so W4 can down-weight it.
- Never mutates a shipped pack - output is a separate, additive `grammar-profile.jsonl`. W4 makes
  the gate/templates READ that profile; W3 only measures. Fill `--sections` with grammar sections
  (CATCQ block names / `§N` ids), not file paths. Win condition: >=1 section with a learned weight.

## Learn grammar (profile-guided generation - W4, the PGO step)

Before compiling, consult `~/.kraken/outcomes/grammar-guide.sh` (reads the W3 profile): STRENGTHEN
high-credit sections, REVIEW-PRUNE zero/negative-credit boilerplate, KEEP the rest. The grammar
finally learns from real builds.

- PINNED floors are not learnable: GROUND gate, ambition floor, security/scanner gate are NEVER
  down-weighted or pruned regardless of credit - grammar-guide emits them KEEP-PINNED and
  autovibe-gate.sh BLOCKS (`pin-violated`) if a profile tries to prune one.
- Graceful: no profile -> frozen hand-authored grammar (W4 off). sim-bootstrap credit is provisional.
- Traceability (W4 check): each directive logs to `grammar-guidance.jsonl` with its source credit,
  so every grammar change traces to a profile delta. Falsification: profile-guided grammar must beat
  frozen grammar on held-out real-receipt pass-rate, else the edge is decorative.

## Domain bootstrap (provisional templates - W5, all backends)

When the intent's domain has no template, do not force-fit a wrong neighbour. Synthesise a
PROVISIONAL template (nearest-neighbour + RECON; body is model-free, written at compile) and
register it quarantined: `~/.kraken/outcomes/domain-bootstrap.sh register --domain <class> --from
<neighbour>`. Real receipts decide: `domain-bootstrap.sh promote` reads build-receipts.jsonl and
graduates to `authored` after >= N real passes, or retires after >= M real fails with 0 passes.

- Receipts promote, not self-score: only REAL receipts move the lane; sim passes are ignored.
- INVARIANT: a provisional template can NEVER claim eval_proven/evolution_proven - the top this
  lifecycle grants is `authored`; the TFC eval/evolve loop earns higher on real data.
- W5 win: >=1 domain with no prior template reaches a passing real receipt and graduates.

## Quality gates (enforced before SHIP)

The blocking gate is `bin/autovibe-gate.sh` (modes: ultra | pack | transcend | ground). It exits 2
to BLOCK; the artifact does not ship until it exits 0.

- PACK: >= 8 files; every CATCQ file has QUALITY WRAP and VERIFY; no vague ACTION verb;
  scanner_scan gate present if any security-adjacent domain (auth, integrations, webhooks,
  payments, storage).
- ULTRA: all 10 grammar sections present and non-empty; ambition floor stated with below-floor
  examples; thinking protocol stages each name a visible artifact; output contract forces waves,
  delete list, risk map, and per-wave verify.
- build_receipt_contract_present (all backends): the artifact carries a `## BUILD RECEIPT` block
  calling `receipt-ingest.sh` (warn - W1; promotes to blocker once emission is reliable). No
  receipt block, no execution signal.
- simulate_contract_present (all backends): the artifact carries a `## SIMULATE` / `--kind sim`
  pre-ship dry-run block (warn - W2; promotes to blocker once calibration is trusted). No dry run,
  no prediction to calibrate.
- Lane gate: ship quality is declared by the earned `lane` (tfc_lane reads it from disk), not by a
  self-asserted status field. The self-rubric in scoring.md is a pre-check, not the ship gate.

## Sharp edges (prime detection at PRE-PIPELINE)

1. Intent names a product => run RECON plus TRANSCEND; never clone (frustration, not admiration).
2. Multi-domain intent => cap skills at 3 per domain, 40 per pack; selection beats accumulation.
3. Trivial one-file intent => lite or a plain prompt; do not promote to deep mode.
4. Security-adjacent domain => RUN-ORDER must append a scanner_scan gate, or the pack does not ship.
5. SHIP batch in try/finally => errored runs still write mind_remember at salience 0.7.

## Non-goals

- Does NOT execute the prompts; it compiles, the downstream LLM executes.
- Does NOT make API calls; pure markdown synthesis.
- Does NOT modify the user's project repo; every write goes to `~/prompt-packs/` only.
- Trivial one-file changes are out of scope: that is a normal prompt.

## Completion Status

End every run with one status line:

- `DONE`: artifact written, gate passed, COMPILE REPORT emitted with path and score.
- `BLOCKED`: gate exited 2, or an invariant would break; state the blocking gate and the fix.
- `NEEDS_CONTEXT`: intent too thin to compile, or backend ambiguous; ask the one question that
  unblocks and stop. Do not compile from nothing.

## Telemetry (run last)

On SHIP (try/finally, always fires even on error):

- `mind_remember(salience=0.9 on success, 0.7 on failure)` with the intent, backend, and score.
- Append a pending outcome row to `~/.kraken/outcomes/decisions.jsonl` (source autovibe) carrying
  the PRE `mind_retrieve` retrieval_id; `/autovibe --outcome <slug> good|bad` closes it via mind_decide.
- If a pass threw or a gate blocked, append one candidate row to `learnings.jsonl` describing the
  real failure (no `consumed_in`) so `tfc_evolve` can fold it into the weakest section later.
- The capture hook has already appended this invocation to `~/.future-code/analytics/runs.jsonl`.
