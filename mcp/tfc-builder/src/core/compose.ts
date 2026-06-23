// src/core/compose.ts
// v4 Wave 2 — context composition (Vector V4).
//
// A skill can inherit another skill's domain knowledge via spec.yaml:
//   imports_context: { from: <skill-name>, files?: [<file>, ...] }
// tfc_compose resolves the inheritance chain depth-first, enforces INV-10 (depth ≤ 3), and
// FAILS CLOSED on a cycle (mirrors the imports-resolve posture in core/fragments.ts). It is
// MODEL-FREE (INV-3): pure spec reads + directory listing. When files is omitted, the whole
// of the source skill's context/ is inherited.

import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { exists, listFiles } from "./fs.js";
import { readYaml } from "./yamlio.js";
import { skillDir } from "./paths.js";
import { findSkillDir } from "./context.js";
import type { SpecYaml } from "./types.js";

export interface ResolvedContext {
  file: string;
  fromSkill: string;
}

export interface ComposeResult {
  skill: string; // category/name of the target
  resolved: ResolvedContext[];
  depth: number;
  cycle?: boolean;
  depthExceeded?: boolean;
}

const MAX_DEPTH = 3;

async function readSpec(dir: string): Promise<SpecYaml | null> {
  const r = await readYaml<SpecYaml>(nodePath.join(dir, "spec.yaml"));
  return r.ok ? r.data : null;
}

async function contextFilesOf(dir: string): Promise<string[]> {
  const r = await listFiles(nodePath.join(dir, "context"));
  return r.ok ? r.data.filter((f) => f.endsWith(".md")) : [];
}

export async function composeContext(input: {
  category: string;
  name: string;
}): Promise<Result<ComposeResult>> {
  const dirR = skillDir(input.category, input.name);
  if (!dirR.ok) return fail("BAD_INPUT", dirR.error.message);
  if (!(await exists(dirR.path))) {
    return fail("NOT_FOUND", `Skill not found: ${input.category}/${input.name}`);
  }

  const target = `${input.category}/${input.name}`;
  const resolved: ResolvedContext[] = [];
  const visited = new Set<string>([input.name]);

  let currentDir: string | null = dirR.path;
  let depth = 0;

  while (currentDir) {
    const spec = await readSpec(currentDir);
    const imp = spec?.imports_context;
    if (!imp || !imp.from) break;

    // Cycle → fail closed: a self-referential chain resolves to nothing (INV-10).
    if (visited.has(imp.from)) {
      return ok({ skill: target, resolved: [], depth: 0, cycle: true });
    }

    // Enforce depth ≤ 3: stop before a 4th hop and report truncation, never recurse deeper.
    if (depth + 1 > MAX_DEPTH) {
      return ok({ skill: target, resolved, depth, depthExceeded: true });
    }

    const fromDir = await findSkillDir(imp.from);
    if (!fromDir) {
      return fail(
        "NOT_FOUND",
        `imports_context.from skill not found: ${imp.from}`,
        "Create the source skill or fix imports_context.from",
      );
    }

    const files =
      imp.files && imp.files.length > 0 ? imp.files : await contextFilesOf(fromDir);
    for (const f of files) resolved.push({ file: f, fromSkill: imp.from });

    visited.add(imp.from);
    depth += 1;
    currentDir = fromDir;
  }

  return ok({ skill: target, resolved, depth });
}
