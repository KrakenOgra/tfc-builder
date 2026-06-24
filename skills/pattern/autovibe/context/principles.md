---
last_verified: 2026-06-23
freshness_clock: 2026-06-23
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.9"
forge_domain: "autovibe"
fill_hint: "5 grounded principles; each cites a reason it is true (not 'best practice'), is falsifiable on a new case, and produces a concrete change when applied."
---

## Principles

source: autovibe/SKILL.md + autovibe/spec.yaml

### 1. BACKEND before depth
**Principle:** Pick PACK vs ULTRA before grading complexity or loading skills. The two backends produce structurally incompatible artifacts — depth decisions (lite / full / deep) are meaningless until BACKEND is fixed.

**Why it is true:** CATCQ requires multi-section wave structure; ULTRA is a single cohesive document. A depth decision made before BACKEND selection gets applied to the wrong template, producing an artifact that cannot be executed by the other backend's runner.

**Falsifiable:** On a new case — if BACKEND is not stated in the first section of the COMPILE REPORT, the principle was violated. Test: does the output contain `Chosen: pack` or `Chosen: ultra` before any DECOMPOSE or CATCQ section? If not, BACKEND came too late.

**Concrete change:** Add "## BACKEND / Chosen: ___" as the first emitted section, before complexity grading. Block COMPILE if this section is absent.

---

### 2. GROUND is a blocking gate, not a suggestion
**Principle:** No COMPILE proceeds without a one-sentence falsifiable crux produced by GROUND. A vague intent fed directly into CATCQ produces an unbounded scope.

**Why it is true:** The CATCQ Context section is the organizing spine of the entire PACK. If Context inherits the raw vague intent, every downstream section (Assumptions, Themes, Constraints, Questions) inherits the same ambiguity — the prompt is unfalsifiable and will expand scope in every wave.

**Falsifiable:** On a new case — does the COMPILE REPORT contain a crux sentence that can be answered yes/no? ("The system fails because users cannot X" is falsifiable. "Build a great app" is not.) If the crux is not testable, GROUND did not complete.

**Concrete change:** GROUND produces exactly one falsifiable sentence before COMPILE is allowed to proceed. If GROUND cannot produce it, emit STOP — do not proceed with a fuzzy crux.

---

### 3. TRANSCEND replaces clone, it does not extend it
**Principle:** When RECON surfaces a named product as the inspiration, the TRANSCEND charter must refuse feature-for-feature parity and name the axes of differentiation explicitly. A TRANSCEND that appends differentiation to a feature list is still a clone.

**Why it is true:** Cloning ships forgettable software because the clone's feature surface is defined by the original's decisions, not by the user's actual crux. TRANSCEND's job is to find what the named product cannot do — and build from that gap outward.

**Falsifiable:** On a new case — does the TRANSCEND charter contain a line that says "NOT: [feature X]"? If the charter only adds features without subtracting the original's constraints, TRANSCEND did not run. The tell: a charter that has no "NOT" list is a feature roadmap, not a differentiation frame.

**Concrete change:** Every TRANSCEND charter requires at least one "NOT:" line — an explicit refusal of a named product feature. If the charter has no refusals, send it back through RECON.

---

### 4. STOP is correct behavior, not a failure
**Principle:** Returning STOP / NEEDS_CONTEXT on out-of-scope tasks (trivial ops, unresolvable BACKEND, missing crux signal) is the right output — emitting a partial COMPILE REPORT to avoid looking unhelpful is the failure.

**Why it is true:** autovibe's output is consumed by an execution agent. A partial COMPILE REPORT with an unclosed BACKEND or a fabricated crux will cause the executor to build the wrong thing or produce a build with no grounding. The RECEIPT will come back mismatched and `tfc_evolve` will ingest a false signal.

**Falsifiable:** On a new case — if autovibe emits a COMPILE REPORT for a single-file rename or a conflicted BACKEND, the principle was violated. Test: does the output for a trivial task contain "STOP" or "NEEDS_CONTEXT"? If it contains "## BACKEND / Chosen:" instead, STOP was suppressed.

**Concrete change:** Add a scope-check gate before GROUND. If the task is a single-file operation or has conflicting BACKEND signals, emit STOP immediately with a one-line redirect. Never emit a COMPILE REPORT to avoid the STOP.

---

### 5. The compiler writes prompts, never code
**Principle:** autovibe's only write targets are `~/prompt-packs/` (for PACK artifacts) and the ULTRA prompt document. It never writes to the user's project repo, never executes the compiled prompt, and never produces a RECEIPT itself.

**Why it is true:** If autovibe writes code directly, the GROUND → TRANSCEND → quality-gate cycle is bypassed. The output is ungrounded code with no crux, no differentiation charter, and no COMPILE REPORT for the executor to review. The feedback loop (RECEIPT → learnings.jsonl → tfc_evolve) breaks because there is no compiled artifact for the executor to run.

**Falsifiable:** On a new case — does autovibe's output contain any file write to the user's project directory (outside `~/prompt-packs/`)? If yes, the principle was violated. Test: search the session for `Edit(` or `Write(` calls targeting project paths — any such call during an autovibe invocation is a scope violation.

**Concrete change:** Block all Edit/Write tool calls to paths outside `~/prompt-packs/` during autovibe's compile cycle. If a user asks autovibe to "also implement it," redirect: compile the prompt, point to the PACK, then stop.
