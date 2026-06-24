import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildGrammarGuide,
  renderGuidanceBlock,
  isPinned,
} from "../../src/core/grammar-guide.js";
import type { SectionReceipt } from "../../src/core/section-attribute.js";
import { TFC_SKILLS } from "../../src/core/paths.js";

const TEST_CATEGORY = "test-grammar-guide";

function receipt(ts: string, credits: Array<[string, string, number]>): SectionReceipt {
  return {
    ts,
    run_id: `r-${ts}`,
    domain: `${TEST_CATEGORY}/x`,
    source: "learnings",
    sections_credited: credits.map(([id, header, confidence]) => ({
      id,
      header,
      credited: confidence >= 0.5,
      confidence,
    })),
  };
}

async function seed(name: string, receipts: SectionReceipt[]): Promise<string> {
  const dir = nodePath.join(TFC_SKILLS, TEST_CATEGORY, name);
  await fsPromises.mkdir(dir, { recursive: true });
  await fsPromises.writeFile(
    nodePath.join(dir, "section-receipts.jsonl"),
    receipts.map((r) => JSON.stringify(r)).join("\n") + "\n",
    "utf-8",
  );
  return dir;
}

describe("isPinned", () => {
  it("pins Quality / VERIFY / Identity by meaning, hard-coded", () => {
    expect(isPinned("Quality Gates")).toBe(true);
    expect(isPinned("## VERIFY")).toBe(true);
    expect(isPinned("Identity")).toBe(true);
    expect(isPinned("Phase 6 -- REFLECT")).toBe(false);
  });
});

describe("buildGrammarGuide", () => {
  afterAll(async () => {
    await fsPromises
      .rm(nodePath.join(TFC_SKILLS, TEST_CATEGORY), { recursive: true, force: true })
      .catch(() => undefined);
  });

  it("returns ready=false and all-KEEP under 3 receipts (no premature pruning)", async () => {
    await seed("under", [
      receipt("t1", [["dead", "Dead Section", 0]]),
      receipt("t2", [["dead", "Dead Section", 0]]),
    ]);
    const r = await buildGrammarGuide({ category: TEST_CATEGORY, name: "under" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.ready).toBe(false);
      expect(r.data.directives.every((d) => d.directive === "KEEP" || d.directive === "KEEP-PINNED")).toBe(true);
    }
  });

  it("at >=3 receipts: STRENGTHEN high-credit, REVIEW-PRUNE dead weight, KEEP-PINNED the floor", async () => {
    const r3 = [
      receipt("t1", [["reflect", "Phase 6 -- REFLECT", 1], ["dead", "Dead Section", 0], ["verify", "VERIFY", 0]]),
      receipt("t2", [["reflect", "Phase 6 -- REFLECT", 1], ["dead", "Dead Section", 0], ["verify", "VERIFY", 0]]),
      receipt("t3", [["reflect", "Phase 6 -- REFLECT", 1], ["dead", "Dead Section", 0], ["verify", "VERIFY", 0]]),
    ];
    await seed("ready", r3);
    const r = await buildGrammarGuide({ category: TEST_CATEGORY, name: "ready" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.ready).toBe(true);
    const byId = Object.fromEntries(r.data.directives.map((d) => [d.id, d.directive]));
    expect(byId["reflect"]).toBe("STRENGTHEN");
    expect(byId["dead"]).toBe("REVIEW-PRUNE");
    // VERIFY has 0 credit but is PINNED — must NOT be prunable (INV-3)
    expect(byId["verify"]).toBe("KEEP-PINNED");
  });

  it("returns receiptCount 0 / not-ready when no sink exists", async () => {
    const r = await buildGrammarGuide({ category: TEST_CATEGORY, name: "missing" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.receiptCount).toBe(0);
      expect(r.data.ready).toBe(false);
    }
  });
});

describe("renderGuidanceBlock", () => {
  it("shows provisional note under 3 receipts", () => {
    const block = renderGuidanceBlock({ domain: "a/b", receiptCount: 2, ready: false, directives: [] });
    expect(block).toContain("2/3 receipts");
  });

  it("renders directive icons when ready", () => {
    const block = renderGuidanceBlock({
      domain: "a/b",
      receiptCount: 3,
      ready: true,
      directives: [
        { id: "reflect", header: "Phase 6 -- REFLECT", directive: "STRENGTHEN", meanCredit: 1, receiptsSeen: 3, pinned: false },
        { id: "verify", header: "VERIFY", directive: "KEEP-PINNED", meanCredit: 0, receiptsSeen: 3, pinned: true },
      ],
    });
    expect(block).toContain("⬆ STRENGTHEN");
    expect(block).toContain("📌 KEEP-PINNED");
  });
});
