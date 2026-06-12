# TFC Migration Guide
# Step-by-step checklists for migrating skills to TFC format
#
# IMPORTANT: Before migrating any skill with intelligence layers (identity, principles,
# patterns, anti_patterns, handoffs, quick_wins), read docs/intelligence-context-guide.md
# first. That doc specifies how to extract and preserve the intelligence context that makes
# a skill behave like a domain expert rather than a generic workflow runner.

---

## Pattern A: Spawner Skill → TFC

**Source:** `~/.spawner/skills/{category}/{name}/skill.yaml`
**Target:** `~/.future-code/skills/{category}/{name}/`

### Checklist

- [ ] **Create target directory**
  ```bash
  mkdir -p ~/.future-code/skills/{category}/{name}
  ```

- [ ] **Copy and rename spec**
  ```bash
  cp ~/.spawner/skills/{category}/{name}/skill.yaml \
     ~/.future-code/skills/{category}/{name}/spec.yaml
  ```

- [ ] **Add required TFC fields to spec.yaml**
  - `model_tier: sonnet` (or `opus`/`haiku` based on task complexity)
  - `priority: 50` (adjust if trigger collisions are likely)
  - `skill_chain: []` (populate once you know the chain)
  - `required_sections: []` (populate from SKILL.md workflow headers)
  - `scaffold_template: |` (optional, add for P04-style debug skills)
  - `can_execute_without_mcp: true`

- [ ] **Step 3a — Extract intelligence layers** (do this before creating SKILL.md)
  Read `docs/intelligence-context-guide.md` and apply the extraction protocol:
  - Check which layers exist in source: `identity`, `principles`, `patterns`,
    `anti_patterns`, `handoffs`, `quick_wins`, `stack`, `does_not_own`
  - For each present layer, run the corresponding extraction step (Steps 2–8 in the guide)
  - Record counts: patterns=N, anti_patterns=N — these must match in SKILL.md
  - Add `does_not_own:` entries to spec.yaml if source has them

  **Intelligence density test:** count named patterns + anti-patterns in source.
  Count must match in migrated SKILL.md — if it decreased, you collapsed to bullets.

- [ ] **Convert `patterns` to SKILL.md workflow**
  The spawner `patterns:` field contains executable examples. Move them
  to SKILL.md as the `## Workflow` section. Do not leave them in spec.yaml.

- [ ] **Create SKILL.md from template**
  ```bash
  cp ~/.future-code/skills/_template/SKILL.md \
     ~/.future-code/skills/{category}/{name}/SKILL.md
  ```
  Then fill in:
  - Frontmatter `name:` = spec.yaml `id`
  - `_SKILL_ID` and `_SKILL_CAT` in the preamble bash block
  - `## [Skill Name] Workflow` with phases from the old `patterns:` field
  - Sharp Edges section (copy from spec.yaml `sharp_edges`)
  - `SKILL_ID_PLACEHOLDER` and `CATEGORY_PLACEHOLDER` in Telemetry block

- [ ] **Verify voice compliance** (no em dashes, no AI vocabulary)
  ```bash
  grep -n ' — ' ~/.future-code/skills/{category}/{name}/SKILL.md
  grep -n '\(delve\|crucial\|robust\|comprehensive\|nuanced\|multifaceted\)' \
       ~/.future-code/skills/{category}/{name}/SKILL.md
  ```

- [ ] **Install the skill** (both steps required)
  ```bash
  CATEGORY={category}
  NAME={name}
  mkdir -p ~/.claude/skills/$NAME
  ln -s ~/.future-code/skills/$CATEGORY/$NAME/SKILL.md ~/.claude/skills/$NAME/SKILL.md
  ln -s ~/.future-code/skills/$CATEGORY/$NAME ~/.spawner/skills/$CATEGORY/$NAME-tfc
  ```

- [ ] **Verify installation**
  ```bash
  ls -la ~/.claude/skills/{name}/SKILL.md
  ls -la ~/.spawner/skills/{category}/{name}-tfc
  ```

- [ ] **Run validation** (if validations.yaml present)
  ```bash
  # Manual check until tfc validate CLI exists:
  grep '## Preamble (run first)' ~/.future-code/skills/{category}/{name}/SKILL.md
  grep '## Telemetry (run last)' ~/.future-code/skills/{category}/{name}/SKILL.md
  ```

---

## Pattern B: gstack Skill → TFC

**Source:** `~/.claude/skills/gstack/{name}/SKILL.md` + CLAUDE.md routing entry
**Target:** `~/.future-code/skills/{category}/{name}/`

### Checklist

- [ ] **Create target directory**
  ```bash
  mkdir -p ~/.future-code/skills/{category}/{name}
  ```

- [ ] **Extract triggers from CLAUDE.md routing table**
  Find the routing entry for this skill in `~/.claude/CLAUDE.md` or the
  project CLAUDE.md. Convert each trigger phrase to a spec.yaml trigger.
  Triggers must be at least 4 words. Rewrite short entries as situation phrases:
  - Bad: `"investigate"` (1 word — collision-prone)
  - Good: `"investigate why this feature broke"` (situation phrase)

- [ ] **Step 3a — Extract intelligence layers** (do this before creating SKILL.md)
  Read `docs/intelligence-context-guide.md` and apply the extraction protocol:
  - Check which layers exist in source: `identity`, `principles`, `patterns`,
    `anti_patterns`, `handoffs`, `quick_wins`, `stack`, `does_not_own`
  - For each present layer, run the corresponding extraction step (Steps 2–8 in the guide)
  - Record counts: patterns=N, anti_patterns=N — these must match in SKILL.md
  - Add `does_not_own:` entries to spec.yaml if source has them

  **Intelligence density test:** count named patterns + anti-patterns in source.
  Count must match in migrated SKILL.md — if it decreased, you collapsed to bullets.

- [ ] **Create spec.yaml from template**
  ```bash
  cp ~/.future-code/skills/_template/spec.yaml \
     ~/.future-code/skills/{category}/{name}/spec.yaml
  ```
  Then fill in:
  - `id:` = skill directory name (kebab-case)
  - `name:` = human-readable title
  - `triggers:` = extracted from CLAUDE.md (minimum 4 words each)
  - `model_tier:` = from old gstack SKILL.md `## Model` section if present
  - `owns:` = what domain this skill is authoritative for
  - `pairs_with:` = what skill runs before/after (use placeholder comments if unknown)
  - `sharp_edges:` = from old SKILL.md `## Sharp Edges` or `## Gotchas` section
  - `priority: 50`
  - `can_execute_without_mcp: true`

- [ ] **Copy and update SKILL.md**
  ```bash
  cp ~/.claude/skills/gstack/{name}/SKILL.md \
     ~/.future-code/skills/{category}/{name}/SKILL.md
  ```
  Then update:
  - Replace preamble block with TFC Preamble v1 (from `_template/SKILL.md`)
  - Set `_SKILL_ID` and `_SKILL_CAT` in preamble
  - Update Operational Self-Improvement block to use TFC path
  - Update Telemetry block to use TFC analytics path

- [ ] **Migrate learnings.jsonl** (if gstack learnings exist)
  ```bash
  # Find existing learnings
  find ~/.gstack/projects -name 'learnings.jsonl' | xargs grep '"skill":"{name}"' 2>/dev/null
  # Append matching entries to TFC path
  find ~/.gstack/projects -name 'learnings.jsonl' \
    | xargs grep '"skill":"{name}"' 2>/dev/null \
    >> ~/.future-code/skills/{category}/{name}/learnings.jsonl
  ```

- [ ] **Remove CLAUDE.md routing entry** for this skill
  The `spec.yaml triggers` field replaces the CLAUDE.md routing table entry.
  After migration, delete the old routing line from CLAUDE.md to avoid
  duplicate routing.

- [ ] **Verify voice compliance** (same check as Pattern A)

- [ ] **Install the skill** (same two-step process as Pattern A)

- [ ] **Verify installation** (same verification as Pattern A)

---

## Pilot 1 Reference: ai/ai-code-generation (spawner→TFC)

Source: `~/.spawner/skills/ai/ai-code-generation/`

```bash
# Apply Pattern A:
mkdir -p ~/.future-code/skills/ai/ai-code-generation
cp ~/.spawner/skills/ai/ai-code-generation/skill.yaml \
   ~/.future-code/skills/ai/ai-code-generation/spec.yaml
# Add: model_tier: sonnet, priority: 50, skill_chain: [], can_execute_without_mcp: true
# Create SKILL.md from template, fill workflow from patterns: field
# Install:
mkdir -p ~/.claude/skills/ai-code-generation
ln -s ~/.future-code/skills/ai/ai-code-generation/SKILL.md ~/.claude/skills/ai-code-generation/SKILL.md
ln -s ~/.future-code/skills/ai/ai-code-generation ~/.spawner/skills/ai/ai-code-generation-tfc
```

---

## Pilot 2 Reference: dev/investigate (gstack→TFC)

Source: `~/.claude/skills/gstack/investigate/SKILL.md`

```bash
# Apply Pattern B:
mkdir -p ~/.future-code/skills/dev/investigate
cp ~/.claude/skills/gstack/investigate/SKILL.md \
   ~/.future-code/skills/dev/investigate/SKILL.md
# Create spec.yaml, extract triggers from CLAUDE.md routing table
# Migrate learnings from ~/.gstack/projects/*/learnings.jsonl
# Install:
mkdir -p ~/.claude/skills/investigate
ln -s ~/.future-code/skills/dev/investigate/SKILL.md ~/.claude/skills/investigate/SKILL.md
ln -s ~/.future-code/skills/dev/investigate ~/.spawner/skills/dev/investigate-tfc
```

---

## Common Pitfalls

**Pairs_with copy errors:** The `_template/spec.yaml` formerly had `realthink` and
`spawner-validate` as literal examples in `pairs_with`. These would copy verbatim into
migrated skills, creating false composition contracts. Template is now placeholder-only.

**Model tier collision:** spawner's `patterns:` section sometimes implies the model.
If the skill does L3+ reasoning, set `model_tier: opus`. Don't default everything to sonnet.

**Learnings path drift:** The `_SKILL_CAT` and `_SKILL_ID` in the preamble block must
match the actual directory path. A mismatch silently writes learnings to the wrong file.

**Short triggers:** A 1-3 word trigger collides with hundreds of other skills.
Always write triggers as situation phrases, not skill names.
