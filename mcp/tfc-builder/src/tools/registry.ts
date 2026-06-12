import type { Result } from "../core/result.js";
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
} from "./index.js";

export interface ToolDef {
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (input: unknown) => Promise<Result<unknown>>;
}

export const registry: Readonly<Record<string, ToolDef>> = {
  tfc_new: {
    description:
      "Scaffold a new TFC skill directory from _template/ with placeholders swapped.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Skill category (kebab-case, e.g. ai-agents)",
        },
        name: {
          type: "string",
          description: "Skill name (kebab-case, e.g. prompt-engineer)",
        },
        archetype: {
          type: "string",
          enum: ["domain-expert", "workflow", "hybrid", "reference"],
          description:
            "Skill shape — selects the scoring rubric (default: domain-expert)",
        },
        dryRun: {
          type: "boolean",
          description: "Plan writes without touching disk",
        },
      },
      required: ["category", "name"],
    },
    handler: tfcNewHandler,
  },

  tfc_brainstorm: {
    description:
      "Return a prompt-template for Claude to brainstorm intelligence layers for a new TFC skill. No API key required — Claude executes the template in-session.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Skill name (kebab-case)" },
        category: { type: "string", description: "Skill category (kebab-case)" },
        intent: {
          type: "string",
          description: "What this skill does in one sentence",
        },
      },
      required: ["name", "category", "intent"],
    },
    handler: tfcBrainstormHandler,
  },

  tfc_generate: {
    description:
      "Return a prompt-template for Claude to generate specific TFC intelligence layers. No API key required.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Skill category (kebab-case)" },
        name: { type: "string", description: "Skill name (kebab-case)" },
        layers: {
          type: "array",
          items: { type: "string" },
          description:
            'Intelligence layers to generate (e.g. ["Identity","Principles","Patterns"])',
        },
      },
      required: ["category", "name", "layers"],
    },
    handler: tfcGenerateHandler,
  },

  tfc_validate: {
    description:
      "Validate a TFC skill against validations.yaml gates — structural, voice, and trigger-length checks.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Skill category (kebab-case)" },
        name: { type: "string", description: "Skill name (kebab-case)" },
      },
      required: ["category", "name"],
    },
    handler: tfcValidateHandler,
  },

  tfc_score: {
    description:
      "Score a TFC skill 0–100 against its archetype rubric (domain-expert | workflow | hybrid | reference). Returns breakdown and exact gaps.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Skill category (kebab-case)" },
        name: { type: "string", description: "Skill name (kebab-case)" },
      },
      required: ["category", "name"],
    },
    handler: tfcScoreHandler,
  },

  tfc_migrate: {
    description:
      "Migrate a spawner or gstack skill to TFC format, preserving all six intelligence layers.",
    inputSchema: {
      type: "object",
      properties: {
        sourcePath: {
          type: "string",
          description: "Absolute path to the source skill directory",
        },
        sourceType: {
          type: "string",
          enum: ["spawner", "gstack"],
          description: "Source skill format",
        },
        category: {
          type: "string",
          description: "Target TFC category (kebab-case)",
        },
        name: {
          type: "string",
          description: "Target TFC skill name (kebab-case)",
        },
        dryRun: {
          type: "boolean",
          description: "Plan writes without touching disk",
        },
      },
      required: ["sourcePath", "sourceType", "category", "name"],
    },
    handler: tfcMigrateHandler,
  },

  tfc_install: {
    description:
      "Install a TFC skill — creates both symlinks (TFC_HOME and CLAUDE_SKILLS). Idempotent.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Skill category (kebab-case)" },
        name: { type: "string", description: "Skill name (kebab-case)" },
        dryRun: {
          type: "boolean",
          description: "Plan writes without touching disk",
        },
      },
      required: ["category", "name"],
    },
    handler: tfcInstallHandler,
  },

  tfc_register: {
    description:
      "Register a TFC skill in the spawner index so it is discoverable via spawner_skills. Idempotent.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Skill category (kebab-case)" },
        name: { type: "string", description: "Skill name (kebab-case)" },
      },
      required: ["category", "name"],
    },
    handler: tfcRegisterHandler,
  },

  tfc_list: {
    description:
      "List every installed TFC skill and detect dangling symlinks.",
    inputSchema: {
      type: "object",
      properties: {
        brokenOnly: {
          type: "boolean",
          description: "Show only dangling symlinks",
        },
      },
    },
    handler: tfcListHandler,
  },
};
