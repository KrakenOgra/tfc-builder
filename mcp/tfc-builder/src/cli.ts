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
  tfcCaptureHandler,
  tfcRelinkHandler,
  tfcDecayHandler,
  tfcReplayHandler,
  tfcPortfolioHandler,
  tfcBehavioralHandler,
  tfcIntegrateHandler,
  tfcContextHandler,
  tfcContextAuditHandler,
  tfcContextUpdateHandler,
  tfcContextGetHandler,
  tfcContextFillHandler,
  tfcContextDiscoverHandler,
  tfcContextCoverageHandler,
  tfcContextForgeHandler,
  tfcComposeHandler,
  tfcGraphHandler,
  tfcRecommendHandler,
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
  .option("--with-context", "Also scaffold context/ stubs when the category is a taxonomy domain")
  .action(
    async (
      category: string,
      name: string,
      opts: { dryRun?: boolean; withContext?: boolean },
    ) => {
      printResult(
        await tfcNewHandler({
          category,
          name,
          ...(opts.dryRun === true ? { dryRun: true as const } : {}),
          ...(opts.withContext === true ? { withContext: true as const } : {}),
        }),
      );
    },
  );

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
  .command("behavioral <category> <name>")
  .description("Behavioral QA (v3 W3): deterministic contract check, no model call")
  .action(async (category: string, name: string) => {
    printResult(await tfcBehavioralHandler({ category, name }));
  });

program
  .command("integrate <category> <name> <system>")
  .description("Write a validated integration contract (v3 W5): pairs_with or requires")
  .option("--direction <dir>", "before | after | parallel (required for a skill pairing)")
  .option("--reason <text>", "why the pairing exists (required for a skill pairing)")
  .option("--dry-run", "Plan the spec.yaml edit without writing")
  .action(
    async (
      category: string,
      name: string,
      system: string,
      opts: { direction?: "before" | "after" | "parallel"; reason?: string; dryRun?: boolean },
    ) => {
      printResult(
        await tfcIntegrateHandler({
          category,
          name,
          system,
          ...(opts.direction ? { direction: opts.direction } : {}),
          ...(opts.reason ? { reason: opts.reason } : {}),
          ...(opts.dryRun === true ? { dryRun: true } : {}),
        }),
      );
    },
  );

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
  .option("--live", "Augment from analytics/runs.jsonl when ≥3 real time-spread invocations exist")
  .action(async (category: string, name: string, opts: { tasks?: string; live?: boolean }) => {
    const taskIds = opts.tasks
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    printResult(
      await tfcEvalHandler({
        category,
        name,
        ...(taskIds && taskIds.length > 0 ? { taskIds } : {}),
        ...(opts.live === true ? { live: true } : {}),
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
  .command("capture [category] [name]")
  .description("Wire/verify continuous capture: --audit reports the loop input side; else inject the hook (one skill or all)")
  .option("--audit", "Read-only: report learningsCount/runsCount/hookWired/neverInvoked per skill")
  .option("--dry-run", "Plan the hook injection without writing")
  .action(
    async (
      category: string | undefined,
      name: string | undefined,
      opts: { audit?: boolean; dryRun?: boolean },
    ) => {
      printResult(
        await tfcCaptureHandler({
          ...(opts.audit === true ? { audit: true as const } : {}),
          ...(category ? { category } : {}),
          ...(name ? { name } : {}),
          ...(opts.dryRun === true ? { dryRun: true as const } : {}),
        }),
      );
    },
  );

program
  .command("relink [category] [name]")
  .description("Repair route integrity: recreate missing TFC symlinks + de-dup identical copies; report real conflicts")
  .option("--dry-run", "Render the repair plan without touching disk")
  .action(
    async (
      category: string | undefined,
      name: string | undefined,
      opts: { dryRun?: boolean },
    ) => {
      printResult(
        await tfcRelinkHandler({
          ...(category ? { category } : {}),
          ...(name ? { name } : {}),
          ...(opts.dryRun === true ? { dryRun: true as const } : {}),
        }),
      );
    },
  );

program
  .command("decay <category> <name>")
  .description("Perishable-proof overlay: report whether a skill's proof is stale as-of a date (effectiveLane drops one rung)")
  .option("--as-of <date>", "Explicit reference instant (ISO 8601); defaults to now")
  .action(async (category: string, name: string, opts: { asOf?: string }) => {
    printResult(
      await tfcDecayHandler({
        category,
        name,
        ...(opts.asOf ? { asOf: opts.asOf } : {}),
      }),
    );
  });

program
  .command("replay <category> <name>")
  .description("Emit an N-sample eval prompt + the aggregate command for a stability quorum (stdev≤0.05, min≥threshold)")
  .option("--samples <n>", "Independent eval samples (integer ≥ 2; default 3)")
  .action(async (category: string, name: string, opts: { samples?: string }) => {
    printResult(
      await tfcReplayHandler({
        category,
        name,
        ...(opts.samples ? { samples: Number(opts.samples) } : {}),
      }),
    );
  });

program
  .command("portfolio")
  .description("One-currency rollup: lane histogram, decay pressure, evolve-ready, below-floor pairings, unreachable")
  .option("--as-of <date>", "Reference instant for decay pressure (ISO 8601); defaults to now")
  .action(async (opts: { asOf?: string }) => {
    printResult(await tfcPortfolioHandler(opts.asOf ? { asOf: opts.asOf } : {}));
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
        s.captureWired ? "" : "unwired",
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

program
  .command("context <category> <name>")
  .description("Scaffold context/ stubs from the taxonomy (category = domain e.g. content/social)")
  .option("--files <names>", "Comma-separated subset of file names (default: all in the domain)")
  .option("--dry-run", "Plan writes without touching disk")
  .action(
    async (
      category: string,
      name: string,
      opts: { files?: string; dryRun?: boolean },
    ) => {
      const files = opts.files
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      printResult(
        await tfcContextHandler({
          category,
          name,
          ...(files && files.length > 0 ? { files } : {}),
          ...(opts.dryRun === true ? { dryRun: true } : {}),
        }),
      );
    },
  );

program
  .command("context-audit")
  .description("Scan all skills for missing/stale/undeclared context files (read-only)")
  .option("--as-of <date>", "Reference instant (ISO 8601); defaults to now")
  .option("--stale-days <n>", "Days before a context file is stale (default 90)")
  .action(async (opts: { asOf?: string; staleDays?: string }) => {
    printResult(
      await tfcContextAuditHandler({
        ...(opts.asOf ? { asOf: opts.asOf } : {}),
        ...(opts.staleDays ? { staleDays: Number(opts.staleDays) } : {}),
      }),
    );
  });

program
  .command("context-update <category> <name> <file>")
  .description("Re-stamp last_verified to today on one context file")
  .action(async (category: string, name: string, file: string) => {
    printResult(await tfcContextUpdateHandler({ category, name, file }));
  });

program
  .command("context-get <name> <domain> <task>")
  .description("Retrieve ranked context BODY for a task (deterministic, model-free; empty ⇒ coverage:0)")
  .option("--token-budget <n>", "Max assembled tokens (default 2000)")
  .option("--top-k <n>", "Max sections returned (default 8)")
  .action(
    async (
      name: string,
      domain: string,
      task: string,
      opts: { tokenBudget?: string; topK?: string },
    ) => {
      printResult(
        await tfcContextGetHandler({
          name,
          domain,
          task,
          ...(opts.tokenBudget ? { tokenBudget: Number(opts.tokenBudget) } : {}),
          ...(opts.topK ? { topK: Number(opts.topK) } : {}),
        }),
      );
    },
  );

program
  .command("context-fill <name> <domain>")
  .description("OFFLINE grounded fill: harvest a skill's sources + emit a fill prompt (model-free; fails closed with no sources)")
  .action(async (name: string, domain: string) => {
    printResult(await tfcContextFillHandler({ name, domain }));
  });

program
  .command("context-discover")
  .description("Discover context domains from disk (taxonomy seed ∪ per-skill _angles.yaml manifests)")
  .action(async () => {
    printResult(await tfcContextDiscoverHandler({}));
  });

program
  .command("context-coverage <name>")
  .description("Angle-completeness coverage for a skill (answered angles / declared angles; covered=all answered + depth_target met)")
  .action(async (name: string) => {
    printResult(await tfcContextCoverageHandler({ name }));
  });

program
  .command("context-forge <name>")
  .description("Derive a domain context/ scaffold FROM SKILL.md (any domain): write _angles.yaml + DV2 stubs + emit a grounded OFFLINE generation prompt (model-free)")
  .option("--deep", "Generate depth angles + raise depth_target to 20")
  .option("--preview", "Dry-run: print the plan + prompt without writing")
  .option("--types <types>", "Comma-separated artifact types to generate (taxonomy,few-shot,anti-pattern,principle,meta)")
  .action(async (name: string, opts: { deep?: boolean; preview?: boolean; types?: string }) => {
    const types = opts.types ? opts.types.split(",").map((t) => t.trim()).filter(Boolean) : undefined;
    printResult(
      await tfcContextForgeHandler({
        name,
        ...(opts.deep ? { deep: true } : {}),
        ...(opts.preview ? { preview: true } : {}),
        ...(types ? { types } : {}),
      }),
    );
  });

program
  .command("compose <category> <name>")
  .description("Resolve a skill's imports_context chain (depth ≤ 3, fails closed on cycle)")
  .action(async (category: string, name: string) => {
    printResult(await tfcComposeHandler({ category, name }));
  });

program
  .command("graph")
  .description("Read-only discovery graph: nodes + pairs_with/imports_context edges across all skills")
  .action(async () => {
    printResult(await tfcGraphHandler({}));
  });

program
  .command("recommend <category> <name>")
  .description("Top-3 skills adjacent to a target in the discovery graph, with rationale")
  .action(async (category: string, name: string) => {
    printResult(await tfcRecommendHandler({ category, name }));
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error("tfc error:", err);
  process.exit(1);
});
