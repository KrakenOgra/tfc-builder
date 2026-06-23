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
// v3 W4: importable reasoning fragments (GROUND, 7-slot, route). Sibling of _template.
export const TFC_FRAGMENTS = nodePath.join(TFC_SKILLS, "_fragments");
// v4 W1: the portable context taxonomy (domains -> required context files). Lives at the
// TFC_HOME root so every skill's context/ stubs trace to one versioned source.
export const TFC_CONTEXT_TAXONOMY = nodePath.join(TFC_HOME, "context-taxonomy.yaml");

// Wave 5: the Kraken Context-Packs index (read-only — the pack-bridge never writes it).
// Override KRAKEN_PACKS_FILE to point the bridge at a fixture in tests.
export const KRAKEN_PACKS =
  process.env["KRAKEN_PACKS_FILE"] ??
  nodePath.join(SPAWNER_SKILLS, "pattern", "kraken-packs", "packs.yaml");

// v3 W5: the MCP server registry used to validate a skill's `requires` reachability.
// Override MCP_CONFIG_FILE to point at a fixture in tests.
export const MCP_CONFIG =
  process.env["MCP_CONFIG_FILE"] ?? nodePath.join(HOME, ".mcp.json");

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

export function fragmentDir(id: string): SafeJoinResult {
  return safeJoin(TFC_FRAGMENTS, id);
}
