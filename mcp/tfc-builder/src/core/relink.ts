// Wave 2 (v3, W-V2): route integrity as a lane PRECONDITION.
//
// A skill that is not reachable from ~/.claude/skills cannot be invoked → cannot accumulate
// learnings → cannot evolve. Link rot silently strangles the loop. This module turns doctor's
// `skill-symlinks` finding into one safe action:
//   - missing / dangling managed symlink  → (re)create it                  [repaired]
//   - regular file BYTE-IDENTICAL to source → de-dup into the canonical link [repaired]
//   - regular file with DIFFERENT content   → reported, never overwritten    [conflict]
//   - symlink pointing at a different live target → reported                  [conflict]
// Conflicts are surfaced for human decision (INV via-negativa) — the tool never destroys a
// skill it did not author. dryRun (INV-3) renders the plan without touching disk.

import * as fsPromises from "node:fs/promises";
import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { readText } from "./fs.js";
import { listSkills } from "./install.js";
import { claudeLink, isUnderAllowedRoot, spawnerLink } from "./paths.js";

type LinkAction =
  | "ok"
  | "created"
  | "replaced-identical"
  | "conflict"
  | "planned";

export interface RelinkOutcome {
  skill: string;
  claude: LinkAction;
  spawner: LinkAction;
  detail: string;
}

export interface RelinkResult {
  outcomes: RelinkOutcome[];
  /** skills that had ≥1 link created/replaced (or would, under dryRun) */
  repaired: string[];
  /** skills with ≥1 unrepairable conflict needing a human decision */
  conflicts: string[];
  dryRun: boolean;
}

type Intent = "ok" | "create" | "replace-identical" | "conflict";

interface LinkInfo {
  kind: "none" | "symlink" | "file" | "dir";
  target: string | null;
  targetExists: boolean;
}

async function inspect(p: string): Promise<LinkInfo> {
  try {
    const ls = await fsPromises.lstat(p);
    if (ls.isSymbolicLink()) {
      const target = await fsPromises.readlink(p);
      const targetExists = await fsPromises
        .stat(p)
        .then(() => true)
        .catch(() => false);
      return { kind: "symlink", target, targetExists };
    }
    if (ls.isDirectory()) return { kind: "dir", target: null, targetExists: true };
    return { kind: "file", target: null, targetExists: true };
  } catch {
    return { kind: "none", target: null, targetExists: false };
  }
}

async function createLink(
  linkPath: string,
  targetPath: string,
): Promise<Result<undefined>> {
  if (!isUnderAllowedRoot(linkPath))
    return fail("PATH_ESCAPE", `link path escapes allowed roots: ${linkPath}`);
  try {
    await fsPromises.mkdir(nodePath.dirname(linkPath), { recursive: true });
    await fsPromises.symlink(targetPath, linkPath);
    return ok(undefined);
  } catch (e) {
    return fail("LINK_ERROR", `Failed to create ${linkPath}: ${String(e)}`);
  }
}

/** Classify the intended repair for one symlink WITHOUT mutating. `sourceFile` (claude only)
 *  enables the byte-identical de-dup of a stale regular-file copy. */
async function classify(
  linkPath: string,
  expectedTarget: string,
  sourceFileForIdentity: string | null,
): Promise<{ intent: Intent; detail: string }> {
  const info = await inspect(linkPath);
  switch (info.kind) {
    case "none":
      return { intent: "create", detail: "missing → create" };
    case "symlink":
      if (info.target === expectedTarget)
        return { intent: "ok", detail: "symlink already correct" };
      if (!info.targetExists)
        return {
          intent: "create",
          detail: `dangling symlink → ${String(info.target)} (recreate to canonical target)`,
        };
      return {
        intent: "conflict",
        detail: `symlink points at a different LIVE target: ${String(info.target)} (human decision)`,
      };
    case "file": {
      if (sourceFileForIdentity) {
        const a = await readText(linkPath);
        const b = await readText(sourceFileForIdentity);
        if (a.ok && b.ok && a.data === b.data)
          return {
            intent: "replace-identical",
            detail: "regular file is byte-identical to source → de-dup into symlink",
          };
      }
      return {
        intent: "conflict",
        detail: "regular file with DIFFERENT content occupies the path (never overwritten)",
      };
    }
    case "dir":
      return {
        intent: "conflict",
        detail: "a real directory occupies the link path (human decision)",
      };
  }
}

async function apply(
  intent: Intent,
  linkPath: string,
  expectedTarget: string,
  dryRun: boolean,
): Promise<{ action: LinkAction; error?: string }> {
  if (intent === "ok") return { action: "ok" };
  if (intent === "conflict") return { action: "conflict" };
  if (dryRun) return { action: "planned" };

  if (intent === "create") {
    // remove a dangling symlink first (safe — its target is gone)
    await fsPromises.unlink(linkPath).catch(() => undefined);
    const r = await createLink(linkPath, expectedTarget);
    return r.ok ? { action: "created" } : { action: "conflict", error: r.error.message };
  }
  // replace-identical: the file content == source, so removing it loses nothing
  await fsPromises.unlink(linkPath).catch(() => undefined);
  const r = await createLink(linkPath, expectedTarget);
  return r.ok
    ? { action: "replaced-identical" }
    : { action: "conflict", error: r.error.message };
}

export async function repairLinks(input: {
  category?: string;
  name?: string;
  dryRun?: boolean;
}): Promise<Result<RelinkResult>> {
  const dryRun = input.dryRun ?? false;
  if ((input.category && !input.name) || (!input.category && input.name))
    return fail(
      "BAD_INPUT",
      "provide BOTH category and name to repair one skill, or NEITHER to repair all",
    );

  const listR = await listSkills({ brokenOnly: false });
  if (!listR.ok) return listR;

  const targets = listR.data.skills.filter(
    (s) =>
      !input.category ||
      (s.category === input.category && s.name === input.name),
  );
  if (input.category && targets.length === 0)
    return fail("NOT_FOUND", `skill not found: ${input.category}/${input.name}`);

  const outcomes: RelinkOutcome[] = [];
  const repaired: string[] = [];
  const conflicts: string[] = [];

  for (const s of targets) {
    const key = `${s.category}/${s.name}`;

    const claudeR = claudeLink(s.name);
    const spawnerR = spawnerLink(s.category, `${s.name}-tfc`);
    if (!claudeR.ok || !spawnerR.ok) {
      return fail("BAD_INPUT", `unsafe skill name: ${key}`);
    }
    const claudeLinkFile = nodePath.join(claudeR.path, "SKILL.md");
    const claudeTarget = nodePath.join(s.dir, "SKILL.md");
    const spawnerLinkPath = spawnerR.path;

    // SAFETY (learned the hard way): if the claude PARENT dir is itself a symlink, then
    // claudeLinkFile resolves THROUGH it into the source — touching it would damage the
    // source, not a copy. Never mutate through a parent symlink. If it resolves to the
    // source dir the skill is already reachable (an older dir-symlink install) → "ok";
    // otherwise it's a real conflict for a human to normalize.
    let cCls: { intent: Intent; detail: string };
    const claudeParent = await inspect(claudeR.path);
    if (claudeParent.kind === "symlink") {
      const realParent = await fsPromises.realpath(claudeR.path).catch(() => null);
      const realSrc = await fsPromises.realpath(s.dir).catch(() => null);
      cCls =
        realParent && realSrc && realParent === realSrc
          ? {
              intent: "ok",
              detail:
                "claude parent dir is a symlink to the source (reachable via dir-symlink; left untouched — normalize with tfc install if you want the standard file-symlink)",
            }
          : {
              intent: "conflict",
              detail: `claude parent dir is a symlink to ${String(claudeParent.target)} (NOT the source; never mutated through it — human decision)`,
            };
    } else {
      cCls = await classify(claudeLinkFile, claudeTarget, claudeTarget);
    }
    const sCls = await classify(spawnerLinkPath, s.dir, null);

    const cApp = await apply(cCls.intent, claudeLinkFile, claudeTarget, dryRun);
    const sApp = await apply(sCls.intent, spawnerLinkPath, s.dir, dryRun);

    const details = [
      `claude: ${cCls.detail}${cApp.error ? ` [err: ${cApp.error}]` : ""}`,
      `spawner: ${sCls.detail}${sApp.error ? ` [err: ${sApp.error}]` : ""}`,
    ].join(" | ");

    outcomes.push({
      skill: key,
      claude: cApp.action,
      spawner: sApp.action,
      detail: details,
    });

    const mutated = (a: LinkAction): boolean =>
      a === "created" || a === "replaced-identical" || a === "planned";
    if (mutated(cApp.action) || mutated(sApp.action)) repaired.push(key);
    if (cApp.action === "conflict" || sApp.action === "conflict")
      conflicts.push(key);
  }

  outcomes.sort((a, b) => a.skill.localeCompare(b.skill));
  return ok({ outcomes, repaired: [...new Set(repaired)], conflicts: [...new Set(conflicts)], dryRun });
}
