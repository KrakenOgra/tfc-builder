## ROUTE (imported: audit-self-router)

Before the first edit, declare the route and the resource that backs it.

- **Route:** the pack, skill, or lane this work belongs to (`ROUTE: P0x` or a named skill).
- **Resource:** the file you loaded that grounds the route (a pack, a spec, a prior run).
- **Engagement:** what you did with it — read + applied, consulted the user, or got a greenlight.

**Gate:** the first edit is blocked until one of resource-loaded / user-consulted / greenlit holds.

Artifact: a one-line ROUTE declaration. Acceptance: the output matches `ROUTE: ` and names a resource.
