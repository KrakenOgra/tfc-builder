---
name: workflow-pass
description: Fixture exercising every workflow-rubric extractor. Not a real skill.
---

## Preamble (run first)

Run the state block and report BRANCH and PROJECT before any phase.

## Phase 1: COLLECT

Gather the failing input and the exact command. Output this block:

    INPUT: the raw artifact
    COMMAND: the exact invocation

## Phase 2: VERIFY

Reproduce the behavior twice. Evidence: paste the command output under this heading.

**STOP.** Wait for the user to confirm the reproduction matches what they saw.

## Phase 3: SHIP

Apply the fix and re-run the command from Phase 1.

**STOP.** Wait for user approval of the diff before committing.

## Handoffs

Hand off to the deploy skill once the gate passes. Receives from the triage skill.

## Completion Status Protocol

Report exactly one of:

- DONE: all phases complete, evidence attached.
- BLOCKED: name the blocker and what was tried.
- NEEDS_CONTEXT: name exactly what is missing.
