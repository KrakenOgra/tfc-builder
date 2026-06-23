// src/core/graph.ts
// v4 Wave 5 — the discovery graph (Vector V4).
//
// tfc_graph reads every skill's spec.yaml and collects the composition edges: pairs_with (a stated
// before/after/parallel relationship) and imports_context (W2 inheritance). tfc_recommend ranks the
// skills adjacent to a target. Both are MODEL-FREE (INV-3) and READ-ONLY (INV-6) — they introduce no
// new state store, only a view recomputable from disk by a stranger after a restart.

import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { exists, listDirs } from "./fs.js";
import { readYaml } from "./yamlio.js";
import { skillDir, TFC_SKILLS } from "./paths.js";
import type { SpecYaml } from "./types.js";

export type EdgeVia = "pairs_with" | "imports_context";

export interface GraphEdge {
  from: string;
  to: string;
  via: EdgeVia;
}

export interface SkillGraph {
  nodes: string[];
  edges: GraphEdge[];
}

export interface Recommendation {
  skill: string;
  reason: string;
  edge: EdgeVia;
}

async function allSkillDirs(): Promise<{ id: string; dir: string }[]> {
  const out: { id: string; dir: string }[] = [];
  const catsR = await listDirs(TFC_SKILLS);
  if (!catsR.ok) return out;
  for (const cat of catsR.data) {
    if (cat.startsWith("_")) continue;
    const skillsR = await listDirs(nodePath.join(TFC_SKILLS, cat));
    if (!skillsR.ok) continue;
    for (const name of skillsR.data) {
      out.push({ id: name, dir: nodePath.join(TFC_SKILLS, cat, name) });
    }
  }
  return out;
}

export async function buildGraph(): Promise<Result<SkillGraph>> {
  const skills = await allSkillDirs();
  const nodes = new Set<string>();
  const edges: GraphEdge[] = [];

  for (const s of skills) {
    nodes.add(s.id);
    const specR = await readYaml<SpecYaml>(nodePath.join(s.dir, "spec.yaml"));
    if (!specR.ok) continue;
    const spec = specR.data;

    if (Array.isArray(spec.pairs_with)) {
      for (const p of spec.pairs_with) {
        if (typeof p.skill === "string" && p.skill) {
          edges.push({ from: s.id, to: p.skill, via: "pairs_with" });
          nodes.add(p.skill); // a paired skill may live outside the TFC tree; it is still a node
        }
      }
    }

    if (spec.imports_context?.from) {
      edges.push({ from: s.id, to: spec.imports_context.from, via: "imports_context" });
      nodes.add(spec.imports_context.from);
    }
  }

  return ok({ nodes: [...nodes].sort(), edges });
}

export async function recommend(input: {
  category: string;
  name: string;
}): Promise<Result<Recommendation[]>> {
  const dirR = skillDir(input.category, input.name);
  if (!dirR.ok) return fail("BAD_INPUT", dirR.error.message);
  if (!(await exists(dirR.path))) {
    return fail("NOT_FOUND", `Skill not found: ${input.category}/${input.name}`);
  }

  const graphR = await buildGraph();
  if (!graphR.ok) return graphR;
  const me = input.name;

  // Adjacency: weight every edge that touches me, whether I declare it (out) or another skill
  // declares it about me (in). More edges + more distinct relationship types ⇒ stronger neighbour.
  const score = new Map<string, { count: number; vias: Set<EdgeVia> }>();
  const bump = (other: string, via: EdgeVia): void => {
    if (other === me) return;
    const e = score.get(other) ?? { count: 0, vias: new Set<EdgeVia>() };
    e.count += 1;
    e.vias.add(via);
    score.set(other, e);
  };
  for (const e of graphR.data.edges) {
    if (e.from === me) bump(e.to, e.via);
    else if (e.to === me) bump(e.from, e.via);
  }

  return ok(
    [...score.entries()]
      .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
      .slice(0, 3)
      .map(([skill, info]) => {
        const vias = [...info.vias];
        return {
          skill,
          reason: `${info.count} ${vias.join("+")} edge(s) with ${me}`,
          edge: vias[0] ?? "pairs_with",
        };
      }),
  );
}
