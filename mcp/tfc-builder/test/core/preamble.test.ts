import { describe, expect, it } from "vitest";
import {
  PREAMBLE_HOOK_START,
  PREAMBLE_HOOK_END,
  buildPreambleHook,
  injectPreambleHook,
} from "../../src/core/preamble.js";

const FRONTMATTER = `---
name: demo
version: 1.0.0
---

## Identity
You are a demo skill.
`;

describe("injectPreambleHook — install-time runtime hook (Wave 3, V2)", () => {
  it("inserts the managed block after the frontmatter when absent", () => {
    const r = injectPreambleHook(FRONTMATTER, "pattern", "demo");
    expect(r.changed).toBe(true);
    expect(r.text).toContain(PREAMBLE_HOOK_START);
    expect(r.text).toContain(PREAMBLE_HOOK_END);
    expect(r.text).toContain('preamble.sh" "pattern" "demo"');
    // frontmatter is preserved and the hook lands after it, before Identity
    expect(r.text.indexOf("name: demo")).toBeLessThan(r.text.indexOf(PREAMBLE_HOOK_START));
    expect(r.text.indexOf(PREAMBLE_HOOK_START)).toBeLessThan(r.text.indexOf("## Identity"));
  });

  it("is idempotent: a second inject makes no change", () => {
    const once = injectPreambleHook(FRONTMATTER, "pattern", "demo");
    const twice = injectPreambleHook(once.text, "pattern", "demo");
    expect(twice.changed).toBe(false);
    expect(twice.text).toBe(once.text);
    // exactly one block — never duplicated
    const count = twice.text.split(PREAMBLE_HOOK_START).length - 1;
    expect(count).toBe(1);
  });

  it("refreshes a stale block in place rather than appending a new one", () => {
    const withOld = injectPreambleHook(FRONTMATTER, "pattern", "old-name");
    const refreshed = injectPreambleHook(withOld.text, "pattern", "demo");
    expect(refreshed.changed).toBe(true);
    expect(refreshed.text).toContain('"pattern" "demo"');
    expect(refreshed.text).not.toContain("old-name");
    expect(refreshed.text.split(PREAMBLE_HOOK_START).length - 1).toBe(1);
  });

  it("prepends the block when there is no frontmatter", () => {
    const r = injectPreambleHook("## Just a heading\n", "ai", "thing");
    expect(r.changed).toBe(true);
    expect(r.text.startsWith(PREAMBLE_HOOK_START)).toBe(true);
  });

  it("buildPreambleHook embeds the exact category/name to source", () => {
    const block = buildPreambleHook("learning", "learn-itr");
    expect(block).toContain('preamble.sh" "learning" "learn-itr"');
    expect(block.startsWith(PREAMBLE_HOOK_START)).toBe(true);
    expect(block.endsWith(PREAMBLE_HOOK_END)).toBe(true);
  });
});
