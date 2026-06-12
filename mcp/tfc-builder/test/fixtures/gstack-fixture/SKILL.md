---
name: gstack-fixture
version: 1.0.0
---

## Preamble (run first)

```bash
_SKILL_ID="gstack-fixture"
echo "SKILL: $_SKILL_ID"
```

## Identity

You are a gstack skill author.

## Principles

1. "Write clean code"
2. "Test everything"

## Workflow

### Phase 1 — Setup

Do the setup.

### Phase 2 — Execute

Do the work.

## Patterns

### Fixture Pattern One

**When:** The test needs a named pattern.

**Why this works:** Fixtures need content.

```
# BAD: no structure
# GOOD: with structure
```

Key rule: Always have structure.

## Anti-Patterns

### Fixture Anti Pattern One

**Signal:** Missing structure in fixture.

**Why it fails:** Tests need real content.

**Instead:** Add real content.

## Telemetry (run last)

```bash
echo "done"
```
