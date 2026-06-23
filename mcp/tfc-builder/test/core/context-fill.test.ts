import * as fsPromises from "node:fs/promises";
import * as nodePath from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TFC_HOME, TFC_SKILLS } from "../../src/core/paths.js";
import { buildFillPrompt } from "../../src/core/context-fill.js";

const TEST_CATEGORY = "test-cce-fill";
const TEST_DIR = nodePath.join(TFC_SKILLS, TEST_CATEGORY);
const TAXONOMY = nodePath.join(TFC_HOME, "context-taxonomy.yaml");

// The vitest sandbox (test/setup.ts) copies only _template into TFC_HOME — no taxonomy. Provision a
// dedicated test domain so the fill step has an angle set without colliding with real domains.
const TAXONOMY_YAML = [
  'version: "1.0"',
  "domains:",
  "  test/social:",
  "    required_files:",
  "      - name: hooks.md",
  '        sections: ["## Emotional Hooks", "## Scroll-Stopping Openers"]',
  '        fill_hint: "List proven hook formulas + one example each."',
  "",
].join("\n");

beforeAll(async () => {
  await fsPromises.writeFile(TAXONOMY, TAXONOMY_YAML, "utf-8");
});

afterAll(async () => {
  await fsPromises.rm(TEST_DIR, { recursive: true, force: true }).catch(() => undefined);
  await fsPromises.rm(TAXONOMY, { force: true }).catch(() => undefined);
});

async function makeSkill(name: string, files: Record<string, string>): Promise<void> {
  const dir = nodePath.join(TEST_DIR, name);
  await fsPromises.mkdir(dir, { recursive: true });
  for (const [f, content] of Object.entries(files)) {
    await fsPromises.writeFile(nodePath.join(dir, f), content, "utf-8");
  }
}

describe("buildFillPrompt", () => {
  it("harvests grounded sources and emits angles + provenance rules", async () => {
    await makeSkill("withsrc", {
      "SKILL.md": "# withsrc\nA reel skill. Use loss-aversion openers on the first frame.",
    });
    const r = await buildFillPrompt({ name: "withsrc", domain: "test/social" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.sources.some((s) => s.label.endsWith("SKILL.md"))).toBe(true);
    expect(r.data.angles.map((a) => a.file)).toContain("hooks.md");
    expect(r.data.prompt).toMatch(/source: <one of the source labels/);
    expect(r.data.prompt).toMatch(/TODO\(unsourced\)/); // honesty escape hatch
  });

  it("fails closed with NO_SOURCES when nothing grounded exists (no fabrication)", async () => {
    await makeSkill("nosrc", { "spec.yaml": "" }); // empty spec, no SKILL.md
    const r = await buildFillPrompt({ name: "nosrc", domain: "test/social" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("NO_SOURCES");
  });

  it("rejects an unknown domain", async () => {
    await makeSkill("withsrc2", { "SKILL.md": "# x\nbody" });
    const r = await buildFillPrompt({ name: "withsrc2", domain: "no/such-domain" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("BAD_INPUT");
  });

  it("INV-4: buildFillPrompt emits a prompt template and does NOT write context files to disk", async () => {
    await makeSkill("inv4skill", {
      "SKILL.md": "# inv4skill\nTest skill for INV-4 verification.",
    });
    const skillDir = nodePath.join(TEST_DIR, "inv4skill");
    const contextDir = nodePath.join(skillDir, "context");

    // Verify context/ does not exist before the call
    const beforeExists = await fsPromises
      .access(contextDir)
      .then(() => true)
      .catch(() => false);
    expect(beforeExists).toBe(false);

    const r = await buildFillPrompt({ name: "inv4skill", domain: "test/social" });

    // The call must succeed and return a prompt string
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(typeof r.data.prompt).toBe("string");
    expect(r.data.prompt.length).toBeGreaterThan(0);

    // INV-4: context/ must still not exist — tfc_context_fill never writes files
    const afterExists = await fsPromises
      .access(contextDir)
      .then(() => true)
      .catch(() => false);
    expect(afterExists).toBe(false);
  });
});
