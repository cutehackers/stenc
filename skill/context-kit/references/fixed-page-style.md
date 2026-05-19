# ContextKit Fixed Page Style

ContextKit pages are fixed-format web pages rendered from JSON. Authors do not
choose per-document components or ad hoc styles.

## Canonical Styles

All ContextKit documentation created in this repository uses one of three fixed
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
- Render `body.scope.in` and `body.scope.out` side by side on wide screens and
  stacked on mobile.
- Render `body.surfaces` as a table with `path`, `role`, and `owner` columns.
- Render collection indexes by scanning document files. Do not require a
  document to contain other documents.
- Render pages using the selected `page.styleTemplate` value.
- Keep all routes predictable:
  - `/specs/<slug>/`
  - `/plans/<slug>/`
  - `/decisions/<slug>/`
  - `/agent-context/<slug>/`

## Page Style

- Lead with document type, title, description, status, owner, and update date.
- Use restrained operational UI styling.
- Keep panels and tables compact enough for repeated reading.
- Do not use document-authored visual components.
- Do not require Markdown or MDX to understand the contract.
