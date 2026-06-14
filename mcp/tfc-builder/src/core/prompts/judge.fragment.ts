export const JUDGE_FRAGMENT = `## HOW TO JUDGE (observable strings only — never vibes)

You are producing an \`eval-report.json\` by measuring BEHAVIOR, not by rating quality.
The rule that keeps this honest: a task passes ONLY if observable strings match. You never
score "does this look good"; you score "did the required substrings appear and the forbidden
ones stay absent". This is the eval-theater firewall (V3).

For EACH golden task below, run it TWICE and compare:

1. **BASELINE** — answer the task's \`prompt\` as a plain assistant, WITHOUT the skill loaded.
   Do not consult the skill's SKILL.md. This is the control.
2. **SKILL-LOADED** — answer the same \`prompt\` AS IF the skill (its SKILL.md, shown above) is
   active and governing your output. This is the treatment.

Then judge the SKILL-LOADED output against the task's checks:

- **must**: every listed string MUST appear in the skill-loaded output. A string wrapped in
  \`/slashes/\` is a regex; anything else is a literal case-sensitive substring.
- **must_not**: none of the listed strings may appear in the skill-loaded output.
- A task's \`pass\` is \`true\` IFF every \`must\` matched AND no \`must_not\` matched. Otherwise \`false\`.
- In \`delta_note\`, state the OBSERVABLE difference: what the baseline missed that the
  skill-loaded run produced (e.g. "baseline answered prose; loaded emitted ## SYSTEM CARD").
  If the skill-loaded run failed a check, say exactly which string was missing or forbidden.

\`behavioral_score\` = (count of tasks with pass:true) / (total tasks judged). A float 0..1.

Do not round kindly. A skill that does not change observable output from baseline scores low —
that is the system working, not a bug. An empty or missing \`must\`/\`must_not\` on a task is a
malformed eval; the lane-gate rejects such a report.`;
