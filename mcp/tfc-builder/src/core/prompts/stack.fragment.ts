export const STACK_FRAGMENT = `## HOW TO WRITE ## Stack Reference

The Stack Reference is the tool inventory the agent reaches for at runtime.

Format: table with columns | Tool | Version | When | Note |
- Tool: the actual tool name (npm package, CLI command, API name, framework)
- Version: the version this skill was written for ("any" if version-agnostic)
- When: the specific situation that calls for this tool
- Note: the hard-won edge case or gotcha (not documentation — the thing that bites)

BAD stack entry:
"| React | latest | UI development | Use for building UI |"

GOOD stack entry:
"| react-query | 5.x | Async server state (fetch, cache, sync) | Do not use for local UI state — that belongs in useState; mixing the two creates cache invalidation bugs that are hard to trace |"

Include only tools actually used by this skill's domain. 5–15 entries is the right range.
If a tool appears in Stack Reference, the skill knows how to use it. Do not list tools
you are not ready to advise on specifically.

Order by frequency of use — most-used tool first.`;
