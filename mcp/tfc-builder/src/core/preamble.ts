// Wave 3 (V2): the install-time injection of a managed runtime hook into a skill's
// SKILL.md. The hook sources runtime/preamble.sh so that invoking the skill records the
// run and exposes `tfc_learn` — closing CRACK-A's input side (learnings exist BECAUSE a
// skill ran, not because a builder remembered to echo JSON).
//
// Pure + idempotent: the block is delimited by stable markers, so re-install replaces it
// in place (never duplicates) and rollback is a clean removal.

export const PREAMBLE_HOOK_START = "<!-- TFC:PREAMBLE-HOOK START -->";
export const PREAMBLE_HOOK_END = "<!-- TFC:PREAMBLE-HOOK END -->";

/** The managed hook block for a skill. Regenerated verbatim on every install. */
export function buildPreambleHook(category: string, name: string): string {
  return `${PREAMBLE_HOOK_START}
## TFC Runtime Hook (managed — do not edit; tfc_install regenerates this block)

Run this first. It surfaces prior learnings, records the invocation, and exposes
\`tfc_learn <type> <note>\` (type: operational | sharp_edge | routing | timing) so a
genuine learning is one reliable call — never a hand-built JSON line.

\`\`\`bash
_TFC_RT="\${TFC_HOME:-$HOME/.future-code}/mcp/tfc-builder/runtime"
[ -f "$_TFC_RT/preamble.sh" ] && source "$_TFC_RT/preamble.sh" "${category}" "${name}"
\`\`\`
${PREAMBLE_HOOK_END}`;
}

export interface InjectResult {
  text: string;
  changed: boolean;
}

/**
 * Insert (or refresh) the managed hook block in a SKILL.md.
 * - If the markers already exist, replace the block in place (idempotent).
 * - Otherwise insert it immediately after the YAML frontmatter (the closing `---`),
 *   or at the very top if there is no frontmatter.
 * Returns the new text and whether anything changed (changed=false ⇒ no write needed).
 */
export function injectPreambleHook(
  skillMdText: string,
  category: string,
  name: string,
): InjectResult {
  const block = buildPreambleHook(category, name);

  const startIdx = skillMdText.indexOf(PREAMBLE_HOOK_START);
  if (startIdx !== -1) {
    const endMarkerIdx = skillMdText.indexOf(PREAMBLE_HOOK_END, startIdx);
    if (endMarkerIdx !== -1) {
      const endIdx = endMarkerIdx + PREAMBLE_HOOK_END.length;
      const existing = skillMdText.slice(startIdx, endIdx);
      if (existing === block) return { text: skillMdText, changed: false };
      const next = skillMdText.slice(0, startIdx) + block + skillMdText.slice(endIdx);
      return { text: next, changed: true };
    }
    // start marker without an end marker — a corrupted block; fall through to re-insert.
  }

  // Insert after frontmatter if present (text starts with `---\n ... \n---`).
  if (skillMdText.startsWith("---")) {
    const afterFirst = skillMdText.indexOf("\n", 3);
    if (afterFirst !== -1) {
      const closeIdx = skillMdText.indexOf("\n---", afterFirst);
      if (closeIdx !== -1) {
        const insertAt = skillMdText.indexOf("\n", closeIdx + 1);
        const at = insertAt === -1 ? skillMdText.length : insertAt + 1;
        const next =
          skillMdText.slice(0, at) + "\n" + block + "\n" + skillMdText.slice(at);
        return { text: next, changed: true };
      }
    }
  }

  // No frontmatter — prepend.
  return { text: block + "\n\n" + skillMdText, changed: true };
}
