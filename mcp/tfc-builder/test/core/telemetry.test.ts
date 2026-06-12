import * as nodePath from "node:path";
import * as fsPromises from "node:fs/promises";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { recordRun, type Outcome } from "../../src/core/telemetry.js";
import { TFC_HOME } from "../../src/core/paths.js";

// vi.mock hoists above imports, replacing the module with spyable wrappers
// whose default implementation delegates to the real functions.
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    mkdir: vi.fn().mockImplementation(actual.mkdir),
    appendFile: vi.fn().mockImplementation(actual.appendFile),
  };
});

const ANALYTICS_FILE = nodePath.join(TFC_HOME, "analytics", "tfc-builder.jsonl");

// Reset mocks to real implementations before each test
afterEach(() => {
  vi.mocked(fsPromises.mkdir).mockReset();
  vi.mocked(fsPromises.appendFile).mockReset();
  // Restore real implementations as default
  const real = vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
  void real.then((m) => {
    vi.mocked(fsPromises.mkdir).mockImplementation(m.mkdir);
    vi.mocked(fsPromises.appendFile).mockImplementation(m.appendFile);
  });
});

describe("recordRun", () => {
  beforeAll(async () => {
    // Pre-create analytics dir so real appends work in happy-path test
    const real = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    await real.mkdir(nodePath.dirname(ANALYTICS_FILE), { recursive: true });
  });

  it("does not throw — happy path completes without error", async () => {
    // Use real implementation for this test
    const real = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    vi.mocked(fsPromises.mkdir).mockImplementation(real.mkdir);
    vi.mocked(fsPromises.appendFile).mockImplementation(real.appendFile);

    await expect(recordRun("tfc_new", 42, "ok")).resolves.toBeUndefined();

    const text = await real.readFile(ANALYTICS_FILE, "utf-8").catch(() => "");
    const last = text.trim().split("\n").at(-1) ?? "";
    if (last) {
      const record = JSON.parse(last) as Record<string, unknown>;
      expect(record["tool"]).toBe("tfc_new");
      expect(record["outcome"]).toBe("ok");
      expect(record["skill"]).toBe("tfc-builder");
    }
  });

  it("mkdir failure does not propagate", async () => {
    vi.mocked(fsPromises.mkdir).mockRejectedValueOnce(
      new Error("Permission denied (simulated)"),
    );
    await expect(recordRun("tfc_validate", 10, "error")).resolves.toBeUndefined();
  });

  it("appendFile failure does not propagate", async () => {
    const real = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    vi.mocked(fsPromises.mkdir).mockImplementation(real.mkdir);
    vi.mocked(fsPromises.appendFile).mockRejectedValueOnce(
      new Error("Disk full (simulated)"),
    );
    await expect(recordRun("tfc_install", 99, "ok")).resolves.toBeUndefined();
  });

  it("all outcome values are accepted without error", async () => {
    const real = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    vi.mocked(fsPromises.mkdir).mockImplementation(real.mkdir);
    vi.mocked(fsPromises.appendFile).mockImplementation(real.appendFile);

    const outcomes: Outcome[] = ["ok", "error", "blocked"];
    for (const outcome of outcomes) {
      await expect(recordRun("tfc_list", 1, outcome)).resolves.toBeUndefined();
    }
  });
});
