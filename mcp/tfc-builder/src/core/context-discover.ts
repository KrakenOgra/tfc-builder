// src/core/context-discover.ts
// CCE v2 Wave 4 (V4 DOMAINS-ARE-DISCOVERED-NOT-DECLARED) — the taxonomy self-populates from disk.
//
// v1 grew the taxonomy by hand-editing context-taxonomy.yaml (4 domains). Here a domain also
// appears just by a skill carrying a context/_angles.yaml manifest that names it — so adding a
// domain edits ZERO .ts and ZERO root YAML. The hand-authored taxonomy stays as a SEED/override.
// Read-only + model-free + clock-free (INV-4): pure directory walk + YAML reads.

import * as nodePath from "node:path";
import { ok, type Result } from "./result.js";
import { exists, listDirs } from "./fs.js";
import { readYaml } from "./yamlio.js";
import { TFC_SKILLS, TFC_CONTEXT_TAXONOMY } from "./paths.js";
import type { ContextTaxonomy } from "./context.js";

// Per-skill manifest (lives at <skill>/context/_angles.yaml). W5 reads angles + depthTarget for
// coverage; W4 only needs the domain it declares and how many angles it claims.
export interface AngleManifestEntry {
  file: string;
  sections?: string[];
  source_hint?: string;
}
export interface AngleManifest {
  domain: string;
  angles: AngleManifestEntry[];
  depth_target?: number;
}

export interface DiscoveredDomain {
  domain: string;
  origin: "taxonomy" | "manifest" | "both";
  fileCount: number; // declared files (taxonomy required_files ∪ manifest angles)
  skills: string[]; // skills carrying a manifest for this domain
}

export interface DiscoveryResult {
  domains: DiscoveredDomain[];
  total: number;
  fromTaxonomy: number;
  fromManifest: number;
}

export async function loadAngleManifest(
  contextDir: string,
): Promise<AngleManifest | null> {
  const p = nodePath.join(contextDir, "_angles.yaml");
  if (!(await exists(p))) return null;
  const r = await readYaml<AngleManifest>(p);
  if (!r.ok || !r.data) return null;
  if (typeof r.data.domain !== "string" || !Array.isArray(r.data.angles)) return null;
  return r.data;
}

interface DomainAccum {
  fromTax: boolean;
  fromMan: boolean;
  files: Set<string>;
  skills: Set<string>;
}

export async function discoverDomains(): Promise<Result<DiscoveryResult>> {
  const byDomain = new Map<string, DomainAccum>();

  const touch = (domain: string): DomainAccum => {
    let e = byDomain.get(domain);
    if (!e) {
      e = { fromTax: false, fromMan: false, files: new Set(), skills: new Set() };
      byDomain.set(domain, e);
    }
    return e;
  };

  // 1) SEED: the hand-authored taxonomy (override layer — absent is fine).
  if (await exists(TFC_CONTEXT_TAXONOMY)) {
    const taxR = await readYaml<ContextTaxonomy>(TFC_CONTEXT_TAXONOMY);
    if (taxR.ok && taxR.data?.domains) {
      for (const [domain, block] of Object.entries(taxR.data.domains)) {
        const e = touch(domain);
        e.fromTax = true;
        for (const f of block.required_files ?? []) e.files.add(f.name);
      }
    }
  }

  // 2) DISCOVERED: per-skill context/_angles.yaml manifests across the whole tree.
  const catsR = await listDirs(TFC_SKILLS);
  if (catsR.ok) {
    for (const cat of catsR.data) {
      if (cat.startsWith("_")) continue;
      const skillsR = await listDirs(nodePath.join(TFC_SKILLS, cat));
      if (!skillsR.ok) continue;
      for (const name of skillsR.data) {
        const contextDir = nodePath.join(TFC_SKILLS, cat, name, "context");
        const manifest = await loadAngleManifest(contextDir);
        if (!manifest) continue;
        const e = touch(manifest.domain);
        e.fromMan = true;
        e.skills.add(`${cat}/${name}`);
        for (const a of manifest.angles) e.files.add(a.file);
      }
    }
  }

  const domains: DiscoveredDomain[] = [...byDomain.entries()]
    .map(([domain, e]) => ({
      domain,
      origin: (e.fromTax && e.fromMan
        ? "both"
        : e.fromTax
          ? "taxonomy"
          : "manifest") as DiscoveredDomain["origin"],
      fileCount: e.files.size,
      skills: [...e.skills].sort(),
    }))
    .sort((a, b) => (a.domain < b.domain ? -1 : a.domain > b.domain ? 1 : 0));

  return ok({
    domains,
    total: domains.length,
    fromTaxonomy: domains.filter((d) => d.origin !== "manifest").length,
    fromManifest: domains.filter((d) => d.origin !== "taxonomy").length,
  });
}
