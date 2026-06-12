# 07 — tfc_install + tfc_register + tfc_list — the install surface

> `ENVOKE: ai-agents/agent-tool-builder` (primary).
> `ENVOKE: security/secrets-handling` (support — symlink + path safety).

---

# CONTEXT
Project:        tfc-builder MCP (see 00-PROJECT.md)
Stack:          TypeScript strict + core lib + validate engine from 05
Current state:  Skills can be built, authored, validated, scored, migrated. Nothing makes them live.
User persona:   Builder who wants a skill invocable (Skill("x")) AND discoverable (spawner_skills) in one call.
Reference:      THE_FUTURE_CODE.md "Installing a TFC Skill" (the two-symlink contract)
Code target:    src/core/install.ts + three handlers

# ACTION
IMPLEMENT tfc_install (both symlinks), tfc_register (spawner index entry), and tfc_list (inventory + dangling-symlink detection).

# TARGET
Files to create or modify:
  src/core/install.ts      (installSkill, registerSkill, listSkills)
  src/tools/index.ts       (wire tfcInstallHandler, tfcRegisterHandler, tfcListHandler)

Do NOT modify:
  src/core/validate.ts     (call it, do not change it)

# CONSTRAINTS
- install creates two symlinks per the contract:
  1. `~/.claude/skills/{name}/SKILL.md -> ~/.future-code/skills/{category}/{name}/SKILL.md`
  2. `~/.spawner/skills/{category}/{name}-tfc -> ~/.future-code/skills/{category}/{name}`
- install CALLS validateSkill first. If blocking failures exist, `fail("VALIDATION_FAILED", ..., "fix gates then re-run")` and create NO symlinks. A skill that fails its gates never goes live.
- Idempotent: an existing correct symlink is success, not error. An existing symlink pointing elsewhere is `fail("LINK_CONFLICT", ..., path)` — never silently repoint.
- All target roots come from `core/paths.ts`. Refuse to write a symlink whose resolved path escapes the three allowed roots (`~/.future-code`, `~/.claude/skills`, `~/.spawner/skills`).
- `dryRun: true` reports the two planned symlinks without creating them.
- register adds the skill to the spawner registry index (the same mechanism spawner_skills reads). If the index format is unknown at build time, register writes the `-tfc` symlink only and returns a `hint` to run `spawner_skills search {name}` to confirm discovery.
- list walks `~/.future-code/skills/*/*`, reports each skill + whether both symlinks exist + resolve. `brokenOnly:true` returns only skills with a missing or dangling link.

# QUALITY
- Full types, no `any`. `InstallResult = { claudeLink: LinkState, spawnerLink: LinkState, validated: boolean }` where LinkState is `"created" | "exists" | "conflict" | "planned"`.
- Unit test: install a valid skill -> both links created; re-run -> both "exists", no error.
- Unit test: install a skill with a blocking validation failure -> VALIDATION_FAILED, zero symlinks on disk.
- Unit test: a pre-existing conflicting link -> LINK_CONFLICT, no mutation.
- Unit test: list with a manually-broken link -> appears in brokenOnly output.
- Use real symlinks in a tmp HOME fixture; do not mock fs for the link tests (catch real symlink semantics).

# QUALITY WRAP

## Scope limiters
- install gates on validate. No bypass flag in v1.
- Do not repoint an existing link automatically — conflicts are surfaced, the user decides.
- Symlinks only inside the three allowed roots. Anything else is refused.

## Anti-pattern guards
- AVOID: install-without-validate — validate is the first line of installSkill.
- AVOID: silent repoint — conflicting links are a hard stop.
- AVOID: path escape — every link target is checked against the allowed roots via paths.ts.
- AVOID: non-idempotent install — re-running is always safe.

## VERIFY
After implementation, run:
- `npm run typecheck` && `npm run lint` — must pass
- `npm run test src/core/install` — all green (real symlinks in tmp HOME)
- Manual smoke: scaffold + author + install a throwaway skill, then `ls -la ~/.claude/skills/<name>/SKILL.md` and `spawner_skills search <name>`; then tfc_list brokenOnly after `rm` the source to confirm dangling detection; clean up
