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
  tfcLaneHandler,
  tfcEvalHandler,
  tfcEvolveHandler,
  tfcPackBridgeHandler,
  tfcDoctorHandler,
  tfcCompileHandler,
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

  tfc_lane: {
    description:
      "Recompute a skill's EARNED evidence lane (authored | eval_proven | evolution_proven) purely from disk — never from a cached or asserted value. Read-only; returns the verdict, the reasons, and any cache drift.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Skill category (kebab-case)" },
        name: { type: "string", description: "Skill name (kebab-case)" },
      },
      required: ["category", "name"],
    },
    handler: tfcLaneHandler,
  },

  tfc_eval: {
    description:
      "Return a LOCAL prompt-template that evaluates a skill behaviorally — baseline (no skill) vs skill-loaded over the golden tasks in evals.yaml, scored on observable must/must_not strings. Claude executes it and writes eval-report.json; runtime/lane-gate.sh validates the report. No API key. A passing fresh report promotes the skill to the eval_proven lane.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Skill category (kebab-case)" },
        name: { type: "string", description: "Skill name (kebab-case)" },
        taskIds: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional subset of golden-task ids to run (partial re-eval); omit to run all",
        },
      },
      required: ["category", "name"],
    },
    handler: tfcEvalHandler,
  },

  tfc_evolve: {
    description:
      "Return a LOCAL prompt-template that closes the loop: fold >=3 unconsumed learnings + eval failures into the weakest SKILL.md sections, bump version, re-eval, append CHANGELOG.jsonl, mark learnings consumed. Reaches evolution_proven only if the new eval beats the old by >=0.05 (a non-improving evolve writes an honest row and stays eval_proven). Refuses (NOT_READY) under 3 unconsumed learnings unless force. No API key.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Skill category (kebab-case)" },
        name: { type: "string", description: "Skill name (kebab-case)" },
        force: {
          type: "boolean",
          description: "Override the >=3-unconsumed-learnings guard",
        },
        dryRun: {
          type: "boolean",
          description: "Plan the regen without writing (INV-3)",
        },
      },
      required: ["category", "name"],
    },
    handler: tfcEvolveHandler,
  },

  tfc_pack_bridge: {
    description:
      "Read-only cross-ecosystem report (V5): for each Kraken pack in packs.yaml that declares a paired TFC skill (pairs_skill) and an evidence floor (min_lane), recompute that skill's EARNED lane from disk and flag any pairing below its floor. Never edits packs.yaml.",
    inputSchema: {
      type: "object",
      properties: {
        packsFile: {
          type: "string",
          description:
            "Override path to packs.yaml (default: ~/.spawner/skills/pattern/kraken-packs/packs.yaml)",
        },
      },
    },
    handler: tfcPackBridgeHandler,
  },

  tfc_doctor: {
    description:
      "TFC system health: home, MCP registration, dist freshness, skill symlinks — PLUS per-skill earned lanes with cacheDrift, evalStale, evolvePending, and INV-6 stray-state flags. The forge grades itself.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: tfcDoctorHandler,
  },

  tfc_compile: {
    description:
      "The intent front door (V1): turn a one-line job into a prompt that makes Claude search-before-building, infer the archetype, and emit a SkillCard born LOOP-READY — carrying lane: authored + 3 eval seeds so the first artifact already sits on the earned-evidence ladder. Prompt-template; Claude fills the card. No API key. BAD_INPUT if the intent is under 5 words.",
    inputSchema: {
      type: "object",
      properties: {
        intent: {
          type: "string",
          description: "The job in one line — describe the job, not the feature",
        },
        context: {
          type: "string",
          description: "Optional extra context (stack, constraints, who it's for)",
        },
      },
      required: ["intent"],
    },
    handler: tfcCompileHandler,
  },
};
