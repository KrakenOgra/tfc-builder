// Foundry W-A + W-B behavioral VERIFY probes.
// W-A: 0 receipts => earnedAngles 0, all provisional; N passing receipts => the angle graduates to required.
// W-B: synthesized:true with empty source_basis => synthesis-earned check BLOCKS; human file is exempt.
import * as fsPromises from "node:fs/promises";
import * as nodePath from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { TFC_SKILLS } from "../../src/core/paths.js";
import {
  promoteAngles,
  recordSectionReceipt,
  parseReceipts,
} from "../../src/core/context-receipt.js";
import { synthesisEarned } from "../../src/core/checks.js";
import type { LoadedSkill } from "../../src/core/checks.js";

const TEST_CATEGORY = "test-foundry-wa";
const TEST_DIR = nodePath.join(TFC_SKILLS, TEST_CATEGORY);

afterAll(async () => {
  await fsPromises.rm(TEST_DIR, { recursive: true, force: true }).catch(() => undefined);
});

const MANIFEST = ["domain: video-prompting", "angles:", "  - file: hooks.md", "  - file: pacing.md"].join("\n");

async function makeSkill(name: string): Promise<string> {
  const ctx = nodePath.join(TEST_DIR, name, "context");
  await fsPromises.mkdir(ctx, { recursive: true });
  await fsPromises.writeFile(nodePath.join(ctx, "_angles.yaml"), MANIFEST, "utf-8");
  return nodePath.join(TEST_DIR, name);
}

describe("Foundry W-A — receipt-earned manifest", () => {
  it("0 receipts => earnedAngles 0, every angle provisional", async () => {
    await makeSkill("zero");
    const r = await promoteAngles({ name: "zero" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.declaredAngles).toBe(2);
    expect(r.data.earnedAngles).toBe(0);
    expect(r.data.earnedCoverage).toBe(0);
    expect(r.data.angles.every((a) => a.lane === "provisional")).toBe(true);
  });

  it("N passing receipts graduate exactly that angle to required", async () => {
    await makeSkill("grad");
    await recordSectionReceipt({ name: "grad", file: "hooks.md", task: "write a hook", passed: true, ts: "2026-06-23T00:00:00Z" });
    await recordSectionReceipt({ name: "grad", file: "pacing.md", task: "pace it", passed: false, ts: "2026-06-23T00:01:00Z" });
    const r = await promoteAngles({ name: "grad", minReceipts: 1 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.earnedAngles).toBe(1); // hooks earned, pacing's only receipt failed
    const hooks = r.data.angles.find((a) => a.file === "hooks.md");
    const pacing = r.data.angles.find((a) => a.file === "pacing.md");
    expect(hooks?.lane).toBe("required");
    expect(pacing?.lane).toBe("provisional");
    expect(r.data.earnedCoverage).toBe(0.5);
  });

  it("minReceipts raises the bar — one pass is not enough when 2 are required", async () => {
    await makeSkill("bar");
    await recordSectionReceipt({ name: "bar", file: "hooks.md", task: "t", passed: true, ts: "2026-06-23T00:00:00Z" });
    const r = await promoteAngles({ name: "bar", minReceipts: 2 });
    expect(r.ok && r.data.earnedAngles).toBe(0);
  });

  it("parseReceipts skips malformed lines (append-only tolerance)", () => {
    const parsed = parseReceipts('{"file":"a.md","task":"t","passed":true,"ts":"x"}\nnot-json\n{"file":"b.md"}\n');
    expect(parsed).toHaveLength(1);
  });
});

describe("Foundry W-B — synthesis-over-data gate", () => {
  const loaded = (dir: string): LoadedSkill => ({
    dirName: nodePath.basename(dir),
    specYaml: {} as never,
    skillMdText: "",
    dir,
  });

  it("synthesized:true with empty source_basis fails synthesis-earned", async () => {
    const dir = await makeSkill("synth-bad");
    await fsPromises.writeFile(
      nodePath.join(dir, "context", "hooks.md"),
      '---\nsynthesized: true\nsource_basis: ""\n---\n\n## H\nbody\n',
      "utf-8",
    );
    expect(synthesisEarned(loaded(dir)).passed).toBe(false);
  });

  it("synthesized:false (human) is exempt — gate passes", async () => {
    const dir = await makeSkill("synth-human");
    await fsPromises.writeFile(
      nodePath.join(dir, "context", "hooks.md"),
      '---\nsynthesized: false\nsource_basis: ""\n---\n\n## H\nbody\n',
      "utf-8",
    );
    expect(synthesisEarned(loaded(dir)).passed).toBe(true);
  });

  it("synthesized:true WITH a named source_basis passes", async () => {
    const dir = await makeSkill("synth-good");
    await fsPromises.writeFile(
      nodePath.join(dir, "context", "hooks.md"),
      '---\nsynthesized: true\nsource_basis: "retention-study-2026, demo/SKILL.md"\n---\n\n## H\nbody\n',
      "utf-8",
    );
    expect(synthesisEarned(loaded(dir)).passed).toBe(true);
  });
});
