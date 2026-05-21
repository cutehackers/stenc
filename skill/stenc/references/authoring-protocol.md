# Stenc Authoring Protocol

Stenc documents support two readers at once:

- humans scanning fixed web pages
- AI coding agents extracting stable contracts, constraints, and validation

The source document is JSON. The web page is a deterministic render of that
JSON. There is no Markdown source and no MDX component layer.

## Workflow

1. Classify the single document as `spec`, `plan`, `decision`, or
   `agent-context`.
2. Start from the matching JSON template in `templates/`.
3. Set the fixed layout template:
   - Add `page.styleTemplate` with one of:
     - `task-first`
     - `operator-console`
     - `evidence-led`
   - For this repository, always pick one of these three for `spec` and `plan`.
4. Fill top-level metadata: `schemaVersion`, `docType`, `id`, `slug`,
   `status`, `title`, `description`, `owner`, `createdAt`, and `updatedAt`.
   Use `schemaVersion: 2` for new documents. `schemaVersion: 1` is accepted
   only for existing nested JSON documents that predate the Superpowers fields.
5. Fill `links`, `page`, and the type-specific `body`.
6. For specs derived from Superpowers brainstorming output, preserve
   requirements, considered approaches, components, data flow, error handling,
   testing strategy, self-review checks, and implementation handoff in their
   dedicated fields.
7. For plans derived from Superpowers plan output, preserve the agentic-worker
   header, checkbox tracking syntax, scope check, file structure, task files,
   step instructions, code blocks, run commands, expected output, no-placeholder
   guidance, self-review checks, and execution handoff as structured objects.
8. Keep normative behavior in explicit arrays and objects, not prose-only
   paragraphs.
9. Put unknowns in `openQuestions`.
10. Run the validator before considering the document ready.
11. Run the docs app build when changing page rendering or generated app files.

## Common Structure

Every Stenc document includes:

- top-level document identity and lifecycle metadata
- `links.sourceOfTruth` plus type-specific links like `relatedSpec`
- `page.humanSummary` and `page.agentSummary`
- `body` fields for the selected document type

Do not put collection data, sidebars, or a list of all docs into a document
artifact. The renderer derives those from `content/<collection>/*.json`.

Type-specific templates add contract, sequencing, rationale, or working-rule
fields inside `body`.

Specs and plans intentionally include fields that mirror Superpowers outputs so
conversion does not drop content that matters to agentic execution. Do not
collapse those sections into a single summary string when the source has
structured requirements, task steps, code examples, commands, or review gates.

## Document Types

### Spec

Use for canonical product, runtime, API, schema, or workflow contracts. A spec
owns truth. Plans and decisions may reference a spec, but should not contradict
it.

A spec can preserve Superpowers brainstorming output through:

- `body.requirements`
- `body.approaches`
- `body.components`
- `body.dataFlow`
- `body.errorHandling`
- `body.testingStrategy`
- `body.selfReviewChecks`
- `body.implementationHandoff`
- `body.supportingSections`

### Plan

Use for execution order, migration work, launch readiness, or cleanup work. A
plan owns sequencing and validation, not canonical product truth. Plans should
be split into independently reviewable `body.slices`.

A plan can preserve Superpowers implementation-plan output through
`body.workerInstructions`, `body.scopeCheck`, `body.fileStructure`,
`body.slices[].files`, structured `body.slices[].steps[]` entries, and
`body.supportingSections`. Use step fields for the exact instruction, code
blocks, command, expected result, and commit or handoff operation.

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
