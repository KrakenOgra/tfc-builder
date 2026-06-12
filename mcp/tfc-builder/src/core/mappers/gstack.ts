import * as nodePath from "node:path";
import { fail, ok, type Result } from "../result.js";
import { exists, readText } from "../fs.js";
import { countRealNamedItems, extractSection } from "../checks.js";

// ── Output ────────────────────────────────────────────────────────────────────

export interface GstackMapped {
  specFields: {
    id: string;
    triggers: string[];
  };
  densityBaseline: {
    patterns: number;
    antiPatterns: number;
  };
  sourceContent: {
    preamblePresent: boolean;
    workflowSections: string[];
    skillMdText: string;
  };
  layersFound: string[];
}

// ── Trigger extraction from CLAUDE.md routing entry ───────────────────────────

function extractTriggersFromClaudeMd(claudeMdText: string, skillId: string): string[] {
  const section = extractSection(claudeMdText, skillId);
  if (!section) return [];

  const triggers: string[] = [];

  const pipeMatch = /triggers?:\s*(.+)/i.exec(section);
  if (pipeMatch?.[1]) {
    triggers.push(
      ...pipeMatch[1]
        .split("|")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    );
  }

  const bulletTriggers = section.match(/^[-*]\s+(.+)/gm) ?? [];
  triggers.push(
    ...bulletTriggers.map((l) => l.replace(/^[-*]\s+/, "").trim()),
  );

  return [...new Set(triggers)];
}

// ── Mapper ────────────────────────────────────────────────────────────────────

export async function mapGstackSkill(
  sourcePath: string,
): Promise<Result<GstackMapped>> {
  if (!(await exists(sourcePath))) {
    return fail("NOT_FOUND", `Source skill not found: ${sourcePath}`);
  }

  const mdR = await readText(sourcePath);
  if (!mdR.ok) return mdR;
  const skillMdText = mdR.data;

  const skillDir = nodePath.dirname(sourcePath);
  const skillId = nodePath.basename(skillDir);

  let triggers: string[] = [];
  for (const claudePath of [
    nodePath.join(skillDir, "CLAUDE.md"),
    nodePath.join(nodePath.dirname(skillDir), "CLAUDE.md"),
  ]) {
    if (await exists(claudePath)) {
      const claudeR = await readText(claudePath);
      if (claudeR.ok) {
        triggers = extractTriggersFromClaudeMd(claudeR.data, skillId);
        if (triggers.length > 0) break;
      }
    }
  }

  const preamblePresent = skillMdText.includes("## Preamble");
  const workflowSections = (skillMdText.match(/^## [A-Z][^\n]+/gm) ?? []).map(
    (h) => h.replace(/^## /, ""),
  );

  const patternSection = extractSection(skillMdText, "Patterns");
  const antiSection = extractSection(skillMdText, "Anti-Patterns");
  const patternCount = countRealNamedItems(patternSection);
  const antiCount = countRealNamedItems(antiSection);

  const layersFound: string[] = [];
  if (skillMdText.includes("## Identity")) layersFound.push("identity");
  if (skillMdText.includes("## Principles")) layersFound.push("principles");
  if (patternCount > 0) layersFound.push("patterns");
  if (antiCount > 0) layersFound.push("anti-patterns");
  if (skillMdText.includes("## Quick Wins")) layersFound.push("quick-wins");
  if (skillMdText.includes("## Handoffs")) layersFound.push("handoffs");

  return ok({
    specFields: { id: skillId, triggers },
    densityBaseline: { patterns: patternCount, antiPatterns: antiCount },
    sourceContent: { preamblePresent, workflowSections, skillMdText },
    layersFound,
  });
}
