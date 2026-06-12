import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    // Runs once in the main process before any worker forks.
    // Creates the tmp HOME and sets TFC_ROOT / CLAUDE_SKILLS_DIR / SPAWNER_SKILLS_DIR.
    globalSetup: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/core/**"],
      exclude: ["src/core/types.ts"],
      thresholds: {
        lines: 90,
      },
      reporter: ["text", "lcov"],
    },
  },
});
