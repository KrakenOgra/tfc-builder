import * as nodePath from "node:path";
import { existsSync } from "node:fs";
import { fail, ok, type Result } from "./result.js";
import { readText } from "./fs.js";
import { fragmentDir } from "./paths.js";

// ── Protocol inheritance (v3 W4 / Vector V4) ────────────────────────────────────
// A reasoning FRAGMENT is a reusable gate+artifact contract (GROUND, 7-slot, route)
// living in skills/_fragments/{id}/fragment.md. A skill declares `imports: [id]` to
// inherit the gate instead of copy-pasting it. resolveImports inlines the markdown at
// compile/generate time; fragmentExists backs the fails-closed validate gate.
//
// INV-1 + INV-4: fragments are markdown, not a runtime. Nothing here calls a model.

export function fragmentExists(id: string): boolean {
  const dirR = fragmentDir(id);
  if (!dirR.ok) return false;
  return existsSync(nodePath.join(dirR.path, "fragment.md"));
}

/**
 * Inline every imported fragment's gate markdown, in order. Fails-closed: an id that
 * does not resolve to skills/_fragments/{id}/fragment.md returns NOT_FOUND rather than
 * silently dropping the gate (a dropped gate is exactly the reinvention V4 prevents).
 */
export async function resolveImports(
  imports: readonly string[],
): Promise<Result<string>> {
  const blocks: string[] = [];
  for (const id of imports) {
    const dirR = fragmentDir(id);
    if (!dirR.ok) return fail("BAD_INPUT", dirR.error.message);
    const mdR = await readText(nodePath.join(dirR.path, "fragment.md"));
    if (!mdR.ok)
      return fail(
        "NOT_FOUND",
        `imported fragment not found: ${id}`,
        "check skills/_fragments/ for the fragment id",
      );
    blocks.push(`<!-- imported fragment: ${id} -->\n${mdR.data.trim()}`);
  }
  return ok(blocks.join("\n\n"));
}
