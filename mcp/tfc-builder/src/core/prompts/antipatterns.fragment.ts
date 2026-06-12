export const ANTIPATTERNS_FRAGMENT = `## HOW TO WRITE ## Anti-Patterns

Named failure modes with root cause and exact fix. Every anti-pattern MUST have:
1. ### [Anti-Pattern Name] — the name of the FAILURE (not the fix)
2. **Signal:** — the observable indicator in code or request that identifies this failure
3. **Why it fails:** — root cause: what assumption is violated, what breaks at scale
4. **Instead:** — exact fix with WRONG/RIGHT contrast showing the corrected approach

The **Why it fails** is the most important field. It lets the agent recognize the
pattern in new situations, not just copy-paste the fix. A fix without a why teaches
compliance; a fix with a why teaches judgment.

BAD anti-pattern (do not write this):
"Don't use var — use const or let."

GOOD anti-pattern (write like this):
### Mutable Default Parameter
**Signal:** A function default parameter is a mutable value: \`fn(x = []) { x.push(1) }\`
**Why it fails:** The default is evaluated once at definition time. Every caller that
  skips the argument shares the same object across calls. After 3 calls, \`fn()\` returns
  \`[1, 1, 1]\`. This breaks silently — the function appears to work in isolation.
**Instead:**
\`\`\`
// WRONG
const fn = (x = []) => { x.push(1); return x; };

// RIGHT — use null sentinel, create inside
const fn = (x: number[] | null = null) => {
  const arr = x ?? [];
  arr.push(1);
  return arr;
};
\`\`\`

Name the anti-pattern after the failure pattern, not the solution.
The signal must be observable — something you can see in the code or request.`;
