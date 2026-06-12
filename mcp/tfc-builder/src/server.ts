#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { registry } from "./tools/registry.js";
import { fail, type Result } from "./core/result.js";
import { recordRun } from "./core/telemetry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "../package.json"), "utf-8"),
) as { version: string };

const server = new Server(
  { name: "tfc-builder", version: pkg.version },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.entries(registry).map(([name, def]) => ({
    name,
    description: def.description,
    inputSchema: def.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const entry = registry[req.params.name];
  if (!entry) {
    const err = fail("UNKNOWN_TOOL", `Unknown tool: ${req.params.name}`);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(err) }],
      isError: true,
    };
  }
  const start = Date.now();
  let result: Result<unknown>;
  try {
    result = await entry.handler(req.params.arguments ?? {});
  } catch (err: unknown) {
    result = fail(
      "INTERNAL",
      `Unexpected handler error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  await recordRun(
    req.params.name,
    Date.now() - start,
    result.ok ? "ok" : "error",
  );
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result) }],
    isError: !result.ok,
  };
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  console.error("tfc-builder fatal:", err);
  process.exit(1);
});
