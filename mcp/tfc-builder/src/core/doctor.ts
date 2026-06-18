import * as fsPromises from "node:fs/promises";
import * as nodePath from "node:path";
import { ok, type Result } from "./result.js";
import { TFC_HOME, TFC_SKILLS, TFC_TEMPLATE } from "./paths.js";
import { listSkills } from "./install.js";
import { recomputeLane } from "./lane.js";
import { auditCapture, type CaptureAuditEntry } from "./capture.js";
import type { Lane } from "./types.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DoctorCheck {
  id: string;
  passed: boolean;
  detail: string;
  fix: string;
}

// Wave 5: the forge grades itself. One lane row per installed TFC skill, recomputed
// from disk — never the spec.yaml cache. The flags are the cross-system currency.
export interface SkillLaneStatus {
  category: string;
  name: string;
  lane: Lane | "unknown";
  /** spec.yaml lane.state disagrees with the recomputation */
  cacheDrift: boolean;
  /** an eval-report exists but its skill_version no longer matches spec.version */
  evalStale: boolean;
  /** eval_proven AND ≥3 unconsumed learnings waiting — the loop is ready to close */
  evolvePending: boolean;
  /** files in the skill dir outside the 4-layer+PROVE contract (INV-6) */
  strayFiles: string[];
  /** Wave 1: the SKILL.md carries the runtime capture hook (loop input is wired) */
  captureWired: boolean;
  /** Wave 1: empty learnings.jsonl AND zero runs rows — the loop has never run here */
  neverInvoked: boolean;
}

export interface DoctorReport {
  checks: DoctorCheck[];
  skills: SkillLaneStatus[];
  healthy: boolean;
}

// The only files a skill dir may contain (INV-4 four-layer + PROVE lane). Anything
// else is stray state — INV-6 forbids a second store; history = CHANGELOG + Mind.
const CONTRACT_FILES = new Set<string>([
  "SKILL.md",
  "spec.yaml",
  "validations.yaml",
  "evals.yaml",
  "eval-report.json",
  "CHANGELOG.jsonl",
  "learnings.jsonl",
]);

// ── Check helpers ─────────────────────────────────────────────────────────────

async function maxMtime(dir: string): Promise<number> {
  let max = 0;
  try {
    const entries = await fsPromises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = nodePath.join(dir, entry.name);
      if (entry.isDirectory()) {
        max = Math.max(max, await maxMtime(full));
      } else if (entry.isFile()) {
        const s = await fsPromises.stat(full);
        max = Math.max(max, s.mtimeMs);
      }
    }
  } catch {
    // skip unreadable entries
  }
  return max;
}

// ── Individual checks ─────────────────────────────────────────────────────────

async function checkHome(): Promise<DoctorCheck> {
  const id = "tfc-home-valid";
  try {
    const s = await fsPromises.stat(TFC_HOME);
    if (!s.isDirectory()) {
      return {
        id,
        passed: false,
        detail: `${TFC_HOME} exists but is not a directory`,
        fix: `Remove it and create a symlink: ln -s ~/vibeship-x-kraken/.future-code ~/.future-code`,
      };
    }
    await fsPromises.stat(TFC_TEMPLATE);
    return { id, passed: true, detail: `${TFC_HOME} resolves and _template exists`, fix: "" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      id,
      passed: false,
      detail: `Cannot access ${TFC_HOME}: ${msg}`,
      fix: `Create symlink: ln -s ~/vibeship-x-kraken/.future-code ~/.future-code`,
    };
  }
}

async function checkMcpRegistration(): Promise<DoctorCheck> {
  const id = "mcp-registered";
  const mcpJsonPath = nodePath.join(process.env["HOME"] ?? "/tmp", ".mcp.json");
  try {
    const text = await fsPromises.readFile(mcpJsonPath, "utf-8");
    const config = JSON.parse(text) as Record<string, unknown>;
    const servers = (config["mcpServers"] ?? {}) as Record<string, { args?: string[] }>;
    const entry = servers["tfc-builder"];
    if (!entry) {
      return {
        id,
        passed: false,
        detail: "tfc-builder not found in ~/.mcp.json mcpServers block",
        fix: `Add entry from ${TFC_HOME}/mcp/tfc-builder/docs/mcp-json-snippet.json`,
      };
    }
    const serverPath = entry.args?.[0];
    if (!serverPath) {
      return {
        id,
        passed: false,
        detail: "tfc-builder mcpServers entry has no args[0] (server path)",
        fix: `Set args[0] to the absolute path of dist/server.js`,
      };
    }
    try {
      await fsPromises.access(serverPath);
      return { id, passed: true, detail: `Registered at ${serverPath} — file exists`, fix: "" };
    } catch {
      const pkgDir = nodePath.dirname(nodePath.dirname(serverPath));
      return {
        id,
        passed: false,
        detail: `Registered path does not exist: ${serverPath}`,
        fix: `Run: cd ${pkgDir} && npm run build`,
      };
    }
  } catch {
    return {
      id,
      passed: false,
      detail: `Cannot read ${mcpJsonPath}`,
      fix: "Create ~/.mcp.json with a tfc-builder mcpServers entry",
    };
  }
}

async function checkDistFresh(): Promise<DoctorCheck> {
  const id = "dist-fresh";
  const pkgDir = nodePath.join(TFC_HOME, "mcp", "tfc-builder");
  const serverDist = nodePath.join(pkgDir, "dist", "server.js");
  const srcDir = nodePath.join(pkgDir, "src");
  try {
    const distStat = await fsPromises.stat(serverDist);
    const srcMax = await maxMtime(srcDir);
    if (srcMax > distStat.mtimeMs) {
      return {
        id,
        passed: false,
        detail: `dist/server.js is stale (src changed ${new Date(srcMax).toISOString()}, dist built ${new Date(distStat.mtimeMs).toISOString()})`,
        fix: `Run: cd ${pkgDir} && npm run build`,
      };
    }
    return { id, passed: true, detail: "dist/server.js is up to date", fix: "" };
  } catch {
    return {
      id,
      passed: false,
      detail: `dist/server.js does not exist — server has never been built`,
      fix: `Run: cd ${pkgDir} && npm run build`,
    };
  }
}

async function checkSkillLinks(): Promise<DoctorCheck> {
  const id = "skill-symlinks";
  const r = await listSkills({ brokenOnly: false });
  if (!r.ok) {
    return {
      id,
      passed: false,
      detail: `Cannot list skills: ${r.error.message}`,
      fix: "Fix tfc-home-valid first",
    };
  }
  const broken = r.data.skills.filter(
    (s) => s.claudeLinkState !== "ok" || s.spawnerLinkState !== "ok",
  );
  if (broken.length === 0) {
    const count = r.data.skills.length;
    return {
      id,
      passed: true,
      detail: count === 0 ? "No skills installed yet" : `All ${count} skill symlinks are ok`,
      fix: "",
    };
  }
  const names = broken.map((s) => `${s.category}/${s.name}`).join(", ");
  return {
    id,
    passed: false,
    detail: `${broken.length} skill(s) have broken/missing symlinks: ${names}`,
    fix: `Run: tfc relink   (recreates missing TFC symlinks + de-dups identical stale copies; reports real conflicts for human decision)`,
  };
}

// ── Lane aggregation (Wave 5) ───────────────────────────────────────────────────

async function countUnconsumedLearnings(dir: string): Promise<number> {
  const p = nodePath.join(dir, "learnings.jsonl");
  try {
    const text = await fsPromises.readFile(p, "utf-8");
    let n = 0;
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      try {
        const o = JSON.parse(line) as { consumed_in?: unknown };
        if (o.consumed_in == null) n++;
      } catch {
        // a malformed line never counts as input
      }
    }
    return n;
  } catch {
    return 0;
  }
}

async function strayFilesIn(dir: string): Promise<string[]> {
  try {
    const entries = await fsPromises.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && !CONTRACT_FILES.has(e.name))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

async function gatherSkillLanes(): Promise<SkillLaneStatus[]> {
  const listR = await listSkills({ brokenOnly: false });
  if (!listR.ok) return [];
  // Wave 1: read the loop's input side once (runs.jsonl + per-skill learnings/hook state).
  const captureByKey = new Map<string, CaptureAuditEntry>();
  const capR = await auditCapture();
  if (capR.ok) for (const c of capR.data.skills) captureByKey.set(c.skill, c);
  const cap = (cat: string, nm: string): { captureWired: boolean; neverInvoked: boolean } => {
    const c = captureByKey.get(`${cat}/${nm}`);
    return { captureWired: c?.hookWired ?? false, neverInvoked: c?.neverInvoked ?? true };
  };

  const out: SkillLaneStatus[] = [];
  for (const s of listR.data.skills) {
    const strayFiles = await strayFilesIn(s.dir);
    const vR = await recomputeLane(s.category, s.name, { reachable: s.reachable });
    if (!vR.ok) {
      out.push({
        category: s.category,
        name: s.name,
        lane: "unknown",
        cacheDrift: false,
        evalStale: false,
        evolvePending: false,
        strayFiles,
        ...cap(s.category, s.name),
      });
      continue;
    }
    const v = vR.data;
    const evalStale = v.inputs.hasEvalReport && !v.inputs.evalFresh;
    const unconsumed = await countUnconsumedLearnings(s.dir);
    out.push({
      category: s.category,
      name: s.name,
      lane: v.lane,
      cacheDrift: v.cacheDrift,
      evalStale,
      evolvePending: v.lane === "eval_proven" && unconsumed >= 3,
      strayFiles,
      ...cap(s.category, s.name),
    });
  }
  out.sort((a, b) =>
    `${a.category}/${a.name}`.localeCompare(`${b.category}/${b.name}`),
  );
  return out;
}

// Wave 1: the loop's input side is wired. Passes when every skill carries the capture hook;
// reports how many wired skills have never actually run (an honest-empty, not a failure).
function checkCaptureWired(skills: SkillLaneStatus[]): DoctorCheck {
  const id = "capture-wired";
  const unwired = skills.filter((s) => !s.captureWired);
  const neverInvoked = skills.filter((s) => s.neverInvoked).length;
  if (unwired.length === 0) {
    return {
      id,
      passed: true,
      detail:
        skills.length === 0
          ? "No skills installed yet"
          : `All ${skills.length} skill(s) have the capture hook (${neverInvoked} never invoked yet)`,
      fix: "",
    };
  }
  return {
    id,
    passed: false,
    detail: `${unwired.length} skill(s) missing the capture hook: ${unwired
      .map((s) => `${s.category}/${s.name}`)
      .join(", ")}`,
    fix: "Run: tfc capture   (injects the runtime hook into every skill's SKILL.md)",
  };
}

function checkLaneDrift(skills: SkillLaneStatus[]): DoctorCheck {
  const id = "lane-cache-drift";
  const drifted = skills.filter((s) => s.cacheDrift);
  const stale = skills.filter((s) => s.evalStale);
  if (drifted.length === 0 && stale.length === 0) {
    return {
      id,
      passed: true,
      detail: `${skills.length} skill(s) lane-consistent — no cacheDrift, no evalStale`,
      fix: "",
    };
  }
  const parts: string[] = [];
  if (drifted.length)
    parts.push(
      `cacheDrift: ${drifted.map((s) => `${s.category}/${s.name}`).join(", ")}`,
    );
  if (stale.length)
    parts.push(
      `evalStale: ${stale.map((s) => `${s.category}/${s.name}`).join(", ")}`,
    );
  return {
    id,
    passed: false,
    detail: parts.join(" | "),
    fix: "Recompute with tfc_lane <cat> <name>; sync spec.yaml lane.state to it, or re-eval if the report is version-stale.",
  };
}

function checkStateContract(skills: SkillLaneStatus[]): DoctorCheck {
  const id = "state-contract"; // INV-6 enforcement
  const offenders = skills.filter((s) => s.strayFiles.length > 0);
  if (offenders.length === 0) {
    return {
      id,
      passed: true,
      detail: "No state files outside the contract (INV-6 holds)",
      fix: "",
    };
  }
  const detail = offenders
    .map((s) => `${s.category}/${s.name}: ${s.strayFiles.join(", ")}`)
    .join(" | ");
  return {
    id,
    passed: false,
    detail: `Stray state files (INV-6): ${detail}`,
    fix: "Remove them — a skill's history lives in CHANGELOG.jsonl + Mind, not a per-skill DB/scratch file.",
  };
}

// ── Charter gates (V4: machine-checkable claims) ─────────────────────────────

async function checkLoopAutoCloses(): Promise<DoctorCheck> {
  const id = "charter-loop-auto-closes";
  const settingsPath = nodePath.join(
    process.env["HOME"] ?? "/tmp",
    ".claude",
    "settings.json",
  );
  try {
    const text = await fsPromises.readFile(settingsPath, "utf-8");
    const settings = JSON.parse(text) as {
      hooks?: { PostToolUse?: Array<{ matcher: string; hooks: Array<{ command?: string }> }> };
    };
    const pt = settings.hooks?.PostToolUse ?? [];
    const skillEntry = pt.find((e) => e.matcher === "^(Skill)$");
    const captureHook = skillEntry?.hooks.find(
      (h) => typeof h.command === "string" && h.command.includes("tfc-capture"),
    );
    if (captureHook) {
      return {
        id,
        passed: true,
        detail: `PostToolUse capture hook wired: ${captureHook.command ?? ""}`,
        fix: "",
      };
    }
    return {
      id,
      passed: false,
      detail: "No TFC capture hook in ~/.claude/settings.json PostToolUse[^(Skill)$]",
      fix: "Add posttooluse-tfc-capture.sh to the ^(Skill)$ PostToolUse hooks array",
    };
  } catch (err) {
    return {
      id,
      passed: false,
      detail: `Cannot read ~/.claude/settings.json: ${err instanceof Error ? err.message : String(err)}`,
      fix: "Ensure ~/.claude/settings.json is valid JSON",
    };
  }
}

async function checkNoStubs(): Promise<DoctorCheck> {
  const id = "charter-no-stubs";
  let stubCount = 0;
  const offenders: string[] = [];
  try {
    const cats = await fsPromises.readdir(TFC_SKILLS, { withFileTypes: true });
    for (const cat of cats) {
      if (!cat.isDirectory() || cat.name === "_template") continue;
      const catPath = nodePath.join(TFC_SKILLS, cat.name);
      const skills = await fsPromises.readdir(catPath, { withFileTypes: true });
      for (const skill of skills) {
        if (!skill.isDirectory()) continue;
        const lPath = nodePath.join(catPath, skill.name, "learnings.jsonl");
        try {
          const text = await fsPromises.readFile(lPath, "utf-8");
          for (const line of text.split("\n")) {
            if (!line.trim()) continue;
            try {
              const r = JSON.parse(line) as { insight?: unknown };
              if (typeof r.insight === "string" && r.insight.trim() === "") {
                stubCount++;
                const key = `${cat.name}/${skill.name}`;
                if (!offenders.includes(key)) offenders.push(key);
              }
            } catch { /* malformed line */ }
          }
        } catch { /* file absent */ }
      }
    }
  } catch { /* TFC_SKILLS inaccessible */ }
  if (stubCount === 0) {
    return {
      id,
      passed: true,
      detail: 'Zero insight:"" stubs in any learnings.jsonl (INV-8 holds)',
      fix: "",
    };
  }
  return {
    id,
    passed: false,
    detail: `${stubCount} insight:"" stub(s) in: ${offenders.join(", ")}`,
    fix: 'Remove or annotate stub records — insight:"" pretends to be a learning without carrying signal (INV-8 violation)',
  };
}

const BASELINE_PATH = nodePath.join(TFC_HOME, "analytics", "tfc-doctor-baseline.json");

async function totalLearnings(): Promise<number> {
  let total = 0;
  try {
    const cats = await fsPromises.readdir(TFC_SKILLS, { withFileTypes: true });
    for (const cat of cats) {
      if (!cat.isDirectory() || cat.name === "_template") continue;
      const catPath = nodePath.join(TFC_SKILLS, cat.name);
      const skills = await fsPromises.readdir(catPath, { withFileTypes: true });
      for (const skill of skills) {
        if (!skill.isDirectory()) continue;
        const lPath = nodePath.join(catPath, skill.name, "learnings.jsonl");
        try {
          const text = await fsPromises.readFile(lPath, "utf-8");
          total += text.split("\n").filter((l) => l.trim()).length;
        } catch { /* absent */ }
      }
    }
  } catch { /* TFC_SKILLS inaccessible */ }
  return total;
}

async function checkLearningsGrowing(): Promise<DoctorCheck> {
  const id = "charter-learnings-growing";
  const current = await totalLearnings();
  let baseline = 0;
  let hasBaseline = false;
  try {
    const text = await fsPromises.readFile(BASELINE_PATH, "utf-8");
    const b = JSON.parse(text) as { total?: unknown };
    if (typeof b.total === "number") { baseline = b.total; hasBaseline = true; }
  } catch { /* first run */ }
  try {
    await fsPromises.mkdir(nodePath.join(TFC_HOME, "analytics"), { recursive: true });
    await fsPromises.writeFile(
      BASELINE_PATH,
      JSON.stringify({ total: current, ts: new Date().toISOString() }),
    );
  } catch { /* non-fatal */ }
  if (!hasBaseline) {
    return {
      id,
      passed: true,
      detail: `First run — baseline set at ${current} learnings`,
      fix: "",
    };
  }
  if (current > baseline) {
    return {
      id,
      passed: true,
      detail: `Learnings grew: ${baseline} → ${current} (+${current - baseline})`,
      fix: "",
    };
  }
  if (current === baseline) {
    return {
      id,
      passed: false,
      detail: `Learnings stagnant at ${current} since last doctor run`,
      fix: "Invoke skills and write EXECUTION RECORDs to grow the signal base",
    };
  }
  return {
    id,
    passed: false,
    detail: `Learnings shrank: ${baseline} → ${current} (${current - baseline} records lost)`,
    fix: "Check if learnings.jsonl files were accidentally truncated or deleted",
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function runDoctor(): Promise<Result<DoctorReport>> {
  const skills = await gatherSkillLanes();
  const [home, mcp, dist, links, loopAutoCloses, noStubs, learningsGrowing] =
    await Promise.all([
      checkHome(),
      checkMcpRegistration(),
      checkDistFresh(),
      checkSkillLinks(),
      checkLoopAutoCloses(),
      checkNoStubs(),
      checkLearningsGrowing(),
    ]);
  const checks: DoctorCheck[] = [
    home, mcp, dist, links,
    checkLaneDrift(skills),
    checkStateContract(skills),
    checkCaptureWired(skills),
    // V4 charter gates — machine-checkable claims
    loopAutoCloses,
    noStubs,
    { // charter-installs-healthy: alias of skill-symlinks for the charter claim
      id: "charter-installs-healthy",
      passed: links.passed,
      detail: links.passed
        ? "All TFC skill installs are healthy symlinks"
        : `Install issues detected — see skill-symlinks: ${links.detail}`,
      fix: links.fix,
    },
    learningsGrowing,
  ];
  return ok({ checks, skills, healthy: checks.every((c) => c.passed) });
}
