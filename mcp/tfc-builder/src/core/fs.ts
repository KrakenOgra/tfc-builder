import * as fsPromises from "node:fs/promises";
import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";

export async function readText(p: string): Promise<Result<string>> {
  try {
    const content = await fsPromises.readFile(p, "utf-8");
    return ok(content);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return fail("NOT_FOUND", `File not found: ${p}`);
    return fail("READ_ERROR", `Failed to read ${p}: ${String(e)}`);
  }
}

export async function writeText(
  p: string,
  content: string,
): Promise<Result<undefined>> {
  try {
    await fsPromises.writeFile(p, content, "utf-8");
    return ok(undefined);
  } catch (e) {
    return fail("WRITE_ERROR", `Failed to write ${p}: ${String(e)}`);
  }
}

export async function ensureDir(p: string): Promise<Result<undefined>> {
  try {
    await fsPromises.mkdir(p, { recursive: true });
    return ok(undefined);
  } catch (e) {
    return fail("MKDIR_ERROR", `Failed to create directory ${p}: ${String(e)}`);
  }
}

export async function exists(p: string): Promise<boolean> {
  try {
    await fsPromises.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function copyDir(
  src: string,
  dest: string,
): Promise<Result<undefined>> {
  const dirResult = await ensureDir(dest);
  if (!dirResult.ok) return dirResult;

  let entries: { name: string; isDirectory: () => boolean }[];
  try {
    entries = await fsPromises.readdir(src, { withFileTypes: true, encoding: "utf-8" });
  } catch (e) {
    return fail("READ_ERROR", `Failed to read directory ${src}: ${String(e)}`);
  }

  for (const entry of entries) {
    const srcPath = nodePath.join(src, entry.name);
    const destPath = nodePath.join(dest, entry.name);
    if (entry.isDirectory()) {
      const sub = await copyDir(srcPath, destPath);
      if (!sub.ok) return sub;
    } else {
      try {
        await fsPromises.copyFile(srcPath, destPath);
      } catch (e) {
        return fail(
          "WRITE_ERROR",
          `Failed to copy ${srcPath} → ${destPath}: ${String(e)}`,
        );
      }
    }
  }

  return ok(undefined);
}

export async function listDirs(p: string): Promise<Result<string[]>> {
  try {
    const entries = await fsPromises.readdir(p, { withFileTypes: true, encoding: "utf-8" });
    return ok(entries.filter((e) => e.isDirectory()).map((e) => e.name as string));
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return fail("NOT_FOUND", `Directory not found: ${p}`);
    return fail("READ_ERROR", `Failed to list ${p}: ${String(e)}`);
  }
}
