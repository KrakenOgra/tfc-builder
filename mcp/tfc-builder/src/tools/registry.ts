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
  tfcContextReceiptHandler,
  tfcContextPromoteHandler,
  tfcComposeHandler,
  tfcGraphHandler,
  tfcRecommendHandler,
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
        withContext: {
          type: "boolean",
          description:
            "Also scaffold context/ stubs when the category is a taxonomy domain (v4 W1)",
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
      "Return a LOCAL prompt-template that evaluates a skill behaviorally — baseline (no skill) vs skill-loaded over the golden tasks in evals.yaml, scored on observable must/must_not strings. Claude executes it and writes eval-report.json; runtime/lane-gate.sh validates the report. No API key. A passing fresh report promotes the skill to the eval_proven lane. v4 W4: --live augments the prompt from analytics/runs.jsonl when the skill has ≥3 real time-spread invocations (report source:\"live\"); otherwise source:\"seeds\". The lane gate reads the score, never the source.",
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
        live: {
          type: "boolean",
          description:
            "Consume analytics/runs.jsonl when ≥3 real time-spread invocations exist (source:live)",
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

  tfc_capture: {
    description:
      "Wave 1 (the living loop's INPUT side): wire + verify continuous learnings capture. With audit:true returns a read-only portfolio of every skill's learningsCount, runsCount, hookWired, and neverInvoked (empty learnings AND zero runs) — the honest dead-loop view. Otherwise injects the runtime capture hook into a skill's SKILL.md (category+name for one, neither for ALL) so a real invocation appends one runs.jsonl row + makes tfc_learn one reliable call. INV-8: it NEVER writes a learning — empty stays empty. No API key.",
    inputSchema: {
      type: "object",
      properties: {
        audit: {
          type: "boolean",
          description:
            "Read-only: report learningsCount/runsCount/hookWired/neverInvoked for every skill",
        },
        category: {
          type: "string",
          description: "Skill category — wire one skill (requires name)",
        },
        name: {
          type: "string",
          description: "Skill name — wire one skill (requires category)",
        },
        dryRun: {
          type: "boolean",
          description: "Plan the hook injection without writing (INV-3)",
        },
      },
    },
    handler: tfcCaptureHandler,
  },

  tfc_relink: {
    description:
      "Wave 2 (route integrity as a lane PRECONDITION): repair the symlinks that make a skill invokable. Recreates missing/dangling ~/.claude/skills and ~/.spawner/skills links, and de-dups a regular file that is BYTE-IDENTICAL to the source into the canonical symlink. NEVER overwrites a different-content file or repoints a live symlink — those are returned in `conflicts` for human decision. category+name repairs one skill, neither repairs all. dryRun renders the plan (INV-3). An unreachable skill recomputes effectiveLane:blocked while keeping its earned lane.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Skill category — repair one skill (requires name)",
        },
        name: {
          type: "string",
          description: "Skill name — repair one skill (requires category)",
        },
        dryRun: {
          type: "boolean",
          description: "Render the repair plan without touching disk (INV-3)",
        },
      },
    },
    handler: tfcRelinkHandler,
  },

  tfc_decay: {
    description:
      "Wave 3 (perishable proof): read-only decay overlay. Compares a skill's recorded proof timestamp (eval-report.json.ts for eval_proven, the latest CHANGELOG.jsonl.ts for evolution_proven) against an explicit asOf and the spec.yaml freshness_horizon. If older than the horizon the proof is `stale` and the EFFECTIVE lane drops one rung (evolution_proven→eval_proven→authored); the earned on-disk lane is untouched. asOf defaults to now at this boundary — the verdict itself never reads the clock (INV-7), so the core lane stays byte-deterministic. No freshness_horizon ⇒ no decay pressure.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Skill category (kebab-case)" },
        name: { type: "string", description: "Skill name (kebab-case)" },
        asOf: {
          type: "string",
          description:
            "Explicit reference instant (ISO 8601, e.g. 2026-06-15 or 2099-01-01). Defaults to now.",
        },
      },
      required: ["category", "name"],
    },
    handler: tfcDecayHandler,
  },

  tfc_replay: {
    description:
      "Wave 4 (stability quorum): return a prompt that runs a skill's behavioral eval N times (default 3) as independent samples, then aggregates the variance via runtime/replay-aggregate.sh into {mean,stdev,min,stable}. stable = stdev ≤ 0.05 AND min ≥ pass_threshold. Promotion should require stability across samples, not a high single lucky run; a report stamped replay.stable:false will NOT recompute to eval_proven. Guards eval-VARIANCE (the eval still scores only observable must/must_not strings). Claude is the engine — no API key.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Skill category (kebab-case)" },
        name: { type: "string", description: "Skill name (kebab-case)" },
        samples: {
          type: "number",
          description: "Independent eval samples to run (integer ≥ 2; default 3)",
        },
      },
      required: ["category", "name"],
    },
    handler: tfcReplayHandler,
  },

  tfc_portfolio: {
    description:
      "Wave 5 (one currency): a single disk-recomputed health surface for the whole skill portfolio — histogram of earned lanes (matches tfc_list), decayPressure (proofs stale as-of a date), evolveReady (eval_proven skills with ≥3 unconsumed learnings), belowFloor (pack pairings under their declared min_lane, via the read-only pack-bridge), and unreachable (skills not invokable). Reads ONLY existing contract files + packs.yaml — introduces no new state store (INV-6). asOf defaults to now.",
    inputSchema: {
      type: "object",
      properties: {
        asOf: {
          type: "string",
          description:
            "Reference instant for decay pressure (ISO 8601); defaults to now",
        },
      },
    },
    handler: tfcPortfolioHandler,
  },

  tfc_behavioral: {
    description:
      "Behavioral QA (v3 W3): deterministic, NO model call. Checks that a skill's DECLARED contract is internally executable — scaffold_template covers every required_section, SKILL.md covers every required_section, and every spec.phases acceptance criterion is machine-shaped. A skill that drops a gate fails here before it ships, so output quality stops scaling with the running agent's capability.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Skill category (kebab-case)" },
        name: { type: "string", description: "Skill name (kebab-case)" },
      },
      required: ["category", "name"],
    },
    handler: tfcBehavioralHandler,
  },

  tfc_integrate: {
    description:
      "Write a VALIDATED integration contract (v3 W5) into a skill's spec.yaml, then re-validate. A system id ending in '-mcp' is added to requires; any other id is a skill pairing added to pairs_with (direction + reason are MANDATORY — no aspirational pairs). Replaces ad-hoc CLAUDE.md integration notes with a checked, reversible edit.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Skill category (kebab-case)" },
        name: { type: "string", description: "Skill name (kebab-case)" },
        system: {
          type: "string",
          description:
            "MCP server id ending in '-mcp' (→ requires) OR a TFC skill id (→ pairs_with)",
        },
        direction: {
          type: "string",
          enum: ["before", "after", "parallel"],
          description: "Required for a skill pairing: when this skill runs relative to it",
        },
        reason: {
          type: "string",
          description: "Required for a skill pairing: why the pairing exists",
        },
        dryRun: {
          type: "boolean",
          description: "Plan the spec.yaml edit without writing",
        },
      },
      required: ["category", "name", "system"],
    },
    handler: tfcIntegrateHandler,
  },

  tfc_context: {
    description:
      "Scaffold a skill's context/ directory from context-taxonomy.yaml — writes empty section stubs with a fill_hint + last_verified frontmatter for one domain (category = taxonomy domain e.g. content/social; name locates the skill by directory). A human fills the knowledge; never calls a model (INV-3). v4 Wave 1.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Taxonomy domain key (e.g. content/social, developer/engineering)",
        },
        name: {
          type: "string",
          description: "Skill name — located by directory under skills/",
        },
        files: {
          type: "array",
          items: { type: "string" },
          description: "Optional subset of file names to scaffold (default: all in the domain)",
        },
        dryRun: {
          type: "boolean",
          description: "Plan writes without touching disk",
        },
      },
      required: ["category", "name"],
    },
    handler: tfcContextHandler,
  },

  tfc_context_audit: {
    description:
      "Scan every skill for context health — for each skill declaring requires_context, report missing files, stale files (last_verified older than staleDays, default 90), and undeclared context/*.md (present but not in requires_context). Read-only, model-free. v4 Wave 1.",
    inputSchema: {
      type: "object",
      properties: {
        asOf: {
          type: "string",
          description: "Reference instant (ISO 8601) for staleness; defaults to now",
        },
        staleDays: {
          type: "number",
          description: "Days before a context file is considered stale (default 90)",
        },
      },
    },
    handler: tfcContextAuditHandler,
  },

  tfc_context_update: {
    description:
      "Re-stamp last_verified to today on one context file after a human refreshes it. Model-free. v4 Wave 1.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Taxonomy domain key (kept for symmetry; the skill is located by name)",
        },
        name: { type: "string", description: "Skill name" },
        file: { type: "string", description: "Context file name, e.g. hooks.md" },
      },
      required: ["category", "name", "file"],
    },
    handler: tfcContextUpdateHandler,
  },

  tfc_context_get: {
    description:
      "Retrieve ranked context BODY for a task. Reads a skill's context/*.md, scores (file × section) against the task string, assembles the top-K within a token budget, and returns the prose + per-section source: provenance — not a path list. Deterministic + model-free (INV-4: identical request → identical bytes). Empty corpus returns {coverage:0, healthy:false}, never []. CCE v2 Wave 1.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Skill name — located by directory under skills/" },
        task: {
          type: "string",
          description: "What the caller needs context for — drives lexical ranking (e.g. 'scroll-stopping openers')",
        },
        domain: {
          type: "string",
          description: "Optional taxonomy domain (e.g. content/social); echoed, selects the angle manifest in later waves",
        },
        tokenBudget: { type: "number", description: "Max assembled tokens (default 2000)" },
        topK: { type: "number", description: "Max sections returned (default 8)" },
      },
      required: ["name", "task"],
    },
    handler: tfcContextGetHandler,
  },
  tfc_context_fill: {
    description:
      "OFFLINE grounded fill. Harvests a skill's grounded sources (its SKILL.md, spec.yaml, prior eval-report.json, an imported skill's SKILL.md) and returns a fill PROMPT that Claude executes out-of-band to draft each context angle-file with a mandatory per-section source: line. The tool is model-free (disk reads + string assembly, INV-4); fails with NO_SOURCES when nothing grounded exists (empty-but-honest beats full-but-wrong). CCE v2 Wave 3.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Skill name — located by directory under skills/" },
        domain: {
          type: "string",
          description: "Taxonomy domain whose angle set to fill (e.g. content/social)",
        },
      },
      required: ["name", "domain"],
    },
    handler: tfcContextFillHandler,
  },
  tfc_context_discover: {
    description:
      "Discover context domains from disk: the hand-authored context-taxonomy.yaml (seed/override) UNION every skill's context/_angles.yaml manifest. A new domain appears just by a skill carrying a manifest that names it — zero .ts and zero root-YAML edits to add one. Read-only + model-free (INV-4). CCE v2 Wave 4.",
    inputSchema: { type: "object", properties: {} },
    handler: tfcContextDiscoverHandler,
  },
  tfc_context_coverage: {
    description:
      "Angle-completeness coverage for one skill. Reads its context/_angles.yaml manifest and scores coverage = angles ANSWERED (file exists AND clears the depth bar) / angles DECLARED — so one filled file out of twelve reports uncovered, not done. Enforces the manifest's depth_target (V6: ≥12 normal, ≥20 for a context domain). Read-only + model-free (INV-4). CCE v2 Wave 5.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Skill name — located by directory under skills/" },
      },
      required: ["name"],
    },
    handler: tfcContextCoverageHandler,
  },
  tfc_context_forge: {
    description:
      "Derive a domain context/ scaffold FROM SKILL.md for ANY domain — no taxonomy entry or hand-written manifest required (the gap fill/coverage left: both dead-end without one). Reads SKILL.md as the only domain signal (INV-2), extracts domain_primitives[], writes context/_angles.yaml + DV2 stubs (synthesized: true), and returns an OFFLINE, primitive-injected, GROUNDED generation prompt Claude executes out-of-band. Adversarial default: artifacts that do not carry >= 2 domain primitives are rejected by tfc_context_forge's validator. Model-free core (extraction + writer + string assembly, INV-4). Args: deep (more angles + depth_target 20), types[] (filter artifact types), preview (plan only, no writes). Then discover -> fill -> coverage operate on the unlocked domain.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Skill name — located by directory under skills/" },
        deep: { type: "boolean", description: "Generate depth angles + raise depth_target to 20 (default 12)" },
        types: {
          type: "array",
          items: { type: "string" },
          description: "Filter to artifact types/files: taxonomy, few-shot, anti-pattern, principle, meta (default all)",
        },
        preview: { type: "boolean", description: "Dry-run: return the plan + prompt without writing manifest/stubs" },
      },
      required: ["name"],
    },
    handler: tfcContextForgeHandler,
  },
  tfc_context_receipt: {
    description:
      "Record a SECTION RECEIPT: a real build retrieved an angle's context file (via context-retrieve) and passed or failed. Appends to <skill>/context/_receipts.jsonl. This is the signal that makes the manifest receipt-earned instead of author-declared. Clock at the boundary (INV-7). Foundry Wave A.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Skill name — located by directory under skills/" },
        file: { type: "string", description: "The context/<file>.md the build retrieved" },
        task: { type: "string", description: "The task string passed to context-retrieve.get" },
        passed: { type: "boolean", description: "Did the build that used this section pass?" },
      },
      required: ["name", "file", "task", "passed"],
    },
    handler: tfcContextReceiptHandler,
  },
  tfc_context_promote: {
    description:
      "Promote angles by RECEIPT, not by author declaration. An angle is `required` only after >= minReceipts passing section receipts; otherwise `provisional`. Returns earnedAngles + earnedCoverage = earned/declared — the honest denominator the author-asserted manifest could not give. Read-only + model-free (INV-4). Foundry Wave A.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Skill name — located by directory under skills/" },
        minReceipts: {
          type: "number",
          description: "Passing receipts required to promote an angle to `required` (default 1)",
        },
      },
      required: ["name"],
    },
    handler: tfcContextPromoteHandler,
  },
  tfc_compose: {
    description:
      "Resolve a skill's imports_context inheritance chain depth-first (depth ≤ 3, fails closed on a cycle) and return the flattened {file, fromSkill} set it inherits. Model-free (INV-3). v4 Wave 2.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Skill category (kebab-case)" },
        name: { type: "string", description: "Skill name (kebab-case)" },
      },
      required: ["category", "name"],
    },
    handler: tfcComposeHandler,
  },

  tfc_graph: {
    description:
      "Read-only discovery graph (INV-6): scan every skill's spec.yaml and return {nodes, edges} where each edge is a pairs_with or imports_context relationship. Model-free. v4 Wave 5.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: tfcGraphHandler,
  },

  tfc_recommend: {
    description:
      "Top-3 skills adjacent to a target in the discovery graph, ranked by edge count + relationship type, each with a rationale. Read-only, model-free. v4 Wave 5.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Skill category (kebab-case)" },
        name: { type: "string", description: "Skill name (kebab-case)" },
      },
      required: ["category", "name"],
    },
    handler: tfcRecommendHandler,
  },
};
