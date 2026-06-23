import * as fsPromises from "node:fs/promises";
import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { copyDir, exists, readText, writeText } from "./fs.js";
import { skillDir, templateDir } from "./paths.js";
import { applyTokens, buildTokenValues } from "./tokens.js";
import { readYaml, writeYaml } from "./yamlio.js";
import { scaffoldContextIfRecognized } from "./context.js";
import type { Archetype, SpecYaml } from "./types.js";

const TEMPLATE_FILES = ["SKILL.md", "spec.yaml", "validations.yaml"] as const;
const KEBAB_RE = /^[a-z][a-z0-9-]{1,39}$/;

export interface CreatedPaths {
  dir: string;
  files: string[];
  dryRun: boolean;
  tokenMap?: Record<string, string>;
}

export interface ScaffoldInput {
  category: string;
  name: string;
  dryRun: boolean;
  archetype?: Archetype;
  // v4 W1: also scaffold context/ stubs when the category is a recognized taxonomy domain.
  withContext?: boolean;
  // YYYY-MM-DD for the context stubs' last_verified, injected at the boundary (handler).
  today?: string;
}

function validateSlug(value: string, field: string): string | null {
  if (!KEBAB_RE.test(value)) {
    return `${field} must be kebab-case (a-z, 0-9, hyphens), 2–40 chars, starting with a letter`;
  }
  return null;
}

function updateFrontmatter(
  content: string,
  updates: Record<string, string>,
): string {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (!match?.[0] || !match?.[1]) return content;
  const header = match[0];
  const front = match[1];
  const rest = content.slice(header.length);
  let updated = front;
  for (const [key, value] of Object.entries(updates)) {
    updated = updated.replace(
      new RegExp(`^(${key}:\\s*).*$`, "m"),
      `$1${value}`,
    );
  }
  return `---\n${updated}\n---${rest}`;
}

async function applyModifications(
  dir: string,
  category: string,
  name: string,
  archetype?: Archetype,
): Promise<Result<undefined>> {
  const tokenValues = buildTokenValues(category, name);

  // Token swap in all template files
  for (const fileName of TEMPLATE_FILES) {
    const p = nodePath.join(dir, fileName);
    const r = await readText(p);
    if (!r.ok) return r;
    const w = await writeText(p, applyTokens(r.data, tokenValues));
    if (!w.ok) return w;
  }

  // Update SKILL.md frontmatter name field
  const skillMdPath = nodePath.join(dir, "SKILL.md");
  const mdR = await readText(skillMdPath);
  if (!mdR.ok) return mdR;
  const mdW = await writeText(
    skillMdPath,
    updateFrontmatter(mdR.data, { name }),
  );
  if (!mdW.ok) return mdW;

  // Update spec.yaml id + category (+ archetype when requested) via YAML round-trip
  const specPath = nodePath.join(dir, "spec.yaml");
  const specR = await readYaml<SpecYaml>(specPath);
  if (!specR.ok) return specR;
  const specW = await writeYaml(specPath, {
    ...specR.data,
    id: name,
    category,
    ...(archetype ? { archetype } : {}),
  });
  if (!specW.ok) return specW;

  // Assert zero remaining _PLACEHOLDER in all files
  for (const fileName of TEMPLATE_FILES) {
    const p = nodePath.join(dir, fileName);
    const r = await readText(p);
    if (!r.ok) return r;
    if (r.data.includes("_PLACEHOLDER")) {
      return fail(
        "INCOMPLETE_SWAP",
        `Remaining _PLACEHOLDER found in ${fileName}`,
        "Check tokens.ts covers all placeholder strings in the template",
      );
    }
  }

  return ok(undefined);
}

export async function scaffoldSkill(
  input: ScaffoldInput,
): Promise<Result<CreatedPaths>> {
  const { category, name, dryRun, archetype } = input;

  const catErr = validateSlug(category, "category");
  if (catErr) return fail("BAD_INPUT", catErr, "E.g. ai-agents, backend, data");
  const nameErr = validateSlug(name, "name");
  if (nameErr) return fail("BAD_INPUT", nameErr, "E.g. prompt-engineer, code-reviewer");

  const dirR = skillDir(category, name);
  if (!dirR.ok) return fail("BAD_INPUT", dirR.error.message);
  const dir = dirR.path;
  const files = TEMPLATE_FILES.map((f) => nodePath.join(dir, f));

  if (dryRun) {
    return ok({ dir, files, dryRun: true, tokenMap: buildTokenValues(category, name) });
  }

  if (await exists(dir)) {
    return fail(
      "EXISTS",
      `Skill directory already exists: ${dir}`,
      "Use tfc_migrate or pick a new name",
    );
  }

  const copyR = await copyDir(templateDir(), dir);
  if (!copyR.ok) return copyR;

  const modR = await applyModifications(dir, category, name, archetype);
  if (!modR.ok) {
    await fsPromises.rm(dir, { recursive: true, force: true }).catch(() => undefined);
    return modR;
  }

  // v4 W1: --with-context writes domain stubs when the fs category is a taxonomy domain.
  // An unrecognized category is a no-op (null), never a scaffold failure; only a real write
  // error rolls back. The _template/context/.gitkeep already gives every skill an empty dir.
  if (input.withContext) {
    const ctxR = await scaffoldContextIfRecognized({
      dir,
      category,
      name,
      today: input.today ?? new Date().toISOString().slice(0, 10),
    });
    if (!ctxR.ok) {
      await fsPromises.rm(dir, { recursive: true, force: true }).catch(() => undefined);
      return ctxR;
    }
  }

  return ok({ dir, files, dryRun: false });
}
