import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { skillDir } from "./paths.js";
import { exists, readText } from "./fs.js";
import { readYaml } from "./yamlio.js";
import type { Lane, SpecYaml } from "./types.js";

/**
 * The EARNED evidence lane, recomputed purely from disk contents.
 *
 * V1 (earned-lane over asserted-score) + V4 (deterministic, re-runnable):
 * this function is a pure function of the files on disk — no Date.now() in the
 * verdict, inputs sorted, identical output across restarts. The spec.yaml
 * `lane.state` field is a CACHE only; the contract files (eval-report.json,
 * CHANGELOG.jsonl, spec.version) are the TRUTH. Never trust the cache for a
 * decision — recompute.
 */
export interface LaneVerdict {
  lane: Lane;
  /**
   * READ-time overlay (W2, W-V2): the lane a consumer should ACT on.
   * "blocked" when the skill is not reachable from ~/.claude/skills (route rot) — the
   * earned `lane` field is preserved (truth is never destroyed; the skill is only gated
   * from being COUNTED until reachable). Reachability is a PURE passed input — this verdict
   * never reads the clock (INV-7); the decay overlay (W3) layers its own effectiveLane, as-of a time.
   */
  effectiveLane: Lane | "blocked";
  /** whether the skill is invokable (both managed symlinks resolve) — a passed input */
  reachable: boolean;
  /** why this lane — deterministic order, safe to diff across runs */
  reasons: string[];
  /** spec.yaml lane.state !== recomputed lane */
  cacheDrift: boolean;
  /** what the verdict was computed from (for auditability) */
  inputs: {
    specVersion: string;
    hasEvalReport: boolean;
    evalFresh: boolean;
    evalPasses: boolean;
    qualifyingEvolution: boolean;
  };
}

// Loose shapes for the contract files — validated structurally, never trusted blindly.
interface EvalReportShape {
  skill_version?: unknown;
  pass_threshold?: unknown;
  behavioral_score?: unknown;
  per_task?: unknown;
  // W4: optional replay quorum stamp. Absent ⇒ unchanged (back-compat). stable:false blocks
  // promotion — a behaviorally UNSTABLE eval is not proof, however high a single run scored.
  replay?: { stable?: unknown };
}

interface ChangelogEntryShape {
  ts?: unknown;
  learnings_consumed?: unknown;
  delta?: unknown;
}

export async function recomputeLane(
  category: string,
  name: string,
  opts?: { reachable?: boolean },
): Promise<Result<LaneVerdict>> {
  const dir = skillDir(category, name);
  if (!dir.ok) return fail("BAD_INPUT", dir.error.message);

  // 1. authored floor — spec.yaml (version = freshness truth) + SKILL.md must exist.
  const specPath = nodePath.join(dir.path, "spec.yaml");
  const skillMdPath = nodePath.join(dir.path, "SKILL.md");
  if (!(await exists(specPath)))
    return fail("NOT_FOUND", `no spec.yaml in ${dir.path}`);
  if (!(await exists(skillMdPath)))
    return fail(
      "NOT_FOUND",
      `no SKILL.md in ${dir.path}`,
      "an authored skill needs both spec.yaml and SKILL.md",
    );

  const specR = await readYaml<SpecYaml>(specPath);
  if (!specR.ok) return fail(specR.error.code, specR.error.message);
  // An empty/half-written spec.yaml parses to null — never crash the recompute
  // (the lane is recomputed over MANY skills by doctor; one bad spec must degrade
  // to a Result, not throw). INV-2.
  if (specR.data === null || typeof specR.data !== "object")
    return fail("BAD_INPUT", `spec.yaml is empty or not a mapping in ${dir.path}`);
  const spec = specR.data;
  const specVersion = spec.version ?? "0.0.0";
  const cached = spec.lane?.state;

  const reasons: string[] = [];
  let lane: Lane = "authored";
  reasons.push("spec.yaml + SKILL.md present → authored");

  // 2. eval_proven? — a fresh eval-report passing the threshold over ≥3 tasks.
  const evalPath = nodePath.join(dir.path, "eval-report.json");
  let hasEvalReport = false;
  let evalFresh = false;
  let evalPasses = false;
  if (await exists(evalPath)) {
    const evalTextR = await readText(evalPath);
    if (!evalTextR.ok) {
      reasons.push(
        `eval-report.json unreadable (${evalTextR.error.code}) → stays authored`,
      );
    } else {
      let rep: EvalReportShape | null = null;
      try {
        rep = JSON.parse(evalTextR.data) as EvalReportShape;
      } catch {
        rep = null;
      }
      if (rep === null) {
        reasons.push("eval-report.json is not valid JSON → stays authored");
      } else {
        hasEvalReport = true;
        const threshold =
          typeof rep.pass_threshold === "number" ? rep.pass_threshold : 0.8;
        const evalScore =
          typeof rep.behavioral_score === "number" ? rep.behavioral_score : 0;
        const perTask = rep.per_task;
        evalFresh = rep.skill_version === specVersion;
        evalPasses =
          evalScore >= threshold &&
          Array.isArray(perTask) &&
          perTask.length >= 3;
        // W4: a replay stamp of stable:false is a hard veto — an unstable eval is not proof.
        const replayUnstable =
          rep.replay != null &&
          typeof rep.replay === "object" &&
          rep.replay.stable === false;
        if (!evalFresh)
          reasons.push(
            `eval-report stale (report v${String(rep.skill_version)} ≠ spec v${specVersion}) → stays authored`,
          );
        else if (!evalPasses)
          reasons.push(
            `eval below threshold or <3 tasks (score ${evalScore}) → stays authored`,
          );
        else if (replayUnstable)
          reasons.push(
            "eval marked unstable across replay (replay.stable=false) → stays authored",
          );
        else {
          lane = "eval_proven";
          reasons.push(
            `eval ${evalScore} ≥ threshold on ≥3 tasks, version match → eval_proven`,
          );
        }
      }
    }
  } else {
    reasons.push("no eval-report.json → cannot exceed authored");
  }

  // 3. evolution_proven? — requires eval_proven AND a measured ≥0.05 improvement
  //    that consumed ≥3 learnings (recorded in CHANGELOG.jsonl).
  let qualifyingEvolution = false;
  if (lane === "eval_proven") {
    const chPath = nodePath.join(dir.path, "CHANGELOG.jsonl");
    if (await exists(chPath)) {
      const chTextR = await readText(chPath);
      if (!chTextR.ok) {
        reasons.push(
          `CHANGELOG.jsonl unreadable (${chTextR.error.code}) → cannot exceed eval_proven`,
        );
      } else {
        const entries: ChangelogEntryShape[] = [];
        for (const line of chTextR.data.split("\n")) {
          if (!line.trim()) continue;
          try {
            entries.push(JSON.parse(line) as ChangelogEntryShape);
          } catch {
            // skip a malformed row — a bad line never counts as proof
          }
        }
        // deterministic: sort by ts before evaluating
        entries.sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
        qualifyingEvolution = entries.some(
          (e) =>
            Array.isArray(e.learnings_consumed) &&
            e.learnings_consumed.length >= 3 &&
            typeof e.delta === "number" &&
            e.delta >= 0.05,
        );
        if (qualifyingEvolution) {
          lane = "evolution_proven";
          reasons.push(
            "CHANGELOG has a ≥3-learning evolve with Δ≥0.05 → evolution_proven",
          );
        } else {
          reasons.push(
            "CHANGELOG present but no qualifying evolve (need ≥3 learnings & Δ≥0.05)",
          );
        }
      }
    } else {
      reasons.push("no CHANGELOG.jsonl → cannot exceed eval_proven");
    }
  }

  // READ-time reachability overlay (W2). reachable is a PURE passed input (default true for
  // callers that don't track link state); when false the consumer-facing effectiveLane is
  // "blocked" but the EARNED lane above is left intact. This verdict never reads the clock — INV-7.
  const reachable = opts?.reachable ?? true;
  const effectiveLane: Lane | "blocked" = reachable ? lane : "blocked";
  if (!reachable)
    reasons.push(
      "UNREACHABLE (managed symlink missing/conflict) → effectiveLane blocked (earned lane preserved)",
    );

  return ok({
    lane,
    effectiveLane,
    reachable,
    reasons,
    cacheDrift: cached !== undefined && cached !== lane,
    inputs: {
      specVersion,
      hasEvalReport,
      evalFresh,
      evalPasses,
      qualifyingEvolution,
    },
  });
}
