# Stenc Fixed Page Style

Stenc pages use the unified B visual language generated from canonical JSON.
Authors choose an information emphasis with `page.styleTemplate`; they do not
choose per-document components, styles, colors, or layout hooks.

## One Shared Visual System

The three fixed templates are:

- `task-first`: contract and requirement emphasis for specs.
- `operator-console`: execution, plan-slice, and status emphasis for plans.
- `evidence-led`: fact and validation emphasis for evidence-heavy documents.

All three use the same stylesheet, tokens, shell, semantic markup, cards,
tables, code panels, badges, states, rich blocks, and diagrams. Template
selection does not change document meaning or field coverage. The current
visual boundary is deliberately small: `task-first` keeps the neutral document
header, `operator-console` adds the shared warning accent to the header, and
`evidence-led` adds the shared relation accent. The renderer also emits stable
template-emphasis classes on the matching semantic sections; these are not
document-authored style controls.

## B Typography and Tokens

The generated stylesheet owns these exact typography tokens:

- Body: `17px`, line height `1.6`.
- Lead and description: `18px`.
- `h1`: `clamp(34px, 5vw, 48px)`.
- `h2`: `24px`.
- `h3` through `h6`: `17px`.
- Tables and diagram detail/connection labels: `15px`.
- Collection and document navigation: `15px`.
- Code: `14px`.
- Metadata, badges, captions, callout labels, and transition text: `13px`.

Required information does not use a token below `13px`. The same stylesheet
also owns the 4–48px spacing scale, 14px component radius, 8px control radius,
pill radius, component/raised shadows, a `76ch` reading measure, a `1120px`
content width, and a `260px` desktop sidebar.

Shared semantic components use neutral surfaces by default. Status, callout,
template, and diagram role accents come from the common information, success,
warning, danger, and relation tokens. Status and role meaning is also printed
as text, so color is not the only signal. Completed execution documents use
the printed `done` status with the shared success treatment.

## Header, First Content, and Navigation

Detail pages put content in this stable order:

1. document type, title, description, status, owner, updated date, schema, and
   selected template;
2. equally sized Human Summary and Agent Summary panels;
3. source-of-truth and related-document links;
4. native document sections;
5. supporting sections and Open Questions.

This makes the header and summaries the first document content. The renderer
does not move native fields into a summary or supporting section.

The desktop shell has a sticky collection sidebar. Detail pages add a separate
`On this page` navigation generated from rendered section IDs. Active
collection links use `aria-current`, background color, text color, and heavier
weight. A skip link moves keyboard focus to the `main` landmark. Section
targets have scroll margin so headings remain visible when focused or linked.

Routes remain predictable:

- `/specs/<slug>/`
- `/plans/<slug>/`
- `/decisions/<slug>/`
- `/agent-context/<slug>/`

## Native and Supporting Components

The renderer keeps spec requirements, approaches, components, data flow, error
handling, contracts, surfaces, testing, validation, review, and implementation
handoff as first-class sections. It keeps plan worker instructions, scope
check, file structure, slices, files, structured steps, code, command/expected
pairs, risks, validation, review, and execution handoff as first-class
sections.

`supportingSections` uses only fixed renderer primitives:

- `facts`: two-column table;
- `links`: label, target, and purpose table;
- `steps`: fixed step panels;
- `blocks`: validator-known paragraph, callout, quote, table, media, task-list,
  source-diagram, or structured-diagram rendering;
- `subSections`: nested fixed panels.

Source JSON cannot select per-document component implementations, layout
variants, icons, colors, or CSS. All authored text and targets are escaped
before rendering.

## Diagram Rendering

- Rendered structured diagram types: `flowDiagram`, `layerDiagram`, `relationDiagram`
- Rendered diagram roles: `boundary`, `consumer`, `engine`, `neutral`, `session`, `surface`, `value`

Choose the representation by meaning:

- Use `diagram` when the exact Mermaid, DOT, or plain source notation is what
  readers must inspect. It renders as an escaped source panel and is never
  executed.
- Use `layerDiagram` for ordered layers, ownership boundaries, and transitions
  between adjacent layers.
- Use `flowDiagram` for directed processing or data movement.
- Use `relationDiagram` for directed ownership, adaptation, or lifecycle
  relations.

Every structured diagram renders a caption, a hidden accessible summary, and a
visual whose decorative layout is hidden from assistive technology. A
`layerDiagram` includes an always-available visually hidden ordered-text
fallback. `flowDiagram` and `relationDiagram` include a visible disclosure
containing the node list and directed relation table. Source order drives both
the visual and fallback.

The renderer assigns role colors from the registered role. Authors cannot set
diagram colors or geometry. Structured diagrams execute no Mermaid, DOT, CDN,
or diagram runtime.

## Responsive Behavior

At `780px` and below:

- the two-column shell becomes a block layout;
- the sticky sidebar becomes a static top region and its links wrap;
- main padding tightens;
- summary, scope, grid, guide, evidence, catalog, and API layouts become one
  column;
- sticky outline/fact/proof rails become static;
- layer rails move above layer content;
- diagram nodes and directed connections become one column and direction
  arrows rotate to preserve reading direction;
- the site header becomes a static vertical stack;
- cards and record term/value pairs fit the viewport.

Tables remain inside horizontally scrollable table regions instead of forcing
page-level horizontal scrolling. A table region receives `role="region"`, an
accessible label, and `tabindex="0"` only while it actually overflows.

## Accessibility

- Pages use an `aside`, labeled navigation landmarks, a focusable `main`, and
  ordered section headings.
- Links and controls receive a 3px `:focus-visible` outline with a 3px offset.
- The skip link becomes visible on focus.
- Hover is never required to reveal content or status.
- Captions, role labels, status text, callout labels, task-state text, media
  alternatives, and diagram fallbacks keep meaning independent of color.
- `prefers-reduced-motion: reduce` disables smooth scrolling and reduces
  transition/animation duration to `0.001ms` with one animation iteration.
- `prefers-contrast: more` strengthens borders and promotes muted text.
- `forced-colors: active` uses system focus and border colors and outlines the
  active navigation link.
- Long prose, list items, and descriptions wrap; code panels and overflowing
  tables scroll within their own bounds.

## Missing, Empty, and Error States

- A missing local media asset renders a dashed danger-tinted `role="alert"`
  panel with the expected content path and alt-text context. Rendered-page
  validation also fails for the missing asset.
- Empty Open Questions renders `No open questions.` in a `role="status"`
  panel.
- An empty collection renders `No <type> documents yet.` in a status panel.
- Invalid collection JSON renders a visible `role="alert"` with the source
  path and validator guidance. If no valid document remains, the collection
  also reports `No valid documents could be rendered.`

Generated HTML and CSS are reproducible output. Do not hand-edit generated
pages or `styles.css`; regenerate them from canonical JSON and the shared
renderer.
