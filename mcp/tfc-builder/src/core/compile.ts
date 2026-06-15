import { fail, ok, type Result } from "./result.js";
import { SKILLCARD_FRAGMENT } from "./prompts/skillcard.fragment.js";
import { VOICEFIX_FRAGMENT } from "./prompts/voicefix.fragment.js";
import type { Archetype } from "./types.js";

/**
 * Wave 6 (V1) — the intent front door. Turns a one-line job into a prompt that makes
 * Claude search-before-building, infer the archetype, and emit a SkillCard that is
 * BORN loop-ready: it carries `lane: authored` + 3 eval seeds, so the very first
 * artifact already sits on the earned-evidence ladder. No skill is born score-only.
 *
 * This is a prompt builder (INV-1): it returns a string, never calls a model and
 * never writes a file. Claude fills the SkillCard; tfc_new/tfc_eval do the writes.
 */

const MIN_INTENT_WORDS = 5;
const OUTPUT_DELIMITER = "---START-SKILLCARD---";

export interface CompilePromptResult {
  prompt: string;
  /** the archetype the front door guessed from the intent verbs (Claude may override) */
  archetypeHint: Archetype;
  /** the delimiter Claude must wrap the SkillCard in */
  outputDelimiter: string;
}

export interface BuildCompileInput {
  intent: string;
  context?: string;
}

/** Cheap verb-based guess; the SkillCard tells Claude to override if wrong. */
export function inferArchetype(intent: string): Archetype {
  const t = intent.toLowerCase();
  if (/\b(look ?up|cheat ?sheet|reference|table|catalog|syntax|which tool|list of)\b/.test(t))
    return "reference";
  if (/\b(step|phase|pipeline|workflow|process|orchestrat|sequence|deploy|ship|migrate|then)\b/.test(t))
    return "workflow";
  if (/\b(review|audit|expert|architect|analyze|critique|strategy|decide|design)\b/.test(t))
    return "domain-expert";
  // ambiguous intent → hybrid; the author narrows it in the card
  return "hybrid";
}

export function buildCompilePrompt(
  input: BuildCompileInput,
): Result<CompilePromptResult> {
  const intent = input.intent.trim();
  const words = intent.split(/\s+/).filter(Boolean);
  if (words.length < MIN_INTENT_WORDS)
    return fail(
      "BAD_INPUT",
      `intent is only ${words.length} word(s); need at least ${MIN_INTENT_WORDS}`,
      "describe the job, not the feature",
    );

  const archetypeHint = inferArchetype(intent);
  const context = input.context?.trim();

  const prompt = `# tfc_compile — intent → born-loop-ready SkillCard

## INTENT
${intent}
${context ? `\n## CONTEXT\n${context}\n` : ""}
## ARCHETYPE HINT
Inferred from the verbs: **${archetypeHint}**. Override it in the card if the job is really another shape.
(domain-expert = BE someone · workflow = DO a process · reference = look something up · hybrid = both.)

---

## STEP 1 — SEARCH BEFORE BUILDING (do this first, do not skip)
The Forge competes on skill BIRTH RATE, not skill count — never birth a duplicate.
1. \`tfc_list\` — what TFC skills already exist?
2. \`ls ~/.claude/skills\` — what is installed natively?
3. \`spawner_skills(action="search", query="<2-3 keywords from the intent>")\` — the 463-skill index.
Fill \`covers_existing\` from real hits and set \`overlap_verdict\`:
- **new** — nothing covers this job → build it.
- **extend** — a skill is close → name it; the card describes the delta only.
- **upgrade-existing** — a skill IS this, just weak → stop; run \`tfc_eval\`/\`tfc_evolve\` on it instead.

## STEP 2 — DRAFT THE CARD
Infer category + name, write a routing-layer description + 4-8 situation triggers, set the
layer_plan target counts, and write the routing block (owns / does_not_own).

## STEP 3 — SEED THE LIVING LOOP (this is what "born loop-ready" means)
Write 3 eval seeds with OBSERVABLE must/must_not strings — the evals.yaml stub. Without
them the skill can never leave \`authored\`. Score what APPEARS in output, never "looks good".
The card is also born into the LIVING lane (v3): it carries a \`freshness_horizon\` (proof is
good-NOW, decays when stale — W3), and \`tfc_install\` auto-injects the runtime capture hook so
real invocations feed \`learnings.jsonl\` (W1). A new skill enters the loop with zero manual steps.

## STEP 4 — ASK AT MOST 3 QUESTIONS
Only if a field is genuinely blocking (you cannot guess category/name/scope). Otherwise emit now.

---

${VOICEFIX_FRAGMENT}

---

${SKILLCARD_FRAGMENT}`;

  return ok({ prompt, archetypeHint, outputDelimiter: OUTPUT_DELIMITER });
}
