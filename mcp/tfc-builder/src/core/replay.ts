// Wave 4 (v3, W-V5): N-sample eval stability quorum.
//
// The eval GATE (runtime/lane-gate.sh) is deterministic, but the eval RUN is Claude-driven and
// therefore non-deterministic. One lucky run could mint a lane; one unlucky run could revoke it.
// This builds a prompt that runs the SAME behavioral eval `samples` times, then aggregates the
// variance (runtime/replay-aggregate.sh) so promotion requires a STABLE score, not a high single
// run. Eval-theater note: replay guards VARIANCE; the eval itself still scores only observable
// must/must_not strings — it does not guard "vibes". No model API (INV-1): Claude is the engine.

import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { skillDir } from "./paths.js";
import { buildEvalPrompt } from "./evaluate.js";

export interface ReplayPromptResult {
  /** the full prompt for Claude to execute the eval `samples` times */
  prompt: string;
  /** glob the aggregate reduces (numbered sample reports — never eval-report.json) */
  reportGlob: string;
  /** the bash command that reduces the samples to {mean,stdev,min,stable} */
  aggregateCmd: string;
  samples: number;
  passThreshold: number;
}

export async function buildReplayPrompt(input: {
  category: string;
  name: string;
  samples: number;
}): Promise<Result<ReplayPromptResult>> {
  const { category, name, samples } = input;
  if (!Number.isInteger(samples) || samples < 2)
    return fail(
      "BAD_INPUT",
      "samples must be an integer ≥ 2 (a quorum needs ≥2 samples; 3+ recommended)",
    );

  const dirR = skillDir(category, name);
  if (!dirR.ok) return fail("BAD_INPUT", dirR.error.message);
  const dir = dirR.path;

  // Reuse the single-run eval prompt (propagates NOT_FOUND for missing SKILL.md / evals.yaml).
  const evalR = await buildEvalPrompt({ category, name });
  if (!evalR.ok) return fail(evalR.error.code, evalR.error.message);
  const { prompt: evalPrompt, passThreshold } = evalR.data;

  const reportGlob = nodePath.join(dir, "eval-report.*.json");
  const evalReportPath = nodePath.join(dir, "eval-report.json");
  const aggregateCmd = `bash runtime/replay-aggregate.sh ${reportGlob}`;

  const prompt = `# tfc_replay — ${samples}-sample stability quorum for ${category}/${name}

A single eval run is non-deterministic. Run the SAME behavioral eval **${samples} times**
independently, then aggregate the variance. Promotion should require a STABLE score across
samples (stdev ≤ 0.05 AND min ≥ ${passThreshold}) — not a high score in one lucky run.

## PROCEDURE
1. For sample i = 1..${samples}, execute the eval below as an INDEPENDENT run — re-judge every
   task fresh; do NOT copy a previous sample's verdicts. Write that sample's report JSON to
   \`${dir}/eval-report.\${i}.json\` (numbered — NOT eval-report.json).
2. After all ${samples} reports exist, aggregate the variance:
   \`\`\`bash
   ${aggregateCmd}
   \`\`\`
3. If the aggregate reports \`"stable": true\`: promote the representative run to
   \`${evalReportPath}\`, add \`"replay": { "samples": ${samples}, "stable": true }\` to it, then
   DELETE the numbered eval-report.*.json samples (they are not contract files — INV-6 forbids
   stray per-skill state). If \`"stable": false\`: do NOT promote — the eval is unstable across
   runs; tighten the skill or the golden tasks and retry. A skill whose eval-report carries
   \`replay.stable: false\` will NOT recompute to eval_proven (the lane refuses an unstable proof).

---

## THE EVAL TO RUN ${samples}× (write each run to a NUMBERED report path per step 1 above)

${evalPrompt}`;

  return ok({ prompt, reportGlob, aggregateCmd, samples, passThreshold });
}
