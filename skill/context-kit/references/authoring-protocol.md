# ContextKit Authoring Protocol

ContextKit documents support two readers at once:

- humans scanning fixed web pages
- AI coding agents extracting stable contracts, constraints, and validation

The source document is JSON. The web page is a deterministic render of that
JSON. There is no Markdown source and no MDX component layer.

## Workflow

1. Classify the document as `spec`, `plan`, `decision`, or `agent-context`.
2. Start from the matching JSON template in `templates/`.
3. Fill all required common fields.
4. Fill all type-specific fields.
5. Keep normative behavior in explicit arrays and objects, not prose-only
   paragraphs.
6. Put unknowns in `openQuestions`.
7. Run the validator before considering the document ready.
8. Run the docs app build when changing page rendering or generated app files.

## Common Structure

Every ContextKit document includes:

- `humanSummary`
- `agentSummary`
- `sourceOfTruth`
- `goal`
- `architecture`
- `scope`
- `nonGoals`
- `surfaces`
- `evidence`
- `validationCommands`
- `agentInstructions`
- `reviewChecklist`
- `openQuestions`

Type-specific templates add contract, sequencing, rationale, or working-rule
fields on top of this common structure.

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
- Avoid hiding important meaning in prose-only strings.
- Avoid saying "should be handled carefully" without naming the owner, command,
  artifact, or validation evidence.
- Keep commands copy-pasteable.
- Use `TBD` only when genuinely unresolved, and list it in `openQuestions`.
