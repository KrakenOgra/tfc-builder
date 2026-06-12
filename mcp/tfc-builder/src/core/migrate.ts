import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { fail, ok, type Result } from "./result.js";
import { scaffoldSkill } from "./scaffold.js";
import { skillDir } from "./paths.js";
import { readYaml, writeYaml } from "./yamlio.js";
import { readText } from "./fs.js";
import { VOICE_FRAGMENT } from "./prompts/voice.fragment.js";
import { PATTERNS_FRAGMENT } from "./prompts/patterns.fragment.js";
import { ANTIPATTERNS_FRAGMENT } from "./prompts/antipatterns.fragment.js";
import { mapSpawnerSkill } from "./mappers/spawner.js";
import { mapGstackSkill } from "./mappers/gstack.js";
import type { SpecYaml, SourceType } from "./types.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MigrationPlan {
  specFields: Partial<SpecYaml>;
  densityBaseline: { patterns: number; antiPatterns: number };
  authoringPrompt: string;
  writeTargets: { file: string; section: string }[];
  layersFound: string[];
  dryRun: boolean;
}

export interface MigrateInput {
  sourcePath: string;
  sourceType: SourceType;
  category: string;
  name: string;
  dryRun: boolean;
}

// ── Migration prompt builder ──────────────────────────────────────────────────

function buildMigrationPrompt(
  category: string,
  name: string,
  targetSkillMdPath: string,
  targetSpecPath: string,
  sourceType: SourceType,
  sourceContent: Record<string, unknown>,
  densityBaseline: { patterns: number; antiPatterns: number },
  layersFound: string[],
): string {
  const layerList = layersFound.length > 0 ? layersFound.join(", ") : "none detected";

  return `# tfc_migrate — Intelligence Preservation Assignment

## SOURCE SKILL
Type: ${sourceType}
Layers found: ${layerList}

## SOURCE CONTENT
\`\`\`json
${JSON.stringify(sourceContent, null, 2)}
\`\`\`

---

## DENSITY CONTRACT (MANDATORY)

The source has:
- ${densityBaseline.patterns} named patterns
- ${densityBaseline.antiPatterns} named anti-patterns

Your output MUST contain:
- EXACTLY ${densityBaseline.patterns} named ### patterns in ## Patterns
- EXACTLY ${densityBaseline.antiPatterns} named ### anti-patterns in ## Anti-Patterns

Do NOT collapse a pattern to a bullet. Every named pattern from the source must appear
as a named pattern in the output. Density loss = migration failure.

---

## WRITING GUIDES

${PATTERNS_FRAGMENT}

---

${ANTIPATTERNS_FRAGMENT}

---

${VOICE_FRAGMENT}

---

## YOUR ASSIGNMENT

Rewrite the source intelligence into TFC format for \`${category}/${name}\`:

1. **## Identity** — Rewrite source \`identity\` in TFC voice. Keep all hard-won lessons.
   Name real failures from the source material. Do NOT paraphrase away the specifics.

2. **## Principles** — Rewrite source \`principles\` as numbered imperatives.
   Each must be a constraint, not a preference. Keep all source principles.

3. **## Patterns** — Rewrite all ${densityBaseline.patterns} source patterns as named ### entries.
   Each must have: ### Name, **When:**, **Why this works:**, example, **Key rule:**.
   Do NOT reduce count. Do NOT merge patterns.

4. **## Anti-Patterns** — Rewrite all ${densityBaseline.antiPatterns} source anti-patterns as named ### entries.
   Each must have: ### Name, **Signal:**, **Why it fails:**, **Instead:**.
   Do NOT reduce count.

5. **## Quick Wins** — Rewrite source quick_wins as zero-ambiguity bullet actions.

6. **## Handoffs** — Rewrite handoffs table + Does NOT own list.

---

## OUTPUT CONTRACT

Use EXACTLY these delimiters. Write ONLY the sections with source content.

---START-SECTION: ## Identity---
[content]
---END-SECTION---

---START-SECTION: ## Principles---
[numbered list]
---END-SECTION---

---START-SECTION: ## Patterns---
[named ### entries — must match density: ${densityBaseline.patterns}]
---END-SECTION---

---START-SECTION: ## Anti-Patterns---
[named ### entries — must match density: ${densityBaseline.antiPatterns}]
---END-SECTION---

---START-SECTION: ## Quick Wins---
[bullet actions]
---END-SECTION---

---START-SECTION: ## Handoffs---
[tables + Does NOT own list]
---END-SECTION---

File to edit: ${targetSkillMdPath}
Also update spec.yaml description if source has a better one: ${targetSpecPath}`;
}

// ── Core implementation ───────────────────────────────────────────────────────

export async function migrateSkill(
  input: MigrateInput,
): Promise<Result<MigrationPlan>> {
  const { sourcePath, sourceType, category, name, dryRun } = input;

  // Expand ~ in sourcePath
  const resolvedSource = sourcePath.startsWith("~/")
    ? nodePath.join(process.env["HOME"] ?? "/tmp", sourcePath.slice(2))
    : sourcePath;

  // Reject paths that resolve outside HOME — prevents reading sensitive system files
  // via prompt injection (e.g., sourcePath: "/etc/passwd").
  const HOME = process.env["HOME"] ?? "/tmp";
  const realSource = await fsPromises.realpath(resolvedSource).catch(() => resolvedSource);
  if (!realSource.startsWith(HOME + nodePath.sep) && realSource !== HOME) {
    return fail(
      "PATH_ESCAPE",
      `sourcePath resolves outside home directory: ${realSource}`,
      `Only paths under ${HOME} are allowed as migration sources`,
    );
  }

  // 1. Map source to TFC structure
  let specFields: Partial<SpecYaml>;
  let densityBaseline: { patterns: number; antiPatterns: number };
  let sourceContent: Record<string, unknown>;
  let layersFound: string[];

  if (sourceType === "spawner") {
    const mapR = await mapSpawnerSkill(resolvedSource);
    if (!mapR.ok) return mapR;
    const m = mapR.data;
    specFields = m.specFields as Partial<SpecYaml>;
    densityBaseline = m.densityBaseline;
    sourceContent = m.sourceContent as Record<string, unknown>;
    layersFound = m.layersFound;
  } else if (sourceType === "gstack") {
    const mapR = await mapGstackSkill(resolvedSource);
    if (!mapR.ok) return mapR;
    const m = mapR.data;
    specFields = m.specFields as Partial<SpecYaml>;
    densityBaseline = m.densityBaseline;
    sourceContent = m.sourceContent as Record<string, unknown>;
    layersFound = m.layersFound;
  } else {
    return fail(
      "BAD_INPUT",
      `Unknown sourceType: ${sourceType as string}`,
      "Valid values: spawner, gstack",
    );
  }

  // Capture source file bytes before any disk writes (for read-only proof)
  const sourceTextR = await readText(resolvedSource);
  if (!sourceTextR.ok) return sourceTextR;
  const sourceBytesAtStart = sourceTextR.data;

  const dirR = skillDir(category, name);
  if (!dirR.ok) return fail("BAD_INPUT", dirR.error.message);
  const targetDir = dirR.path;
  const targetSpecPath = nodePath.join(targetDir, "spec.yaml");
  const targetSkillMdPath = nodePath.join(targetDir, "SKILL.md");

  const authoringPrompt = buildMigrationPrompt(
    category,
    name,
    targetSkillMdPath,
    targetSpecPath,
    sourceType,
    sourceContent,
    densityBaseline,
    layersFound,
  );

  const writeTargets = [
    { file: targetSkillMdPath, section: "## Identity" },
    { file: targetSkillMdPath, section: "## Principles" },
    { file: targetSkillMdPath, section: "## Patterns" },
    { file: targetSkillMdPath, section: "## Anti-Patterns" },
    { file: targetSkillMdPath, section: "## Quick Wins" },
    { file: targetSkillMdPath, section: "## Handoffs" },
    { file: targetSpecPath, section: "description + triggers" },
  ];

  if (dryRun) {
    return ok({
      specFields,
      densityBaseline,
      authoringPrompt,
      writeTargets,
      layersFound,
      dryRun: true,
    });
  }

  // 2. Scaffold target dir
  const scaffoldR = await scaffoldSkill({ category, name, dryRun: false });
  if (!scaffoldR.ok) {
    // EXISTS is ok — skill was already scaffolded, we'll overwrite spec fields
    if (scaffoldR.error.code !== "EXISTS") return scaffoldR;
  }

  // 3. Overwrite spec.yaml with mapped fields
  const specR = await readYaml<SpecYaml>(targetSpecPath);
  if (!specR.ok) return specR;
  const updatedSpec: SpecYaml = {
    ...specR.data,
    ...(specFields.id ? { id: specFields.id } : {}),
    ...(specFields.description ? { description: specFields.description } : {}),
    ...(specFields.triggers && specFields.triggers.length > 0
      ? { triggers: specFields.triggers }
      : {}),
    ...(specFields.does_not_own && specFields.does_not_own.length > 0
      ? { does_not_own: specFields.does_not_own }
      : {}),
  };
  const specWriteR = await writeYaml(targetSpecPath, updatedSpec);
  if (!specWriteR.ok) return specWriteR;

  // 4. Verify source was NOT mutated
  const sourceAfterR = await readText(resolvedSource);
  if (!sourceAfterR.ok) return sourceAfterR;
  if (sourceAfterR.data !== sourceBytesAtStart) {
    return fail(
      "SOURCE_MUTATED",
      "Migration corrupted the source file — this is a bug",
      "Report to tfc-builder maintainers",
    );
  }

  return ok({
    specFields,
    densityBaseline,
    authoringPrompt,
    writeTargets,
    layersFound,
    dryRun: false,
  });
}
