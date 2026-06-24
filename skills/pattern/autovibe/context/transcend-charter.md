---
last_verified: 2026-06-23
freshness_clock: 2026-06-23
synthesized: true
source_basis: "SKILL.md (tfc_context_forge)"
confidence: "0.9"
forge_domain: "autovibe"
---

## Charter Structure

source: autovibe/SKILL.md + autovibe/eval-report.json #transcend-not-clone

A TRANSCEND charter has four parts, in order:

1. **RECON input** — what the named product does well (2-3 bullets, sourced from observation)
2. **RECON weaknesses** — what the named product does badly or cannot do (2-5 bullets)
3. **Differentiation axes** — the dimensions on which the new system will be better, named explicitly
4. **NOT list** — features from the named product that the new system explicitly refuses

Example charter (from eval-report.json):
```
## TRANSCEND
Charter: build a local-first, instant-write note system where blocks are plain markdown files.

RECON strengths:
- Notion's block model is expressive and composable
- Notion's team wiki is deeply integrated

RECON weaknesses:
- Block editor adds 200ms per keystroke at scale
- Offline mode breaks silently
- No local-first storage option

Differentiation axes: offline-first, zero latency writes, Git-backed history

NOT: drag-and-drop database views
NOT: team wikis
NOT: API integrations
```

## NOT List

source: autovibe/spec.yaml #sharp_edges

The NOT list is the load-bearing artifact of TRANSCEND. Without it, the charter is a feature roadmap, not a differentiation frame.

Rules for the NOT list:
- Each `NOT:` item must be a feature the named product has (not an imaginary feature)
- Minimum one `NOT:` item — a charter with zero NOT items failed TRANSCEND
- NOT items should cut scope, not add it — they protect the crux from feature-creep

Anti-NOT (wrong):
- `NOT: bad performance` — this is a requirement, not a feature refusal
- `NOT: cloning Notion` — too abstract; name the specific feature being refused
- `NOT: everything Notion does` — a blanket refusal is unfalsifiable and useless

Correct NOT:
- `NOT: drag-and-drop database views`
- `NOT: team wiki pages`
- `NOT: embedded API integrations`

## Differentiation Axes

source: autovibe/eval-report.json #transcend-not-clone

Differentiation axes are the named dimensions on which the PACK will outperform the named product. Each axis maps to a design decision in the CATCQ Themes section.

Deriving axes from RECON weaknesses:
| RECON weakness | Differentiation axis |
|----------------|---------------------|
| "Block editor adds 200ms per keystroke" | Zero-latency writes (plain text, no block parser) |
| "Offline mode breaks silently" | Offline-first (local storage, sync on reconnect) |
| "No Git-backed history" | Git history as first-class versioning |

One weakness → one axis. Axes without a corresponding weakness are speculation — omit them.
