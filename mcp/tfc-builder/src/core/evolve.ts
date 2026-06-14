import * as nodePath from "node:path";
import { createHash } from "node:crypto";
import { fail, ok, type Result } from "./result.js";
import { skillDir } from "./paths.js";
import { exists, readText } from "./fs.js";
import { readYaml } from "./yamlio.js";
import type { SpecYaml } from "./types.js";

// Wave 4 (V2,V4): close the loop. Consume >=3 learnings, regen the weakest sections,
// bump the version, append a CHANGELOG row, re-eval — and reach `evolution_proven` ONLY
// if the new eval beats the old by >=0.05. A non-improving evolve is allowed (honest
// no-improvement CHANGELOG row; lane stays eval_proven). This is a prompt builder:
// Claude is the engine of the regen+re-eval; this function never mutates or calls a model.

const MIN_UNCONSUMED = 3;
const MIN_DELTA = 0.05;

export interface EvolvePromptResult {
  prompt: string;
  /** short hashes of the unconsumed learnings this evolve will fold in + mark consumed */
  learningsConsumed: string[];
  /** the eval task ids that failed at pre-state (regen should target their sections) */
  failingTaskIds: string[];
  fromVersion: string;
  toVersion: string;
  preEvalScore: number;
  reportPath: string;
  changelogPath: string;
  learningsPath: string;
}

export interface BuildEvolveInput {
  category: string;
  name: string;
  /** override the >=3-unconsumed-learnings guard (INV: evolve needs real input) */
  force?: boolean;
  /** plan-only: the prompt instructs Claude to show the regen without writing (INV-3) */
  dryRun?: boolean;
}

interface LearningShape {
  type?: unknown;
  note?: unknown;
  consumed_in?: unknown;
}

interface EvalReportShape {
  behavioral_score?: unknown;
  per_task?: unknown;
}

/** evolve bumps the MINOR version (§4.2 example: 1.0.0 -> 1.1.0). */
export function bumpMinor(version: string): string {
  const parts = version.split(".");
  const major = Number(parts[0] ?? 0);
  const minor = Number(parts[1] ?? 0);
  if (Number.isNaN(major) || Number.isNaN(minor)) return "0.1.0";
  return `${major}.${minor + 1}.0`;
}

/** stable short hash of a learnings.jsonl line — the CHANGELOG `learnings_consumed` id. */
export function lineHash(line: string): string {
  return createHash("sha256").update(line.trim()).digest("hex").slice(0, 12);
}

export async function buildEvolvePrompt(
  input: BuildEvolveInput,
): Promise<Result<EvolvePromptResult>> {
  const { category, name } = input;
  const force = input.force ?? false;
  const dryRun = input.dryRun ?? false;

  const dirR = skillDir(category, name);
  if (!dirR.ok) return fail("BAD_INPUT", dirR.error.message);
  const dir = dirR.path;

  // 1. eval_proven precondition — there must be an eval-report to beat.
  const reportPath = nodePath.join(dir, "eval-report.json");
  if (!(await exists(reportPath)))
    return fail(
      "NOT_READY",
      `no eval-report.json in ${dir}`,
      "a skill must reach eval_proven (tfc_eval) before it can evolve",
    );
  const repR = await readText(reportPath);
  if (!repR.ok) return fail(repR.error.code, repR.error.message);
  let preEvalScore = 0;
  const failingTaskIds: string[] = [];
  try {
    const rep = JSON.parse(repR.data) as EvalReportShape;
    preEvalScore = typeof rep.behavioral_score === "number" ? rep.behavioral_score : 0;
    if (Array.isArray(rep.per_task)) {
      for (const t of rep.per_task as Array<{ id?: unknown; pass?: unknown }>) {
        if (t && t.pass === false && typeof t.id === "string") failingTaskIds.push(t.id);
      }
    }
  } catch {
    return fail("BAD_INPUT", `eval-report.json is not valid JSON in ${dir}`);
  }

  // 2. >=3 unconsumed learnings (the real input to fold in) unless forced.
  const learningsPath = nodePath.join(dir, "learnings.jsonl");
  const unconsumed: { hash: string; type: string; note: string }[] = [];
  if (await exists(learningsPath)) {
    const lr = await readText(learningsPath);
    if (!lr.ok) return fail(lr.error.code, lr.error.message);
    for (const line of lr.data.split("\n")) {
      if (!line.trim()) continue;
      let parsed: LearningShape | null = null;
      try {
        parsed = JSON.parse(line) as LearningShape;
      } catch {
        continue; // a malformed line is never counted as input
      }
      if (parsed && parsed.consumed_in == null) {
        unconsumed.push({
          hash: lineHash(line),
          type: typeof parsed.type === "string" ? parsed.type : "operational",
          note: typeof parsed.note === "string" ? parsed.note : "",
        });
      }
    }
  }
  if (unconsumed.length < MIN_UNCONSUMED && !force)
    return fail(
      "NOT_READY",
      `only ${unconsumed.length} unconsumed learning(s); evolve needs >=${MIN_UNCONSUMED}`,
      "run the skill more and log genuine learnings via tfc_learn, or pass force:true",
    );

  // 3. version bump + section discovery.
  const specPath = nodePath.join(dir, "spec.yaml");
  const specR = await readYaml<SpecYaml>(specPath);
  if (!specR.ok) return fail(specR.error.code, specR.error.message);
  const fromVersion = specR.data.version ?? "0.0.0";
  const toVersion = bumpMinor(fromVersion);

  const skillMdPath = nodePath.join(dir, "SKILL.md");
  const mdR = await readText(skillMdPath);
  if (!mdR.ok) return fail(mdR.error.code, mdR.error.message);
  const sections = (mdR.data.match(/^## .+$/gm) ?? []).map((h) => h.slice(3).trim());

  const changelogPath = nodePath.join(dir, "CHANGELOG.jsonl");
  const learningsConsumed = unconsumed.map((u) => u.hash);

  const renderedLearnings = unconsumed
    .map((u) => `  - [${u.type}] (${u.hash}) ${u.note}`)
    .join("\n");
  const renderedFails =
    failingTaskIds.length > 0
      ? failingTaskIds.map((id) => `  - ${id}`).join("\n")
      : "  (none — pre-eval passed every task; improve breadth, not just fixes)";

  const prompt = `# tfc_evolve — close the loop for ${category}/${name}  (${fromVersion} -> ${toVersion})

${dryRun ? "**DRY RUN — plan the regen and show it; do NOT write any file.**\n" : ""}You will fold real run-learnings back into this skill and PROVE the result is better by
re-measurement. evolution_proven is earned ONLY if the new eval beats the old by >=${MIN_DELTA}.
A non-improving evolve is allowed: write the honest CHANGELOG row and leave the lane at eval_proven.

## PRE-STATE (measured, from disk)
- pre_eval_score: **${preEvalScore}**  (the number to beat by >=${MIN_DELTA})
- failing tasks to target:
${renderedFails}

## UNCONSUMED LEARNINGS TO FOLD IN (${unconsumed.length})
${renderedLearnings}

## SKILL SECTIONS (## headers) — regen only the weakest, not the whole file
${sections.map((s) => `  - ${s}`).join("\n")}

---

## STEPS (do them in order)
1. **Cluster** the learnings + failing tasks → name the 1–2 sections that, rewritten, would
   fix them. Edit ONLY those sections in \`${skillMdPath}\`. Keep voice + structure.
2. **Bump version** to \`${toVersion}\` in \`${specPath}\` (version:) and the SKILL.md frontmatter.
3. **Re-eval**: run \`tfc_eval ${category} ${name}\`, execute the returned prompt, overwrite
   \`${reportPath}\` (its skill_version MUST now read \`${toVersion}\`), and validate with
   \`bash runtime/lane-gate.sh ${reportPath}\`. Call the new behavioral_score **post_eval_score**.
4. **Append** one line to \`${changelogPath}\` (append-only):
\`\`\`json
{"ts":"<UTC ISO-8601>","from_version":"${fromVersion}","to_version":"${toVersion}","learnings_consumed":${JSON.stringify(learningsConsumed)},"pre_eval_score":${preEvalScore},"post_eval_score":<measured>,"delta":<post-pre, real>,"sections_touched":["<section>"]}
\`\`\`
   Use the REAL post score. Never write a delta you did not measure (DELETE #10).
5. **Mark consumed**: in \`${learningsPath}\`, set \`"consumed_in":"${toVersion}"\` on exactly the
   ${unconsumed.length} lines whose hashes are ${JSON.stringify(learningsConsumed)} (match by hashing each line).
6. **Mind outcome signal (INV-6, no new store)** — record the result, do not build a history DB:
\`\`\`
mind_remember(user_id="550e8400-e29b-41d4-a716-446655440000", content="evolved ${category}/${name} ${fromVersion}->${toVersion}, eval delta <real>", content_type="event", temporal_level=2, salience=0.8)
\`\`\`

## OUTCOME
- If post_eval_score − ${preEvalScore} >= ${MIN_DELTA}: lane recomputes to **evolution_proven**. Verify:
  \`node dist/cli.js lane ${category} ${name}\` → \`"lane": "evolution_proven"\`.
- Else: keep the honest CHANGELOG row (delta < ${MIN_DELTA}); lane stays eval_proven. Do not inflate.`;

  return ok({
    prompt,
    learningsConsumed,
    failingTaskIds,
    fromVersion,
    toVersion,
    preEvalScore,
    reportPath,
    changelogPath,
    learningsPath,
  });
}
