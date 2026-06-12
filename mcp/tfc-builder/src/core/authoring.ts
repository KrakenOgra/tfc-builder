import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { exists, readText } from "./fs.js";
import { skillDir } from "./paths.js";
import { VOICE_FRAGMENT } from "./prompts/voice.fragment.js";
import { IDENTITY_FRAGMENT } from "./prompts/identity.fragment.js";
import { PRINCIPLES_FRAGMENT } from "./prompts/principles.fragment.js";
import { PATTERNS_FRAGMENT } from "./prompts/patterns.fragment.js";
import { ANTIPATTERNS_FRAGMENT } from "./prompts/antipatterns.fragment.js";
import { QUICK_WINS_FRAGMENT } from "./prompts/quick-wins.fragment.js";
import { HANDOFFS_FRAGMENT } from "./prompts/handoffs.fragment.js";
import { STACK_FRAGMENT } from "./prompts/stack.fragment.js";

export interface AuthoringResult {
  prompt: string;
  writeTargets: { file: string; section: string }[];
}

export interface BrainstormInput {
  name: string;
  category: string;
  intent: string;
}

export interface GenerateInput {
  category: string;
  name: string;
  layers: string[];
}

const LAYER_MAP = new Map<string, { fragment: string; section: string }>([
  ["patterns", { fragment: PATTERNS_FRAGMENT, section: "## Patterns" }],
  ["anti-patterns", { fragment: ANTIPATTERNS_FRAGMENT, section: "## Anti-Patterns" }],
  ["quick-wins", { fragment: QUICK_WINS_FRAGMENT, section: "## Quick Wins" }],
  ["handoffs", { fragment: HANDOFFS_FRAGMENT, section: "## Handoffs" }],
  ["stack", { fragment: STACK_FRAGMENT, section: "## Stack Reference" }],
]);

async function readSkillContext(
  category: string,
  name: string,
): Promise<
  Result<{
    specText: string;
    skillMdText: string;
    specPath: string;
    skillMdPath: string;
  }>
> {
  const dirR = skillDir(category, name);
  if (!dirR.ok) return fail("BAD_INPUT", dirR.error.message);
  const dir = dirR.path;

  if (!(await exists(dir))) {
    return fail(
      "NOT_FOUND",
      `Skill not found: ${category}/${name}`,
      "run tfc_new first",
    );
  }

  const specPath = nodePath.join(dir, "spec.yaml");
  const skillMdPath = nodePath.join(dir, "SKILL.md");

  const specR = await readText(specPath);
  if (!specR.ok) return specR;

  const mdR = await readText(skillMdPath);
  if (!mdR.ok) return mdR;

  return ok({
    specText: specR.data,
    skillMdText: mdR.data,
    specPath,
    skillMdPath,
  });
}

export async function buildBrainstormPrompt(
  input: BrainstormInput,
): Promise<Result<AuthoringResult>> {
  const { name, category, intent } = input;

  const ctxR = await readSkillContext(category, name);
  if (!ctxR.ok) return ctxR;
  const { specText, skillMdText, specPath, skillMdPath } = ctxR.data;

  const prompt = `# tfc_brainstorm — Identity + Principles Assignment

## INTENT
${intent}

## CURRENT SKILL CONTEXT
Skill: ${category}/${name}

### Current spec.yaml
\`\`\`yaml
${specText}
\`\`\`

### Current SKILL.md
\`\`\`markdown
${skillMdText}
\`\`\`

---

## YOUR ASSIGNMENT

Using the intent above and the current skill context, produce the following for \`${category}/${name}\`:

### 1. spec.yaml fields to update

**description:** One concise line — what this skill does, for whom, in what situation.
Must describe a specific capability, not a category.

**triggers:** 4–8 situation phrases. Each trigger MUST:
- Be at least 4 words long
- Describe a specific situation a builder would be in when they need this skill
- NOT be generic ("I need help", "help with prompts")
- Start with a verb or noun (not "I" — these are search phrases, not sentences)

Example trigger shape (adapt to this skill's domain):
- "write a chain of thought prompt for classification"
- "few-shot examples inconsistent between runs"
- "structure a system prompt for role consistency across sessions"

### 2. SKILL.md sections to write

${IDENTITY_FRAGMENT}

---

${PRINCIPLES_FRAGMENT}

---

${VOICE_FRAGMENT}

---

## OUTPUT CONTRACT

Write your output using EXACTLY these delimiters. Do not add prose outside them.

---START-SPEC-YAML-UPDATES---
description: [your one-line description]
triggers:
  - "[trigger 1 — at least 4 words, situation phrase]"
  - "[trigger 2]"
  - "[trigger 3]"
  - "[trigger 4]"
---END-SPEC-YAML-UPDATES---

---START-IDENTITY---
[Full ## Identity section body — starting with "You are..." on the first line]
---END-IDENTITY---

---START-PRINCIPLES---
[Full ## Principles section body — starting with the numbered list]
---END-PRINCIPLES---

Files to edit after producing the above:
- ${specPath} — update fields: description, triggers
- ${skillMdPath} — update sections: ## Identity, ## Principles

Do NOT modify any other fields in spec.yaml.
Do NOT modify any other sections in SKILL.md.`;

  return ok({
    prompt,
    writeTargets: [
      { file: specPath, section: "description + triggers" },
      { file: skillMdPath, section: "## Identity" },
      { file: skillMdPath, section: "## Principles" },
    ],
  });
}

export async function buildGeneratePrompt(
  input: GenerateInput,
): Promise<Result<AuthoringResult>> {
  const { category, name, layers } = input;

  const invalidLayers = layers.filter((l) => !LAYER_MAP.has(l));
  if (invalidLayers.length > 0) {
    return fail(
      "BAD_INPUT",
      `Unknown layers: ${invalidLayers.join(", ")}`,
      `Valid layers: ${Array.from(LAYER_MAP.keys()).join(", ")}`,
    );
  }

  const ctxR = await readSkillContext(category, name);
  if (!ctxR.ok) return ctxR;
  const { specText, skillMdText, skillMdPath } = ctxR.data;

  const selectedFragments = layers
    .map((l) => LAYER_MAP.get(l)?.fragment ?? "")
    .filter((f) => f.length > 0)
    .join("\n\n---\n\n");

  const sectionList = layers
    .map((l) => LAYER_MAP.get(l)?.section ?? l)
    .join(", ");

  const writeTargets = layers.map((l) => ({
    file: skillMdPath,
    section: LAYER_MAP.get(l)?.section ?? l,
  }));

  const prompt = `# tfc_generate — Intelligence Layer Assignment

## SKILL
${category}/${name}

## SECTIONS TO GENERATE
${sectionList}

## CURRENT SKILL CONTEXT

### Current spec.yaml
\`\`\`yaml
${specText}
\`\`\`

### Current SKILL.md
\`\`\`markdown
${skillMdText}
\`\`\`

---

## WRITING GUIDES

${selectedFragments}

---

${VOICE_FRAGMENT}

---

## OUTPUT CONTRACT

Generate ONLY the sections listed: ${sectionList}.
Do NOT generate sections not in this list.
Do NOT rewrite or modify any other existing sections.

For each section, use EXACTLY this format:

---START-SECTION: [Section Header]---
[Full section content — do not include the ## heading line, only the body]
---END-SECTION---

File to edit: ${skillMdPath}

Replace the existing body of each named section with your generated content.
Leave all other sections unchanged.`;

  return ok({ prompt, writeTargets });
}
