# ContextKit Authoring Protocol

ContextKit documents must support two readers at once:

- humans scanning for status, scope, and decisions
- AI coding agents extracting stable contracts, constraints, and validation

## Workflow

1. Classify the document as `spec`, `plan`, `decision`, or `agent-context`.
2. Start from the matching template.
3. Fill frontmatter before body prose.
4. Preserve required headings.
5. Put normative behavior in explicit sections, lists, and tables.
6. Put unknowns under `Open Questions`.
7. Run the validator before considering the document ready.

## Document Types

### Spec

Use for canonical product, runtime, API, schema, or workflow contracts. A spec
owns truth. Plans and decisions may reference a spec, but should not contradict
it.

### Plan

Use for execution order, migration work, launch readiness, or cleanup work. A
plan owns sequencing and validation, not canonical product truth.

### Decision

Use for ADR-style rationale. A decision records tradeoffs and consequences. It
should point to the spec that owns ongoing behavior.

### Agent Context

Use for reusable AI coding-agent entry context. It should be short, scoped, and
connected to source-of-truth docs.

## Writing Rules

- Prefer concrete nouns over broad terms like "stuff", "logic", or "flow".
- Avoid hiding important meaning in prose-only paragraphs.
- Avoid saying "should be handled carefully" without naming the owner, command,
  artifact, or validation evidence.
- Keep commands copy-pasteable.
- Use `TBD` only when genuinely unresolved, and list it under `Open Questions`.

