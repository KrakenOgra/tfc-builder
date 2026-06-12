import * as fsPromises from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { copyDir, ensureDir, exists, listDirs, readText, writeText } from "../../src/core/fs.js";
import { TFC_TEMPLATE } from "../../src/core/paths.js";

describe("fs", () => {
  const tmpBase = path.join(os.tmpdir(), `tfc-builder-test-${Date.now()}`);

  afterEach(async () => {
    await fsPromises.rm(tmpBase, { recursive: true, force: true }).catch(() => undefined);
  });

  it("copyDir copies _template (3 files) and exists reports all three", async () => {
    const dest = path.join(tmpBase, "skill-copy");
    const r = await copyDir(TFC_TEMPLATE, dest);
    expect(r.ok).toBe(true);
    expect(await exists(path.join(dest, "SKILL.md"))).toBe(true);
    expect(await exists(path.join(dest, "spec.yaml"))).toBe(true);
    expect(await exists(path.join(dest, "validations.yaml"))).toBe(true);
  });

  it("exists returns false for a non-existent path", async () => {
    expect(await exists(path.join(tmpBase, "ghost.txt"))).toBe(false);
  });

  it("readText returns NOT_FOUND for missing file", async () => {
    const r = await readText(path.join(tmpBase, "nope.txt"));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("NOT_FOUND");
  });

  it("writeText + readText round-trips content", async () => {
    const p = path.join(tmpBase, "rw.txt");
    await ensureDir(tmpBase);
    const w = await writeText(p, "hello tfc");
    expect(w.ok).toBe(true);
    const r = await readText(p);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toBe("hello tfc");
  });

  it("listDirs returns directory names only", async () => {
    const dir = path.join(tmpBase, "listing");
    await fsPromises.mkdir(path.join(dir, "sub-a"), { recursive: true });
    await fsPromises.mkdir(path.join(dir, "sub-b"), { recursive: true });
    await fsPromises.writeFile(path.join(dir, "file.txt"), "x");
    const r = await listDirs(dir);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.sort()).toEqual(["sub-a", "sub-b"]);
  });
});
