import { describe, it, expect } from "vitest";
import { CHECK_REGISTRY, type LoadedSkill } from "../../src/core/checks.js";
import type { SpecYaml } from "../../src/core/types.js";

function mk(spec: Partial<SpecYaml>, md = ""): LoadedSkill {
  return { dirName: "x", skillMdText: md, specYaml: spec as SpecYaml };
}

function run(id: string, skill: LoadedSkill): { passed: boolean } {
  const fn = CHECK_REGISTRY.get(id);
  if (!fn) throw new Error(`no check registered: ${id}`);
  return fn(skill);
}

describe("v3 protocol gates (W1/W2/W4/W5)", () => {
  it("template-no-placeholder (W1): fails on meta-instruction, passes when concrete", () => {
    expect(run("template-no-placeholder", mk({}, "Replace this section with steps")).passed).toBe(false);
    expect(run("template-no-placeholder", mk({}, 'echo "Replace with real commands"')).passed).toBe(false);
    expect(run("template-no-placeholder", mk({}, "## Workflow\nGround your crux.")).passed).toBe(true);
  });

  it("phase-artifacts (W2): passes when absent, fails on prose acceptance, passes when machine-shaped", () => {
    expect(run("phase-artifacts", mk({})).passed).toBe(true);
    expect(run("phase-artifacts", mk({ phases: [{ artifact: "x", acceptance: "looks nice" }] })).passed).toBe(false);
    expect(run("phase-artifacts", mk({ phases: [{ artifact: "x", acceptance: "`tsc` exits 0" }] })).passed).toBe(true);
  });

  it("imports-resolve (W4): passes when empty, fails-closed on an unknown fragment", () => {
    expect(run("imports-resolve", mk({ imports: [] })).passed).toBe(true);
    expect(run("imports-resolve", mk({ imports: ["definitely-missing-frag"] })).passed).toBe(false);
  });

  it("pairs-with-complete (W5): fails when direction/reason missing, passes when complete", () => {
    expect(run("pairs-with-complete", mk({ pairs_with: [{ skill: "a" }] })).passed).toBe(false);
    expect(
      run("pairs-with-complete", mk({ pairs_with: [{ skill: "a", direction: "before", reason: "x" }] })).passed,
    ).toBe(true);
  });

  it("requires-reachable (W5): passes when requires is empty", () => {
    expect(run("requires-reachable", mk({ requires: [] })).passed).toBe(true);
  });
});
