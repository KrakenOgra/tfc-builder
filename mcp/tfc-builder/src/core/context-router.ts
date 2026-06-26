// TFC v2 Layer 18 — CONTEXT FILE ROUTER generator (tfc_context_router).
//
// Reads spec.context_routing + context_max_load and emits the ## CONTEXT FILE ROUTER
// section: one load-when entry per file (keywords ∪ phases, with a mode constraint), a
// top-N hard cap, and a verifiable "CONTEXT LOADED:" STATE line. Stops the all-files-every-run
// token overflow by making the LLM rank and load only matched files.
//
// INV-1: pure function. No model call, no file write.

import type { ContextRoute } from "./types.js";

export interface ContextRouterInput {
  contextRouting: ContextRoute[];
  maxLoad: number; // top-N hard cap; default 3 at the assembly boundary
}

export interface ContextRouterResult {
  section: string;
}

export function buildContextRouterSection(
  input: ContextRouterInput,
): ContextRouterResult {
  const routes = input.contextRouting ?? [];
  const maxLoad = input.maxLoad;
  const total = routes.length;

  const entries = routes.map((r) => {
    const kw = `{${(r.load_when?.keywords ?? []).join(", ")}}`;
    const phases = r.load_when?.phases ?? [];
    const phaseClause =
      phases.length > 0 ? ` OR phase IN {${phases.join(", ")}}` : "";
    const mode = r.load_when?.mode ?? "any";
    return `  ${r.file} → load when: ${kw}${phaseClause}
    MODE constraint: ${mode}`;
  });

  const body =
    entries.length > 0
      ? entries.join("\n\n")
      : "  (no context_routing declared — all context/ files load by default)";

  const maxClause =
    maxLoad === 0
      ? "0 (kill-switch: load ALL files — debugging only)"
      : String(maxLoad);

  const section = `## CONTEXT FILE ROUTER
<!-- tfc_context_router generated — load ONLY matched files; max ${maxClause} per run -->

FOR user_request, load context files where keywords match:

${body}

RULE: Load top ${maxClause} files by keyword match count. Unmatched files are NOT loaded.
STATE: "CONTEXT LOADED: [file1], [file2], ... — matched [N] of ${total} triggers"
ANTI-PATTERN: loading all context files on every run = token overflow.`;

  return { section };
}
