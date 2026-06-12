export const QUICK_WINS_FRAGMENT = `## HOW TO WRITE ## Quick Wins

Immediate actions that produce visible improvement in under 15 minutes. Zero ambiguity.

Each quick win MUST be:
- A concrete command or action (verb + object + expected result)
- Completable in under 15 minutes
- Observable — the result is visible (output change, test passes, file exists)
- NOT a suggestion ("consider reviewing...") — an action ("run X to find Y")

BAD quick win (do not write this):
"Review your prompts for clarity."
"Make sure your system prompt is well-structured."

GOOD quick win (write like this):
"Run \`grep -rn 'You are a helpful' src/prompts/\` and replace every generic persona
with a domain-specific one — each replacement reduces off-topic responses."
"Add one worked output example to the highest-traffic prompt in your system — measure
call success rate before and after."

Write 5–10 quick wins. Order them by impact: the most immediately unblocking action first.
Each quick win should be independently executable — no dependencies between them.`;
