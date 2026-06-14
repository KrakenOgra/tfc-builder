import { describe, expect, it } from "vitest";
import { buildCompilePrompt, inferArchetype } from "../../src/core/compile.js";

describe("buildCompilePrompt (Wave 6 — intent front door)", () => {
  it("rejects an intent under 5 words with a job-not-feature hint", () => {
    const r = buildCompilePrompt({ intent: "make a thing" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("BAD_INPUT");
    expect(r.error.hint).toMatch(/describe the job/i);
  });

  it("emits a SkillCard carrying lane: authored (DONE-WHEN + VERIFY)", () => {
    const r = buildCompilePrompt({
      intent: "review terraform plans for security misconfigurations before apply",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // the exact token the wave VERIFY greps for
    expect(r.data.prompt).toMatch(/lane: *authored/);
    expect(r.data.outputDelimiter).toBe("---START-SKILLCARD---");
  });

  it("emits at least 3 eval seeds (the evals.yaml stub)", () => {
    const r = buildCompilePrompt({
      intent: "review terraform plans for security misconfigurations before apply",
    });
    if (!r.ok) throw new Error(r.error.message);
    const seedIds = r.data.prompt.match(/^\s+- id: /gm) ?? [];
    expect(seedIds.length).toBeGreaterThanOrEqual(3);
    expect(r.data.prompt).toContain("eval_seeds:");
    expect(r.data.prompt).toContain("pass_threshold:");
  });

  it("instructs search-before-building and emits the SkillCard delimiters", () => {
    const r = buildCompilePrompt({
      intent: "help me write consistent few-shot classification prompts",
    });
    if (!r.ok) throw new Error(r.error.message);
    expect(r.data.prompt).toMatch(/tfc_list/);
    expect(r.data.prompt).toMatch(/spawner_skills/);
    expect(r.data.prompt).toContain("overlap_verdict");
    expect(r.data.prompt).toContain("---END-SKILLCARD---");
  });

  it("carries the voice contract into the drafted card", () => {
    const r = buildCompilePrompt({
      intent: "audit react components for accessibility regressions before merge",
    });
    if (!r.ok) throw new Error(r.error.message);
    expect(r.data.prompt).toMatch(/VOICE CONTRACT/);
  });

  it("threads optional context into the prompt", () => {
    const r = buildCompilePrompt({
      intent: "build a pipeline that ships nightly database backups to cold storage",
      context: "stack is postgres + rclone on a cron host",
    });
    if (!r.ok) throw new Error(r.error.message);
    expect(r.data.prompt).toMatch(/## CONTEXT/);
    expect(r.data.prompt).toMatch(/rclone/);
  });

  it("infers archetype from intent verbs", () => {
    expect(inferArchetype("which tool do I use for X, quick lookup")).toBe("reference");
    expect(inferArchetype("ship a multi-step deploy pipeline")).toBe("workflow");
    expect(inferArchetype("review and audit security architecture")).toBe("domain-expert");
    expect(inferArchetype("a little helper for notes")).toBe("hybrid");
  });
});
