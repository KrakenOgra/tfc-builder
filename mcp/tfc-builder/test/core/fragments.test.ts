import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs/promises";
import * as nodePath from "node:path";
import { resolveImports, fragmentExists } from "../../src/core/fragments.js";
import { TFC_FRAGMENTS } from "../../src/core/paths.js";

const ID = "test-ground-fragment";
const DIR = nodePath.join(TFC_FRAGMENTS, ID);

beforeAll(async () => {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(
    nodePath.join(DIR, "fragment.md"),
    "## GROUND (test)\nground your crux before amplifying.\n",
  );
});

afterAll(async () => {
  await fs.rm(DIR, { recursive: true, force: true });
});

describe("fragments (v3 W4 — protocol inheritance)", () => {
  it("fragmentExists: true for a real fragment, false for a missing one", () => {
    expect(fragmentExists(ID)).toBe(true);
    expect(fragmentExists("nope-not-here")).toBe(false);
  });

  it("resolveImports inlines the fragment markdown with a provenance marker", async () => {
    const r = await resolveImports([ID]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toContain("## GROUND (test)");
    expect(r.data).toContain(`imported fragment: ${ID}`);
  });

  it("resolveImports fails-closed on a missing fragment (INV-5)", async () => {
    const r = await resolveImports(["does-not-exist"]);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("NOT_FOUND");
  });
});
