import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as nodePath from "node:path";
import { runBehavioral } from "../../src/core/behavioral.js";
import type { LoadedSkill } from "../../src/core/checks.js";
import type { SpecYaml } from "../../src/core/types.js";

function mkSkill(spec: Partial<SpecYaml>, md: string): LoadedSkill {
  return { dirName: "x", skillMdText: md, specYaml: spec as SpecYaml };
}

describe("runBehavioral (v3 W3 — deterministic contract QA)", () => {
  it("passes when scaffold + SKILL.md cover required_sections and phases are machine-shaped", () => {
    const r = runBehavioral(
      mkSkill(
        {
          required_sections: ["## PHASE 1", "## ROOT CAUSE:"],
          scaffold_template: "## PHASE 1\n## ROOT CAUSE:\n",
          phases: [{ artifact: "a diff", acceptance: "`git diff` exits 0" }],
        },
        "## PHASE 1\nstuff\n## ROOT CAUSE:\ndone",
      ),
    );
    expect(r.passed).toBe(true);
  });

  it("FAILS when a required section is dropped from the scaffold", () => {
    const r = runBehavioral(
      mkSkill(
        {
          required_sections: ["## PHASE 1", "## ROOT CAUSE:"],
          scaffold_template: "## PHASE 1\n",
          phases: [],
        },
        "## PHASE 1\n## ROOT CAUSE:",
      ),
    );
    expect(r.passed).toBe(false);
    expect(
      r.checks.find((c) => c.id === "scaffold-covers-required-sections")?.passed,
    ).toBe(false);
  });

  it("FAILS when a ## Phase header is deleted from SKILL.md (the VERIFY case)", () => {
    const r = runBehavioral(
      mkSkill(
        {
          required_sections: ["## PHASE 1"],
          scaffold_template: "## PHASE 1\n",
          phases: [],
        },
        "no phase header here",
      ),
    );
    expect(r.passed).toBe(false);
    expect(
      r.checks.find((c) => c.id === "skillmd-covers-required-sections")?.passed,
    ).toBe(false);
  });

  it("FAILS when a phase acceptance is prose, not machine-shaped", () => {
    const r = runBehavioral(
      mkSkill(
        { required_sections: [], scaffold_template: "", phases: [{ artifact: "x", acceptance: "looks good and is clear" }] },
        "",
      ),
    );
    expect(r.passed).toBe(false);
    expect(
      r.checks.find((c) => c.id === "phase-acceptance-satisfiable")?.passed,
    ).toBe(false);
  });

  it("INV-3: behavioral.ts imports no fs/network/model — it never invokes a model (model-free)", () => {
    const src = readFileSync(
      nodePath.resolve(
        nodePath.dirname(fileURLToPath(import.meta.url)),
        "../../src/core/behavioral.ts",
      ),
      "utf8",
    );
    expect(src).not.toMatch(
      /^import .*(node:fs|node:child_process|node:http|node:net|undici|axios)/m,
    );
    expect(src).not.toMatch(/\bfetch\s*\(|anthropic|openai|api\.anthropic/i);
  });
});
