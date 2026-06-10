# Stenc Fixed Page Style

Stenc pages are fixed-format web pages rendered from JSON. Authors do not
choose per-document components or ad hoc styles.

## Canonical Styles

All Stenc documentation created in this repository uses one of three fixed
style families:

- `task-first`
- `operator-console`
- `evidence-led`

`spec` and `plan` documents must choose one style family when they are authored.
`decision` and `agent-context` documents can also use one of these styles for
consistency.

Use these as follows:

- `task-first`: contract-first specs with explicit scope, architecture, and
  validation.
- `operator-console`: execution-centric pages with status, slices, risks, and
  checklists.
- `evidence-led`: records that are centered on evidence, facts, and
  agent-driven proof.

## Rendering Rules

- Render `page.humanSummary` and `page.agentSummary` as first-viewport panels.
- Render status, owner, and `updatedAt` metadata in stable badges.
- Render `links.sourceOfTruth`, `body.validation`, and
  `body.agentInstructions` as
  explicit operational sections.
- Render Superpowers-derived spec sections such as `body.requirements`,
  `body.approaches`, `body.components`, `body.dataFlow`,
  `body.errorHandling`, and `body.testingStrategy` as first-class sections.
- Render Superpowers-derived plan sections such as `body.fileStructure`,
  `body.workerInstructions`, `body.scopeCheck`, `body.slices[].files`,
  structured `body.slices[].steps[]`, `body.selfReviewChecks`,
  `body.executionHandoff`, and plan `body.supportingSections` without
  collapsing code blocks, commands, expected output, or no-placeholder guidance
  into plain text.
- Render extended supporting section fields with fixed primitives: `facts` as
  a two-column table, `links` as a label/target/purpose table, `steps` as step
  panels, `blocks` as validator-known rich primitives, and `subSections` as
  nested supporting-section panels. Do not let source JSON choose custom
  components or layout variants.
- Rendered pages should make converted legacy outline sections visible, but
  the renderer must not infer core Stenc semantics from arbitrary supporting
  sections. Authors are responsible for putting requirements, validation,
  surfaces, slices, and agent instructions in their native core fields before
  using supporting sections.
- Render `body.scope.in` and `body.scope.out` side by side on wide screens and
  stacked on mobile.
- Render `body.surfaces` as a table with `path`, `role`, and `owner` columns.
- Render collection indexes by scanning document files. Do not require a
  document to contain other documents.
- Render pages using the selected `page.styleTemplate` value.
- Every JSON document in `content/<collection>/` must have a matching generated
  styled page at the predictable route before Stenc authoring is considered
  complete.
- Keep all routes predictable:
  - `/specs/<slug>/`
  - `/plans/<slug>/`
  - `/decisions/<slug>/`
  - `/agent-context/<slug>/`

## Rich Supporting Blocks

The renderer owns all visual treatment for `supportingSections[].blocks`.
Authors provide only typed data. The renderer may use badges, callout borders,
inline code, keyboard tokens, marks, quote panels, and fixed tables, but source
JSON must not choose custom layouts, components, icons, colors, or variants.

All block text, span text, link targets, quote sources, table headers, and table
cells are escaped before rendering.

## Page Style

- Lead with document type, title, description, status, owner, and update date.
- Use restrained operational UI styling.
- Keep panels and tables compact enough for repeated reading.
- Do not use document-authored visual components.
- Do not require Markdown or MDX to understand the contract.
