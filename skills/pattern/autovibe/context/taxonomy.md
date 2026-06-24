---
last_verified: 2026-06-23
freshness_clock: 2026-06-23
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.9"
forge_domain: "autovibe"
fill_hint: "List the 5-8 fundamental categories/types in this domain; each: name, definition, and a 'when to use' condition."
---

## Categories

source: autovibe/SKILL.md

### 1. BACKEND: PACK (CATCQ prompt-pack)
A multi-section prompt artifact using Context, Assumptions, Themes, Constraints, Questions structure. Produced for greenfield builds where the intent names a new system. Writes to `~/prompt-packs/<name>/`.

**When to use:** Intent is vague ("health app for a bodybuilder"), names no prior system, user wants an executable build spec.

### 2. BACKEND: ULTRA (single self-contained ULTRA prompt)
One cohesive prompt document for transforming an existing system. Triggered by transformation language: "make X great", "1000x X", `--ultra`, `--one`. ULTRA and PACK are structurally incompatible — not interchangeable.

**When to use:** Intent names a target system that already exists and the user wants it amplified or overhauled.

### 3. GROUND (crux-finding phase)
Pre-COMPILE step that reduces vague intent to a falsifiable root problem — the front-end IR that both backends share. GROUND is a blocking gate: a COMPILE without GROUND produces a prompt without a crux, which breaks the CATCQ structure.

**When to use:** Always, before any COMPILE. This is the single most violated step.

### 4. TRANSCEND (ambition amplification charter)
Runs after RECON when intent names a known product. Instead of enumerating that product's features (cloning), TRANSCEND builds a charter that designs beyond it. Its output is a differentiation frame, not a feature list.

**When to use:** RECON surfaces a named product as the target — TRANSCEND replaces the clone instinct.

### 5. COMPILE REPORT
The required output artifact emitted at the end of every successful compilation. Contains: BACKEND choice, GROUND crux, DECOMPOSE list, TRANSCEND charter (if applicable), any STOP conditions encountered.

**When to use:** Every invocation that produces a prompt artifact. Its absence means the compile did not complete.

### 6. STOP / NEEDS_CONTEXT (scope deferral gate)
Returned when the task is out of scope for a compiler: trivial single-file operations, conflicting BACKEND signals, or unresolvable crux. STOP is not a failure — it prevents autovibe from executing code or writing to the project repo directly.

**When to use:** Single-file rename, ambiguous BACKEND, or compound intent whose split order cannot be determined.

### 7. RECEIPT (build outcome link)
An observed build result that closes the compiler loop. RECEIPT is produced after the generated prompt executes and a real build completes — autovibe never writes a RECEIPT. It feeds `tfc_evolve` via `learnings.jsonl`.

**When to use:** After the PACK or ULTRA prompt executes and build results are observable. Never produced by autovibe itself.

## When To Use

source: autovibe/spec.yaml

| Signal | BACKEND |
|--------|---------|
| Vague intent, no prior system named | PACK |
| "make X great / 1000x X / next-level X" | ULTRA |
| `--ultra` or `--one` flag explicit | ULTRA |
| Named product as frustration target | PACK + TRANSCEND |
| Single-file / trivial operation | STOP |
| Compound intent (two systems) | Two ordered BACKEND blocks |
| Security-adjacent (auth, payments, webhooks) | PACK + scanner_scan gate in COMPILE REPORT |
