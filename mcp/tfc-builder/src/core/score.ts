import { fail, ok, type Result } from "./result.js";
import {
  loadSkill,
  loadSkillFromDir,
  CHECK_REGISTRY,
  extractSection,
  countRealNamedItems,
  countNumberedItems,
  countBulletItems,
  isFilledContent,
  countPhases,
  phasesAscending,
  countStopPoints,
  hasCompletionProtocol,
  hasEvidenceRules,
  countH2Sections,
  countTables,
  hasVersionStamp,
  type LoadedSkill,
} from "./checks.js";
import { skillDir } from "./paths.js";
import { ARCHETYPES, DEFAULT_ARCHETYPE, type Archetype } from "./types.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RubricResult {
  score: number;
  breakdown: Record<string, number>;
  gaps: string[];
}

export interface ScoreReport extends RubricResult {
  archetype: Archetype;
  // Present only for hybrid: full per-rubric detail behind the halved breakdown
  halves?: { domain: RubricResult; workflow: RubricResult };
}

// ── Shared scoring helpers ────────────────────────────────────────────────────

function scoreNamedSection(
  content: string,
  maxPoints: number,
  label: string,
  gaps: string[],
): number {
  const count = countRealNamedItems(content);
  if (count === 0) {
    gaps.push(`${label}: no named items — write at least 3 named entries (see tfc_generate)`);
    return 0;
  }
  if (count === 1) {
    gaps.push(`${label}: only 1 named item — add 2 more for full score`);
    return Math.round(maxPoints * 0.25);
  }
  if (count === 2) {
    gaps.push(`${label}: only 2 named items — add 1 more for full score`);
    return Math.round(maxPoints * 0.6);
  }
  return maxPoints;
}

// voiceClean (max 10) — reuses check registry, no duplicate logic
function scoreVoiceClean(skill: LoadedSkill, gaps: string[]): number {
  const emDashCheck = CHECK_REGISTRY.get("voice-em-dash");
  const aiVocabCheck = CHECK_REGISTRY.get("voice-ai-vocabulary");
  const emDashOk = emDashCheck ? emDashCheck(skill).passed : true;
  const aiVocabOk = aiVocabCheck ? aiVocabCheck(skill).passed : true;
  if (!emDashOk) gaps.push("Voice: em dash found in prose — replace with ':' or split sentence");
  if (!aiVocabOk) gaps.push("Voice: AI vocabulary found — replace with direct concrete language");
  return emDashOk && aiVocabOk ? 10 : emDashOk || aiVocabOk ? 5 : 0;
}

// ── DOMAIN_RUBRIC (the v1 rubric) — "BE someone" skills ──────────────────────
// identity 15 · principles 15 · patterns 20 · anti-patterns 20 · quick-wins 10
// · handoffs 10 · voice 10

export function scoreDomainExpert(skill: LoadedSkill): RubricResult {
  const gaps: string[] = [];
  const breakdown: Record<string, number> = {};

  // identity (max 15) — filled content with hard-won lessons
  const identitySection = extractSection(skill.skillMdText, "Identity");
  const identityFilled = isFilledContent(identitySection);
  const identityHasLessons =
    identityFilled && /hard-won|The team that|I.ve seen|observed from/i.test(identitySection);
  if (!identityFilled) {
    gaps.push("Identity: section is a placeholder — run tfc_brainstorm to generate it");
    breakdown["identity"] = identitySection.trim().length > 0 ? 5 : 0;
  } else if (!identityHasLessons) {
    gaps.push("Identity: no hard-won lessons detected — name a real failure (see intelligence-context-guide.md)");
    breakdown["identity"] = 8;
  } else {
    breakdown["identity"] = 15;
  }

  // principles (max 15) — filled imperatives
  const principlesSection = extractSection(skill.skillMdText, "Principles");
  const principlesFilled = isFilledContent(principlesSection);
  const imperativeCount = principlesFilled ? countNumberedItems(principlesSection) : 0;
  if (!principlesFilled) {
    gaps.push("Principles: section is a placeholder — run tfc_brainstorm to generate it");
    breakdown["principles"] = 0;
  } else if (imperativeCount < 3) {
    gaps.push(`Principles: only ${imperativeCount} imperative(s) — write at least 4`);
    breakdown["principles"] = imperativeCount > 0 ? 8 : 0;
  } else {
    breakdown["principles"] = 15;
  }

  // patterns (max 20) — named ### entries
  const patternsSection = extractSection(skill.skillMdText, "Patterns");
  breakdown["patterns"] = scoreNamedSection(patternsSection, 20, "Patterns", gaps);

  // antiPatterns (max 20) — named ### entries in Anti-Patterns
  const antiSection = extractSection(skill.skillMdText, "Anti-Patterns");
  breakdown["antiPatterns"] = scoreNamedSection(antiSection, 20, "Anti-Patterns", gaps);

  // quickWins (max 10) — bullet items
  const qwSection = extractSection(skill.skillMdText, "Quick Wins");
  const qwFilled = isFilledContent(qwSection);
  const qwCount = qwFilled ? countBulletItems(qwSection) : 0;
  if (!qwFilled) {
    gaps.push("Quick Wins: section is a placeholder — run tfc_generate with layers:[\"quick-wins\"]");
    breakdown["quickWins"] = 0;
  } else if (qwCount < 3) {
    gaps.push(`Quick Wins: only ${qwCount} entries — write at least 5 zero-ambiguity actions`);
    breakdown["quickWins"] = qwCount > 0 ? 5 : 0;
  } else {
    breakdown["quickWins"] = 10;
  }

  // handoffs (max 10) — Does NOT own + at least one table row
  const handoffsSection = extractSection(skill.skillMdText, "Handoffs");
  const hasDoesNotOwn = handoffsSection.includes("Does NOT own");
  const hasHandoffRow = /^\|[^|]+\|/m.test(handoffsSection);
  if (!handoffsSection.trim()) {
    gaps.push("Handoffs: section absent — run tfc_generate with layers:[\"handoffs\"]");
    breakdown["handoffs"] = 0;
  } else if (!hasDoesNotOwn && !hasHandoffRow) {
    gaps.push("Handoffs: no Does NOT own list and no handoff table — add boundary contracts");
    breakdown["handoffs"] = 0;
  } else if (!hasDoesNotOwn || !hasHandoffRow) {
    gaps.push(
      hasDoesNotOwn
        ? "Handoffs: missing handoff table (Provides to / Receives from)"
        : "Handoffs: missing Does NOT own list — name at least one scope boundary",
    );
    breakdown["handoffs"] = 5;
  } else {
    breakdown["handoffs"] = 10;
  }

  breakdown["voiceClean"] = scoreVoiceClean(skill, gaps);

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, breakdown, gaps };
}

// ── WORKFLOW_RUBRIC — "DO something" skills (investigate, ship, vague-to-system)
// phases 20 · stop-points 15 · preamble 10 · completion-protocol 10
// · evidence-rules 15 · failure-paths 10 · handoffs 10 · voice 10

export function scoreWorkflow(skill: LoadedSkill): RubricResult {
  const gaps: string[] = [];
  const breakdown: Record<string, number> = {};
  const md = skill.skillMdText;

  // phases (max 20) — numbered, ordered
  const phaseCount = countPhases(md);
  if (phaseCount === 0) {
    gaps.push("Phases: no numbered phase headings (## Phase 1 ...) — a workflow needs ordered phases");
    breakdown["phases"] = 0;
  } else if (phaseCount === 1) {
    gaps.push("Phases: only 1 phase — split the procedure into at least 3 ordered phases");
    breakdown["phases"] = 5;
  } else if (phaseCount === 2) {
    gaps.push("Phases: only 2 phases — add at least 1 more for full score");
    breakdown["phases"] = 12;
  } else if (!phasesAscending(md)) {
    gaps.push("Phases: phase numbers are not in ascending order — renumber them");
    breakdown["phases"] = 12;
  } else {
    breakdown["phases"] = 20;
  }

  // stopPoints (max 15) — explicit gates where the model must wait
  const stops = countStopPoints(md);
  if (stops === 0) {
    gaps.push("Stop points: none found — mark explicit gates with **STOP.** where user input is required");
    breakdown["stopPoints"] = 0;
  } else if (stops === 1) {
    gaps.push("Stop points: only 1 — most workflows need at least 2 explicit gates");
    breakdown["stopPoints"] = 9;
  } else {
    breakdown["stopPoints"] = 15;
  }

  // preamble (max 10) — reuses the registry check
  const preambleCheck = CHECK_REGISTRY.get("preamble-present");
  const preambleOk = preambleCheck ? preambleCheck(skill).passed : false;
  if (!preambleOk) {
    gaps.push('Preamble: missing "## Preamble (run first)" block — state must load before phase 1');
  }
  breakdown["preamble"] = preambleOk ? 10 : 0;

  // completionProtocol (max 10) — a ## Completion section defining DONE/BLOCKED
  const completionOk = hasCompletionProtocol(md);
  if (!completionOk) {
    gaps.push("Completion protocol: add a ## Completion section defining DONE and BLOCKED statuses");
  }
  breakdown["completionProtocol"] = completionOk ? 10 : 0;

  // evidenceRules (max 15) — "screenshot or it didn't happen"
  const evidenceOk = hasEvidenceRules(md);
  if (!evidenceOk) {
    gaps.push('Evidence rules: none found — require proof per phase ("Evidence:", screenshots, output blocks)');
  }
  breakdown["evidenceRules"] = evidenceOk ? 15 : 0;

  // failurePaths (max 10) — BLOCKED / NEEDS_CONTEXT defined
  const hasBlocked = /\bBLOCKED\b/.test(md);
  const hasNeedsContext = /\bNEEDS_CONTEXT\b/.test(md);
  if (hasBlocked && hasNeedsContext) {
    breakdown["failurePaths"] = 10;
  } else if (hasBlocked || hasNeedsContext) {
    gaps.push(
      hasBlocked
        ? "Failure paths: NEEDS_CONTEXT status missing — define what happens when input is too sparse"
        : "Failure paths: BLOCKED status missing — define what happens when the workflow cannot proceed",
    );
    breakdown["failurePaths"] = 5;
  } else {
    gaps.push("Failure paths: neither BLOCKED nor NEEDS_CONTEXT defined — name the exit ramps");
    breakdown["failurePaths"] = 0;
  }

  // handoffs (max 10) — where the work goes next (handoff mention or route arrow)
  const hasHandoff = /\bhandoffs?\b/i.test(md) || /→\s*\/[a-z0-9-]+/.test(md);
  if (!hasHandoff) {
    gaps.push("Handoffs: no handoff or route target — name where the output goes next");
  }
  breakdown["handoffs"] = hasHandoff ? 10 : 0;

  breakdown["voiceClean"] = scoreVoiceClean(skill, gaps);

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, breakdown, gaps };
}

// ── REFERENCE_RUBRIC — lookup tables, cheatsheets ─────────────────────────────
// coverage 40 · freshness 20 (version-stamped) · retrieval shape 30 (tables,
// anchors) · voice 10

export function scoreReference(skill: LoadedSkill): RubricResult {
  const gaps: string[] = [];
  const breakdown: Record<string, number> = {};
  const md = skill.skillMdText;

  // coverage (max 40) — distinct lookup sections
  const sections = countH2Sections(md);
  if (sections >= 6) {
    breakdown["coverage"] = 40;
  } else if (sections >= 4) {
    gaps.push(`Coverage: only ${sections} sections — a reference needs 6+ distinct lookup sections`);
    breakdown["coverage"] = 25;
  } else if (sections >= 2) {
    gaps.push(`Coverage: only ${sections} sections — far too thin for a reference skill`);
    breakdown["coverage"] = 12;
  } else {
    gaps.push("Coverage: no lookup sections found — structure the content under ## headings");
    breakdown["coverage"] = 0;
  }

  // freshness (max 20) — version-stamped content
  const fresh = hasVersionStamp(md);
  if (!fresh) {
    gaps.push('Freshness: no version stamp — add "as of <date>" or the covered version (v1.2)');
  }
  breakdown["freshness"] = fresh ? 20 : 0;

  // retrievalShape (max 30) — tables and anchors beat prose for lookup
  const tables = countTables(md);
  if (tables >= 2) {
    breakdown["retrievalShape"] = 30;
  } else if (tables === 1) {
    gaps.push("Retrieval shape: only 1 table — convert more lists/prose into lookup tables");
    breakdown["retrievalShape"] = 15;
  } else {
    gaps.push("Retrieval shape: no tables — references must be scannable, not prose");
    breakdown["retrievalShape"] = 0;
  }

  breakdown["voiceClean"] = scoreVoiceClean(skill, gaps);

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, breakdown, gaps };
}

// ── HYBRID — both rubrics at 50% weight; must clear 60 on both halves ────────

const HYBRID_HALF_FLOOR = 60;

export function scoreHybrid(skill: LoadedSkill): {
  result: RubricResult;
  halves: { domain: RubricResult; workflow: RubricResult };
} {
  const domain = scoreDomainExpert(skill);
  const workflow = scoreWorkflow(skill);
  const breakdown: Record<string, number> = {
    domainHalf: Math.round(domain.score / 2),
    workflowHalf: Math.round(workflow.score / 2),
  };
  const gaps: string[] = [];
  if (domain.score < HYBRID_HALF_FLOOR) {
    gaps.push(
      `hybrid: domain half scored ${domain.score}/100 — must clear ${HYBRID_HALF_FLOOR} on both halves`,
    );
  }
  if (workflow.score < HYBRID_HALF_FLOOR) {
    gaps.push(
      `hybrid: workflow half scored ${workflow.score}/100 — must clear ${HYBRID_HALF_FLOOR} on both halves`,
    );
  }
  gaps.push(...domain.gaps.map((g) => `[domain] ${g}`));
  gaps.push(...workflow.gaps.map((g) => `[workflow] ${g}`));

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { result: { score, breakdown, gaps }, halves: { domain, workflow } };
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

export function scoreFromLoaded(skill: LoadedSkill): ScoreReport {
  const declared = skill.specYaml.archetype;
  const preGaps: string[] = [];
  let archetype: Archetype;
  if (declared === undefined) {
    archetype = DEFAULT_ARCHETYPE;
  } else if ((ARCHETYPES as readonly string[]).includes(declared)) {
    archetype = declared;
  } else {
    archetype = DEFAULT_ARCHETYPE;
    preGaps.push(
      `archetype: unknown value "${String(declared)}" — scored as ${DEFAULT_ARCHETYPE}; use one of ${ARCHETYPES.join(" | ")}`,
    );
  }

  if (archetype === "workflow") {
    const r = scoreWorkflow(skill);
    return { archetype, score: r.score, breakdown: r.breakdown, gaps: [...preGaps, ...r.gaps] };
  }
  if (archetype === "reference") {
    const r = scoreReference(skill);
    return { archetype, score: r.score, breakdown: r.breakdown, gaps: [...preGaps, ...r.gaps] };
  }
  if (archetype === "hybrid") {
    const { result, halves } = scoreHybrid(skill);
    return {
      archetype,
      score: result.score,
      breakdown: result.breakdown,
      gaps: [...preGaps, ...result.gaps],
      halves,
    };
  }
  const r = scoreDomainExpert(skill);
  return { archetype, score: r.score, breakdown: r.breakdown, gaps: [...preGaps, ...r.gaps] };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function scoreSkillFromDir(dir: string): Promise<Result<ScoreReport>> {
  const skillR = await loadSkillFromDir(dir);
  if (!skillR.ok) return skillR;
  return ok(scoreFromLoaded(skillR.data));
}

export async function scoreSkill(input: {
  category: string;
  name: string;
}): Promise<Result<ScoreReport>> {
  const dirR = skillDir(input.category, input.name);
  if (!dirR.ok) return fail("BAD_INPUT", dirR.error.message);
  const skillR = await loadSkill(input.category, input.name);
  if (!skillR.ok) return skillR;
  return ok(scoreFromLoaded(skillR.data));
}
