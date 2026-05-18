# ContextKit Authoring Protocol

ContextKit documents must support two readers at once:

- humans scanning for status, scope, and decisions
- AI coding agents extracting stable contracts, constraints, and validation

## Workflow

1. Classify the document as `spec`, `plan`, `decision`, or `agent-context`.
2. Read `templates/base-template.mdx` to understand the shared shape.
3. Start from the matching type-specific template.
4. Fill frontmatter before body prose.
5. Preserve required headings.
6. Put normative behavior in explicit sections, lists, and tables.
7. Put unknowns under `Open Questions`.
8. Run the validator before considering the document ready.

## Base Structure

Every ContextKit document extends the base template. The base structure borrows
the useful discipline of Superpowers plans: visible goal, architecture, owned
surfaces, evidence, validation, and review checks. ContextKit keeps that shape
plain-Markdown friendly so the document remains useful outside Starlight.

Required base headings:

- `Human Summary`
- `Agent Summary`
- `Source Of Truth`
- `Goal`
- `Architecture`
- `Scope`
- `Non-Goals`
- `File Or Surface Map`
- `Evidence`
- `Validation`
- `Agent Instructions`
- `Review Checklist`
- `Open Questions`

Type-specific templates add their own contract, sequencing, rationale, or
working-rule sections on top of this base.

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
