// src/core/context-depth.ts
// CCE v2 Wave 2 (V3 DEPTH-AND-FRESHNESS-ARE-BOTH-GATED) — the deterministic depth verdict.
//
// The v1 audit read each file then kept only last_verified (context.ts:230), so an empty-but-
// stamped stub reported healthy. This scores DEPTH: a file is `deep` only when every declared
// section carries non-empty body, at least one section carries a `source:`, and the prose clears
// a token floor. Empty stubs fail on all three — fails-closed. Reuses the W1 parser so there is
// one definition of "what a section is". Model-free + clock-free (INV-4); freshness stays in the
// audit's existing last_verified path (INV-7, clock at the handler boundary).

import {
  estimateTokens,
  parseContextFile,
  type ParsedContextFile,
} from "./context-retrieve.js";

export interface DepthBar {
  requireAllSectionsFilled: boolean; // an empty ## header sinks the file
  minSourcedSections: number; // provenance floor (V2 honesty contract)
  minTokens: number; // body-density floor across the whole file
  minSections: number; // a file with no sections is not context
}

// W5 will override these per-domain from the angle manifest; until then they are the global floor.
export const DEFAULT_DEPTH_BAR: DepthBar = {
  requireAllSectionsFilled: true,
  minSourcedSections: 1,
  minTokens: 80,
  minSections: 1,
};

export interface DepthVerdict {
  file: string;
  sectionsTotal: number;
  sectionsNonEmpty: number;
  sourcedSections: number;
  tokens: number;
  coverage: number; // sectionsNonEmpty / sectionsTotal (0 when no sections)
  deep: boolean;
  reasons: string[]; // why NOT deep — empty iff deep (fails-closed evidence)
}

export function scoreDepth(
  parsed: ParsedContextFile,
  bar: DepthBar = DEFAULT_DEPTH_BAR,
): DepthVerdict {
  const sectionsTotal = parsed.sections.length;
  const sectionsNonEmpty = parsed.sections.filter((s) => !s.isEmpty).length;
  const sourcedSections = parsed.sections.filter(
    (s) => !s.isEmpty && s.source !== null,
  ).length;
  const tokens = parsed.sections.reduce(
    (sum, s) => sum + estimateTokens(s.body),
    0,
  );
  const coverage = sectionsTotal === 0 ? 0 : sectionsNonEmpty / sectionsTotal;

  const reasons: string[] = [];
  if (sectionsTotal < bar.minSections) {
    reasons.push(`no sections (need ≥ ${bar.minSections})`);
  }
  if (bar.requireAllSectionsFilled && sectionsNonEmpty < sectionsTotal) {
    reasons.push(`${sectionsTotal - sectionsNonEmpty} empty section(s)`);
  }
  if (sourcedSections < bar.minSourcedSections) {
    reasons.push(
      `${sourcedSections} sourced section(s) (need ≥ ${bar.minSourcedSections})`,
    );
  }
  if (tokens < bar.minTokens) {
    reasons.push(`body too thin (${tokens} < ${bar.minTokens} tokens)`);
  }

  return {
    file: parsed.file,
    sectionsTotal,
    sectionsNonEmpty,
    sourcedSections,
    tokens,
    coverage,
    deep: reasons.length === 0,
    reasons,
  };
}

export function scoreDepthOf(
  file: string,
  content: string,
  bar: DepthBar = DEFAULT_DEPTH_BAR,
): DepthVerdict {
  return scoreDepth(parseContextFile(file, content), bar);
}
