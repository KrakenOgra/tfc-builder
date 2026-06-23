// src/core/context-coverage.ts
// CCE v2 Wave 5 (V6 DEPTH-COMES-FROM-MANY-ANGLES) — angle-completeness coverage.
//
// v1 (and W2 file-depth) treat "the required file exists" as covered. V6 rejects that: a domain is
// covered only when every distinct ANGLE has its OWN sourced, deep file. Coverage = angles ANSWERED
// (file exists AND clears the W2 depth bar) / angles DECLARED in the manifest. A domain answered by
// one file out of twelve is uncovered, not 8% done-and-fine. The author records the depth target in
// the manifest (V6: ≥12 normal, ≥20 when the domain's own subject is context). Model-free + clock-
// free (INV-4): manifest read + per-file depth scoring, reusing W2's bar and W1's parser.

import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { exists, readText } from "./fs.js";
import { findSkillDir } from "./context.js";
import { parseContextFile } from "./context-retrieve.js";
import { scoreDepth } from "./context-depth.js";
import { loadAngleManifest } from "./context-discover.js";

export const DEFAULT_DEPTH_TARGET = 12;

export interface AngleStatus {
  file: string;
  exists: boolean;
  deep: boolean; // exists AND clears the depth bar (non-empty, sourced, dense)
  reasons: string[]; // depth reasons when present-but-shallow; "missing" when absent
}

export interface CoverageVerdict {
  skill: string;
  domain: string;
  declaredAngles: number;
  answeredAngles: number; // exists AND deep
  coverage: number; // answeredAngles / declaredAngles (0 when none declared)
  depthTarget: number;
  depthTargetMet: boolean; // declaredAngles >= depthTarget
  covered: boolean; // every declared angle answered AND depthTarget met
  angles: AngleStatus[];
  reasons: string[]; // why NOT covered — empty iff covered (fails-closed evidence)
}

export async function scoreCoverage(input: {
  name: string;
}): Promise<Result<CoverageVerdict>> {
  const dir = await findSkillDir(input.name);
  if (!dir) {
    return fail("NOT_FOUND", `Skill not found by name: ${input.name}`);
  }
  const skill = nodePath.basename(dir);
  const contextDir = nodePath.join(dir, "context");

  const manifest = await loadAngleManifest(contextDir);
  if (!manifest) {
    return fail(
      "NOT_FOUND",
      `No context/_angles.yaml manifest for ${skill}`,
      "Author a manifest (domain + angles[] + depth_target) so coverage can be measured by angle, not by file presence",
    );
  }

  const depthTarget = manifest.depth_target ?? DEFAULT_DEPTH_TARGET;
  const declaredAngles = manifest.angles.length;

  const angles: AngleStatus[] = [];
  for (const a of manifest.angles) {
    const p = nodePath.join(contextDir, a.file);
    if (!(await exists(p))) {
      angles.push({ file: a.file, exists: false, deep: false, reasons: ["missing"] });
      continue;
    }
    const r = await readText(p);
    if (!r.ok) {
      angles.push({ file: a.file, exists: true, deep: false, reasons: ["unreadable"] });
      continue;
    }
    const depth = scoreDepth(parseContextFile(a.file, r.data));
    angles.push({
      file: a.file,
      exists: true,
      deep: depth.deep,
      reasons: depth.deep ? [] : depth.reasons,
    });
  }

  const answeredAngles = angles.filter((a) => a.deep).length;
  const coverage = declaredAngles === 0 ? 0 : answeredAngles / declaredAngles;
  const depthTargetMet = declaredAngles >= depthTarget;

  const reasons: string[] = [];
  if (!depthTargetMet) {
    reasons.push(
      `only ${declaredAngles} angle(s) declared (need ≥ ${depthTarget} for this domain)`,
    );
  }
  if (answeredAngles < declaredAngles) {
    reasons.push(`${declaredAngles - answeredAngles} angle(s) unanswered (missing or shallow)`);
  }

  return ok({
    skill,
    domain: manifest.domain,
    declaredAngles,
    answeredAngles,
    coverage,
    depthTarget,
    depthTargetMet,
    covered: reasons.length === 0,
    angles,
    reasons,
  });
}
