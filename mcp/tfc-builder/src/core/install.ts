import * as fsPromises from "node:fs/promises";
import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { exists, listDirs, readText, writeText } from "./fs.js";
import { injectPreambleHook } from "./preamble.js";
import {
  ALLOWED_ROOTS,
  claudeLink,
  isUnderAllowedRoot,
  skillDir,
  spawnerLink,
  TFC_SKILLS,
} from "./paths.js";
import { validateSkill } from "./validate.js";
import { recomputeLane } from "./lane.js";
import type { Lane } from "./types.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type LinkState = "created" | "exists" | "conflict" | "planned";

export interface InstallResult {
  claudeLink: LinkState;
  spawnerLink: LinkState;
  validated: boolean;
  // Wave 3: the runtime hook that makes learnings exist because the skill ran.
  preambleHook: "injected" | "current" | "planned";
}

export interface SkillEntry {
  category: string;
  name: string;
  dir: string;
  // Earned evidence lane, recomputed from disk — the headline quality signal.
  lane: Lane | "unknown";
  // W2: consumer-facing lane after the reachability overlay — "blocked" when unreachable.
  effectiveLane: Lane | "blocked" | "unknown";
  // W2: both managed symlinks resolve → the skill is invokable.
  reachable: boolean;
  claudeLinkState: "ok" | "missing" | "dangling" | "conflict";
  spawnerLinkState: "ok" | "missing" | "dangling" | "conflict";
}

export interface ListResult {
  skills: SkillEntry[];
}

// ── Symlink helpers ───────────────────────────────────────────────────────────

async function readLinkTarget(p: string): Promise<string | null> {
  try {
    return await fsPromises.readlink(p);
  } catch {
    return null;
  }
}

async function symlinkStat(p: string): Promise<"file" | "dir" | "broken" | "none"> {
  try {
    // lstat sees the link itself; stat follows it
    await fsPromises.lstat(p);
    try {
      const s = await fsPromises.stat(p);
      return s.isDirectory() ? "dir" : "file";
    } catch {
      return "broken";
    }
  } catch {
    return "none";
  }
}

async function ensureSymlink(
  linkPath: string,
  targetPath: string,
  dryRun: boolean,
): Promise<Result<LinkState>> {
  if (!isUnderAllowedRoot(linkPath)) {
    return fail(
      "PATH_ESCAPE",
      `Link path escapes allowed roots: ${linkPath}`,
      `Allowed: ~/.future-code, ~/.claude/skills, ~/.spawner/skills`,
    );
  }
  if (!isUnderAllowedRoot(targetPath)) {
    return fail(
      "PATH_ESCAPE",
      `Link target escapes allowed roots: ${targetPath}`,
    );
  }

  if (dryRun) return ok("planned");

  const st = await symlinkStat(linkPath);

  if (st === "none") {
    // Create parent if needed
    await fsPromises.mkdir(nodePath.dirname(linkPath), { recursive: true });
    await fsPromises.symlink(targetPath, linkPath);
    return ok("created");
  }

  // Link or file already exists — check target
  const existing = await readLinkTarget(linkPath);
  if (existing === null) {
    // Regular file/dir occupies the path — conflict
    return fail(
      "LINK_CONFLICT",
      `Non-symlink already exists at: ${linkPath}`,
      `Remove it manually then re-run tfc_install`,
    );
  }
  if (existing === targetPath) return ok("exists");

  // Symlink points elsewhere — hard stop, never repoint silently
  return fail(
    "LINK_CONFLICT",
    `Symlink at ${linkPath} already points to: ${existing}`,
    `Expected: ${targetPath}. Remove it manually then re-run tfc_install`,
  );
}

// ── installSkill ──────────────────────────────────────────────────────────────

export async function installSkill(input: {
  category: string;
  name: string;
  dryRun: boolean;
}): Promise<Result<InstallResult>> {
  const { category, name, dryRun } = input;

  // 1. Compute dir and realpath-check BEFORE any reads — catches a planted
  //    symlink inside TFC_SKILLS pointing outside allowed roots.
  const skillDirR = skillDir(category, name);
  if (!skillDirR.ok) return fail("BAD_INPUT", skillDirR.error.message);
  const dir = skillDirR.path;

  const realDir = await fsPromises.realpath(dir).catch(() => dir);
  // Compare against REALPATH'd allowed roots: TFC_HOME itself may be a symlink
  // (e.g. ~/.future-code → /repo/.future-code). The guard still catches a planted
  // symlink that escapes the safe zone — it just resolves the roots the same way.
  const realRoots = await Promise.all(
    ALLOWED_ROOTS.map((r) => fsPromises.realpath(r).catch(() => r)),
  );
  const underRealRoot = realRoots.some(
    (root) => realDir === root || realDir.startsWith(root + nodePath.sep),
  );
  if (!underRealRoot) {
    return fail(
      "PATH_ESCAPE",
      `Skill dir resolves outside allowed roots: ${realDir}`,
      `${dir} is a symlink to ${realDir} which escapes the safe zone`,
    );
  }

  // 2. Validate — blocking failures stop install
  const valR = await validateSkill({ category, name });
  if (!valR.ok) return valR;
  const blocking = valR.data.blocking.filter((g) => !g.passed);
  if (blocking.length > 0) {
    return fail(
      "VALIDATION_FAILED",
      `${blocking.length} blocking gate(s) failed: ${blocking.map((g) => g.id).join(", ")}`,
      "Fix gates then re-run tfc_install",
    );
  }

  // 2.5 Inject the Wave-3 runtime hook into the SOURCE SKILL.md (the symlink target).
  //     Idempotent: re-install refreshes the managed block, never duplicates it.
  const sourceSkillMd = nodePath.join(dir, "SKILL.md");
  let preambleHook: InstallResult["preambleHook"] = "current";
  {
    const mdR = await readText(sourceSkillMd);
    if (!mdR.ok) return fail(mdR.error.code, mdR.error.message);
    const injected = injectPreambleHook(mdR.data, category, name);
    if (injected.changed) {
      if (dryRun) {
        preambleHook = "planned";
      } else {
        const wR = await writeText(sourceSkillMd, injected.text);
        if (!wR.ok) return fail(wR.error.code, wR.error.message);
        preambleHook = "injected";
      }
    }
  }

  const claudeLinkR = claudeLink(name);
  if (!claudeLinkR.ok) return fail("BAD_INPUT", claudeLinkR.error.message);
  // Claude link: ~/.claude/skills/{name}/SKILL.md -> {dir}/SKILL.md
  const claudeLinkDir = claudeLinkR.path;
  const claudeLinkFile = nodePath.join(claudeLinkDir, "SKILL.md");
  const claudeTarget = nodePath.join(dir, "SKILL.md");

  const spawnerLinkR = spawnerLink(category, `${name}-tfc`);
  if (!spawnerLinkR.ok) return fail("BAD_INPUT", spawnerLinkR.error.message);
  const spawnerLinkPath = spawnerLinkR.path;

  // 3. Create symlinks
  const clR = await ensureSymlink(claudeLinkFile, claudeTarget, dryRun);
  if (!clR.ok) return clR;

  const spR = await ensureSymlink(spawnerLinkPath, dir, dryRun);
  if (!spR.ok) {
    // Roll back claude link if we just created it
    if (!dryRun && clR.data === "created") {
      await fsPromises.unlink(claudeLinkFile).catch(() => undefined);
      await fsPromises
        .rmdir(claudeLinkDir)
        .catch(() => undefined);
    }
    return spR;
  }

  return ok({
    claudeLink: clR.data,
    spawnerLink: spR.data,
    validated: true,
    preambleHook,
  });
}

// ── registerSkill ─────────────────────────────────────────────────────────────

export async function registerSkill(input: {
  category: string;
  name: string;
}): Promise<Result<{ spawnerLink: string; hint: string }>> {
  const { category, name } = input;

  // register = ensure the -tfc spawner symlink exists (same as install but no claude link)
  const skillDirR = skillDir(category, name);
  if (!skillDirR.ok) return fail("BAD_INPUT", skillDirR.error.message);
  const dir = skillDirR.path;

  if (!(await exists(dir))) {
    return fail("NOT_FOUND", `Skill not found: ${category}/${name}`, "run tfc_new first");
  }

  const spawnerLinkR = spawnerLink(category, `${name}-tfc`);
  if (!spawnerLinkR.ok) return fail("BAD_INPUT", spawnerLinkR.error.message);
  const linkPath = spawnerLinkR.path;

  const spR = await ensureSymlink(linkPath, dir, false);
  if (!spR.ok) return spR;

  return ok({
    spawnerLink: linkPath,
    hint: `Run: spawner_skills(action="search", query="${name}") to confirm discovery`,
  });
}

// ── listSkills ────────────────────────────────────────────────────────────────

async function checkLinkState(
  linkPath: string,
  expectedTarget: string,
): Promise<"ok" | "missing" | "dangling" | "conflict"> {
  const st = await symlinkStat(linkPath);
  if (st === "none") return "missing";
  if (st === "broken") return "dangling";
  const target = await readLinkTarget(linkPath);
  if (target === null) return "conflict"; // regular file at that path
  if (target === expectedTarget) return "ok";
  return "conflict";
}

/**
 * W2: is a skill invokable? True iff BOTH managed symlinks resolve to the skill's dir.
 * A pure read of disk link state — fed into recomputeLane as the `reachable` overlay input.
 */
export async function skillReachable(
  category: string,
  name: string,
): Promise<boolean> {
  const dir = nodePath.join(TFC_SKILLS, category, name);
  const claudeLinkR = claudeLink(name);
  const spawnerLinkR = spawnerLink(category, `${name}-tfc`);
  if (!claudeLinkR.ok || !spawnerLinkR.ok) return false;
  const claudeState = await checkLinkState(
    nodePath.join(claudeLinkR.path, "SKILL.md"),
    nodePath.join(dir, "SKILL.md"),
  );
  const spawnerState = await checkLinkState(spawnerLinkR.path, dir);
  return claudeState === "ok" && spawnerState === "ok";
}

export async function listSkills(input: {
  brokenOnly: boolean;
}): Promise<Result<ListResult>> {
  const { brokenOnly } = input;

  const categoriesR = await listDirs(TFC_SKILLS);
  if (!categoriesR.ok) return categoriesR;

  const skills: SkillEntry[] = [];

  for (const cat of categoriesR.data) {
    if (cat === "_template") continue;
    const catPath = nodePath.join(TFC_SKILLS, cat);
    const namesR = await listDirs(catPath);
    if (!namesR.ok) continue;

    for (const nm of namesR.data) {
      const dir = nodePath.join(TFC_SKILLS, cat, nm);

      const claudeLinkR = claudeLink(nm);
      const spawnerLinkR = spawnerLink(cat, `${nm}-tfc`);

      const claudeLinkFile = claudeLinkR.ok
        ? nodePath.join(claudeLinkR.path, "SKILL.md")
        : "";
      const spawnerLinkPath = spawnerLinkR.ok ? spawnerLinkR.path : "";

      const claudeState = claudeLinkR.ok
        ? await checkLinkState(claudeLinkFile, nodePath.join(dir, "SKILL.md"))
        : "missing";
      const spawnerState = spawnerLinkR.ok
        ? await checkLinkState(spawnerLinkPath, dir)
        : "missing";

      const reachable = claudeState === "ok" && spawnerState === "ok";
      const laneR = await recomputeLane(cat, nm, { reachable });
      const lane: Lane | "unknown" = laneR.ok ? laneR.data.lane : "unknown";
      const effectiveLane: Lane | "blocked" | "unknown" = laneR.ok
        ? laneR.data.effectiveLane
        : "unknown";

      const entry: SkillEntry = {
        category: cat,
        name: nm,
        dir,
        lane,
        effectiveLane,
        reachable,
        claudeLinkState: claudeState,
        spawnerLinkState: spawnerState,
      };

      if (brokenOnly) {
        if (claudeState !== "ok" || spawnerState !== "ok") {
          skills.push(entry);
        }
      } else {
        skills.push(entry);
      }
    }
  }

  return ok({ skills });
}
