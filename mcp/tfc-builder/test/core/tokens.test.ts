import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { readText } from "../../src/core/fs.js";
import { TFC_TEMPLATE } from "../../src/core/paths.js";
import { applyTokens, buildTokenValues, TOKENS } from "../../src/core/tokens.js";

describe("tokens", () => {
  it("TOKENS constants contain _PLACEHOLDER suffix", () => {
    expect(TOKENS.SKILL_ID).toMatch(/_PLACEHOLDER$/);
    expect(TOKENS.CATEGORY).toMatch(/_PLACEHOLDER$/);
  });

  it("buildTokenValues maps both placeholders", () => {
    const map = buildTokenValues("ai-agents", "my-skill");
    expect(map[TOKENS.SKILL_ID]).toBe("my-skill");
    expect(map[TOKENS.CATEGORY]).toBe("ai-agents");
  });

  it("applyTokens replaces all occurrences", () => {
    const text = "id: SKILL_ID_PLACEHOLDER\ncategory: CATEGORY_PLACEHOLDER\npath: CATEGORY_PLACEHOLDER/SKILL_ID_PLACEHOLDER";
    const result = applyTokens(text, buildTokenValues("ai-agents", "my-skill"));
    expect(result).toBe("id: my-skill\ncategory: ai-agents\npath: ai-agents/my-skill");
  });

  it("swap leaves zero *_PLACEHOLDER strings in template SKILL.md", async () => {
    const p = path.join(TFC_TEMPLATE, "SKILL.md");
    const r = await readText(p);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const swapped = applyTokens(r.data, buildTokenValues("ai-agents", "my-skill"));
    expect(swapped).not.toMatch(/_PLACEHOLDER/);
  });
});
