# ContextKit Fixed Page Style

ContextKit pages are fixed-format Astro web pages rendered from JSON. Authors do
not choose per-document components or styles.

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
