---
last_verified: 2026-06-23
freshness_clock: 2026-06-23
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.9"
forge_domain: "autovibe"
fill_hint: "10-term domain glossary, recommended reading order of the artifacts, and a DOMAIN-AGNOSTIC 5-step bootstrap recipe."
---

## Glossary

source: autovibe/SKILL.md + autovibe/spec.yaml

| Term | Definition |
|------|-----------|
| **ULTRA** | A single self-contained prompt document for transforming an existing system. Triggered by `--ultra`, `--one`, or transformation language ("make X great"). |
| **COMPILE** | The act of turning a vague intent into a structured prompt artifact (PACK or ULTRA). Compile never writes code. |
| **GROUND** | The pre-compile crux-finding step. Reduces vague intent to one falsifiable sentence. Blocking gate — no COMPILE proceeds without it. |
| **BACKEND** | The structural choice between PACK and ULTRA. Must be declared before depth grading or skill loading. |
| **CATCQ** | Context, Assumptions, Themes, Constraints, Questions — the section structure of a PACK artifact. |
| **REPORT** | Short for COMPILE REPORT — the output gate artifact that contains BACKEND choice, crux, DECOMPOSE list, TRANSCEND charter. |
| **STOP** | Scope deferral gate. Emitted when the task is out of scope (trivial op, conflicted BACKEND, missing crux). Correct behavior, not a failure. |
| **TRANSCEND** | Ambition amplification charter. Runs after RECON when intent names a known product. Produces a differentiation frame with explicit "NOT:" refusals. |
| **PACK** | A multi-section CATCQ prompt artifact for greenfield builds. Writes to `~/prompt-packs/<name>/`. |
| **RECEIPT** | An observed build outcome (produced by the build environment, never by autovibe). Feeds `tfc_evolve` via `learnings.jsonl` to sharpen future compiles. |

## Reading Order

source: autovibe/SKILL.md

1. **taxonomy.md** — Understand the 7 categories (PACK, ULTRA, GROUND, TRANSCEND, COMPILE REPORT, STOP, RECEIPT) and the BACKEND decision table before anything else.
2. **principles.md** — Read the 5 principles to understand the invariants the compiler enforces. These are falsifiable: apply them to a new case to check if you understand them.
3. **few-shots.md** — Study the 3 worked examples to see GROUND → BACKEND → COMPILE → REPORT in sequence. Pay attention to the "because" annotations — they explain the mechanism, not just the result.
4. **anti-patterns.md** — Read the 7 failure modes. Most autovibe errors are GROUND-skips, wrong BACKEND, or clone-instead-of-TRANSCEND. The corrected versions are the operative rules.
5. **META.md** (this file) — Glossary and bootstrap recipe. Return here when a term is ambiguous or when starting a new domain context derivation.

## Bootstrap Recipe

source: autovibe/SKILL.md (domain-agnostic 5-step)

This recipe applies to ANY domain, not just autovibe. Use it when deriving a new context scaffold from a SKILL.md.

1. **Identify the fundamental categories.** What are the 5-8 types or phases that every invocation of this domain touches? Each category should have a name, a one-sentence definition, and a "when to use" condition. If two categories feel indistinguishable, merge them.

2. **Find the blocking gates.** Which steps are mandatory-before-the-next? Draw the dependency graph. Any gate that can be skipped without an error is not a real gate — make it blocking or remove it.

3. **Extract the structural incompatibilities.** What pairs of options in this domain are mutually exclusive? Name them explicitly. Incompatibilities are the most common source of wrong-backend / wrong-path failures.

4. **Write the STOP conditions.** What inputs are out of scope for this domain? A domain without explicit STOP conditions will silently attempt everything — and fail on the edge cases it was never designed to handle.

5. **Derive the feedback loop.** What artifact does this domain produce, and what observable outcome closes the loop? Name the output artifact, the observable signal, and the mechanism by which the signal updates the domain's future behavior (the RECEIPT → evolve path). A domain without a closed loop cannot improve.
