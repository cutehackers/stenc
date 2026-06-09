# Stenc Rich Markdown Primitives Design Spec

## Purpose

Stenc는 Markdown/MDX를 문서 source로 되살리지 않고도, 기존 Markdown 문서에서 자주 쓰던 표현을 더 풍부하게 담을 수 있어야 한다. 이 설계는 JSON source of truth와 fixed renderer 원칙을 유지하면서, Markdown 계열 표현을 Stenc 고정 primitive로 승격하는 phased 확장안을 정의한다.

핵심 방향은 Markdown parser를 넣는 것이 아니라, Stenc validator가 아는 bounded JSON block과 inline span만 허용하는 것이다. 렌더러는 허용된 primitive를 deterministic하게 HTML로 만들고, 문서 작성자는 raw HTML, per-document component, layout DSL, MDX import를 사용할 수 없다.

## Problem

현재 Stenc는 spec/plan/decision/agent-context 문서의 운영 계약을 구조적으로 표현하는 데 집중한다. `supportingSections` 확장으로 facts, links, steps, subSections를 표현할 수 있지만, 기존 Markdown 문서에서 흔한 다음 요소는 아직 Stenc 스타일로 옮기기 어렵다.

- inline emphasis: bold, italic, inline code, links, keyboard token
- blockquote와 admonition: note, warning, tip, danger
- Markdown pipe table
- image와 caption
- task checklist
- diagram fence: Mermaid 같은 diagram source

이 요소들을 단순 문자열로 넣으면 사람에게는 스캔성이 떨어지고, agent에게는 링크, 경고, 표, 체크리스트, 코드 토큰의 의미가 안정적으로 추출되지 않는다. 반대로 Markdown parser나 raw HTML passthrough를 넣으면 Stenc의 JSON-first, deterministic, dependency-light, fixed-renderer 철학이 약해진다.

## Scope

In scope:

- `body.supportingSections[]`에 optional `blocks` 배열을 추가한다.
- `blocks`는 renderer가 아는 고정 `type`만 허용한다.
- Phase 1에서 paragraph spans, callout, quote, table을 추가한다.
- Phase 2에서 media, taskList를 추가한다.
- Phase 3에서 diagram block을 추가하되, 첫 구현은 rendered diagram이 아니라 safe source panel로 시작한다.
- validator, renderer, templates, references, examples, tests를 같은 계약으로 정렬한다.
- 기존 fields(`content`, `items`, `facts`, `links`, `steps`, `codeBlocks`, `subSections`)와 backward compatibility를 유지한다.

Out of scope:

- Markdown, MDX, frontmatter를 Stenc document source로 허용
- Markdown parser를 runtime 또는 renderer에 추가
- raw HTML passthrough
- per-document React/MDX component
- per-document CSS, layout DSL, theme override
- 문서 author가 선택하는 `component`, `layout`, `variant`, `kind`
- interactive diagram runtime, Mermaid CDN, client-side dependency loading in Phase 1 or Phase 2
- arbitrary embedded iframe, script, video, remote widget

## Design Principles

### JSON remains the source of truth

모든 의미는 JSON field에 있어야 한다. 렌더된 HTML은 재생성 가능한 결과물이며, 문서 의미를 숨기는 장소가 아니다.

### Fixed renderer, richer primitives

표현 범위를 늘리되 renderer extension mechanism을 만들지 않는다. 문서 author는 허용된 primitive의 data만 제공하고, renderer가 fixed Stenc style로 표시한다.

### No Markdown parser

`**bold**`, `[link](target)`, `| table |` 같은 Markdown syntax를 source 안에서 해석하지 않는다. 그런 표현은 typed JSON으로 명시한다.

### Core fields first

Stenc core field에 들어갈 수 있는 요구사항, validation, surfaces, slices, agent instructions는 계속 core field에 넣는다. `supportingSections[].blocks`는 supporting material과 legacy outline 표현 보존용이다.

### Safe by default

모든 text, target, caption, diagram source는 HTML escape된다. 외부 asset과 diagram rendering은 명시 정책이 없으면 실행하지 않는다.

## Proposed JSON Shape

`body.supportingSections[]`에 `blocks`를 optional field로 추가한다.

```json
{
  "heading": "Migration Notes",
  "content": "High-level summary for agents.",
  "items": [],
  "blocks": [
    {
      "type": "paragraph",
      "spans": [
        { "type": "text", "text": "Run " },
        { "type": "code", "text": "./scripts/validate.sh" },
        { "type": "text", "text": " before release." }
      ]
    },
    {
      "type": "callout",
      "tone": "warning",
      "title": "Do not commit generated pages",
      "body": "Generated HTML stays derived from JSON."
    }
  ],
  "subSections": []
}
```

`blocks` is ordered. Renderer must render blocks in array order after the section's existing `content` and `items`, and before nested `subSections`.

## Phase 1: Text Structure Blocks

Phase 1 covers the highest-value Markdown expressions without asset handling or diagram rendering.

### Block: `paragraph`

Purpose:

- Replace inline Markdown formatting with structured spans.
- Preserve inline code, links, emphasis, keyboard tokens, and highlights without parsing Markdown.

Shape:

```json
{
  "type": "paragraph",
  "spans": [
    { "type": "text", "text": "Use " },
    { "type": "strong", "text": "JSON source" },
    { "type": "text", "text": " and run " },
    { "type": "code", "text": "./scripts/validate.sh" },
    { "type": "text", "text": "." }
  ]
}
```

Allowed span types:

- `text`: plain text
- `strong`: bold emphasis
- `emphasis`: italic emphasis
- `code`: inline code token
- `link`: inline link with `text` and `target`
- `kbd`: keyboard or command-key token
- `mark`: highlighted text

Validation rules:

- `spans` must be a non-empty array.
- Every span must have a supported `type`.
- Every span must have non-empty `text`.
- `link` spans must also have non-empty `target`.
- Unknown span fields are rejected unless explicitly documented.

Rendering rules:

- `text`, `strong`, `emphasis`, `code`, `kbd`, and `mark` render to fixed inline styles.
- `link` renders to `<a>` with escaped text and escaped target.
- Renderer must not parse Markdown inside `text`.

### Block: `callout`

Purpose:

- Replace Markdown admonitions, note blocks, and operational warnings with typed Stenc UI.

Shape:

```json
{
  "type": "callout",
  "tone": "warning",
  "title": "Validation before release",
  "body": "Run the full validation suite before publishing a Stenc release."
}
```

Allowed tones:

- `neutral`
- `info`
- `success`
- `warning`
- `danger`

Validation rules:

- `tone`, `title`, and `body` are required non-empty strings.
- `tone` must be one of the allowed tones.
- Callouts do not accept custom icon, color, component, layout, or variant fields.

Rendering rules:

- Renderer maps `tone` to a fixed Stenc style.
- The visual treatment is deterministic and independent of the source document.
- `body` is rendered as escaped text in Phase 1. Nested blocks inside callouts are out of scope.

### Block: `quote`

Purpose:

- Preserve blockquote semantics separately from operational callouts.

Shape:

```json
{
  "type": "quote",
  "text": "Markdown is an input to conversion, not a Stenc document source.",
  "source": "skill/stenc/references/authoring-protocol.md"
}
```

Validation rules:

- `text` is required.
- `source` is optional.
- No raw HTML or Markdown parsing.

Rendering rules:

- Render as a fixed quote panel with optional source line.

### Block: `table`

Purpose:

- Replace Markdown pipe tables with structured JSON tables.

Shape:

```json
{
  "type": "table",
  "columns": ["Markdown Need", "Stenc Primitive", "Phase"],
  "rows": [
    ["Inline code", "paragraph.spans[].code", "1"],
    ["Admonition", "callout", "1"]
  ]
}
```

Validation rules:

- `columns` must be a non-empty array of strings.
- `rows` must be an array of arrays.
- Every row must have the same length as `columns`.
- Phase 1 table cells are plain strings only.

Rendering rules:

- Render with the existing fixed Stenc table style.
- Escape all cell values.
- Do not support alignment syntax or Markdown formatting in cells during Phase 1.

### Phase 1 Acceptance Criteria

- Validator accepts `supportingSections[].blocks` with `paragraph`, `callout`, `quote`, and `table`.
- Validator rejects unknown block types.
- Validator rejects unknown visual-control fields such as `component`, `layout`, `variant`, and `kind`.
- Renderer displays Phase 1 blocks in deterministic order.
- Existing docs without `blocks` still validate and render unchanged.
- Tests prove hostile HTML is escaped in spans, callouts, quotes, and table cells.

## Phase 2: Asset And Checklist Blocks

Phase 2 adds common Markdown expressions that need policy decisions around files and checklist semantics.

### Block: `media`

Purpose:

- Replace Markdown images with explicit repo-local media references.

Shape:

```json
{
  "type": "media",
  "src": "assets/stenc-flow.png",
  "alt": "Stenc JSON to generated HTML flow",
  "caption": "Generated pages are derived artifacts."
}
```

Validation rules:

- `src` and `alt` are required.
- `caption` is optional.
- Initial policy allows repo-local relative paths only.
- `src` must not be an absolute URL, `javascript:` URL, data URL, or path outside the docs app asset root.

Rendering rules:

- Render image with fixed max width and caption style.
- Always include escaped alt text.
- If the asset is missing, renderer should still produce a visible missing-asset panel instead of silently dropping content.

Asset policy:

- Asset source location is `docs/stenc/content/assets/`.
- Generated HTML may copy or reference assets deterministically, but generated files must remain reproducible from source.
- Asset handling must not require network access.
- Missing media assets fail `check-rendered-pages.js`. The renderer may also show a visible placeholder in generated HTML, but the completion gate must fail until the source asset exists.

### Block: `taskList`

Purpose:

- Replace Markdown checkbox lists used as reference checklists.
- Keep execution plans' authoritative steps in `body.slices[].steps[]`; `taskList` is supporting material, not the plan engine.

Shape:

```json
{
  "type": "taskList",
  "items": [
    {
      "label": "Update templates",
      "checked": false
    },
    {
      "label": "Run ./scripts/validate.sh",
      "checked": false
    }
  ]
}
```

Validation rules:

- `items` must be a non-empty array.
- Every item has non-empty `label` and boolean `checked`.
- Optional `note` may be added later, but Phase 2 does not need it.

Rendering rules:

- Render fixed checkboxes or status marks.
- Render as read-only content.
- Do not create interactive persistence or mutable task state.

### Phase 2 Acceptance Criteria

- Validator accepts `media` and `taskList` only under `supportingSections[].blocks`.
- Renderer produces fixed, read-only output for media and task lists.
- Invalid media paths fail validation.
- Missing media files are surfaced clearly during render or rendered-page checks.
- Tests prove `taskList` does not replace plan `slices[].steps[]`.

## Phase 3: Diagram Source Blocks

Phase 3 addresses Mermaid and diagram fences. The first implementation should preserve diagram source safely before introducing any client-side rendering.

### Block: `diagram`

Purpose:

- Preserve diagram source from Markdown fences such as Mermaid without requiring Markdown parsing.
- Give humans and agents a stable place to inspect architecture diagrams.

Shape:

```json
{
  "type": "diagram",
  "language": "mermaid",
  "title": "Stenc render flow",
  "source": "flowchart LR\n  JSON --> Validator\n  Validator --> Renderer\n  Renderer --> HTML"
}
```

Allowed languages:

- `mermaid`
- `dot`
- `plain`

Validation rules:

- `language`, `title`, and `source` are required.
- `language` must be an allowed value.
- `source` is rendered as escaped source text in the first Phase 3 implementation.

Rendering rules:

- Initial renderer displays a fixed diagram-source panel with language badge and code block.
- No client-side Mermaid runtime is required for Phase 3 baseline.
- Future rendered-diagram support must be an explicit follow-up decision and must work offline.

### Phase 3 Acceptance Criteria

- Validator accepts supported diagram languages and rejects unknown languages.
- Renderer shows diagram source safely and visibly.
- No script execution or remote dependency is introduced.
- Documentation explains that rendered diagrams are a later enhancement, not part of the baseline.

## Rejected Approaches

### Add a Markdown parser

Rejected because it reintroduces Markdown as a meaningful source layer. It would also create dependency, sanitization, and rendering drift risks.

### Allow raw HTML passthrough

Rejected because it conflicts with deterministic fixed rendering and creates obvious safety problems.

### Add per-document components

Rejected because `component`, `layout`, `variant`, and `kind` turn Stenc into a component DSL. Stenc should grow through bounded primitives owned by the renderer, not per-document UI instructions.

### Put all rich content into `content` strings

Rejected because agents cannot reliably extract links, warnings, tables, task states, and inline code semantics from prose-only strings.

## Architecture

### Validator

Responsibility:

- Validate `supportingSections[].blocks`.
- Validate block-specific fields and span-specific fields.
- Reject unknown block types, unknown span types, and visual-control fields.
- Preserve existing compatibility for documents without `blocks`.

Interfaces:

- `node skill/stenc/scripts/validate-stenc-doc.js <file-or-dir>`
- `validateSupportingSections(entries, errors, prefix)`
- New helper: `validateSupportingBlocks(blocks, errors, prefix)`
- New helper: `validateInlineSpans(spans, errors, prefix)`

Dependencies:

- Existing dependency-light Node.js runtime.
- Existing string and array helper functions.

### Renderer

Responsibility:

- Render each supported block type with fixed Stenc UI.
- Escape all user-provided text.
- Keep static HTML deterministic.
- Avoid client-side dependencies for Phase 1 and Phase 2.

Interfaces:

- `node skill/stenc/scripts/setup-project.js --project-root "$(pwd)" --docs-dir docs/stenc`
- `renderSupportingSection(section, depth)`
- New helper: `renderSupportingBlocks(blocks)`
- New helper: `renderInlineSpans(spans)`

Dependencies:

- Existing `escapeHtml`, `listItems`, `codeBlocks`, `renderTable` patterns.
- Existing generated static page pipeline.

### Templates And References

Responsibility:

- Teach authors when to use core fields versus `supportingSections[].blocks`.
- Provide minimal examples without encouraging dumping arbitrary Markdown into JSON.
- Keep installed `skill/stenc/SKILL.md`, `references/authoring-protocol.md`, `references/json-field-contract.md`, and `references/fixed-page-style.md` aligned.

### Examples App

Responsibility:

- Include at least one sample document that demonstrates Phase 1 blocks.
- Add Phase 2 and Phase 3 examples as those phases are implemented.
- Verify rendered examples through the existing rendered-page checks.

## Data Flow

1. Author converts a Markdown-derived spec or plan into Stenc JSON.
2. Author maps durable contract content into native Stenc core fields first.
3. Author maps remaining rich supporting content into `supportingSections[].blocks`.
4. Validator checks top-level fields, document-type body fields, supporting sections, blocks, and spans.
5. Renderer reads JSON content from the docs app.
6. Renderer writes static HTML using fixed Stenc styles.
7. `check-rendered-pages.js` verifies each JSON document has a matching page.

## Error Handling

Unknown block type:

- Case: `{"type": "accordion"}` appears in `blocks`.
- Behavior: validation fails with the exact block path and allowed types.

Unknown span type:

- Case: `{"type": "underline", "text": "..."}` appears in paragraph spans.
- Behavior: validation fails and names allowed span types.

Visual-control drift:

- Case: a block includes `component`, `layout`, `variant`, or `kind`.
- Behavior: validation fails. These fields remain reserved as rejected control fields.

Invalid media path:

- Case: media `src` is `https://...`, `/absolute/path`, `../outside.png`, `data:...`, or `javascript:...`.
- Behavior: Phase 2 validation fails before render.

Missing media asset:

- Case: media path passes syntax validation but file is absent.
- Behavior: `check-rendered-pages.js` fails with the missing asset path. The renderer may show a visible placeholder, but it must not silently omit the block.

Diagram runtime request:

- Case: a user expects Mermaid to execute in Phase 3 baseline.
- Behavior: docs clarify that baseline preserves diagram source; rendered diagrams require a separate follow-up decision.

## Testing Strategy

### Phase 1 Tests

Validator:

- Accepts `paragraph`, `callout`, `quote`, and `table`.
- Rejects unknown block types.
- Rejects unknown span types.
- Rejects missing required fields.
- Rejects table rows with the wrong number of cells.
- Rejects visual-control fields.

Renderer:

- Renders paragraph spans in order.
- Renders callout tone with fixed class names.
- Renders quote source when present.
- Renders table headers and rows.
- Escapes hostile HTML in every Phase 1 string.

References and examples:

- Templates and examples include one concise Phase 1 sample.
- References document the allowed fields and rejected fields.

### Phase 2 Tests

Validator:

- Accepts repo-local `media.src`.
- Rejects external, absolute, escaping, data, and script-like media paths.
- Accepts read-only `taskList`.
- Rejects non-boolean `checked`.

Renderer:

- Renders image alt text and caption.
- Produces a visible missing-asset state.
- Renders task list as read-only.

### Phase 3 Tests

Validator:

- Accepts `mermaid`, `dot`, and `plain`.
- Rejects unknown diagram languages.
- Requires non-empty `title` and `source`.

Renderer:

- Renders diagram source in a fixed code panel.
- Does not inject scripts or remote dependencies.
- Escapes diagram source.

### Full Validation

Run from the repo root:

```bash
./scripts/validate.sh
```

Expected:

- All validator tests pass.
- Renderer tests pass.
- Examples app setup and rendered-page checks pass.
- Existing documents without `blocks` remain valid.

## Rollout Plan

### Phase 1: Text Structure Blocks

Implementation surfaces:

- `skill/stenc/scripts/validate-stenc-doc.js`
- `skill/stenc/scripts/validate-stenc-doc.test.js`
- `skill/stenc/scripts/setup-project.js`
- `skill/stenc/scripts/setup-project.test.js`
- `skill/stenc/references/json-field-contract.md`
- `skill/stenc/references/authoring-protocol.md`
- `skill/stenc/references/fixed-page-style.md`
- `skill/stenc/SKILL.md`
- `examples-app/content/**`
- `examples/**` if source examples are mirrored there

Done when:

- `paragraph`, `callout`, `quote`, and `table` are validated and rendered.
- Existing `supportingSections` examples still pass.
- Full validation passes.

### Phase 2: Asset And Checklist Blocks

Implementation surfaces:

- Same validator and renderer files.
- Asset path policy helper if path validation becomes non-trivial.
- Examples app assets.
- Rendered-page check if missing media must be enforced there.

Done when:

- `media` and `taskList` are validated and rendered.
- Invalid media paths fail validation.
- Missing assets fail `check-rendered-pages.js`.
- Full validation passes.

### Phase 3: Diagram Source Blocks

Implementation surfaces:

- Same validator and renderer files.
- Documentation explaining baseline source rendering.
- Examples with a small Mermaid source block.

Done when:

- `diagram` validates supported languages.
- Diagram source renders safely as escaped source.
- No script or network dependency is introduced.
- Full validation passes.

## Open Questions

- Should `table` cells remain plain strings indefinitely, or should a later phase allow `spans` inside cells?
- Should `callout.body` eventually support `spans`, or is plain text enough for Stenc's operational style?
- Should rendered Mermaid diagrams be considered after Phase 3, or should diagram source panels remain the permanent Stenc behavior?
