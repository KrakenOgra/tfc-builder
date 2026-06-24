import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  extractSections,
  attributeSections,
  headerKeywords,
  slug,
  runAttribution,
  type SectionReceipt,
} from "../../src/core/section-attribute.js";
import { TFC_SKILLS } from "../../src/core/paths.js";

describe("extractSections", () => {
  it("pulls ## and ### headers, de-dupes, drops the managed runtime hook", () => {
    const md = [
      "## TFC Runtime Hook (managed — do not edit)",
      "blah",
      "## Identity",
      "## Phase 6 -- REFLECT",
      "### Phase 6 -- REFLECT", // dup slug
      "text only no header",
    ].join("\n");
    const secs = extractSections(md);
    expect(secs.map((s) => s.header)).toEqual([
      "Identity",
      "Phase 6 -- REFLECT",
    ]);
    expect(secs[1]?.id).toBe("phase-6-reflect");
  });
});

describe("headerKeywords / slug", () => {
  it("keeps distinctive tokens, drops generic scaffolding words", () => {
    expect(headerKeywords("Phase 6 -- REFLECT")).toEqual(["reflect"]);
    expect(slug("Phase 6 -- REFLECT")).toBe("phase-6-reflect");
  });
});

describe("attributeSections (the REFLECT ground-truth case)", () => {
  const sections = extractSections(
    ["## Identity", "## Phase 5 -- DIVERGE", "## Phase 6 -- REFLECT"].join("\n"),
  );
  const learnings = [
    "reflect-iter1-stable-is-vote REFLECT declaring stable on iter1 is always a vote in disguise",
  ];

  it("credits the referenced section by its distinctive keyword", () => {
    const credits = attributeSections(sections, learnings);
    const reflect = credits.find((c) => c.id === "phase-6-reflect");
    expect(reflect?.credited).toBe(true);
    expect(reflect?.confidence).toBe(1);
  });

  it("leaves unreferenced sections un-credited (dead weight signal)", () => {
    const credits = attributeSections(sections, learnings);
    const identity = credits.find((c) => c.id === "identity");
    expect(identity?.credited).toBe(false);
    expect(identity?.confidence).toBe(0);
  });

  it("never throws on empty learnings", () => {
    const credits = attributeSections(sections, []);
    expect(credits.every((c) => c.credited === false)).toBe(true);
  });
});

describe("runAttribution (disk roundtrip, append-only)", () => {
  const TEST_CATEGORY = "test-attribution";
  const TEST_NAME = "attr-fixture";
  const dir = nodePath.join(TFC_SKILLS, TEST_CATEGORY, TEST_NAME);

  beforeAll(async () => {
    await fsPromises.mkdir(dir, { recursive: true });
    await fsPromises.writeFile(
      nodePath.join(dir, "SKILL.md"),
      ["## Identity", "## Phase 6 -- REFLECT"].join("\n"),
      "utf-8",
    );
    await fsPromises.writeFile(
      nodePath.join(dir, "learnings.jsonl"),
      JSON.stringify({
        ts: "2026-06-15T08:50:00Z",
        skill: TEST_NAME,
        key: "reflect-iter1-stable-is-vote",
        insight: "REFLECT declaring stable on iter1 is always a vote in disguise",
      }) + "\n",
      "utf-8",
    );
  });

  afterAll(async () => {
    await fsPromises
      .rm(nodePath.join(TFC_SKILLS, TEST_CATEGORY), { recursive: true, force: true })
      .catch(() => undefined);
  });

  it("writes a receipt and appends (never overwrites) on a second run", async () => {
    const r1 = await runAttribution({ category: TEST_CATEGORY, name: TEST_NAME, ts: "2026-06-24T00:00:00Z" });
    expect(r1.ok).toBe(true);
    if (r1.ok) {
      expect(r1.data.source).toBe("learnings");
      expect(r1.data.sections_credited.find((c) => c.id === "phase-6-reflect")?.credited).toBe(true);
    }
    await runAttribution({ category: TEST_CATEGORY, name: TEST_NAME, ts: "2026-06-24T00:01:00Z" });
    const sink = await fsPromises.readFile(nodePath.join(dir, "section-receipts.jsonl"), "utf-8");
    const rows = sink.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l) as SectionReceipt);
    expect(rows).toHaveLength(2);
  });

  it("fails cleanly when SKILL.md has no sections", async () => {
    const empty = nodePath.join(TFC_SKILLS, TEST_CATEGORY, "empty");
    await fsPromises.mkdir(empty, { recursive: true });
    await fsPromises.writeFile(nodePath.join(empty, "SKILL.md"), "no headers here", "utf-8");
    const r = await runAttribution({ category: TEST_CATEGORY, name: "empty", ts: "2026-06-24T00:00:00Z" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("NO_SECTIONS");
  });
});
