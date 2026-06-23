# TFC Migration Guide

Migrating a skill is not reformatting a config file. It is transplanting a domain expert's brain into a new container. Done wrong, the container looks right and the brain is gone.

Before touching any skill with intelligence layers (identity, principles, patterns, anti_patterns, handoffs, quick_wins), read `docs/intelligence-context-guide.md`. A skill that passes validation but lost its intelligence layers is a prettier shell around a dumber agent.

**The intelligence density test:** count named patterns + anti-patterns in the source. That count must match in the migrated SKILL.md. If it decreased, you collapsed content to bullets and lost the expertise.

---

## Fastest path: use `tfc_migrate`

Before working through Pattern A or B manually, try the MCP tool:

```
tfc_migrate({
  "sourcePath": "~/.spawner/skills/category/name/skill.yaml",
  "sourceType": "spawner",
  "category": "category",
  "name": "name",
  "dryRun": true
})
```

Run with `dryRun: true` first. The tool returns an authoring prompt with a density contract — it requires at least as many named patterns and anti-patterns as the source skill carried. Source files are never modified.

Use the manual patterns below when `tfc_migrate` cannot parse the source format, or when you want full control over the intelligence extraction process.

---

## Pattern A: YAML skill → TFC

**Source:** existing `skill.yaml` in `{your-skill-library}/{category}/{name}/`
**Target:** `~/.future-code/skills/{category}/{name}/`

### Checklist

- [ ] **Create target directory**
  ```bash
  mkdir -p ~/.future-code/skills/{category}/{name}
  ```

- [ ] **Copy and rename spec**
  ```bash
  cp {source-path}/{category}/{name}/skill.yaml \
     ~/.future-code/skills/{category}/{name}/spec.yaml
  ```

- [ ] **Add required TFC fields to spec.yaml**
  - `model_tier: sonnet` (or `opus`/`haiku` based on task complexity — don't default everything to sonnet)
  - `priority: 50` (adjust if trigger collisions are likely)
  - `skill_chain: []` (populate once you know the chain)
  - `required_sections: []` (populate from SKILL.md workflow headers)
  - `scaffold_template: |` (optional — add for P04-style debug skills)
  - `can_execute_without_mcp: true`

- [ ] **Extract intelligence layers** — do this before creating SKILL.md
  Apply the extraction protocol from `docs/intelligence-context-guide.md`:
  - Check which layers exist: `identity`, `principles`, `patterns`, `anti_patterns`, `handoffs`, `quick_wins`, `stack`, `does_not_own`
  - For each present layer, run the corresponding extraction step
  - Record counts: patterns=N, anti_patterns=N — these must match in SKILL.md
  - Add `does_not_own:` entries to spec.yaml if source has them

- [ ] **Convert `patterns` to SKILL.md workflow**
  The `patterns:` field contains executable examples. Move them to SKILL.md as the `## Workflow` section. Do not leave them in spec.yaml.

- [ ] **Create SKILL.md from template**
  ```bash
  cp ~/.future-code/skills/_template/SKILL.md \
     ~/.future-code/skills/{category}/{name}/SKILL.md
  ```
  Fill in:
  - Frontmatter `name:` = spec.yaml `id`
  - `_SKILL_ID` and `_SKILL_CAT` in the preamble bash block
  - `## [Skill Name] Workflow` with phases from the old `patterns:` field
  - Sharp Edges section (from spec.yaml `sharp_edges`)
  - `SKILL_ID_PLACEHOLDER` and `CATEGORY_PLACEHOLDER` in Telemetry block

- [ ] **Verify voice compliance** — no em dashes, no AI vocabulary
  ```bash
  grep -n ' — ' ~/.future-code/skills/{category}/{name}/SKILL.md
  grep -n '\(delve\|crucial\|robust\|comprehensive\|nuanced\|multifaceted\)' \
       ~/.future-code/skills/{category}/{name}/SKILL.md
  ```

- [ ] **Install**
  ```bash
  tfc_install("skills/{category}/{name}")
  ```

- [ ] **Verify installation**
  ```bash
  ls -la ~/.claude/skills/{name}/SKILL.md   # symlink → ~/.future-code/...
  ```

- [ ] **Run validation**
  ```bash
  grep '## Preamble (run first)' ~/.future-code/skills/{category}/{name}/SKILL.md
  grep '## Telemetry (run last)' ~/.future-code/skills/{category}/{name}/SKILL.md
  ```

---

## Pattern B: SKILL.md skill → TFC

**Source:** `~/.claude/skills/{name}/SKILL.md` + CLAUDE.md routing entry
**Target:** `~/.future-code/skills/{category}/{name}/`

### Checklist

- [ ] **Create target directory**
  ```bash
  mkdir -p ~/.future-code/skills/{category}/{name}
  ```

- [ ] **Extract triggers from CLAUDE.md routing table**
  Convert each routing entry to a spec.yaml trigger. Triggers must be at least 4 words. Rewrite short entries as situation phrases:
  - Bad: `"investigate"` (1 word — collides with hundreds of other skills)
  - Good: `"investigate why this feature broke"` (situation phrase, specific)

- [ ] **Extract intelligence layers** — do this before creating SKILL.md
  Same process as Pattern A. Count must match.

- [ ] **Create spec.yaml from template**
  ```bash
  cp ~/.future-code/skills/_template/spec.yaml \
     ~/.future-code/skills/{category}/{name}/spec.yaml
  ```
  Fill in: `id`, `name`, `triggers` (from CLAUDE.md), `model_tier`, `owns`, `pairs_with`, `sharp_edges`, `priority: 50`, `can_execute_without_mcp: true`

- [ ] **Copy and update SKILL.md**
  ```bash
  cp ~/.claude/skills/{name}/SKILL.md \
     ~/.future-code/skills/{category}/{name}/SKILL.md
  ```
  Update: replace preamble with TFC Preamble v1, set `_SKILL_ID` and `_SKILL_CAT`, update Operational Self-Improvement and Telemetry blocks to TFC paths.

- [ ] **Migrate learnings.jsonl** (if prior learnings exist)
  ```bash
  # Find existing learnings and append to TFC path
  find ~/.gstack/projects -name 'learnings.jsonl' \
    | xargs grep '"skill":"{name}"' 2>/dev/null \
    >> ~/.future-code/skills/{category}/{name}/learnings.jsonl
  ```

- [ ] **Remove CLAUDE.md routing entry** for this skill
  `spec.yaml triggers` replaces the CLAUDE.md routing table. Delete the old routing line after migration to prevent duplicate routing.

- [ ] **Verify voice compliance** (same grep as Pattern A)

- [ ] **Install**
  ```bash
  tfc_install("skills/{category}/{name}")
  ```

- [ ] **Verify installation**
  ```bash
  ls -la ~/.claude/skills/{name}/SKILL.md   # symlink → ~/.future-code/...
  ```

---

## Pilot 1: ai/ai-code-generation

```bash
mkdir -p ~/.future-code/skills/ai/ai-code-generation
# Copy source skill.yaml → spec.yaml, add TFC fields
# Create SKILL.md from template, fill workflow from patterns: field
tfc_install("skills/ai/ai-code-generation")
```

---

## Pilot 2: dev/investigate

```bash
mkdir -p ~/.future-code/skills/dev/investigate
# Copy SKILL.md, create spec.yaml, extract triggers from CLAUDE.md
# Migrate prior learnings
tfc_install("skills/dev/investigate")
```

---

## Common pitfalls

**Intelligence layer collapse — the most common failure.**
You migrated the structure but dropped named patterns and anti-patterns in favor of generic bullets. The skill validates, scores 65, and behaves like a workflow runner instead of a domain expert. Fix: count before and after. Any decrease in named patterns means collapsed content.

**Learnings path drift.**
`_SKILL_CAT` and `_SKILL_ID` in the preamble block must match the actual directory path exactly. A mismatch silently writes learnings to the wrong file — the skill runs fine but never improves.

**Short triggers.**
A 1–3 word trigger collides with hundreds of other skills. Write triggers as situation phrases, not skill names.

**Model tier defaulted to sonnet.**
If the skill does L3+ reasoning — strategy, research, synthesis, knowledge arbitrage — set `model_tier: opus`. Not everything is sonnet territory. Getting this wrong means the skill under-performs on complex tasks silently.

**Pairs_with copy errors.**
Old skills sometimes hardcoded tool-specific skill IDs as literal `pairs_with` values — these create false composition contracts that route incorrectly at runtime. Use placeholders in new skills, then populate when the chain is known.
