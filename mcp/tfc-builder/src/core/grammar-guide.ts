import * as nodePath from "node:path";
import { fail, ok, type Result } from "./result.js";
import { readText, exists } from "./fs.js";
import { skillDir } from "./paths.js";
import { round2, type SectionReceipt } from "./section-attribute.js";

/**
 * TFC 1000x — Wave 2: the grammar guide.
 *
 * Reads section-receipts.jsonl for a domain and turns per-section execution credit into
 * compile directives (DV-1 attribution over assertion, DV-3 compression is the metric).
 *
 * Two hard rules, both INV-3 (no synthetic learning, no premature pruning):
 *  - Under MIN_RECEIPTS real receipts -> everything is KEEP (provisional, never prune).
 *  - PINNED sections (Quality Gates / VERIFY / Identity / Preamble) are KEEP-PINNED
 *    regardless of credit. The pinned set is a HARD-CODED list, not a threshold — a
 *    configurable floor is a defeatable floor.
 */

export type Directive = "STRENGTHEN" | "REVIEW-PRUNE" | "KEEP" | "KEEP-PINNED";

export interface SectionDirective {
  id: string;
  header: string;
  directive: Directive;
  /** mean confidence across all receipts seen for this section */
  meanCredit: number;
  receiptsSeen: number;
  pinned: boolean;
}

export interface GrammarGuideResult {
  domain: string;
  receiptCount: number;
  /** >= MIN_RECEIPTS — only then do STRENGTHEN / REVIEW-PRUNE fire */
  ready: boolean;
  directives: SectionDirective[];
}

const MIN_RECEIPTS = 3;
const STRENGTHEN_AT = 0.7;
const PRUNE_BELOW = 0.3;

// INV-3: the un-prunable floor. Hard-coded by MEANING, never read from config.
const PINNED_MARKERS = [
  "quality gate",
  "quality wrap",
  "quality",
  "verify",
  "verification",
  "identity",
  "preamble",
  "principles",
  "tfc runtime hook",
];

export function isPinned(header: string): boolean {
  const h = header.toLowerCase();
  return PINNED_MARKERS.some((m) => h.includes(m));
}

export interface BuildGrammarGuideInput {
  category: string;
  name: string;
}

export async function buildGrammarGuide(
  args: BuildGrammarGuideInput,
): Promise<Result<GrammarGuideResult>> {
  const dirR = skillDir(args.category, args.name);
  if (!dirR.ok) return fail(dirR.error.code, dirR.error.message);
  const domain = `${args.category}/${args.name}`;
  const sink = nodePath.join(dirR.path, "section-receipts.jsonl");

  if (!(await exists(sink))) {
    return ok({ domain, receiptCount: 0, ready: false, directives: [] });
  }

  const txt = await readText(sink);
  if (!txt.ok) return txt;

  const receipts: SectionReceipt[] = [];
  for (const line of txt.data.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      receipts.push(JSON.parse(t) as SectionReceipt);
    } catch {
      /* skip malformed row */
    }
  }

  const agg = new Map<string, { header: string; sum: number; count: number }>();
  for (const r of receipts) {
    for (const sc of r.sections_credited ?? []) {
      const cur = agg.get(sc.id) ?? { header: sc.header, sum: 0, count: 0 };
      cur.sum += sc.confidence;
      cur.count += 1;
      cur.header = sc.header;
      agg.set(sc.id, cur);
    }
  }

  const ready = receipts.length >= MIN_RECEIPTS;
  const directives: SectionDirective[] = [];
  for (const [id, a] of agg) {
    const meanCredit = a.count ? round2(a.sum / a.count) : 0;
    const pinned = isPinned(a.header);
    let directive: Directive;
    if (pinned) directive = "KEEP-PINNED";
    else if (!ready) directive = "KEEP";
    else if (meanCredit >= STRENGTHEN_AT) directive = "STRENGTHEN";
    else if (meanCredit < PRUNE_BELOW) directive = "REVIEW-PRUNE";
    else directive = "KEEP";
    directives.push({ id, header: a.header, directive, meanCredit, receiptsSeen: a.count, pinned });
  }
  directives.sort((x, y) => x.header.localeCompare(y.header));

  return ok({ domain, receiptCount: receipts.length, ready, directives });
}

/** Render the guide as a compact block to inject into a compile/evolve prompt (W3). */
export function renderGuidanceBlock(guide: GrammarGuideResult): string {
  if (!guide.ready) {
    return `(${guide.receiptCount}/${MIN_RECEIPTS} receipts — provisional, no pruning yet)`;
  }
  return guide.directives
    .map((d) => {
      const icon =
        d.directive === "STRENGTHEN"
          ? "⬆"
          : d.directive === "REVIEW-PRUNE"
            ? "⬇"
            : d.directive === "KEEP-PINNED"
              ? "📌"
              : "•";
      return `${icon} ${d.directive}  ${d.header}  (credit ${d.meanCredit})`;
    })
    .join("\n");
}
