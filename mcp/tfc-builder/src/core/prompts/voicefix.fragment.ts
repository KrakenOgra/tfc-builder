// Wave 6: the voice contract the drafted SkillCard + SKILL.md must satisfy, framed as
// scoped rewrites (per 05-IMPROVEMENTS A#4). A compiled skill is born clean — voice debt
// is cheapest to kill at authoring time, not after install.

export const VOICEFIX_FRAGMENT = `## VOICE CONTRACT (the drafted skill MUST satisfy this — rewrite before emitting)

Direct, concrete, builder-to-builder. Name the file, command, and user-visible impact.

SCAN every line you draft for these violations and rewrite the offending sentence:
- em dash (—) in prose → split into two sentences or use a colon
- banned words: delve, crucial, robust, comprehensive, nuanced, multifaceted, seamless
- corporate/academic tone: leveraging, utilize, facilitate → use, use, help
- hedging: "it depends", "you might consider", "this could potentially" → state the call
- passive voice where active works → name the actor

REQUIRED shape:
- principles are imperatives ("Use X before Y", not "Consider X")
- each pattern names the real failure it prevents (the WHY beats the fix)
- triggers are situation phrases the user would actually say, >= 4 words, no skill name
- sections end with what to DO, not what to think`;
