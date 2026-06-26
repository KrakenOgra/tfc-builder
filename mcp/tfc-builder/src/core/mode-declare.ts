// TFC v2 Layer 9 — MODE DECLARATION generator (tfc_mode_declare).
//
// Reads spec.mode_check and emits the ## MODE DECLARATION section as a deterministic
// IF/THEN tool-detection gate with named states + a never-block fallback. Placed FIRST
// inside the Capability Group so the executing LLM resolves mode before any phase input.
//
// INV-1: pure function. Reads the spec field, returns a string. No model call, no file write.

import type { ModeCheck } from "./types.js";

export interface ModeDeclareInput {
  modeCheck: ModeCheck;
}

export interface ModeDeclareResult {
  section: string;
}

/**
 * Generates the MODE DECLARATION section from a mode_check: spec.
 * - One `CHECK:` line per required tool, ordered by detection_order when provided.
 * - The first tool SETs mode; subsequent tools confirm it.
 * - fallback (almost always "prompt") becomes the ON UNCERTAINTY target.
 */
export function buildModeDeclareSection(input: ModeDeclareInput): ModeDeclareResult {
  const { modeCheck } = input;
  const tools = orderTools(modeCheck);
  const fallback = modeCheck.fallback ?? "prompt";

  const checkLines: string[] = [];
  tools.forEach((tool, i) => {
    if (i === 0) {
      checkLines.push(
        `  CHECK: ${tool} callable?`,
        `    YES → SET mode = "tool"`,
        `    NO  → SET mode = "${fallback}"`,
      );
    } else {
      checkLines.push(
        `  CHECK: ${tool} callable?  ← one CHECK per entry in mode_check.required_tools`,
        `    YES → confirm mode = "tool"`,
        `    NO  → SET mode = "${fallback}"`,
      );
    }
  });
  if (tools.length === 0) {
    checkLines.push(
      `  (no required tools declared) → SET mode = "${fallback}"`,
    );
  }

  const section = `## MODE DECLARATION
<!-- tfc_mode_declare generated — EXECUTE THIS BEFORE PHASE 1 -->

STEP 1 — DETECT execution mode:
${checkLines.join("\n")}
  ON UNCERTAINTY: SET mode = "${fallback}"  # never block on detection failure

STEP 2 — STATE mode (required output):
  FORMAT: "MODE: [tool|prompt] — [one-line detection basis]"
  EXAMPLES:
    "MODE: tool — bash responsive, ffmpeg v6.1 found"
    "MODE: prompt — bash not confirmed; generating text artifacts for user execution"

MODE STATES:
  "tool":   full pipeline — read/write files, run CLI commands, produce real binary artifacts
  "prompt": text-only — emit all artifacts as code blocks; instruct user to execute

GATE: mode MUST be STATED before processing any phase input.
BLOCK: if mode undetermined after DETECT → SET mode = "${fallback}", STATE "mode-fallback: defaulting to ${fallback}"
NEVER: abort because a tool is unavailable. Downgrade to "prompt" and continue.`;

  return { section };
}

/** detection_order wins; any required_tools not listed there are appended in declared order. */
function orderTools(modeCheck: ModeCheck): string[] {
  const required = modeCheck.required_tools ?? [];
  const order = modeCheck.detection_order ?? [];
  if (order.length === 0) return [...required];
  const inOrder = order.filter((t) => required.includes(t));
  const rest = required.filter((t) => !order.includes(t));
  return [...inOrder, ...rest];
}
