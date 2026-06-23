import * as fsPromises from "node:fs/promises";
import * as nodePath from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { TFC_SKILLS } from "../../src/core/paths.js";
import { discoverDomains } from "../../src/core/context-discover.js";

const TEST_CATEGORY = "test-cce-disc";
const TEST_DIR = nodePath.join(TFC_SKILLS, TEST_CATEGORY);

afterAll(async () => {
  await fsPromises.rm(TEST_DIR, { recursive: true, force: true }).catch(() => undefined);
});

async function writeManifest(skill: string, yaml: string): Promise<void> {
  const dir = nodePath.join(TEST_DIR, skill, "context");
  await fsPromises.mkdir(dir, { recursive: true });
  await fsPromises.writeFile(nodePath.join(dir, "_angles.yaml"), yaml, "utf-8");
}

describe("discoverDomains", () => {
  it("surfaces a brand-new domain from a manifest with origin=manifest (zero code change)", async () => {
    await writeManifest(
      "newdomainskill",
      [
        "domain: zzz/brand-new",
        "depth_target: 12",
        "angles:",
        "  - file: thesis.md",
        '    sections: ["## Thesis"]',
        "  - file: risk.md",
        '    sections: ["## Risk"]',
        "",
      ].join("\n"),
    );
    const r = await discoverDomains();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const d = r.data.domains.find((x) => x.domain === "zzz/brand-new");
    expect(d).toBeTruthy();
    expect(d!.origin).toBe("manifest");
    expect(d!.fileCount).toBe(2);
    expect(d!.skills).toContain(`${TEST_CATEGORY}/newdomainskill`);
  });

  it("ignores a malformed manifest (fails closed — no partial domain)", async () => {
    await writeManifest("badskill", "domain: 123\nangles: not-a-list\n");
    const r = await discoverDomains();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // a manifest with a non-string domain / non-array angles contributes nothing
    expect(r.data.domains.every((x) => x.domain !== "123")).toBe(true);
  });
});
