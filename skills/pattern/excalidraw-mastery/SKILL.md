---
name: excalidraw-mastery
version: "1.3.0"
description: |
  Generates production-quality Excalidraw diagrams from deep-understanding sessions.
  Transforms KNOWLEDGE_STATE, DELTA, THE_UNLOCK, salience scores, and prerequisite
  graphs into visual knowledge maps. Makes abstract learning state visible and navigable.
argument-hint: '"<topic> [--gap|--prereq|--session|--evolution|--feynman]"'
user-invocable: true
triggers:
  - /excalidraw
  - visualize this
  - draw the gap map
  - map my knowledge
  - show the mastery map
  - generate excalidraw
  - show knowledge state
---

<!-- TFC:PREAMBLE-HOOK START -->
## Preamble (run first)

Run this before Phase 1. It surfaces prior learnings, records the invocation, and exposes
`tfc_learn <type> <note>` (type: operational | sharp_edge | routing | timing) so a
genuine learning is one reliable call: never a hand-built JSON line.

```bash
_TFC_RT="${TFC_HOME:-$HOME/.future-code}/mcp/tfc-builder/runtime"
[ -f "$_TFC_RT/preamble.sh" ] && source "$_TFC_RT/preamble.sh" "pattern" "excalidraw-mastery"
```

State to load before Phase 1:
- **Session context:** scan conversation for KNOWLEDGE_STATE, DELTA, THE_UNLOCK
- **Generator reachability:** confirm `~/vibeship-x-kraken/gen-excalidraw-v4.mjs` exists; if absent, BLOCKED
- **Mode:** identify from trigger flag (`--gap`, `--prereq`, `--session`, `--evolution`, `--feynman`); default: gap-map
<!-- TFC:PREAMBLE-HOOK END -->

# EXCALIDRAW MASTERY: Visual Knowledge Engine

> A diagram that doesn't encode memory strength pretends all nodes are equal.
> Salience rings tell the truth: THIS node is solid, THAT one is fading, THAT ONE
> you don't know at all. Not decorative concept maps: epistemic X-rays of exactly
> where your knowledge breaks down.

## Identity

**Persona:** Edward Tufte's discipline meets Bret Victor's dynamism meets a software
engineer who has built 400+ knowledge maps and discovered that static diagrams lie.

**Core principles:**
- EVERY node's salience MUST be encoded visually: the eye registers ~150 Mbits/sec (Tufte) and a diagram that omits rings wastes that bandwidth.
- THE_UNLOCK always uses bridge category, always highlighted, always center band.
- Mastery layout for gap maps. Prereq-chain for dependency graphs. NEVER force/radial.
- Output always goes to a vault path: Excalidraw JSON cannot be reconstructed from memory.
- Phase frames are mandatory when nodes span multiple learning phases.
- Feynman badges (yes/no) are small but critical: verification state is the difference between familiarity and mastery.
- Hard cap: 6 or fewer arrows per diagram: at full-diagram zoom arrows dominate, more than 6 produces spaghetti.
- One grouping layer only (frames OR swim_lanes OR groups, never two): stacking produces white-out collisions.

## Modes

| Mode | Trigger | Layout | Required inputs |
|------|---------|--------|----------------|
| gap-map | `/excalidraw` or `/excalidraw --gap` | mastery | DELTA, THE_UNLOCK |
| prereq-chain | `/excalidraw --prereq <topic>` | prereq-chain | prerequisite_list, target_concept |
| session-capture | `/excalidraw --session` | mastery | session_concepts, session_number |
| evolution | `/excalidraw --evolution` | layers | session_history |
| feynman-map | `/excalidraw --feynman` | mastery | feynman_results |

## Mastery Layout Bands (v1.3)

```
Row 0 -- MASTERED:      salience >= 0.7
Row 1 -- BRIDGE/UNLOCK: bridge category ALWAYS (regardless of salience)
Row 2 -- LEARNING:      salience 0.15-0.7 (amber-dashed=decaying, blue=learning)
Row 3 -- GAP:           salience < 0.15 or category="gap"
```

Bridge is ALWAYS in its own visual band: never mixed with learning/decaying nodes.

## Execution Pipeline

### Phase 1: Read Context

Read KNOWLEDGE_STATE, DELTA, THE_UNLOCK from the current conversation.
If not in context: `mind_retrieve(user_id=550e8400-e29b-41d4-a716-446655440000, query="<topic> knowledge state gaps")`
Extract: concepts_known[], concepts_gap[], unlock_concept, salience_scores{}

**Evidence:** concepts_known[], concepts_gap[], and unlock_concept are all populated before proceeding.

**STOP.** If KNOWLEDGE_STATE and DELTA are absent from conversation AND mind_retrieve returns no relevant memories: ask the user to describe their learning state (what they know, what gaps remain, what concept was the main unlock). Do not fabricate nodes.

### Phase 2: Build Spec

Transform session data into gen-excalidraw-v4 JSON spec.

**Node category mapping from salience:**
- salience >= 0.7: "mastered"
- salience >= 0.4: "decaying"
- salience >= 0.15: "gap" (encountered but weak)
- salience < 0.15 OR concept in DELTA: "gap"
- THE_UNLOCK concept: category="bridge", highlight=true, size="lg"

**STOP.** If THE_UNLOCK is not identifiable from context or memory: ask the user which concept was the single most important reframe from the session before writing the spec. Never omit the bridge node or substitute a generic concept.

**Evidence:** `/tmp/ex-spec-<timestamp>.json` written; node count and category breakdown (N mastered / N decaying / N gap / N bridge) stated before Phase 3.

### Phase 3: Generate

```bash
# Write spec to temp file first
# Run generator -- path is fixed; do NOT repoint to .future-code after TFC migration
node ~/vibeship-x-kraken/gen-excalidraw-v4.mjs \
  --input /tmp/ex-spec-<timestamp>.json \
  --output ~/Vaults/Kraken\ Starting/Deep\ Understanding/<topic>/session-<N>-map.excalidraw.md
```

NEVER generate to stdout only. Always use --output.
Requires generator version >= 4.2.0 (band-aligned layout + orthogonal routing).
Check with: `node ~/vibeship-x-kraken/gen-excalidraw-v4.mjs --version`

**Evidence:** vault file exists at specified path; file size > 5KB (empty diagram = generation failed).

### Phase 4: Report and Handoff

Report: vault path, element count, node breakdown (mastered/gap/bridge count).
Offer to `mind_remember` the vault path as a reference for this topic.

**Evidence:** vault path reported to user in response; offer to persist it to Mind confirmed or declined.

## Handoff

**Output destination:** Obsidian vault at `~/Vaults/Kraken Starting/Deep Understanding/<topic>/session-N-map.excalidraw.md`

**Downstream consumers:**
- `deep-understanding`: reads prior session diagrams for continuity in `--evolve` mode
- `mind_remember`: persists vault path so future sessions can locate this diagram
- User: opens in Obsidian Excalidraw plugin for navigation

**Route target on failure:** if generator is missing or vault path is unwritable, report BLOCKED and suggest running `node ~/vibeship-x-kraken/gen-excalidraw-v4.mjs --version` to diagnose.

## JSON Schema Reference

```yaml
required:
  title: "string -- topic of the session"
  subtitle: "string -- 'Session N : DELTA: [gap1, gap2]'"
  layout: "mastery | prereq-chain | layers | tree | flow | radial | force | grid"
  nodes: "array of NodeSpec"
optional:
  mode: "gap-map | prereq-chain | session-capture | evolution | feynman-map"
  topic: "string -- for session metadata"
  progress: "{ mastered: N, total: N } -- drives progress bar"
  swim_lanes: "boolean -- render mastery band backgrounds"
  arrows: "array of ArrowSpec"

node_spec:
  id: "string -- unique, kebab-case"
  label: "string -- display name (\\n for line break)"
  category: "mastered | decaying | gap | bridge | analogy | prereq | concept | mechanism | result | example | insight"
  salience: "0.0 to 1.0 -- drives ring visualization"
  highlight: "boolean -- extra thick border, hachure fill"
  feynman_tested: "boolean -- show badge"
  feynman_passed: "boolean -- green check or red X"
  session: "integer -- session number stamp"
  phase: "0-4 -- which deep-understanding phase"
  size: "sm | md | lg | xl"

arrow_spec:
  from: "node id"
  to: "node id"
  label: "string -- relationship description"
  relationship: "requires | enables | analogy | blocks | explains | leads-to"
```

## Critical Sharp Edges

1. **Mastery layout, never force:** force destroys band structure; scatter = cognitive chaos
2. **THE_UNLOCK = bridge, always:** category=bridge, highlight=true, size=lg; buried = diagram fails
3. **--output always:** stdout-only loses the diagram in 48h; no vault = doesn't exist
4. **Generator path is ~/vibeship-x-kraken/gen-excalidraw-v4.mjs:** do not repoint after TFC migration
5. **DELTA to gap nodes:** every DELTA concept must appear as a gap node; missing gaps = false mastery
6. **Salience on every node:** fallback: mastered=0.85, decaying=0.45, gap=0.1, bridge=0.5
7. **6 or fewer arrows:** more produces spaghetti at diagram zoom levels
8. **One grouping layer:** stacking swim_lanes + groups + frames = white-edge bleed
9. **Vault path ends in .excalidraw.md:** Obsidian won't recognize it otherwise
10. **3 or more nodes:** a 1-2 node diagram is too sparse to be useful

## Known Limits

- Does NOT generate code/architecture diagrams: that is graphify's domain.
- Limited to ~30 nodes per diagram: beyond that, split into multiple diagrams.
- Requires Mind API for canonical salience scores: falls back to category-based estimates.
- Does NOT output Mermaid, Lucidchart, draw.io: Excalidraw JSON only.
- Cannot encode skill chains across topics: single-topic per diagram.

## Completion

**DONE:** vault file exists at specified path AND size > 5KB AND vault path reported to user in response.

**BLOCKED:** generator `~/vibeship-x-kraken/gen-excalidraw-v4.mjs` not found (run `node ~/vibeship-x-kraken/gen-excalidraw-v4.mjs --version` to diagnose) OR vault path directory does not exist and cannot be created.

**NEEDS_CONTEXT:** KNOWLEDGE_STATE and DELTA absent from conversation AND mind_retrieve returns no relevant memories for the topic. Emit one STOP and ask for learning state before proceeding.

## Post-Generation Checklist

- [ ] File exists at specified vault path
- [ ] File size > 5KB (real diagram, not empty)
- [ ] Can open in Obsidian Excalidraw plugin
- [ ] Mastered nodes visible in top band (if mastery layout)
- [ ] Gap nodes visible in bottom band (if mastery layout)
- [ ] Bridge/THE_UNLOCK node prominently centered
- [ ] Salience rings visible on nodes with salience < 0.7
- [ ] Vault path reported to user immediately after generation

## Telemetry (run last)

```bash
_TFC_RT="${TFC_HOME:-$HOME/.future-code}/mcp/tfc-builder/runtime"
[ -f "$_TFC_RT/telemetry.sh" ] && source "$_TFC_RT/telemetry.sh" "pattern" "excalidraw-mastery"
```
