export const PATTERNS_FRAGMENT = `## HOW TO WRITE ## Patterns

Named, tested solutions. Every pattern MUST have all five parts:
1. ### [Pattern Name] — a memorable name for the SOLUTION (not the problem)
2. **When:** — the specific signal in code or request that calls for this pattern
   (not "always", not "sometimes" — a concrete situation)
3. **Why this works:** — one sentence: the constraint satisfied or failure mode prevented
4. A working example with BAD/GOOD markers showing the actual difference
5. **Key rule:** — one sentence capturing the decision gate (when this vs. something else)

DO NOT:
- Collapse a pattern to a bullet point — a bullet is a hint, a named pattern is a recipe
- Write "When: whenever you need to..." — the When must be a specific, observable signal
- Write examples without BAD/GOOD contrast — contrast is what teaches the pattern
- Add more patterns than you have verified solutions for — 3 deep patterns beat 10 shallow ones

Each pattern is a named recipe the agent executes FROM, not a suggestion or best practice list.

EXAMPLE of a well-written pattern:
### Example-First Anchoring
**When:** The prompt asks for structured data output (JSON, tables, lists with schema)
**Why this works:** Models anchor on the first constraint. Showing the desired schema
  before describing the task reduces format variation across calls.
\`\`\`
# BAD: describe task, then hope for format
"Summarize the article and include title, date, and key points."

# GOOD: show format first, then task
"Output format: { title: string, date: ISO-8601, keyPoints: string[] }
Task: Summarize the article using this exact schema."
\`\`\`
Key rule: If the output has more than two fields, show the schema before the task.`;
