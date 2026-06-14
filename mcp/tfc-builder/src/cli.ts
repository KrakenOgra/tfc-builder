#!/usr/bin/env node
import { Command } from "commander";
import type { Result } from "./core/result.js";
import { runDoctor } from "./core/doctor.js";
import {
  tfcBrainstormHandler,
  tfcGenerateHandler,
  tfcInstallHandler,
  tfcListHandler,
  tfcMigrateHandler,
  tfcNewHandler,
  tfcRegisterHandler,
  tfcScoreHandler,
  tfcValidateHandler,
  tfcLaneHandler,
  tfcEvalHandler,
  tfcEvolveHandler,
  tfcPackBridgeHandler,
  tfcCompileHandler,
} from "./tools/index.js";

function printResult(result: Result<unknown>): void {
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

const program = new Command()
  .name("tfc")
  .description("TFC skill lifecycle CLI — shares core lib with the MCP server")
  .version("0.1.0");

program
  .command("new <category> <name>")
  .description("Scaffold a new TFC skill from _template/")
  .option("--dry-run", "Plan writes without touching disk")
  .action(async (category: string, name: string, opts: { dryRun?: boolean }) => {
    printResult(
      await tfcNewHandler({
        category,
        name,
        ...(opts.dryRun === true ? { dryRun: true as const } : {}),
      }),
    );
  });

program
  .command("brainstorm <category> <name>")
  .description("Return prompt-template for intelligence layer brainstorm")
  .requiredOption("--intent <text>", "What this skill does in one sentence")
  .action(async (category: string, name: string, opts: { intent: string }) => {
    printResult(await tfcBrainstormHandler({ category, name, intent: opts.intent }));
  });

program
  .command("generate <category> <name>")
  .description("Return prompt-template to generate specific intelligence layers")
  .requiredOption("--layers <layers>", "Comma-separated layer names")
  .action(async (category: string, name: string, opts: { layers: string }) => {
    printResult(
      await tfcGenerateHandler({
        category,
        name,
        layers: opts.layers
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    );
  });

program
  .command("validate <category> <name>")
  .description("Validate a TFC skill against validations.yaml gates")
  .action(async (category: string, name: string) => {
    printResult(await tfcValidateHandler({ category, name }));
  });

program
  .command("score <category> <name>")
  .description("Score a skill 0-100 on intelligence density")
  .action(async (category: string, name: string) => {
    printResult(await tfcScoreHandler({ category, name }));
  });

program
  .command("migrate <sourcePath> <category> <name>")
  .description("Migrate a spawner/gstack skill to TFC format")
  .requiredOption("--source-type <type>", "Source format: spawner | gstack")
  .option("--dry-run", "Plan writes without touching disk")
  .action(
    async (
      sourcePath: string,
      category: string,
      name: string,
      opts: { sourceType: string; dryRun?: boolean },
    ) => {
      printResult(
        await tfcMigrateHandler({
          sourcePath,
          category,
          name,
          sourceType: opts.sourceType,
          ...(opts.dryRun === true ? { dryRun: true as const } : {}),
        }),
      );
    },
  );

program
  .command("install <category> <name>")
  .description("Install both symlinks for a TFC skill")
  .option("--dry-run", "Plan writes without touching disk")
  .action(async (category: string, name: string, opts: { dryRun?: boolean }) => {
    printResult(
      await tfcInstallHandler({
        category,
        name,
        ...(opts.dryRun === true ? { dryRun: true as const } : {}),
      }),
    );
  });

program
  .command("register <category> <name>")
  .description("Register a skill in the spawner index")
  .action(async (category: string, name: string) => {
    printResult(await tfcRegisterHandler({ category, name }));
  });

program
  .command("list")
  .description("List installed TFC skills and detect dangling symlinks")
  .option("--broken-only", "Show only dangling symlinks")
  .action(async (opts: { brokenOnly?: boolean }) => {
    printResult(
      await tfcListHandler({
        ...(opts.brokenOnly === true ? { brokenOnly: true as const } : {}),
      }),
    );
  });

program
  .command("lane <category> <name>")
  .description("Recompute a skill's earned evidence lane from disk (read-only)")
  .action(async (category: string, name: string) => {
    printResult(await tfcLaneHandler({ category, name }));
  });

program
  .command("eval <category> <name>")
  .description("Return a local behavioral-eval prompt (baseline vs skill-loaded over evals.yaml)")
  .option("--tasks <ids>", "Comma-separated golden-task ids to run (default: all)")
  .action(async (category: string, name: string, opts: { tasks?: string }) => {
    const taskIds = opts.tasks
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    printResult(
      await tfcEvalHandler({
        category,
        name,
        ...(taskIds && taskIds.length > 0 ? { taskIds } : {}),
      }),
    );
  });

program
  .command("evolve <category> <name>")
  .description("Return a local loop-closing prompt (consume learnings, regen, re-eval, CHANGELOG)")
  .option("--force", "Override the >=3-unconsumed-learnings guard")
  .option("--dry-run", "Plan the regen without writing")
  .action(async (category: string, name: string, opts: { force?: boolean; dryRun?: boolean }) => {
    printResult(
      await tfcEvolveHandler({
        category,
        name,
        ...(opts.force === true ? { force: true as const } : {}),
        ...(opts.dryRun === true ? { dryRun: true as const } : {}),
      }),
    );
  });

program
  .command("compile")
  .description("Intent front door: emit a born-loop-ready SkillCard (lane: authored + 3 eval seeds)")
  .requiredOption("--intent <text>", "The job in one line — describe the job, not the feature")
  .option("--context <text>", "Optional extra context (stack, constraints, audience)")
  .action(async (opts: { intent: string; context?: string }) => {
    printResult(
      await tfcCompileHandler({
        intent: opts.intent,
        ...(opts.context ? { context: opts.context } : {}),
      }),
    );
  });

program
  .command("pack-bridge")
  .description("Read-only report: which pack-paired TFC skills sit below their declared min_lane floor")
  .option("--packs-file <path>", "Override path to packs.yaml")
  .action(async (opts: { packsFile?: string }) => {
    printResult(
      await tfcPackBridgeHandler(
        opts.packsFile ? { packsFile: opts.packsFile } : {},
      ),
    );
  });

program
  .command("doctor")
  .description("TFC health + per-skill earned lanes (cacheDrift, evalStale, evolvePending, stray-state)")
  .action(async () => {
    const r = await runDoctor();
    if (!r.ok) {
      console.error(JSON.stringify(r, null, 2));
      process.exit(1);
    }
    const { checks, skills, healthy } = r.data;
    for (const c of checks) {
      const icon = c.passed ? "✓" : "✗";
      console.log(`${icon}  ${c.id}: ${c.detail}`);
      if (!c.passed) console.log(`   fix: ${c.fix}`);
    }
    console.log("");
    // Header names every dimension so the report is lane-aware even on a clean system.
    console.log(
      "Skill lanes (recomputed from disk; flags: cacheDrift evalStale evolvePending stray):",
    );
    if (skills.length === 0) {
      console.log("  (no TFC skills installed)");
    }
    for (const s of skills) {
      const flags = [
        s.cacheDrift ? "cacheDrift" : "",
        s.evalStale ? "evalStale" : "",
        s.evolvePending ? "evolvePending" : "",
        s.strayFiles.length ? `stray(${s.strayFiles.join(",")})` : "",
      ]
        .filter(Boolean)
        .join(" ");
      console.log(`  ${s.category}/${s.name}: ${s.lane}${flags ? "  ⚠ " + flags : ""}`);
    }
    console.log("");
    console.log(healthy ? "healthy" : "NEEDS FIXES — see above");
    if (!healthy) process.exit(1);
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error("tfc error:", err);
  process.exit(1);
});
