import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { skillDir } from "./paths.js";
import { exists, readText } from "./fs.js";
import { readYaml } from "./yamlio.js";
import { JUDGE_FRAGMENT } from "./prompts/judge.fragment.js";

// ── evals.yaml shape (author input; validated structurally, never trusted blindly) ──
export interface GoldenTask {
  id: string;
  prompt: string;
  must?: string[];
  must_not?: string[];
}

export interface EvalsYaml {
  pass_threshold?: number;
  golden_tasks?: GoldenTask[];
}

export interface EvalPromptResult {
  /** the full prompt for Claude to execute (baseline-vs-loaded per task) */
  prompt: string;
  /** where the produced eval-report.json must be written */
  reportPath: string;
  /** the task ids this prompt will judge (after optional taskIds filter) */
  taskIds: string[];
  /** the pass threshold the lane will require (default 0.8) */
  passThreshold: number;
}

export interface BuildEvalInput {
  category: string;
  name: string;
  /** optional subset of golden-task ids to run (for partial re-evals) */
  taskIds?: string[];
}

const DEFAULT_THRESHOLD = 0.8;

/**
 * Build the LOCAL eval prompt for a skill (V2: the loop ships before authoring polish;
 * V3: local-first proof — prompt-template + bash gate + Claude-as-engine, no model API).
 *
 * Returns a prompt string the caller (Claude) executes in-session to produce
 * `eval-report.json`. The deterministic judge of the REPORT is `runtime/lane-gate.sh`;
 * Claude is the engine of the RUN. This function never calls a model.
 */
export async function buildEvalPrompt(
  input: BuildEvalInput,
): Promise<Result<EvalPromptResult>> {
  const { category, name } = input;

  const dirR = skillDir(category, name);
  if (!dirR.ok) return fail("BAD_INPUT", dirR.error.message);
  const dir = dirR.path;

  const skillMdPath = nodePath.join(dir, "SKILL.md");
  if (!(await exists(skillMdPath)))
    return fail(
      "NOT_FOUND",
      `no SKILL.md in ${dir}`,
      "a skill must be authored before it can be evaluated",
    );

  const evalsPath = nodePath.join(dir, "evals.yaml");
  if (!(await exists(evalsPath)))
    return fail(
      "NOT_FOUND",
      `no evals.yaml in ${dir}`,
      "seed evals.yaml from the SkillCard or hand-write 3 golden tasks (id, prompt, must[], must_not[])",
    );

  const evalsR = await readYaml<EvalsYaml>(evalsPath);
  if (!evalsR.ok) return fail(evalsR.error.code, evalsR.error.message);
  const evals = evalsR.data;

  const allTasks = Array.isArray(evals.golden_tasks) ? evals.golden_tasks : [];
  if (allTasks.length === 0)
    return fail(
      "BAD_INPUT",
      `evals.yaml in ${dir} has no golden_tasks`,
      "add at least 3 golden tasks, each with an id, prompt, and observable must/must_not strings",
    );

  // optional taskIds filter (partial re-eval) — fail loudly on an unknown id
  let selected = allTasks;
  if (input.taskIds && input.taskIds.length > 0) {
    const known = new Set(allTasks.map((t) => t.id));
    const unknown = input.taskIds.filter((id) => !known.has(id));
    if (unknown.length > 0)
      return fail(
        "BAD_INPUT",
        `unknown task id(s): ${unknown.join(", ")}`,
        `known ids: ${[...known].join(", ")}`,
      );
    const want = new Set(input.taskIds);
    selected = allTasks.filter((t) => want.has(t.id));
  }

  const passThreshold =
    typeof evals.pass_threshold === "number"
      ? evals.pass_threshold
      : DEFAULT_THRESHOLD;

  const skillMdR = await readText(skillMdPath);
  if (!skillMdR.ok) return fail(skillMdR.error.code, skillMdR.error.message);

  const reportPath = nodePath.join(dir, "eval-report.json");
  const taskIds = selected.map((t) => t.id);

  const renderedTasks = selected
    .map((t, i) => {
      const must = (t.must ?? []).map((m) => `    - ${m}`).join("\n") || "    (none)";
      const mustNot =
        (t.must_not ?? []).map((m) => `    - ${m}`).join("\n") || "    (none)";
      return `### Task ${i + 1} — id: \`${t.id}\`
PROMPT:
> ${t.prompt}
must (every one MUST appear in skill-loaded output):
${must}
must_not (none may appear):
${mustNot}`;
    })
    .join("\n\n");

  const prompt = `# tfc_eval — behavioral evaluation of ${category}/${name}

You will produce \`eval-report.json\` by measuring whether loading this skill changes
observable output versus a no-skill baseline. Pass threshold: **${passThreshold}** over
**${selected.length}** golden task(s) (≥3 required to reach the \`eval_proven\` lane).

## THE SKILL UNDER TEST (treat this as the skill-loaded context)

\`\`\`markdown
${skillMdR.data}
\`\`\`

---

${JUDGE_FRAGMENT}

---

## GOLDEN TASKS

${renderedTasks}

---

## OUTPUT CONTRACT

Run each task baseline-vs-loaded, judge by the observable strings, then write EXACTLY this
JSON to \`${reportPath}\` (no prose around it):

\`\`\`json
{
  "skill_version": "<the version: field from this skill's spec.yaml>",
  "ts": "<current UTC time, ISO-8601>",
  "pass_threshold": ${passThreshold},
  "behavioral_score": <passed_tasks / ${selected.length}, a float 0..1>,
  "per_task": [
${selected
  .map(
    (t) =>
      `    { "id": "${t.id}", "pass": <true|false>, "delta_note": "<observable baseline-vs-loaded difference>" }`,
  )
  .join(",\n")}
  ]
}
\`\`\`

Then validate it deterministically:
\`\`\`bash
bash runtime/lane-gate.sh ${reportPath}
\`\`\`
A non-zero exit means the report is malformed or below threshold — fix the run, never the gate.`;

  return ok({ prompt, reportPath, taskIds, passThreshold });
}
