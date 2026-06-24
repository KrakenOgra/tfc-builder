---
last_verified: 2026-06-23
freshness_clock: 2026-06-23
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.9"
forge_domain: "autovibe"
fill_hint: "3 worked examples (input task -> good output -> annotation that explains WHY via a domain MECHANISM, using the word 'because')."
---

## Example 1

source: autovibe/eval-report.json #transcend-not-clone

**Input:** "Build a note-taking app like Notion"

**Output (skill-loaded):**
```
## BACKEND
Chosen: PACK

## GROUND
Crux: the user is frustrated with Notion's block latency and monolithic UX — they want locality and speed, not feature parity.

## RECON (Notion weakness scan)
- Block editor adds 200ms per keystroke at scale
- Offline mode breaks silently
- No local-first storage option

## TRANSCEND
Charter: build a local-first, instant-write note system where blocks are plain markdown files.
Differentiation: offline-first architecture, zero block latency, Git-backed history.
NOT: drag-and-drop database views, team wikis, or API integrations.

## COMPILE REPORT
Pack written to ~/prompt-packs/local-first-notes/
```

**Annotation:** Works because the GROUND crux ("frustration" = latency + monolith) redirected TRANSCEND away from feature-cloning. Without GROUND, the CATCQ Context would inherit Notion's feature surface as requirements — the PACK would compile a clone. TRANSCEND's "NOT:" line is the structural proof the compiler ran correctly.

---

## Example 2

source: autovibe/eval-report.json #compound-backend-sequence

**Input:** "Enhance my CLI task manager and build a new dashboard for it"

**Output (skill-loaded):**
```
## BACKEND (1 of 2)
Chosen: ULTRA — enhancing the existing CLI (transformation of named system)

## GROUND
Crux: CLI has no priority sorting or due-date awareness — output is a flat unordered list.

[ULTRA prompt for CLI: add priority tiers, due-date tags, filtered views]

---

## BACKEND (2 of 2)
Chosen: PACK — new dashboard (greenfield; depends on CLI enhancement above)

## GROUND
Crux: dashboard must consume CLI's new output format; design is blocked until ULTRA ships.

## CATCQ
Context: dashboard reads from CLI's tagged-output format...
[PACK artifact continues]

## COMPILE REPORT
Two BACKEND blocks emitted in dependency order. Execute ULTRA first, then PACK.
```

**Annotation:** Works because compound-intent detection split the intent before GROUND ran on either system. A single undifferentiated BACKEND block would mix ULTRA and CATCQ structures, producing an artifact neither backend's runner can consume. The dependency order is a GROUND output — without a separate GROUND per system, the sequencing is arbitrary and the executor cannot know which prompt to run first.

---

## Example 3

source: autovibe/eval-report.json #trivial-defer

**Input:** "Rename the `userHandler` function to `handleUser`"

**Output (skill-loaded):**
```
STOP — NEEDS_CONTEXT

This is a single-file rename, out of autovibe's compiler scope.
autovibe produces prompt artifacts (PACK or ULTRA) for system-level builds.
For a rename: use your editor's refactor tool or ask Claude directly.
No COMPILE REPORT emitted.
```

**Annotation:** Works because the scope-check gate fires before GROUND — a single-file operation has no crux to reduce and no BACKEND to select. Emitting a COMPILE REPORT here would be a scope violation: autovibe writes only to `~/prompt-packs/` and the RECEIPT loop has nothing to close. The STOP is the correct output because a compiler that compiles everything is a compiler that enforces nothing.
