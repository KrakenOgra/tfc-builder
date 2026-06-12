import { fail, ok, type Result } from "../result.js";
import { exists } from "../fs.js";
import { readYaml } from "../yamlio.js";

// ── Source types (spawner YAML schema — not TFC) ─────────────────────────────

interface SpawnerPattern {
  name?: string;
  description?: string;
  when?: string;
  implementation?: string;
  example?: string;
}

interface SpawnerAntiPattern {
  name?: string;
  why?: string;
  why_bad?: string;
  instead?: string;
  example_bad?: string;
  example_good?: string;
}

interface SpawnerSharpEdge {
  id?: string;
  summary?: string;
  severity?: string;
  situation?: string;
  why?: string;
  solution?: string;
  symptoms?: string[];
  red_flags?: string[];
}

interface SpawnerSkillYaml {
  id?: string;
  name?: string;
  version?: string;
  category?: string;
  description?: string;
  triggers?: string[];
  identity?: string;
  principles?: string[];
  patterns?: SpawnerPattern[];
  anti_patterns?: SpawnerAntiPattern[];
  handoffs?: unknown;
  quick_wins?: string[];
  stack?: unknown;
  does_not_own?: string[];
  sharp_edges?: SpawnerSharpEdge[];
}

// ── Output ────────────────────────────────────────────────────────────────────

export interface SpawnerMapped {
  specFields: {
    id: string;
    name: string;
    description: string;
    triggers: string[];
    does_not_own: string[];
  };
  densityBaseline: {
    patterns: number;
    antiPatterns: number;
  };
  sourceContent: {
    identity: string;
    principles: string[];
    patternsYaml: string;
    antiPatternsYaml: string;
    handoffsYaml: string;
    quickWins: string[];
    stackYaml: string;
  };
  layersFound: string[];
}

// ── Mapper ────────────────────────────────────────────────────────────────────

function toYamlBlock(value: unknown): string {
  if (!value) return "";
  return JSON.stringify(value, null, 2);
}

export async function mapSpawnerSkill(
  sourcePath: string,
): Promise<Result<SpawnerMapped>> {
  if (!(await exists(sourcePath))) {
    return fail("NOT_FOUND", `Source skill not found: ${sourcePath}`);
  }

  const yamlR = await readYaml<SpawnerSkillYaml>(sourcePath);
  if (!yamlR.ok) return yamlR;
  const s = yamlR.data;

  const patterns = s.patterns ?? [];
  const antiPatterns = s.anti_patterns ?? [];

  const layersFound: string[] = [];
  if (s.identity) layersFound.push("identity");
  if (s.principles && s.principles.length > 0) layersFound.push("principles");
  if (patterns.length > 0) layersFound.push("patterns");
  if (antiPatterns.length > 0) layersFound.push("anti-patterns");
  if (s.handoffs) layersFound.push("handoffs");
  if (s.quick_wins && s.quick_wins.length > 0) layersFound.push("quick-wins");
  if (s.stack) layersFound.push("stack");

  return ok({
    specFields: {
      id: s.id ?? "",
      name: s.name ?? "",
      description: typeof s.description === "string"
        ? s.description.trim()
        : "",
      triggers: s.triggers ?? [],
      does_not_own: s.does_not_own ?? [],
    },
    densityBaseline: {
      patterns: patterns.length,
      antiPatterns: antiPatterns.length,
    },
    sourceContent: {
      identity: s.identity ?? "",
      principles: s.principles ?? [],
      patternsYaml: toYamlBlock(patterns),
      antiPatternsYaml: toYamlBlock(antiPatterns),
      handoffsYaml: toYamlBlock(s.handoffs),
      quickWins: s.quick_wins ?? [],
      stackYaml: toYamlBlock(s.stack),
    },
    layersFound,
  });
}
