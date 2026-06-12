# TFC Forge — The Doc Set
# Audit → Decode → Design → Build: from tfc-builder v1 to the skill foundry

**Date:** 2026-06-11
**Scope:** Full audit of `~/.future-code` + tfc-builder MCP, deep decode of gstack and
spawner skill systems, and the design of the next system: one engine that turns any
user intent into a world-class, routed, self-improving skill.

---

## Reading order

| # | Doc | What it answers | Read when |
|---|-----|-----------------|-----------|
| 1 | [01-AUDIT.md](01-AUDIT.md) | What exists today, what is strong, what is broken. Live-tested with real scores. | Before changing anything |
| 2 | [02-GSTACK-DECODED.md](02-GSTACK-DECODED.md) | How gstack actually routes the model and keeps quality high. 14 mechanisms, file-level evidence. | Designing routing or runtime behavior |
| 3 | [03-SPAWNER-DECODED.md](03-SPAWNER-DECODED.md) | How spawner packs domain intelligence into YAML. The 8-file anatomy and the 7 intelligence layers. | Designing skill content |
| 4 | [04-FORGE-DESIGN.md](04-FORGE-DESIGN.md) | The better system. Architecture, skill archetypes, intent compiler, eval harness, learning loop. Includes the worked example: "skill that teaches any domain" built in ~20 minutes. | The core doc. Read fully. |
| 5 | [05-IMPROVEMENTS-AND-NEW-TOOLS.md](05-IMPROVEMENTS-AND-NEW-TOOLS.md) | Every improvement, 6 new tool specs with contracts, and the strategy that sequences them. | Planning the build |
| 6 | [06-ROADMAP.md](06-ROADMAP.md) | Exact implementation waves: which file, which command, which test, in what order. | Executing |

---

## The TL;DR (if you read nothing else)

1. **tfc-builder v1 is solid plumbing: 7.5/10.** 9 tools work live, 105 tests (103 pass, 2 skip), safe
   symlinks, real scoring. Verified today: 3 skills installed, all 6 symlinks ok,
   scores 90 / 100 / 0.

2. **The 0 is the tell.** `vague-to-system` scores 0/100 because the scorer only
   recognizes one skill shape (domain expert). gstack's best skills (investigate,
   ship, qa) would also score ~0. Fix: skill archetypes (04-FORGE-DESIGN, Decision 1).

3. **gstack's secret is not the skills. It is the compiler and the runtime.** Skills
   are build artifacts generated from one template plus shared blocks plus per-model
   overlay patches. Routing is description-text engineering plus a 30-rule intent
   table plus a bias rule: "false positive is cheaper than false negative."

4. **spawner's secret is intelligence density.** A skill.yaml is a compressed domain
   expert: identity with battle scars, imperative principles, named patterns with
   examples, anti-patterns with root causes, boundary contracts.

5. **Nobody closes the loop.** gstack logs learnings but never rewrites skills from
   them. spawner skills are frozen at birth. The Forge's differentiator: `tfc_evolve`,
   which consumes learnings + telemetry and regenerates weak sections (04-FORGE-DESIGN,
   Decision 5).

6. **The missing layer in ALL THREE systems: behavioral evals.** Nothing tests whether
   a skill actually changes model behavior. `tfc_eval` with golden tasks is the
   highest-leverage new tool (05-IMPROVEMENTS, Tool 2).

---

## Where things live (orientation map)

`~/.future-code` is a symlink → `~/vibeship-x-kraken/.future-code` (the physical source tree and git repo).

| Thing | Path |
|------|------|
| TFC spec (the constitution) | `~/.future-code/THE_FUTURE_CODE.md` |
| tfc-builder MCP source | `~/.future-code/mcp/tfc-builder/src/` |
| TFC skills | `~/.future-code/skills/{category}/{name}/` |
| TFC template | `~/.future-code/skills/_template/` |
| Shared runtime | `~/.future-code/runtime/` |
| Telemetry | `~/.future-code/analytics/tfc-builder.jsonl` |
| gstack home (skills repo) | `~/.claude/skills/gstack/` |
| gstack state | `~/.gstack/` |
| spawner skills | `~/.spawner/skills/` (478 skills, 37+ categories) |
| Kraken tier-0 hook + packs | `~/.spawner/skills/pattern/kraken-packs/packs.yaml` |
| This doc set | `~/.future-code/docs/forge/` |
