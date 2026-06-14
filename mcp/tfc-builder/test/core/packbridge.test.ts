import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import * as os from "node:os";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildPackBridgeReport } from "../../src/core/packbridge.js";
import { scaffoldSkill } from "../../src/core/scaffold.js";
import { TFC_SKILLS } from "../../src/core/paths.js";
import { readYaml, writeYaml } from "../../src/core/yamlio.js";
import type { SpecYaml } from "../../src/core/types.js";

const CAT = "test-packbridge-fixture";
const AUTHORED = "authored-paired";
const PROVEN = "proven-paired";

let packsFile = "";
let tmpDir = "";

function dir(name: string): string {
  return nodePath.join(TFC_SKILLS, CAT, name);
}

async function setVersion(name: string, version: string): Promise<void> {
  const specPath = nodePath.join(dir(name), "spec.yaml");
  const r = await readYaml<SpecYaml>(specPath);
  if (!r.ok) throw new Error(`setVersion ${name}: ${r.error.message}`);
  await writeYaml(specPath, { ...r.data, id: name, version });
}

const PASSING_REPORT = {
  skill_version: "1.0.0",
  ts: "2026-06-14T00:00:00Z",
  pass_threshold: 0.8,
  behavioral_score: 0.9,
  per_task: [
    { id: "t1", pass: true },
    { id: "t2", pass: true },
    { id: "t3", pass: true },
  ],
};

const PACKS_FIXTURE = `packs:
  - id: PX1
    title: "needs eval_proven, paired to an authored skill"
    pairs_skill: ${AUTHORED}
    min_lane: eval_proven
  - id: PX2
    title: "needs eval_proven, paired to an eval_proven skill"
    pairs_skill: ${PROVEN}
    min_lane: eval_proven
  - id: PX3
    title: "names a skill that is not installed"
    pairs_skill: does-not-exist
    min_lane: authored
  - id: PX4
    title: "paired but declares no floor"
    pairs_skill: ${AUTHORED}
  - id: PX5
    title: "no pairing at all"
    personas: [tactical]
`;

beforeAll(async () => {
  await fsPromises
    .rm(nodePath.join(TFC_SKILLS, CAT), { recursive: true, force: true })
    .catch(() => undefined);

  for (const n of [AUTHORED, PROVEN]) {
    await scaffoldSkill({ category: CAT, name: n, dryRun: false });
    await setVersion(n, "1.0.0");
  }
  // PROVEN reaches eval_proven via a fresh passing report.
  await fsPromises.writeFile(
    nodePath.join(dir(PROVEN), "eval-report.json"),
    JSON.stringify(PASSING_REPORT),
  );

  tmpDir = await fsPromises.mkdtemp(nodePath.join(os.tmpdir(), "tfc-packs-"));
  packsFile = nodePath.join(tmpDir, "packs.yaml");
  await fsPromises.writeFile(packsFile, PACKS_FIXTURE);
});

afterAll(async () => {
  await fsPromises
    .rm(nodePath.join(TFC_SKILLS, CAT), { recursive: true, force: true })
    .catch(() => undefined);
  await fsPromises.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
});

describe("buildPackBridgeReport (Wave 5 — one currency)", () => {
  it("flags a pack requiring eval_proven paired to an authored skill (DONE-WHEN)", async () => {
    const r = await buildPackBridgeReport({ packsFile });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const px1 = r.data.rows.find((row) => row.pack === "PX1");
    expect(px1).toBeDefined();
    expect(px1?.resolved).toBe(true);
    expect(px1?.lane).toBe("authored");
    expect(px1?.min_lane).toBe("eval_proven");
    expect(px1?.below_floor).toBe(true);
  });

  it("passes a pack whose paired skill meets the floor", async () => {
    const r = await buildPackBridgeReport({ packsFile });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const px2 = r.data.rows.find((row) => row.pack === "PX2");
    expect(px2?.resolved).toBe(true);
    expect(px2?.lane).toBe("eval_proven");
    expect(px2?.below_floor).toBe(false);
  });

  it("reports an unresolved pairing without flagging it below floor", async () => {
    const r = await buildPackBridgeReport({ packsFile });
    if (!r.ok) throw new Error(r.error.message);

    const px3 = r.data.rows.find((row) => row.pack === "PX3");
    expect(px3?.resolved).toBe(false);
    expect(px3?.below_floor).toBe(false);
    expect(px3?.note).toMatch(/not an installed TFC skill/);
  });

  it("includes a paired pack with no floor and excludes packs with no pairing", async () => {
    const r = await buildPackBridgeReport({ packsFile });
    if (!r.ok) throw new Error(r.error.message);

    const px4 = r.data.rows.find((row) => row.pack === "PX4");
    expect(px4?.resolved).toBe(true);
    expect(px4?.min_lane).toBeNull();
    expect(px4?.below_floor).toBe(false);

    expect(r.data.rows.find((row) => row.pack === "PX5")).toBeUndefined();
  });

  it("summarizes the four declaring packs and the single below-floor pairing", async () => {
    const r = await buildPackBridgeReport({ packsFile });
    if (!r.ok) throw new Error(r.error.message);

    expect(r.data.summary.packs_with_pairing).toBe(4);
    expect(r.data.summary.resolved).toBe(3);
    expect(r.data.summary.below_floor).toBe(1);
    expect(r.data.legend).toMatch(/min_lane/);
    expect(r.data.legend).toMatch(/below_floor/);
  });

  it("never edits packs.yaml (read-only)", async () => {
    const before = await fsPromises.readFile(packsFile, "utf-8");
    await buildPackBridgeReport({ packsFile });
    const after = await fsPromises.readFile(packsFile, "utf-8");
    expect(after).toBe(before);
  });

  it("fails cleanly when packs.yaml is absent", async () => {
    const r = await buildPackBridgeReport({
      packsFile: nodePath.join(tmpDir, "nope.yaml"),
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("NOT_FOUND");
  });
});
