#!/usr/bin/env node
import { Command } from "commander";
import type { Result } from "./core/result.js";
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

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error("tfc error:", err);
  process.exit(1);
});
