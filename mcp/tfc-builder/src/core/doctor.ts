import * as fsPromises from "node:fs/promises";
import * as nodePath from "node:path";
import { ok, type Result } from "./result.js";
import { TFC_HOME, TFC_TEMPLATE } from "./paths.js";
import { listSkills } from "./install.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DoctorCheck {
  id: string;
  passed: boolean;
  detail: string;
  fix: string;
}

export interface DoctorReport {
  checks: DoctorCheck[];
  healthy: boolean;
}

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
    fix: `Run: tfc install <category> <name> for each broken skill`,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function runDoctor(): Promise<Result<DoctorReport>> {
  const checks = await Promise.all([
    checkHome(),
    checkMcpRegistration(),
    checkDistFresh(),
    checkSkillLinks(),
  ]);
  return ok({ checks, healthy: checks.every((c) => c.passed) });
}
