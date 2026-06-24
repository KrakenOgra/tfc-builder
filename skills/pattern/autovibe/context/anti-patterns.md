---
last_verified: 2026-06-23
freshness_clock: 2026-06-23
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.9"
forge_domain: "autovibe"
fill_hint: "The 5-8 most common domain failures; each: the failure pattern -> why it fails -> the corrected version."
---

## Failure Modes

source: autovibe/spec.yaml #sharp_edges + autovibe/eval-report.json

### 1. Clone-instead-of-TRANSCEND
**Pattern:** Intent names a known product ("build something like Notion") → autovibe enumerates that product's features as requirements and produces a PACK that clones the target.

**Why it fails:** The PACK's CATCQ inherits the named product's feature surface. GROUND never ran to find the user's actual frustration (the crux), so the compiled prompt designs a forgettable copy rather than a differentiated system. The COMPILE REPORT will show BACKEND=PACK but no TRANSCEND charter, which is the structural tell.

**Corrected version:** RECON runs first (surface the named product's weaknesses). GROUND extracts the crux (what is the user actually frustrated with?). TRANSCEND builds a charter that explicitly refuses feature-for-feature parity and names the differentiation axes instead.

---

### 2. Skipping GROUND
**Pattern:** BACKEND is picked and COMPILE runs immediately on the raw intent without a GROUND step.

**Why it fails:** The CATCQ structure requires a falsifiable crux as its organizing spine. Without GROUND, COMPILE injects the vague intent directly into the Context section — producing a prompt that is broad, unfalsifiable, and inconsistent in scope. The generated build spec will spawn scope-creep debates in every wave.

**Corrected version:** GROUND is a blocking gate. Run it on the raw intent to produce a one-sentence falsifiable crux before any BACKEND decision. Only then does COMPILE proceed.

---

### 3. Wrong BACKEND (ULTRA for greenfield, PACK for transformation)
**Pattern:** User says "build me a Stripe payment integration" (greenfield) → autovibe emits a single ULTRA prompt. Or: "make my auth system great" (transformation) → autovibe emits a multi-file CATCQ PACK.

**Why it fails:** ULTRA is a single self-contained prompt — it has no CATCQ sections, no wave structure, no skill-load caps. A greenfield build executed as one ULTRA prompt produces an unbounded scope dump. Conversely, a PACK for a transformation breaks into sections that assume a blank-slate system and ignores the existing codebase's constraints.

**Corrected version:** BACKEND selection is the first decision after GROUND, before any depth grading. The heuristic is binary: does a named, existing system need to change (ULTRA) or does a new system need to be created (PACK)?

---

### 4. Executing the prompt instead of compiling it
**Pattern:** autovibe receives an intent, then writes code directly to the user's project repo, bypassing the COMPILE step entirely.

**Why it fails:** autovibe is a compiler, not an executor. Writing code is out of scope: the COMPILE REPORT must be the final output, and only `~/prompt-packs/` is a valid write target. Code written directly skips the GROUND + TRANSCEND + quality-gate cycle that makes the generated artifact trustworthy.

**Corrected version:** Emit the PACK or ULTRA prompt artifact to `~/prompt-packs/`. Stop. The user or another agent executes the compiled prompt. If the execution produces a RECEIPT, `tfc_evolve` ingests it — but autovibe never triggers that chain itself.

---

### 5. Compound-intent blindness (one BACKEND for two systems)
**Pattern:** "Enhance my CLI and build a dashboard for it" → one undifferentiated BACKEND block and one merged CATCQ.

**Why it fails:** The two systems have different BACKEND requirements (ULTRA for the existing CLI, PACK for the new dashboard) and a dependency ordering constraint (dashboard is blocked until CLI enhancement ships). Merging them into one BACKEND produces an artifact that neither execution model can consume correctly.

**Corrected version:** Detect compound intent. Split into two ordered BACKEND blocks. GROUND each independently. The dependency order is a GROUND output — emit it explicitly in the COMPILE REPORT so the executor knows which to run first.

---

### 6. Missing scanner_scan gate for security-adjacent builds
**Pattern:** PACK is emitted for a system involving auth, payments, or webhooks with no mention of a security scan gate in the COMPILE REPORT.

**Why it fails:** Generated prompts for security-adjacent systems will produce code that needs scanner validation before it ships. Without the gate, the RECEIPT never includes security scan status, and the feedback loop `tfc_evolve` receives is incomplete — it can't distinguish "shipped clean" from "shipped with vulns."

**Corrected version:** When GROUND crux or DECOMPOSE list contains auth, payments, webhooks, or user data — append `scanner_scan gate: required before RECEIPT` to the COMPILE REPORT explicitly.

---

### 7. STOP omission on ambiguous BACKEND
**Pattern:** User passes both greenfield signals ("build a new X") and `--ultra` in the same message → autovibe picks one arbitrarily and compiles.

**Why it fails:** An arbitrary BACKEND choice without resolving the conflict means one of the two structural paths is wrong. The resulting artifact will fail when executed because it was built against the wrong backend contract.

**Corrected version:** Detect the conflict. Emit STOP with a one-line question: "Greenfield (PACK) or transformation of an existing system (ULTRA)?" Do not compile until the BACKEND ambiguity is resolved.
