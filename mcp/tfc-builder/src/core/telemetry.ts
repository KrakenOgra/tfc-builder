import * as fsPromises from "node:fs/promises";
import * as nodePath from "node:path";
import { TFC_HOME } from "./paths.js";

export type Outcome = "ok" | "error" | "blocked";

export interface RunRecord {
  skill: string;
  tool: string;
  duration_ms: number;
  outcome: Outcome;
  ts: string;
}

const analyticsDir = (): string => nodePath.join(TFC_HOME, "analytics");
const analyticsFile = (): string =>
  nodePath.join(analyticsDir(), "tfc-builder.jsonl");

export async function recordRun(
  tool: string,
  durationMs: number,
  outcome: Outcome,
): Promise<void> {
  try {
    const record: RunRecord = {
      skill: "tfc-builder",
      tool,
      duration_ms: durationMs,
      outcome,
      ts: new Date().toISOString(),
    };
    await fsPromises.mkdir(analyticsDir(), { recursive: true });
    await fsPromises.appendFile(analyticsFile(), JSON.stringify(record) + "\n", "utf-8");
  } catch {
    // Best-effort: telemetry failures NEVER propagate to the caller.
  }
}
