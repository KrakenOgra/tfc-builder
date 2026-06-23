// src/core/context-fill.ts
// CCE v2 Wave 3 (V2 MACHINE-DRAFTS-HUMAN-VERIFIES) — the OFFLINE fill step.
//
// Inverts the v1 default "a human fills the knowledge" (context.ts:6-8) WITHOUT breaking INV-4:
// this function is model-free. It HARVESTS grounded source text from disk (the skill's own
// SKILL.md / spec.yaml, an imported skill's SKILL.md, the prior eval-report.json) and ASSEMBLES a
// fill prompt that Claude executes OFFLINE — out of band, never on the tfc_context_get read path.
// The prompt forbids ungrounded prose and requires a `source:` line per section, so the W2 depth
// audit (which fails-closed on unsourced/empty sections) certifies the result. If there is nothing
// grounded to harvest, this FAILS rather than inviting hallucination.

import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { exists, readText } from "./fs.js";
import { readYaml } from "./yamlio.js";
import { TFC_CONTEXT_TAXONOMY } from "./paths.js";
import { findSkillDir, type ContextTaxonomy, type TaxonomyFile } from "./context.js";
import { loadAngleManifest } from "./context-discover.js";
import type { SpecYaml } from "./types.js";

const MAX_EXCERPT_CHARS = 2400;

export interface HarvestedSource {
  label: string; // how the fill prompt cites it in a `source:` line
  path: string; // absolute path on disk (provenance audit trail)
  excerpt: string; // grounded text, truncated to MAX_EXCERPT_CHARS
}

export interface FillAngle {
  file: string; // context/<file>.md to write
  sections: string[]; // the ## headers the file must carry
  fillHint: string; // the taxonomy author's instruction for this file
}

export interface FillPromptResult {
  skill: string;
  domain: string;
  contextDir: string;
  angles: FillAngle[];
  sources: HarvestedSource[];
  prompt: string; // the OFFLINE fill prompt — Claude executes this; this fn never calls a model
}

function truncate(text: string): string {
  const t = text.trim();
  return t.length <= MAX_EXCERPT_CHARS
    ? t
    : `${t.slice(0, MAX_EXCERPT_CHARS)}\n…[truncated]`;
}

async function harvestFrom(
  label: string,
  path: string,
): Promise<HarvestedSource | null> {
  if (!(await exists(path))) return null;
  const r = await readText(path);
  if (!r.ok || r.data.trim().length === 0) return null;
  return { label, path, excerpt: truncate(r.data) };
}

export async function buildFillPrompt(input: {
  name: string;
  domain: string;
}): Promise<Result<FillPromptResult>> {
  const dir = await findSkillDir(input.name);
  if (!dir) {
    return fail(
      "NOT_FOUND",
      `Skill not found by name: ${input.name}`,
      "Run tfc_new first, or check the skill name",
    );
  }
  const skill = nodePath.basename(dir);

  // Angle set = the taxonomy domain's required files (W5 swaps this for the angle manifest).
  if (!(await exists(TFC_CONTEXT_TAXONOMY))) {
    return fail("NOT_FOUND", `context-taxonomy.yaml not found at ${TFC_CONTEXT_TAXONOMY}`);
  }
  const taxR = await readYaml<ContextTaxonomy>(TFC_CONTEXT_TAXONOMY);
  if (!taxR.ok) return fail(taxR.error.code, taxR.error.message);
  const domainBlock = taxR.data?.domains?.[input.domain];
  if (!domainBlock) {
    const known = Object.keys(taxR.data?.domains ?? {}).join(", ");
    return fail(
      "BAD_INPUT",
      `Unknown context domain: ${input.domain}`,
      `Known domains: ${known}`,
    );
  }
  const taxonomyAngles: FillAngle[] = (domainBlock.required_files ?? []).map(
    (f: TaxonomyFile) => ({
      file: f.name,
      sections: f.sections,
      fillHint: f.fill_hint,
    }),
  );

  // Foundry W-C: the fill-prompt tree is the SAME tree coverage/promotion measure. When the skill
  // carries a per-skill context/_angles.yaml manifest, prompt over ITS angles (so the author fills
  // exactly what tfc_context_coverage scores), falling back to the taxonomy domain otherwise. The
  // taxonomy entry, matched by filename, still supplies sections/fillHint when the manifest omits them.
  const manifest = await loadAngleManifest(nodePath.join(dir, "context"));
  const taxByFile = new Map(taxonomyAngles.map((a) => [a.file, a]));
  const angles: FillAngle[] =
    manifest && manifest.angles.length > 0
      ? manifest.angles.map((a) => {
          const tax = taxByFile.get(a.file);
          return {
            file: a.file,
            sections: a.sections ?? tax?.sections ?? [],
            fillHint: a.source_hint ?? tax?.fillHint ?? "",
          };
        })
      : taxonomyAngles;

  // Harvest grounded sources, in priority order. Each is a real file on disk.
  const sources: HarvestedSource[] = [];
  const skillMd = await harvestFrom(`${skill}/SKILL.md`, nodePath.join(dir, "SKILL.md"));
  if (skillMd) sources.push(skillMd);
  const specMd = await harvestFrom(`${skill}/spec.yaml`, nodePath.join(dir, "spec.yaml"));
  if (specMd) sources.push(specMd);
  const evalReport = await harvestFrom(
    `${skill}/eval-report.json`,
    nodePath.join(dir, "eval-report.json"),
  );
  if (evalReport) sources.push(evalReport);

  // Pull an imported skill's SKILL.md if this skill declares imports_context (V2 grounded reuse).
  const specR = await readYaml<SpecYaml>(nodePath.join(dir, "spec.yaml"));
  if (specR.ok && specR.data?.imports_context?.from) {
    const fromName = specR.data.imports_context.from;
    const fromDir = await findSkillDir(fromName);
    if (fromDir) {
      const importedMd = await harvestFrom(
        `${fromName}/SKILL.md`,
        nodePath.join(fromDir, "SKILL.md"),
      );
      if (importedMd) sources.push(importedMd);
    }
  }

  // Grounded-sources-only: with nothing to harvest, refuse rather than invite fabrication.
  if (sources.length === 0) {
    return fail(
      "NO_SOURCES",
      `No grounded sources to harvest for ${skill}`,
      "Author SKILL.md, or declare imports_context.from, before filling context — empty-but-honest beats full-but-wrong",
    );
  }

  const contextDir = nodePath.join(dir, "context");

  const renderedAngles = angles
    .map((a) => {
      const secs = a.sections.map((s) => `    ${s}`).join("\n");
      return `### ${a.file}\nsections:\n${secs}\n  fill_hint: ${a.fillHint}`;
    })
    .join("\n\n");

  const renderedSources = sources
    .map(
      (s) =>
        `### source: \`${s.label}\`  (${s.path})\n\n\`\`\`\n${s.excerpt}\n\`\`\``,
    )
    .join("\n\n");

  const prompt = `# tfc_context_fill — OFFLINE grounded fill for ${skill} (domain: ${input.domain})

You are drafting context bodies that another skill will read at runtime. This runs OFFLINE
(out of the deterministic read path) so it may use your judgement — but it is GROUNDED-ONLY.

## HARD RULES (the depth audit fails-closed on violations)
1. Draw EVERY claim from the HARVESTED SOURCES below. Do NOT invent facts, numbers, or examples
   that are not supported by a source.
2. Each \`##\` section MUST carry a provenance line directly under its header, exactly:
   \`source: <one of the source labels above, optionally #anchor>\`
3. If a section cannot be grounded in any harvested source, write its body as
   \`TODO(unsourced): <what is missing and which source would supply it>\` and DO NOT add a
   source line — leave it to fail the audit honestly. Never fabricate to make it pass.
4. Keep each section concrete: formulas, examples, numbers the sources support — not prose filler.

## ANGLES TO FILL (write each as context/<file>, with these sections)

${renderedAngles}

## HARVESTED SOURCES (your only permitted ground truth)

${renderedSources}

## OUTPUT CONTRACT
For each angle file, write \`${contextDir}/<file>\` with YAML frontmatter
(\`last_verified: <today YYYY-MM-DD>\`) followed by each \`##\` section, a \`source:\` line, and a
grounded body. Then verify:
\`\`\`bash
node dist/cli.js context-audit | grep -A3 "${skill}"   # the filled files must drop out of "shallow"
node dist/cli.js context-get ${skill} ${input.domain} "<a real task>"   # must return a sourced body
\`\`\`
A file still listed as shallow means it is empty, unsourced, or too thin — fix the draft, never the gate.`;

  return ok({ skill, domain: input.domain, contextDir, angles, sources, prompt });
}
