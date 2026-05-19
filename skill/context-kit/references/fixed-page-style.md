# ContextKit Fixed Page Style

ContextKit pages are fixed-format Astro web pages rendered from JSON. Authors do
not choose per-document components or styles.

## Rendering Rules

- Render `humanSummary` and `agentSummary` as first-viewport panels.
- Render status, owner, and last-updated metadata in stable badges.
- Render `sourceOfTruth`, `validationCommands`, and `agentInstructions` as
  explicit operational sections.
- Render `scope.in` and `scope.out` side by side on wide screens and stacked on
  mobile.
- Render `surfaces` as a table with `surface`, `role`, and `owner` columns.
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
