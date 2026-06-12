# Spawner → TFC: What's Kept, What's Cut, What's Fixed

## What spawner does well (TFC keeps all of this)

### spec.yaml YAML structure
The single best thing spawner built. Machine-readable, queryable, composable.
TFC extends it — doesn't replace it.

### triggers array
The routing engine. `spawner_skills(search="X")` works because of this.
TFC inherits it directly. The only change: triggers must be ≥4 words (specificity rule).

### sharp_edges
The most underrated spawner pattern. Durable gotchas with severity, situation, why,
solution, symptoms, red_flags. TFC promotes this to first-class — every skill MUST
have at least one, and every edge MUST have a solution (warnings without fixes are noise).

### pairs_with / collaboration
The composition graph. Knowing what a skill pairs with before/after it is how you
build multi-skill chains instead of monolithic single skills.

### validations.yaml
Quality gates as data. TFC makes these more specific (blocking vs warning vs info tiers)
and adds TFC-specific checks (preamble, voice, learnings loop).

---

## What spawner does poorly (TFC fixes)

### Spawner skills have no SKILL.md
A skill with only `spec.yaml` is a fact, not an action. Claude can find it but can't
run it. TFC makes SKILL.md mandatory.

**The fix:** Every TFC skill must have SKILL.md. The spec.yaml `patterns` field
(code examples) migrates to SKILL.md workflow sections.

### No operational learning loop
Spawner skills are frozen at their initial quality. Nothing gets recorded when a
sharp edge fires. Nothing improves after 100 runs.

**The fix:** `learnings.jsonl` is mandatory. The TFC preamble surfaces it automatically.

### No model routing
Spawner has no opinion about which model tier should execute a skill.
"Use claude-sonnet" is not in any spawner skill's metadata.

**The fix:** `spec.yaml model_tier` declares the behavioral tier. The preamble emits
`MODEL_TIER: [tier]` which Claude reads.

### No skill chain routing
Spawner knows what skills pair together but doesn't emit routing signals at prompt time.
Knowing that P04 should chain realthink@L3 requires reading the YAML — it never fires automatically.

**The fix:** `spec.yaml skill_chain` with `min_level` gates. The tier-0 hook reads this
and emits `→ SKILL-CHAIN [L3]: /realthink` automatically.

### Vague short triggers cause collision
"build", "research", "ai", "design" — all appear in hundreds of spawner skills.
`spawner_skills(search="build")` returns noise.

**The fix:** TFC validation gate requires all triggers ≥4 words. "build new feature with TypeScript"
not "build".

---

## Migration checklist: Spawner → TFC

For each spawner skill you want to migrate:

1. [ ] Copy `skill.yaml` → `spec.yaml`, rename fields to TFC schema
2. [ ] Add `model_tier: sonnet` (default) or change if skill is strategic/tactical
3. [ ] Add `skill_chain: []` (empty is fine; fill in if skill benefits from sub-skill routing)
4. [ ] Add `required_sections: []` (fill in if skill has MNEP requirements)
5. [ ] Move `patterns:` code examples from spec → new SKILL.md workflow sections
6. [ ] Create SKILL.md from `_template/SKILL.md`, fill in the workflow
7. [ ] Update TFC preamble placeholders (_SKILL_ID, _SKILL_CAT)
8. [ ] Verify all triggers are ≥4 words
9. [ ] Verify all sharp_edges have solution fields
10. [ ] Run validations.yaml checks
11. [ ] Symlink into `~/.claude/skills/` and `~/.spawner/skills/` (or use `tfc install` when CLI exists)
