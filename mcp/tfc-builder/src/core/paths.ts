import * as nodePath from "node:path";

const HOME = process.env["HOME"] ?? "/tmp";

// Test isolation: TFC_ROOT / CLAUDE_SKILLS_DIR / SPAWNER_SKILLS_DIR env vars redirect
// the roots away from the real home without patching every call-site.
export const TFC_HOME =
  process.env["TFC_ROOT"] ?? nodePath.join(HOME, ".future-code");
export const CLAUDE_SKILLS =
  process.env["CLAUDE_SKILLS_DIR"] ?? nodePath.join(HOME, ".claude", "skills");
export const SPAWNER_SKILLS =
  process.env["SPAWNER_SKILLS_DIR"] ?? nodePath.join(HOME, ".spawner", "skills");
export const TFC_SKILLS = nodePath.join(TFC_HOME, "skills");
export const TFC_TEMPLATE = nodePath.join(TFC_SKILLS, "_template");

export type PathError = { code: "UNSAFE_PATH"; message: string };
export type SafeJoinResult =
  | { ok: true; path: string }
  | { ok: false; error: PathError };

export function safeJoin(root: string, ...segments: string[]): SafeJoinResult {
  for (const seg of segments) {
    if (seg.includes("..")) {
      return {
        ok: false,
        error: { code: "UNSAFE_PATH", message: `segment contains '..': ${seg}` },
      };
    }
    if (seg.startsWith("/")) {
      return {
        ok: false,
        error: { code: "UNSAFE_PATH", message: `segment is absolute: ${seg}` },
      };
    }
    if (seg.includes("\0")) {
      return {
        ok: false,
        error: { code: "UNSAFE_PATH", message: "segment contains null byte" },
      };
    }
  }
  const resolved = nodePath.join(root, ...segments);
  const rootWithSep = root.endsWith(nodePath.sep) ? root : root + nodePath.sep;
  if (!resolved.startsWith(rootWithSep) && resolved !== root) {
    return {
      ok: false,
      error: { code: "UNSAFE_PATH", message: "resolved path escapes root" },
    };
  }
  return { ok: true, path: resolved };
}

export const ALLOWED_ROOTS = [TFC_HOME, CLAUDE_SKILLS, SPAWNER_SKILLS] as const;

export function isUnderAllowedRoot(p: string): boolean {
  return ALLOWED_ROOTS.some(
    (root) => p.startsWith(root + nodePath.sep) || p === root,
  );
}

// ── Path builders — all use safeJoin; no raw string concatenation ─────────────

export function skillDir(category: string, name: string): SafeJoinResult {
  return safeJoin(TFC_SKILLS, category, name);
}

export function claudeLink(name: string): SafeJoinResult {
  return safeJoin(CLAUDE_SKILLS, name);
}

export function spawnerLink(category: string, name: string): SafeJoinResult {
  return safeJoin(SPAWNER_SKILLS, category, name);
}

export function templateDir(): string {
  return TFC_TEMPLATE;
}
