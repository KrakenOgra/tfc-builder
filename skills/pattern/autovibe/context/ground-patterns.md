---
last_verified: 2026-06-23
freshness_clock: 2026-06-23
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.9"
forge_domain: "autovibe"
---

## Crux Patterns

source: autovibe/SKILL.md #GROUND

GROUND reduces a vague intent to one falsifiable sentence — the crux. The crux is the organizing spine of the entire COMPILE output. Three common crux patterns:

**Pattern A: Frustration crux** — the user's pain with an existing situation.
Template: "The user cannot [X] because [existing system / workflow] does [Y]."
Test: can this be answered yes/no after building? If yes, it is falsifiable.

**Pattern B: Absence crux** — a capability that does not exist yet.
Template: "There is no way to [X] without [expensive / brittle workaround Y]."
Test: does the built system make Y unnecessary?

**Pattern C: Scale crux** — something that works at small scale but breaks at large scale.
Template: "[X] works for [N=small] but fails when [N=large] because [mechanism]."
Test: does the built system handle the large-N case?

## Bad Crux Examples

source: autovibe/SKILL.md + autovibe/eval-report.json

| Intent | Bad Crux (unfalsifiable) | Why it fails |
|--------|--------------------------|--------------|
| "health app for a bodybuilder" | "Build a great health app" | Not testable — "great" has no yes/no answer |
| "make Notion great" | "Improve Notion" | No mechanism named; no delta to measure |
| "1000x my CLI task manager" | "The CLI needs to be better" | "Better" is not a crux; it is a direction |
| "note-taking app" | "Notes should be easy" | No user, no pain, no mechanism |

## Good Crux Examples

source: autovibe/eval-report.json #transcend-not-clone

| Intent | Good Crux (falsifiable) | Why it works |
|--------|------------------------|--------------|
| "note-taking app like Notion" | "Users lose writes during offline Notion sessions because Notion has no local-first storage" | Names the mechanism (no local-first); testable after build |
| "health app for a bodybuilder" | "Bodybuilders cannot track progressive overload across muscle groups without switching apps" | Names the gap; testable (does built app track this in one place?) |
| "1000x my CLI task manager" | "CLI outputs a flat unordered list with no priority or due-date awareness" | Specific, testable: does output show priority tiers? |
| "make auth system great" | "Auth system has no session expiry enforcement — tokens live indefinitely in the DB" | Mechanism named (no expiry); testable (does token expire after N minutes?) |
