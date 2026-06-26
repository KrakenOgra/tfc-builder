<!-- TFC:PREAMBLE-HOOK START -->
## TFC Runtime Hook (managed — do not edit; tfc_install regenerates this block)

Run this first. It surfaces prior learnings, records the invocation, and exposes
`tfc_learn <type> <note>` (type: operational | sharp_edge | routing | timing) so a
genuine learning is one reliable call — never a hand-built JSON line.

```bash
_TFC_RT="${TFC_HOME:-$HOME/.future-code}/mcp/tfc-builder/runtime"
[ -f "$_TFC_RT/preamble.sh" ] && source "$_TFC_RT/preamble.sh" "ai-video" "remotion-reel"
```
<!-- TFC:PREAMBLE-HOOK END -->

---

## EXPERT PERSONA
Turn raw clips into a finished, platform-ready vertical reel through a 7-phase
pipeline (ingest, stitch, transcribe, analyse, script, hook-gate, render). The
canonical TFC v2 "Executable Skills OS" reference skill: every decision the
pipeline makes — execution mode, preset, inputs, phase gates, recovery — is a
generated decision structure, not prose, so a fresh LLM executes it without asking
a single structural question.

## BEHAVIORAL CONSTRAINTS
ALWAYS: stay within owns — reel-pipeline-orchestration, clip-stitching-and-dead-space-removal, transcription-and-script-generation, hook-gating-and-render.
NEVER: act on does_not_own — idea-validation-pmf, creator-voice-script-authoring, thumbnail-graphic-design.

## KNOWN-GOOD RECIPES
Use the CAPABILITY INVENTORY + SELECTOR LOGIC below to pick the recipe (preset) for the request.

## BATTLE SCARS
- **Phase 7 ran on a corrupted script.json because Phase 5 only checked format, not hook count** — A format-valid script.json with zero hooks reads as "done" to a format gate
but produces a hookless reel. The gate must check an observable property
(hooks.length >= 3), not just existence.
 → Every phase declares an Evidence Gate with an observable CHECK and a BLOCK-IF
negation. Phase N+1 cannot begin until Phase N emits GATE PASS.

- **vibe mode crashed because bash was absent and Phase 1 aborted with no fallback** — Aborting on a missing tool throws away the prompt-mode path, where the skill
could still emit executable artifacts for the user to run.
 → MODE DECLARATION downgrades to prompt mode on any tool-absence and never aborts.


## BOUNDARY CONTRACTS
Owns: reel-pipeline-orchestration, clip-stitching-and-dead-space-removal, transcription-and-script-generation, hook-gating-and-render
Does not own: idea-validation-pmf, creator-voice-script-authoring, thumbnail-graphic-design (see SCOPE GUARD for handoff conditions).

## IMMEDIATE ACTIONS
1. Run MODE DECLARATION → STATE "MODE: ...".
2. Run SELECTOR LOGIC → STATE "PRESET: ...".
3. Run INPUT PARSER → emit "INPUTS RESOLVED:".

---

## MODE DECLARATION
<!-- tfc_mode_declare generated — EXECUTE THIS BEFORE PHASE 1 -->

STEP 1 — DETECT execution mode:
  CHECK: bash callable?
    YES → SET mode = "tool"
    NO  → SET mode = "prompt"
  CHECK: ffmpeg callable?  ← one CHECK per entry in mode_check.required_tools
    YES → confirm mode = "tool"
    NO  → SET mode = "prompt"
  ON UNCERTAINTY: SET mode = "prompt"  # never block on detection failure

STEP 2 — STATE mode (required output):
  FORMAT: "MODE: [tool|prompt] — [one-line detection basis]"
  EXAMPLES:
    "MODE: tool — bash responsive, ffmpeg v6.1 found"
    "MODE: prompt — bash not confirmed; generating text artifacts for user execution"

MODE STATES:
  "tool":   full pipeline — read/write files, run CLI commands, produce real binary artifacts
  "prompt": text-only — emit all artifacts as code blocks; instruct user to execute

GATE: mode MUST be STATED before processing any phase input.
BLOCK: if mode undetermined after DETECT → SET mode = "prompt", STATE "mode-fallback: defaulting to prompt"
NEVER: abort because a tool is unavailable. Downgrade to "prompt" and continue.

---

## CAPABILITY INVENTORY
<!-- tfc_assemble compiled from capabilities: spec -->

Each capability lists what activates it. Select the matching capability; use its preset.

| Capability | Triggers (keywords) | Mode Required | Preset |
|---|---|---|---|
| viral-short | viral, hook, tiktok, trending | any | viral-9to16 |
| talking-head | talking head, explainer, founder, to camera | any | clean-talking-head |
| cinematic | cinematic, brand film, montage | tool | cinematic-graded |
| default-reel | reel, short, video | any | (always) |

RULE: If user_request contains a trigger keyword, activate that capability.
DEFAULT: If no trigger matches, activate "default-reel".

---

## SELECTOR LOGIC
<!-- tfc_selector generated — EXECUTE AFTER MODE DECLARATION -->

INPUT: user_request (string)
PARSE: extract topic_keywords, format_hints, scale_hints, audience_hints from user_request

DECISION TREE:
  IF topic_keywords ∩ {viral, hook, tiktok, trending}:
    SELECT preset "viral-9to16"
    STATE: "PRESET: viral-9to16 — fast-cut, hook-first vertical reel tuned for algorithmic reach"

  ELIF topic_keywords ∩ {talking head, explainer, founder, to camera}:
    SELECT preset "clean-talking-head"
    STATE: "PRESET: clean-talking-head — single-speaker explainer with captions and minimal cuts"

  ELIF topic_keywords ∩ {cinematic, brand film, montage} AND mode = "tool":
    SELECT preset "cinematic-graded"
    STATE: "PRESET: cinematic-graded — color-graded montage with music-driven pacing (tool mode for real render)"

  ELSE:
    SELECT preset "default-reel"
    STATE: "PRESET: default-reel (default) — no specific trigger matched; to override: name a capability keyword"

INVARIANT: A preset MUST be SELECTED and STATED before Phase 1 begins.
FORMAT: output exactly one line "PRESET: [name] — [basis]" before Phase 1.
NEVER: emit "which preset would you like?" — selection by asking = skill failure.

---

## INPUT PARSER
<!-- tfc_assemble compiled from inputs: spec — EXECUTE AFTER SELECTOR LOGIC -->

FOR EACH required input (in order below):

  INPUT: topic (string — non-empty)
    DETECT: Is topic explicitly stated in user message?
      YES → EXTRACT topic = [extracted_value]
      NO  → INFER using: the subject of the reel; infer from the clips' transcript or the user's phrasing
        IF inferable → SET topic = [inferred_value]
                       STATE: "Inferred topic: [value] — [one-line reason]"
        IF NOT inferable → ESCALATE: "What topic? (the subject of the reel; infer from the clips' transcript or the user's phrasing)"

  INPUT: platform (enum — tiktok | reels | shorts)
    DETECT: Is platform explicitly stated in user message?
      YES → EXTRACT platform = [extracted_value]
      NO  → INFER using: default to tiktok unless the user names a platform or aspect ratio
        IF inferable → SET platform = [inferred_value]
                       STATE: "Inferred platform: [value] — [one-line reason]"
        IF NOT inferable → ESCALATE: "What platform? (default to tiktok unless the user names a platform or aspect ratio)"

  INPUT: clips_path (path)
    DETECT: Is clips_path explicitly stated in user message?
      YES → EXTRACT clips_path = [extracted_value]
      NO  → INFER using: the directory of raw clips; infer from the most recent footage folder if unstated
        IF inferable → SET clips_path = [inferred_value]
                       STATE: "Inferred clips_path: [value] — [one-line reason]"
        IF NOT inferable → ESCALATE: "What clips_path? (the directory of raw clips; infer from the most recent footage folder if unstated)"

BEFORE PHASE 1 — emit INPUTS RESOLVED block:
  INPUTS RESOLVED:
    topic: [value] ([extracted|inferred] — [basis])
    platform: [value] ([extracted|inferred] — [basis])
    clips_path: [value] ([extracted|inferred] — [basis])

RULE: Attempt inference before escalating. Escalate ONLY inputs with no inference path.
MAX ESCALATIONS: 2 total (from escalation_rules.max_escalations).
ANTI-PATTERN: "What [input_name] do you want?" without inference attempt first = failure.

---

## SCOPE GUARD
<!-- tfc_assemble compiled from does_not_own: spec -->

This skill hands off when:
  idea-validation-pmf → hand off to: the skill/tool that owns it
  creator-voice-script-authoring → hand off to: the skill/tool that owns it
  thumbnail-graphic-design → hand off to: the skill/tool that owns it

RULE: On handoff trigger, STATE "SCOPE: out of bounds — [condition]; routing to [target]" before stopping.
NEVER: attempt in-scope emulation of an out-of-bounds task.

---

## EVIDENCE GATES
<!-- tfc_evidence_gate generated — one GATE block per phase -->

PHASE ingest GATE:
  ARTIFACT: clips.json
  CHECK: clips.json EXISTS AND clips.length >= 1
  STATE-ON-PASS: "Phase ingest PASS — artifact: clips.json, clips.json EXISTS AND clips.length >= 1"
  BLOCK-IF: clips.json absent OR clips.length == 0
  STATE-ON-BLOCK: "Phase ingest BLOCKED — clips.json: clips.json absent OR clips.length == 0. Invoking recovery."
  ON-BLOCK: execute Recovery Protocol for Phase ingest; DO NOT begin stitch

PHASE stitch GATE:
  ARTIFACT: timeline.json
  CHECK: timeline.json EXISTS AND segments.length >= 1
  STATE-ON-PASS: "Phase stitch PASS — artifact: timeline.json, timeline.json EXISTS AND segments.length >= 1"
  BLOCK-IF: timeline.json absent OR segments.length == 0
  STATE-ON-BLOCK: "Phase stitch BLOCKED — timeline.json: timeline.json absent OR segments.length == 0. Invoking recovery."
  ON-BLOCK: execute Recovery Protocol for Phase stitch; DO NOT begin transcribe

PHASE transcribe GATE:
  ARTIFACT: transcript.json
  CHECK: transcript.json EXISTS AND words.length > 0
  STATE-ON-PASS: "Phase transcribe PASS — artifact: transcript.json, transcript.json EXISTS AND words.length > 0"
  BLOCK-IF: transcript.json absent OR words.length == 0
  STATE-ON-BLOCK: "Phase transcribe BLOCKED — transcript.json: transcript.json absent OR words.length == 0. Invoking recovery."
  ON-BLOCK: execute Recovery Protocol for Phase transcribe; DO NOT begin analyse

PHASE analyse GATE:
  ARTIFACT: beats.json
  CHECK: beats.json EXISTS AND beats.length >= 1
  STATE-ON-PASS: "Phase analyse PASS — artifact: beats.json, beats.json EXISTS AND beats.length >= 1"
  BLOCK-IF: beats.json absent OR beats.length == 0
  STATE-ON-BLOCK: "Phase analyse BLOCKED — beats.json: beats.json absent OR beats.length == 0. Invoking recovery."
  ON-BLOCK: execute Recovery Protocol for Phase analyse; DO NOT begin script

PHASE script GATE:
  ARTIFACT: script.json
  CHECK: script.json EXISTS AND hooks.length >= 3
  STATE-ON-PASS: "Phase script PASS — artifact: script.json, script.json EXISTS AND hooks.length >= 3"
  BLOCK-IF: script.json absent OR hooks.length < 3
  STATE-ON-BLOCK: "Phase script BLOCKED — script.json: script.json absent OR hooks.length < 3. Invoking recovery."
  ON-BLOCK: execute Recovery Protocol for Phase script; DO NOT begin hook-gate

PHASE hook-gate GATE:
  ARTIFACT: hook_verdict.json
  CHECK: hook_verdict.json EXISTS AND passed == true
  STATE-ON-PASS: "Phase hook-gate PASS — artifact: hook_verdict.json, hook_verdict.json EXISTS AND passed == true"
  BLOCK-IF: hook_verdict.json absent OR passed == false
  STATE-ON-BLOCK: "Phase hook-gate BLOCKED — hook_verdict.json: hook_verdict.json absent OR passed == false. Invoking recovery."
  ON-BLOCK: execute Recovery Protocol for Phase hook-gate; DO NOT begin render

PHASE render GATE:
  ARTIFACT: reel.mp4
  CHECK: reel.mp4 EXISTS AND duration_s <= 90
  STATE-ON-PASS: "Phase render PASS — artifact: reel.mp4, reel.mp4 EXISTS AND duration_s <= 90"
  BLOCK-IF: reel.mp4 absent OR duration_s > 90
  STATE-ON-BLOCK: "Phase render BLOCKED — reel.mp4: reel.mp4 absent OR duration_s > 90. Invoking recovery."
  ON-BLOCK: execute Recovery Protocol for Phase render; DO NOT begin the next phase

PIPELINE RULE: Phase N+1 MUST NOT begin until Phase N GATE result = PASS.
ANTI-PATTERN: "Phase N complete" without emitting GATE PASS = automatic BLOCK on Phase N+1.

---

## DEPENDENCY GRAPH
<!-- tfc_assemble compiled from phase_dependencies: spec -->

Each phase declares the phases that must GATE PASS first and the artifacts it consumes:

  stitch — REQUIRES: ingest — artifacts: clips.json
  transcribe — REQUIRES: stitch — artifacts: timeline.json
  analyse — REQUIRES: transcribe — artifacts: transcript.json
  script — REQUIRES: analyse — artifacts: beats.json
  hook-gate — REQUIRES: script — artifacts: script.json
  render — REQUIRES: hook-gate, script — artifacts: hook_verdict.json, script.json

RULE: A dependent phase emits "BLOCKED — dependency [phase] not complete; required artifact: [name]"
and does NOT execute until every depends_on phase has GATE PASS.

---

## RECOVERY PROTOCOL
<!-- tfc_assemble compiled from recovery_protocol: spec -->

ON PHASE FAILURE — execute in order, do not skip levels:

PHASE render:
  STEP 1 — RETRY: retry — re-run Phase render with same inputs (max 2 times)
  STEP 2 — DOWNGRADE: downgrade
  STEP 3 — ESCALATE: escalate (only after STEP 2 fails)
  STEP 4 — ABORT: abort; STATE "Phase render unrecoverable — [reason]"

PHASE transcribe:
  STEP 1 — RETRY: retry — re-run Phase transcribe with same inputs (max 1 times)
  STEP 2 — DOWNGRADE: downgrade
  STEP 3 — ESCALATE: escalate (only after STEP 2 fails)
  STEP 4 — ABORT: abort; STATE "Phase transcribe unrecoverable — [reason]"

RULE: Never jump from STEP 1 to STEP 3. Downgrade before asking.

---

## STATE TRACKER
<!-- append this compact block after each GATE PASS in the pipeline -->

STATE SNAPSHOT (replace previous; do not append):
  mode: [tool|prompt]
  preset: [selected_preset]
  phase_current: [phase_name]
  phases_passed: [list]
  inputs: {[input_name]: [value], ...}
  last_artifact: [artifact_name]
  escalations_used: [n] of [max]

---

## QUALITY RUBRIC
<!-- tfc_assemble compiled from quality_rubric: spec -->

After each phase, check the phase artifact against these criteria:

PHASE script:
  CHECK: hook lands in first 3 seconds → observable: script.json hooks[0].t_start <= 3 → severity: fail
  CHECK: at least one pattern interrupt scheduled → observable: script.json interrupts.length >= 1 → severity: warn
  ON FAIL: BLOCK next phase; invoke Recovery Protocol
  ON WARN: STATE "[criterion]: warning — [observation]"; continue

PHASE render:
  CHECK: loudness within platform target → observable: reel.mp4 integrated_lufs within [-16, -13] → severity: warn
  CHECK: aspect ratio is 9:16 → observable: reel.mp4 width/height == 9/16 → severity: fail
  ON FAIL: BLOCK next phase; invoke Recovery Protocol
  ON WARN: STATE "[criterion]: warning — [observation]"; continue

---

## ESCALATION LADDER
<!-- tfc_assemble compiled from escalation_rules: spec -->

Inference-first policy. Execute in order. NEVER skip levels.

LEVEL 1 — INFER: if confidence >= 0.6, infer and STATE the inference
LEVEL 2 — DOWNGRADE: if inference below threshold, reduce scope and try again
LEVEL 3 — ASK: if downgrade fails, ask exactly one question (max 2 total)
LEVEL 4 — ABORT: if ask fails or max_escalations reached, STATE reason and stop

APPLIES TO: all inputs, all phase decisions, all preset selections.
REPLACES: all "NEVER ASK" and "DO NOT ask" directives elsewhere in this skill.

---

## CONTEXT FILE ROUTER
<!-- tfc_context_router generated — load ONLY matched files; max 3 per run -->

FOR user_request, load context files where keywords match:

  hooks.md → load when: {hook, viral, opener} OR phase IN {script, hook-gate}
    MODE constraint: any

  pacing.md → load when: {pacing, rhythm, cut} OR phase IN {stitch, analyse}
    MODE constraint: any

  captions.md → load when: {caption, subtitle, text} OR phase IN {script, render}
    MODE constraint: any

  color-grade.md → load when: {cinematic, grade, color} OR phase IN {render}
    MODE constraint: tool

  platform-specs.md → load when: {tiktok, reels, shorts, aspect} OR phase IN {render}
    MODE constraint: any

  loudness.md → load when: {audio, loudness, lufs} OR phase IN {render}
    MODE constraint: tool

RULE: Load top 3 files by keyword match count. Unmatched files are NOT loaded.
STATE: "CONTEXT LOADED: [file1], [file2], ... — matched [N] of 6 triggers"
ANTI-PATTERN: loading all context files on every run = token overflow.

---

## TOOL AVAILABILITY CHECK
<!-- execute after MODE DECLARATION, before Phase 1 -->

CHECK EACH REQUIRED TOOL:
  bash: callable? → YES: available | NO: degrade (see MODE STATES)
  ffmpeg: callable? → YES: available | NO: degrade (see MODE STATES)

DEGRADE RULE: if a required tool is unavailable, SET mode = "prompt" for phases that need it;
continue with remaining phases in available mode.
STATE: "TOOLS: [tool_1] available | [tool_2] unavailable — degrading affected phases to prompt mode"

---

## CROSS-SKILL INVOCATION PROTOCOL
<!-- tfc_assemble compiled from cross_skill_invocations: spec -->

Invoke these skills automatically when trigger conditions are met — no user prompt required.

  SKILL: idearalph
    TRIGGER: user_request keywords ∩ {validate, concept, idea, hook ideas} → invoke before Phase 1 (pre-pipeline)
    HANDOFF: pass topic + platform from INPUTS RESOLVED from INPUTS RESOLVED block
    RETURN: receive scored hook concepts; feed top 3 into the script phase; use it as execution input
    ON UNAVAILABLE: STATE "SKIP: idearalph unavailable — continuing without it"; continue

  SKILL: reel-forge
    TRIGGER: user_request keywords ∩ {voice, creator voice, script it} → invoke before Phase script
    HANDOFF: pass topic + beats.json from INPUTS RESOLVED block
    RETURN: receive a voiced script; use as the script phase artifact; use it as execution input
    ON UNAVAILABLE: STATE "SKIP: reel-forge unavailable — continuing without it"; continue

RULE: Check triggers after INPUTS RESOLVED. Invoke matching skills before Phase 1 begins.
NEVER: bury cross-skill calls in phase prose. This section is the single authority.

---

## MEMORY PROTOCOL
<!-- tfc_assemble compiled from memory_protocol: spec -->

RETRIEVE at: session_start, phase_1_begin
  CALL: mind_retrieve(query="[skill] [domain] prior runs")
  USE: retrieved context to inform INPUTS RESOLVED inferences

STORE on: phase_complete, gate_block, user_correction
  CALL: mind_remember(content=[event_summary], salience=0.5)
  STORE: phase outcomes, gate blocks, user corrections, escalations

RULE: Retrieve before Phase 1 begins. Store after each meaningful event.

---

## SELF-IMPROVEMENT HOOK
<!-- tfc_eval reads learning_triggers to target learnings.jsonl writes -->

This skill teaches tfc_eval which events to capture:

LEARNING TRIGGERS: gate_block, selector_miss, mode_fallback, escalation
  gate_block → capture: which phase blocked, artifact state, check condition
  selector_miss → capture: input that triggered wrong preset, correct preset
  mode_fallback → capture: which tool was absent, fallback path taken

EVAL FOCUS: selector_accuracy, gate_pass_rate, inference_rate
  selector_accuracy → measure: preset selected matches expected for input type
  gate_pass_rate → measure: phases that PASS gate on first attempt / total attempts

NOTE: tfc_evolve writes ONLY to sections matched by learning_triggers. Other sections unchanged.
