import { describe, expect, it } from "vitest";
import { extractSection } from "../../src/core/checks.js";

describe("extractSection", () => {
  it("extracts content between two ## headings", () => {
    const text = "## Patterns\nsome content\n## Anti-Patterns\nother";
    expect(extractSection(text, "Patterns")).toBe("some content");
  });

  it("extracts to end of text when no following ## heading", () => {
    const text = "## Patterns\nonly section";
    expect(extractSection(text, "Patterns")).toBe("only section");
  });

  it("returns empty string when heading not found", () => {
    expect(extractSection("## Patterns\ncontent", "Missing")).toBe("");
  });

  it("does NOT match ### sub-headings (the critical regression)", () => {
    // '## Patterns' is a substring of '### Patterns' at offset 1 — the old
    // indexOf-based implementation would incorrectly match here.
    const text = "### Patterns\nshould not match\n## Other\ncontent";
    expect(extractSection(text, "Patterns")).toBe("");
  });

  it("does NOT match a heading quoted in prose", () => {
    const text = "See `## Patterns` for examples.\n## Patterns\nreal content";
    // The prose quote is mid-line; only the line-start anchor should match.
    expect(extractSection(text, "Patterns")).toBe("real content");
  });

  it("handles trailing whitespace on the heading line", () => {
    const text = "## Patterns  \ncontent here";
    expect(extractSection(text, "Patterns")).toBe("content here");
  });
});
