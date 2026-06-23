import { describe, expect, it } from "vitest";
import { scoreDepthOf } from "../../src/core/context-depth.js";

const stub = [
  "---",
  "last_verified: 2026-06-22",
  "---",
  "",
  "## Emotional Hooks",
  "",
  "## Pattern Interrupts",
  "",
].join("\n");

const deep = [
  "---",
  "last_verified: 2026-06-22",
  "source: reel-forge/SKILL.md",
  "---",
  "",
  "## Emotional Hooks",
  "Loss-aversion openers outperform curiosity openers on save rate. " +
    "Lead with the cost of NOT watching. Example: 'You are losing reach every time you do this.' " +
    "Why: the viewer feels the stake before the payoff, so the thumb stops. Pair with a fast cut. " +
    "A second proven formula is the contrarian flip: state the consensus, then negate it in three words, " +
    "so the viewer needs the resolution. Example: 'Everyone says post daily. They are wrong.' " +
    "The mechanism is an open loop the brain refuses to leave unclosed, which buys the next two seconds.",
  "",
].join("\n");

describe("scoreDepth", () => {
  it("fails an empty-but-stamped stub on all three counts (fails-closed)", () => {
    const v = scoreDepthOf("hooks.md", stub);
    expect(v.deep).toBe(false);
    expect(v.coverage).toBe(0);
    expect(v.sourcedSections).toBe(0);
    expect(v.reasons.length).toBeGreaterThanOrEqual(3);
  });

  it("passes a filled + sourced + dense file", () => {
    const v = scoreDepthOf("hooks.md", deep);
    expect(v.deep).toBe(true);
    expect(v.reasons).toHaveLength(0);
    expect(v.coverage).toBe(1);
    expect(v.sourcedSections).toBe(1);
    expect(v.tokens).toBeGreaterThanOrEqual(80);
  });

  it("filled but UNSOURCED still fails — provenance is required (V2)", () => {
    const unsourced = deep.replace("source: reel-forge/SKILL.md\n", "");
    const v = scoreDepthOf("hooks.md", unsourced);
    expect(v.deep).toBe(false);
    expect(v.reasons.some((r) => r.includes("sourced"))).toBe(true);
  });
});
