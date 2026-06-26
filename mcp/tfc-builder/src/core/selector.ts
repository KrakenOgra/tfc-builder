// TFC v2 Layer 8 — SELECTOR LOGIC generator (tfc_selector).
//
// Reads spec.capabilities and emits the ## SELECTOR LOGIC section as a deterministic
// IF/ELIF/ELSE decision tree mapping user_request keywords → preset, with a mandatory
// "PRESET: [name] — [basis]" STATE line. Executed AFTER Mode Declaration, BEFORE Phase 1.
//
// INV-1: pure function. No model call, no file write.

import type { Capability } from "./types.js";

export interface SelectorInput {
  capabilities: Capability[];
}

export interface SelectorResult {
  section: string;
}

/**
 * Generates the SELECTOR LOGIC decision tree.
 * - Branch ordering: most-specific first (more trigger keywords ⇒ earlier branch).
 * - The default branch uses the capability whose preset is null, else the last entry.
 */
export function buildSelectorSection(input: SelectorInput): SelectorResult {
  const caps = [...(input.capabilities ?? [])];

  // Choose the default capability: prefer an explicit null-preset entry, else last.
  const defaultCap =
    caps.find((c) => c.preset === null) ?? caps[caps.length - 1] ?? null;
  const branchCaps = caps.filter((c) => c !== defaultCap);

  // Sort branches by specificity (keyword count descending) — most specific matches first.
  branchCaps.sort(
    (a, b) => (b.triggers?.keywords?.length ?? 0) - (a.triggers?.keywords?.length ?? 0),
  );

  const branches: string[] = [];
  branchCaps.forEach((cap, i) => {
    const kw = setLiteral(cap.triggers?.keywords ?? []);
    const modeClause =
      cap.triggers?.mode && cap.triggers.mode !== "any"
        ? ` AND mode = "${cap.triggers.mode}"`
        : "";
    const preset = cap.preset ?? cap.name;
    const head = i === 0 ? "IF" : "ELIF";
    branches.push(
      `  ${head} topic_keywords ∩ ${kw}${modeClause}:`,
      `    SELECT preset "${preset}"`,
      `    STATE: "PRESET: ${preset} — ${cap.description}"`,
      ``,
    );
  });

  let elseBlock: string;
  if (defaultCap) {
    const preset = defaultCap.preset ?? defaultCap.name;
    elseBlock = `  ELSE:
    SELECT preset "${preset}"
    STATE: "PRESET: ${preset} (default) — no specific trigger matched; to override: name a capability keyword"`;
  } else {
    elseBlock = `  ELSE:
    SELECT preset "default"
    STATE: "PRESET: default (default) — no capabilities declared; to override: name a capability keyword"`;
  }

  const treeBody =
    branches.length > 0 ? `${branches.join("\n")}\n${elseBlock}` : elseBlock;

  const section = `## SELECTOR LOGIC
<!-- tfc_selector generated — EXECUTE AFTER MODE DECLARATION -->

INPUT: user_request (string)
PARSE: extract topic_keywords, format_hints, scale_hints, audience_hints from user_request

DECISION TREE:
${treeBody}

INVARIANT: A preset MUST be SELECTED and STATED before Phase 1 begins.
FORMAT: output exactly one line "PRESET: [name] — [basis]" before Phase 1.
NEVER: emit "which preset would you like?" — selection by asking = skill failure.`;

  return { section };
}

function setLiteral(keywords: string[]): string {
  return `{${keywords.join(", ")}}`;
}
