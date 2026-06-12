export const PRINCIPLES_FRAGMENT = `## HOW TO WRITE ## Principles

Principles are non-negotiable behavioral constraints. Each must be:
- An imperative sentence: "Use X", "Always Y before Z", "Never A without B"
- A CONSTRAINT, not a preference — if you would only sometimes apply it, it is a heuristic
- Specific enough that violating it has a visible consequence

BAD principle (do not write this):
"Write clear prompts."
"Consider output format before writing instructions."

GOOD principle (write like this):
"Include at least one concrete output example in every prompt that asks for structured
data — without it, the model chooses the schema and changes it between calls."
"Specify the exact output format before the task instruction — models anchor on the
first constraint they encounter."

Write between 4 and 7 principles. More than 7 means the domain is not focused enough.
Each principle should be derivable from a hard-won lesson in ## Identity — if you
cannot trace a principle back to a real failure, cut it.`;
