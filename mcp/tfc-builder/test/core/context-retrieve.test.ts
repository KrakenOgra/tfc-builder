import * as fsPromises from "node:fs/promises";
import * as nodePath from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { TFC_SKILLS } from "../../src/core/paths.js";
import {
  estimateTokens,
  getContext,
  parseContextFile,
} from "../../src/core/context-retrieve.js";

const TEST_CATEGORY = "test-cce-retrieve";
const TEST_DIR = nodePath.join(TFC_SKILLS, TEST_CATEGORY);

afterAll(async () => {
  await fsPromises.rm(TEST_DIR, { recursive: true, force: true }).catch(() => undefined);
});

async function writeContextFile(skill: string, file: string, content: string): Promise<void> {
  const dir = nodePath.join(TEST_DIR, skill, "context");
  await fsPromises.mkdir(dir, { recursive: true });
  await fsPromises.writeFile(nodePath.join(dir, file), content, "utf-8");
}

describe("parseContextFile", () => {
  it("splits sections, strips a per-section source line, flags empties", () => {
    const md = [
      "---",
      "last_verified: 2026-06-22",
      "source: file-level-fallback",
      "---",
      "",
      "## Filled",
      "source: SKILL.md#hooks",
      "Real body text here.",
      "",
      "## Empty",
      "",
    ].join("\n");
    const pf = parseContextFile("hooks.md", md);
    expect(pf.frontmatterSource).toBe("file-level-fallback");
    expect(pf.sections).toHaveLength(2);
    const filled = pf.sections.find((s) => s.header === "Filled")!;
    expect(filled.isEmpty).toBe(false);
    expect(filled.body).toBe("Real body text here.");
    expect(filled.source).toBe("SKILL.md#hooks"); // per-section beats frontmatter
    const empty = pf.sections.find((s) => s.header === "Empty")!;
    expect(empty.isEmpty).toBe(true);
    expect(empty.source).toBe("file-level-fallback"); // falls back to frontmatter
  });
});

describe("estimateTokens", () => {
  it("is deterministic chars/4", () => {
    expect(estimateTokens("12345678")).toBe(2);
    expect(estimateTokens("")).toBe(0);
  });
});

describe("getContext", () => {
  it("ranks the task-matching section first and returns its sourced body", async () => {
    await writeContextFile(
      "alpha",
      "hooks.md",
      [
        "---",
        "last_verified: 2026-06-22",
        "---",
        "",
        "## Scroll-Stopping Openers",
        "source: reel-forge/SKILL.md",
        "Open on motion, not a face.",
        "",
        "## Emotional Hooks",
        "",
      ].join("\n"),
    );
    const r = await getContext({ name: "alpha", task: "scroll-stopping openers" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.sections[0]!.header).toBe("Scroll-Stopping Openers");
    expect(r.data.sections[0]!.body).toBe("Open on motion, not a face.");
    expect(r.data.sections[0]!.source).toBe("reel-forge/SKILL.md");
    expect(r.data.sectionsTotal).toBe(2);
    expect(r.data.sectionsNonEmpty).toBe(1);
    expect(r.data.coverage).toBeCloseTo(0.5, 5);
    expect(r.data.healthy).toBe(true); // coverage>0 AND a returned section is sourced
  });

  it("empty stubs ⇒ explicit coverage:0/healthy:false verdict, never []", async () => {
    await writeContextFile(
      "beta",
      "hooks.md",
      ["---", "last_verified: 2026-06-22", "---", "", "## Empty A", "", "## Empty B", ""].join("\n"),
    );
    const r = await getContext({ name: "beta", task: "anything" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.coverage).toBe(0);
    expect(r.data.healthy).toBe(false);
    expect(r.data.sectionsTotal).toBe(2);
  });

  it("is deterministic — identical requests return identical output (INV-4)", async () => {
    const a = await getContext({ name: "alpha", task: "openers hooks" });
    const b = await getContext({ name: "alpha", task: "openers hooks" });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("unknown skill fails closed", async () => {
    const r = await getContext({ name: "no-such-skill-xyz", task: "x" });
    expect(r.ok).toBe(false);
  });
});
