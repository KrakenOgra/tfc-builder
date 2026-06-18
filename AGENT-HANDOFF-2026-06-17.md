# TFC Agent Handoff — 2026-06-17

**Source:** Principal audit completed 2026-06-17 (P04 Scientist Debug, 6 stages, 157/157 tests verified)
**For:** next agent or session executing fixes against `~/.future-code`
**Rule:** execute in order; run the verify command before marking done; stop and report if any command fails

---

## CONTEXT CAPSULE — read this first

TFC ("The Future Code") is a skill OS at `~/.future-code` (symlink → `~/vibeship-x-kraken/.future-code`).
It runs a TypeScript MCP server (`dist/server.js`) registered in `~/.mcp.json`.
157/157 tests pass. The foundation is healthy. What follows is installation drift + one destroyed skill + stale docs + a learning loop that almost never fires.

**Physical anchor:**
```
~/.future-code → ~/vibeship-x-kraken/.future-code   (symlink — do not break this)
~/.future-code/mcp/tfc-builder/                      (TypeScript MCP server + CLI)
~/.future-code/skills/                               (10 real skills + _template)
~/.future-code/runtime/preamble.sh                   (sourced by skills)
~/.claude/skills/                                    (installed skill symlinks)
~/.future-code/analytics/                            (runs.jsonl, tfc-builder.jsonl, waves.jsonl)
```

---

## ORDERED ACTIONS — severity × effort ranked

---

### ACTION 1 — Fix genius-ai: remove circular symlink, rebuild SKILL.md, reinstall
**Severity:** CRITICAL | **Effort:** M | **Blocks:** `/genius-ai` slash command is silently broken

**What happened:** A relink operation on 2026-06-15 destroyed the SKILL.md content and left a symlink that points to itself (circular). The `~/.claude/skills/genius-ai/SKILL.md` symlink resolves to this dead circular target.

**Verify the problem first:**
```bash
file /home/roshish/.future-code/skills/ai/genius-ai/SKILL.md
# Expected bad output: "broken symbolic link to /home/roshish/.future-code/skills/ai/genius-ai/SKILL.md"
```

**Step 1 — Remove the circular symlink:**
```bash
rm /home/roshish/.future-code/skills/ai/genius-ai/SKILL.md
```

**Step 2 — Rebuild SKILL.md from spec.yaml:**

The skill spec is intact. Call `tfc_generate(skill_id="genius-ai", category="ai")` — this returns a prompt template. Execute the template to generate the SKILL.md content based on the spec (id: genius-ai, archetype: hybrid, model_tier: sonnet). The skill's job: 3-question diagnostic (goal/tried/blocked) → maps to 7 Laws of AI leverage → selects 3 patterns from a 25-pattern library → outputs ready-to-use prompt or compound workflow.

Write the output to:
```
/home/roshish/.future-code/skills/ai/genius-ai/SKILL.md
```

**Step 3 — Reinstall:**
Call `tfc_install(skill_id="genius-ai", category="ai")` — this creates the symlink in `~/.claude/skills/genius-ai/`.

**Verify done:**
```bash
file /home/roshish/.future-code/skills/ai/genius-ai/SKILL.md
# Must output: regular file (NOT "symbolic link")
ls -la /home/roshish/.claude/skills/genius-ai/SKILL.md
# Must output: symlink → /home/roshish/.future-code/skills/ai/genius-ai/SKILL.md
```

---

### ACTION 2 — Install audit-self (not installed despite being v3.1.0)
**Severity:** HIGH | **Effort:** S | **Blocks:** `/audit-self` unreachable; Kraken OS L2+ self-audit hook silently fails

**Verify the problem:**
```bash
ls /home/roshish/.claude/skills/audit-self/ 2>/dev/null || echo "MISSING"
# Expected: MISSING
```

**Fix:**
Call `tfc_install(skill_id="audit-self", category="pattern")`.

If the TFC MCP is unavailable, create the symlink manually:
```bash
mkdir -p /home/roshish/.claude/skills/audit-self
ln -s /home/roshish/.future-code/skills/pattern/audit-self/SKILL.md \
      /home/roshish/.claude/skills/audit-self/SKILL.md
```

**Verify done:**
```bash
ls -la /home/roshish/.claude/skills/audit-self/SKILL.md
# Must output: symlink → /home/roshish/.future-code/skills/pattern/audit-self/SKILL.md
file /home/roshish/.claude/skills/audit-self/SKILL.md
# Must output: ASCII or Unicode text (the symlink resolves and the file reads)
```

---

### ACTION 3 — Replace kraken-flow regular file with a symlink
**Severity:** HIGH | **Effort:** S | **Blocks:** source edits to kraken-flow silently won't propagate to installed version

**What happened:** `tfc_install` was either bypassed or malfunctioned — `~/.claude/skills/kraken-flow/SKILL.md` is a regular file copy, not a symlink. Every future edit to the source will diverge silently.

**Verify the problem:**
```bash
file /home/roshish/.claude/skills/kraken-flow/SKILL.md
# Bad output: "Unicode text, UTF-8 text" (NOT a symlink)
```

**Fix:**
```bash
rm /home/roshish/.claude/skills/kraken-flow/SKILL.md
ln -s /home/roshish/.future-code/skills/pattern/kraken-flow/SKILL.md \
      /home/roshish/.claude/skills/kraken-flow/SKILL.md
```

Or call `tfc_install(skill_id="kraken-flow", category="pattern")` which will detect the non-symlink and replace it.

**Verify done:**
```bash
file /home/roshish/.claude/skills/kraken-flow/SKILL.md
# Must output: symbolic link to /home/roshish/.future-code/skills/pattern/kraken-flow/SKILL.md
```

---

### ACTION 4 — Fix README.md stale test count
**Severity:** HIGH | **Effort:** S | **Blocks:** trust in docs; anyone reading README thinks the suite is 46 tests smaller than it is

**Verify the problem:**
```bash
grep -n "tests" /home/roshish/.future-code/mcp/tfc-builder/README.md | grep "suites\|green"
# Shows: line ~308: "111 tests across 13 suites"
```

**Fix — update the claim:**
```bash
sed -i 's/111 tests across 13 suites/157 tests across 20 suites/' \
  /home/roshish/.future-code/mcp/tfc-builder/README.md
```

**Verify done:**
```bash
grep "tests across" /home/roshish/.future-code/mcp/tfc-builder/README.md
# Must output: 157 tests across 20 suites
```

---

### ACTION 5 — Update MCP description tool count
**Severity:** HIGH | **Effort:** S | **Blocks:** operator confusion; description says "9 tools" for a server with ~20

**Verify the problem:**
```bash
grep -A4 '"tfc-builder"' /home/roshish/.mcp.json
# Shows: description "... 9 tools."
```

**Get actual count first:**
```bash
# Count distinct handler entries in registry.ts
grep -c "handler:" /home/roshish/.future-code/mcp/tfc-builder/src/tools/registry.ts
```

**Fix — update description in ~/.mcp.json:**
Edit `~/.mcp.json` and change the tfc-builder `"description"` field to reflect the actual tool count from the command above. Example (verify count first):
```
"description": "TFC Builder — scaffold, validate, migrate, score, eval, evolve, and install TFC skills. No API key. <N> tools."
```

**Verify done:**
```bash
grep "description" /home/roshish/.mcp.json | grep tfc
# Must not say "9 tools"
```

---

### ACTION 6 — Auto-close the learning loop in preamble.sh
**Severity:** MEDIUM | **Effort:** S | **Unlocks:** manifesto's flagship claim ("every run teaches the skill"); currently 7 learnings entries across all time

**What's wrong:** `preamble.sh` reads and surfaces learnings (lines 24-42) but never writes to them. `learnings-log.sh` exists but must be explicitly called. Result: 4 recorded invocations, only 3 skills with any learnings, 7 total lines.

**Verify the problem:**
```bash
grep -n "append\|>>\|write\|learnings-log" /home/roshish/.future-code/runtime/preamble.sh
# Expected: no output (no write operations)
```

**Fix — add EXIT trap to preamble.sh:**

Add the following block at the end of `/home/roshish/.future-code/runtime/preamble.sh` (after line 47):

```bash
# Auto-stub: log this invocation to learnings.jsonl so the loop isn't manual
_LEARN_DIR="${_TFC_HOME:-$HOME/.future-code}/skills/${_SKILL_CAT:-unknown}/${_SKILL_ID:-unknown}"
if [ -d "$_LEARN_DIR" ] && [ -n "$_SKILL_ID" ] && [ "$_SKILL_ID" != "unknown" ]; then
  echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"session\":\"${_SESSION_ID:-}\",\"version\":\"${_SPEC_VER:-}\",\"insight\":\"\"}" \
    >> "$_LEARN_DIR/learnings.jsonl"
fi
```

**Verify done (requires _SKILL_ID and _SKILL_CAT to be set):**
```bash
export _SKILL_ID="vague-to-system" _SKILL_CAT="pattern"
BEFORE=$(wc -l < /home/roshish/.future-code/skills/pattern/vague-to-system/learnings.jsonl 2>/dev/null || echo 0)
source /home/roshish/.future-code/runtime/preamble.sh
AFTER=$(wc -l < /home/roshish/.future-code/skills/pattern/vague-to-system/learnings.jsonl 2>/dev/null || echo 0)
[ "$AFTER" -gt "$BEFORE" ] && echo "PASS: learnings incremented" || echo "FAIL: no write"
```

---

### ACTION 7 — Bootstrap lane fields for authored skills
**Severity:** MEDIUM | **Effort:** S | **Unlocks:** TFC quality floor (lane system can't grade 9 of 10 skills)

**What's wrong:** 9 of 10 skills have empty `lane:` in spec.yaml. The lane system (`tfc_lane`, `tfc_eval`) is TFC's quality ratchet — with no lane set, nothing can be graded or improved mechanically.

**Verify the problem:**
```bash
for f in $(find /home/roshish/.future-code/skills -name "spec.yaml" -not -path "*/_template/*"); do
  lane=$(grep "^lane:" "$f" 2>/dev/null | awk '{print $2}')
  echo "$(basename $(dirname $f)): lane='$lane'"
done
# Most lines will show: lane=''
```

**Fix — set authored lane for skills with a valid SKILL.md:**

For each skill below that has SKILL.md present (Y in audit), run `tfc_lane(skill_id="<id>", category="<cat>")` which computes the correct lane from disk state. If the skill has no eval-report yet, the lane will be set to `authored`.

Skills to lane-bootstrap (id, category, has eval-report):
| skill_id | category | has eval-report |
|---|---|---|
| ai-code-generation | ai | NO — will land at `authored` |
| video-prompting | ai-video | NO — will land at `authored` |
| learn-itr | learning | NO — will land at `authored` |
| audit-self | pattern | YES — will land at correct lane from report |
| genesis | pattern | NO — will land at `authored` |
| intent-to-goal | pattern | YES — will land at correct lane |
| kraken-flow | pattern | YES — will land at correct lane |
| reel-forge | pattern | YES — will land at correct lane |
| vague-to-system | pattern | YES — will land at correct lane |

Call `tfc_lane(skill_id="<id>", category="<cat>")` for each row above in order.

**Verify done:**
```bash
for f in $(find /home/roshish/.future-code/skills -name "spec.yaml" -not -path "*/_template/*"); do
  lane=$(grep "^lane:" "$f" 2>/dev/null | awk '{print $2}')
  echo "$(basename $(dirname $f)): lane='$lane'"
done
# All lines must show a non-empty lane value
```

---

### ACTION 8 — Fix audit script depth bug (audit tooling, not TFC itself)
**Severity:** LOW | **Effort:** S | **Blocks:** any future use of the Stage B audit script silently misses all real skills

**What's wrong:** The Stage B inventory script in the ULTRA PROMPT uses `-mindepth 2 -maxdepth 2` to find spec.yaml files. Real skills sit at depth 3 (`skills/category/name/spec.yaml`); only `_template` is at depth 2. The script silently returns only the template.

**Fix — update the audit brief (ULTRA PROMPT) or remember for future runs:**

When running Stage B inventory, use `-mindepth 2 -maxdepth 3`:
```bash
find ~/.future-code/skills -mindepth 2 -maxdepth 3 -name "spec.yaml" -exec dirname {} \; | sort
# Must return all 10 real skills + template (11 total)
```

No file change required in TFC itself. This is a correction to the audit methodology.

**Verify:**
```bash
find /home/roshish/.future-code/skills -mindepth 2 -maxdepth 3 -name "spec.yaml" | wc -l
# Must output: 11 (10 skills + _template)
```

---

### ACTION 9 — Run full verification sweep after all fixes
**Severity:** — | **Effort:** S | **Required:** proves all 8 actions are done

Run these in order after completing Actions 1–8:

```bash
# 1. Genius-ai rebuilt and installed
file /home/roshish/.future-code/skills/ai/genius-ai/SKILL.md
# → regular file (not symlink, not broken)

# 2. Audit-self installed
ls /home/roshish/.claude/skills/audit-self/SKILL.md
# → symlink exists

# 3. Kraken-flow is a symlink
file /home/roshish/.claude/skills/kraken-flow/SKILL.md
# → symbolic link

# 4. README test count correct
grep "tests across" /home/roshish/.future-code/mcp/tfc-builder/README.md
# → 157 tests across 20 suites

# 5. MCP description updated
grep -A4 '"tfc-builder"' /home/roshish/.mcp.json | grep description
# → does not say "9 tools"

# 6. Preamble writes learnings
grep ">>" /home/roshish/.future-code/runtime/preamble.sh | grep learnings
# → at least one line with >>

# 7. Lanes set
for f in $(find /home/roshish/.future-code/skills -name "spec.yaml" -not -path "*/_template/*"); do
  lane=$(grep "^lane:" "$f" | awk '{print $2}')
  [ -z "$lane" ] && echo "MISSING LANE: $f"
done
# → no output (all lanes set)

# 8. Tests still pass
cd /home/roshish/.future-code/mcp/tfc-builder && node node_modules/vitest/vitest.mjs run 2>&1 | grep -E "Tests|FAIL"
# → Tests  157 passed (157) — no FAIL lines
```

---

## WHAT TO SKIP (explicitly out of scope)

These were identified in the audit but deliberately excluded from this handoff:

| Item | Why skipped |
|---|---|
| `tfc_doctor --counts` auto-update feature | New tool development; not a fix |
| `tfc_install --reconcile` batch command | Enhancement, not a bug |
| `tfc_lane --bootstrap` command | tfc_lane already exists; call it per-skill (Action 7) |
| Adding `direction: "parallel"` validation gate | types.ts already has it; lower priority than operational fixes |
| Eslint config upgrade (eslint 8 → 9) | No felt pain; `.eslintrc.cjs` already works |
| `.github/` CI setup | Solo prototype; out of scope |
| Moving plaintext API key in `~/.mcp.json` | Adjacent to TFC, not a TFC defect |

---

## SYSTEM STATE SNAPSHOT (as of audit 2026-06-17)

```
HOME:           symlink → ~/vibeship-x-kraken/.future-code   ✓
MCP_REGISTERED: YES — dist/server.js resolves                 ✓
TESTS:          157/157 passing (20 suites)                    ✓
GIT:            parent repo has git; .future-code subtree has no independent git
SKILLS:         10 real skills (9 with SKILL.md; 1 destroyed)
INVOCATIONS:    4 skills ever run (runs.jsonl has 4 entries)
LEARNINGS:      7 total lines across 3 skills
EVAL REPORTS:   6 files
CHANGELOGS:     3 files (genius-ai, audit-self, vague-to-system)
ANALYTICS:      runs.jsonl (4), tfc-builder.jsonl (119), waves.jsonl (13)
```

---

*Handoff produced by principal audit session 2026-06-17. Audit doc: `~/.kraken/think/20260617-AUDIT-TFC.md` (if written) or reconstruct from this session's output.*
