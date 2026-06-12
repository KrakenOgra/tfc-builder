import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildBrainstormPrompt,
  buildGeneratePrompt,
} from "../../src/core/authoring.js";
import { scaffoldSkill } from "../../src/core/scaffold.js";
import { TFC_SKILLS } from "../../src/core/paths.js";
import { PATTERNS_FRAGMENT } from "../../src/core/prompts/patterns.fragment.js";
import { ANTIPATTERNS_FRAGMENT } from "../../src/core/prompts/antipatterns.fragment.js";

const TEST_CATEGORY = "test-authoring";
const TEST_NAME = "auth-fixture";
const TEST_DIR = nodePath.join(TFC_SKILLS, TEST_CATEGORY);

beforeAll(async () => {
  await scaffoldSkill({ category: TEST_CATEGORY, name: TEST_NAME, dryRun: false });
});

afterAll(async () => {
  await fsPromises.rm(TEST_DIR, { recursive: true, force: true }).catch(() => undefined);
});

describe("buildBrainstormPrompt", () => {
  it("returns NOT_FOUND for non-existent skill with tfc_new hint", async () => {
    const r = await buildBrainstormPrompt({
      category: "nonexistent",
      name: "no-such-skill",
      intent: "test",
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("NOT_FOUND");
    expect(r.error.hint).toContain("tfc_new");
  });

  it("includes current spec.yaml content in prompt", async () => {
    const r = await buildBrainstormPrompt({
      category: TEST_CATEGORY,
      name: TEST_NAME,
      intent: "build a skill for testing prompt templates",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // The spec.yaml raw text is embedded under "Current spec.yaml" heading
    expect(r.data.prompt).toContain("Current spec.yaml");
    expect(r.data.prompt).toContain(TEST_NAME);
    expect(r.data.prompt).toContain(TEST_CATEGORY);
  });

  it("includes voice ban list (em dash + banned words)", async () => {
    const r = await buildBrainstormPrompt({
      category: TEST_CATEGORY,
      name: TEST_NAME,
      intent: "test",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.prompt).toContain("em dash");
    expect(r.data.prompt).toContain("delve");
  });

  it("includes 4-word trigger instruction", async () => {
    const r = await buildBrainstormPrompt({
      category: TEST_CATEGORY,
      name: TEST_NAME,
      intent: "test",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.prompt).toContain("4 words");
  });

  it("writeTargets cover spec description+triggers AND Identity AND Principles", async () => {
    const r = await buildBrainstormPrompt({
      category: TEST_CATEGORY,
      name: TEST_NAME,
      intent: "test",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.writeTargets).toHaveLength(3);
    const sections = r.data.writeTargets.map((t) => t.section);
    expect(sections).toContain("## Identity");
    expect(sections).toContain("## Principles");
    expect(sections.some((s) => s.includes("description"))).toBe(true);
  });

  it("prompt includes OUTPUT CONTRACT delimiters", async () => {
    const r = await buildBrainstormPrompt({
      category: TEST_CATEGORY,
      name: TEST_NAME,
      intent: "test intent",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.prompt).toContain("---START-SPEC-YAML-UPDATES---");
    expect(r.data.prompt).toContain("---START-IDENTITY---");
    expect(r.data.prompt).toContain("---START-PRINCIPLES---");
  });

  it("prompt matches snapshot (catches template drift)", async () => {
    const r = await buildBrainstormPrompt({
      category: TEST_CATEGORY,
      name: TEST_NAME,
      intent: "write a skill that generates type-safe TypeScript prompt templates",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Normalize the tmp-HOME absolute path so the snapshot is stable across runs.
    const normalized = r.data.prompt.replaceAll(TFC_SKILLS, "/TFC_SKILLS");
    expect(normalized).toMatchSnapshot();
  });
});

describe("buildGeneratePrompt", () => {
  it("with layers:['patterns'] includes ONLY patterns fragment — not anti-patterns", async () => {
    const r = await buildGeneratePrompt({
      category: TEST_CATEGORY,
      name: TEST_NAME,
      layers: ["patterns"],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Patterns fragment unique opener must appear
    expect(r.data.prompt).toContain(PATTERNS_FRAGMENT.slice(0, 40));
    // Anti-patterns fragment opener must NOT appear
    expect(r.data.prompt).not.toContain(ANTIPATTERNS_FRAGMENT.slice(0, 40));
  });

  it("with multiple layers includes all requested fragments", async () => {
    const r = await buildGeneratePrompt({
      category: TEST_CATEGORY,
      name: TEST_NAME,
      layers: ["patterns", "anti-patterns"],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.prompt).toContain(PATTERNS_FRAGMENT.slice(0, 40));
    expect(r.data.prompt).toContain(ANTIPATTERNS_FRAGMENT.slice(0, 40));
  });

  it("returns BAD_INPUT for unknown layer with valid layer hint", async () => {
    const r = await buildGeneratePrompt({
      category: TEST_CATEGORY,
      name: TEST_NAME,
      layers: ["unknown-layer"],
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("BAD_INPUT");
    expect(r.error.hint).toContain("patterns");
  });

  it("returns NOT_FOUND for non-existent skill", async () => {
    const r = await buildGeneratePrompt({
      category: "nonexistent",
      name: "no-such",
      layers: ["patterns"],
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("NOT_FOUND");
    expect(r.error.hint).toContain("tfc_new");
  });

  it("includes voice fragment in all layer prompts", async () => {
    const r = await buildGeneratePrompt({
      category: TEST_CATEGORY,
      name: TEST_NAME,
      layers: ["quick-wins"],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.prompt).toContain("em dash");
  });

  it("writeTargets match exactly the requested layers", async () => {
    const r = await buildGeneratePrompt({
      category: TEST_CATEGORY,
      name: TEST_NAME,
      layers: ["patterns", "handoffs"],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.writeTargets).toHaveLength(2);
    const sections = r.data.writeTargets.map((t) => t.section);
    expect(sections).toContain("## Patterns");
    expect(sections).toContain("## Handoffs");
  });

  it("all 5 valid layers accepted without error", async () => {
    const r = await buildGeneratePrompt({
      category: TEST_CATEGORY,
      name: TEST_NAME,
      layers: ["patterns", "anti-patterns", "quick-wins", "handoffs", "stack"],
    });
    expect(r.ok).toBe(true);
  });
});
