export const HANDOFFS_FRAGMENT = `## HOW TO WRITE ## Handoffs

The Handoffs section defines the skill's boundary contracts: what it provides,
what it receives, and what it explicitly refuses to own.

Structure:

### Provides to
Table: | Skill | When | What to pass |
- Skill: the receiving skill's ID (kebab-case)
- When: the trigger condition that causes this handoff
- What to pass: the specific artifact or context (not "context" — name the thing)

### Receives from
Table: | Skill | When | What arrives |
- Same structure — name what arrives, specifically

### Does NOT own
Bulleted list of scope boundaries with routing:
- [scope-slug] → [skill-id that owns it]

The "Does NOT own" list is as important as the rest. It prevents the agent from
attempting work outside its boundary — which is worse than refusing, because it
produces confident wrong output.

BAD handoff:
"Receives: context from other skills"

GOOD handoff:
"| code-reviewer | After implementation | The PR diff, the failing test output, and the specific line numbers to focus on |"

Write at least one "Does NOT own" entry. If you cannot name something this skill
does not own, the skill's scope is too broad.`;
