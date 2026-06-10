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

## Design Process

이 설계는 "Markdown을 더 많이 받아들이는가"가 아니라 "Markdown에서 유용했던 표현 의미를 Stenc의 고정 JSON 계약으로 승격할 수 있는가"를 기준으로 검토했다. grill-with-docs 검증에서 사용한 질문은 다음 순서다.

1. Stenc의 핵심가치와 충돌하는가?
   - Markdown parser, raw HTML, MDX component, per-document layout field는 JSON source of truth와 fixed renderer를 약하게 만들기 때문에 제외한다.
   - validator가 아는 typed field와 renderer-owned visual treatment만 허용한다.
2. 구현계획으로 옮길 수 있을 만큼 경계가 선명한가?
   - 각 primitive는 shape, validation rules, rendering rules, tests, acceptance criteria를 함께 가진다.
   - phase마다 validator, renderer, references, examples, rendered-page checks의 변경 표면을 명시한다.
3. 단순한 첫 구현에서 scale up이 가능한가?
   - Phase 1은 text-only primitive로 시작해 escaping, ordering, unknown-field rejection을 먼저 잠근다.
   - Phase 2는 asset path와 checklist semantics처럼 정책이 필요한 표현을 분리한다.
   - Phase 3은 diagram source preservation으로 시작해 runtime rendering 결정을 뒤로 미룬다.
4. 기존 Stenc 문서를 깨뜨리지 않는가?
   - `blocks`는 optional이고 기존 `supportingSections` fields는 그대로 유지한다.
   - core field priority는 유지되어, 요구사항이나 plan step이 supporting block으로 밀려나지 않는다.

### Product Value Alignment

이 설계가 지켜야 하는 Stenc 가치:

- Agent-readable: 의미는 문자열 안의 Markdown syntax가 아니라 typed JSON field에서 직접 읽힌다.
- Human-friendly: 렌더러는 고정 UI primitive로 스캔 가능한 페이지를 만든다.
- Deterministic: 같은 JSON source는 같은 HTML을 만들고, network/runtime dependency 없이 검증된다.
- Dependency-light: parser, sanitizer, diagram runtime 같은 큰 의존성은 phase baseline에 추가하지 않는다.
- Installable skill: authoring rules, templates, validator, renderer, examples가 함께 움직여 target repo에서도 같은 계약으로 작동한다.

### Scale-Up Posture

Scale up은 extension hook을 여는 방식이 아니라 renderer-owned primitive catalog를 넓히는 방식으로 진행한다. 새 primitive가 추가되려면 다음 checklist를 통과해야 한다.

- Source shape가 JSON으로 명시되어 있고 Markdown parsing을 요구하지 않는다.
- Unknown field rejection 규칙이 있다.
- Renderer가 고정 style을 소유하고 source JSON이 visual layout을 선택하지 않는다.
- 기존 문서와 schemaVersion compatibility를 깨뜨리지 않는다.
- Validator tests, renderer tests, reference docs, examples, rendered-page checks가 같은 계약을 증명한다.

### Implementation Handoff Contract

구현계획으로 전환할 때 plan은 phase를 섞지 않고 다음 순서로 잘라야 한다.

1. Phase 1 plan은 `paragraph`, `callout`, `quote`, `table`만 구현한다.
2. Phase 1에서 validator/renderer helper와 hostile HTML escaping tests를 먼저 안정화한다.
3. Phase 2 plan은 Phase 1 helper 위에 `media`와 `taskList`만 추가한다.
4. Phase 2 전에 `docs/DECISIONS.md`의 media asset root 결정을 accepted 또는 explicitly deferred로 정리한다.
5. Phase 2에서 asset root, copy behavior, generated URL, and missing-asset failure path를 별도 acceptance criterion으로 검증한다.
6. Phase 3 plan은 rendered diagram이 아니라 escaped source panel만 구현한다.
7. rendered Mermaid나 richer nested spans는 `docs/DECISIONS.md`의 사용자 결정이 정리된 뒤 별도 spec 또는 follow-up phase로 다룬다.

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

### Allowed Key Matrix

Validator implementation must use allowlists for every new shape. Unknown keys fail validation even when they are not visual-control fields.

| Shape | Allowed keys |
| --- | --- |
| `paragraph` block | `type`, `spans` |
| `text`, `strong`, `emphasis`, `code`, `kbd`, `mark` span | `type`, `text` |
| `link` span | `type`, `text`, `target` |
| `callout` block | `type`, `tone`, `title`, `body` |
| `quote` block | `type`, `text`, `source` |
| `table` block | `type`, `columns`, `rows` |
| `media` block | `type`, `src`, `alt`, `caption` |
| `taskList` block | `type`, `items` |
| `taskList.items[]` | `label`, `checked` |
| `diagram` block | `type`, `language`, `title`, `source` |

## Phase Gate Summary

| Phase | Adds | Why here | Must not add | Gate |
| --- | --- | --- | --- | --- |
| 1 | `paragraph`, `callout`, `quote`, `table` | No asset lookup or runtime dependency; proves the typed block model | media files, checklist state mutation, diagram rendering | validator and renderer pass with hostile HTML escaping |
| 2 | `media`, `taskList` | Adds file policy and read-only checklist semantics after text model is stable | remote assets, writable task state, plan-step replacement | invalid paths fail validation and missing assets fail rendered-page checks |
| 3 | `diagram` source panel | Preserves diagram fences safely before any rendering runtime decision | Mermaid CDN, client-side script execution, remote dependency | escaped source panel renders with no script dependency |
| Follow-up | table cell spans, callout spans, rendered diagrams | Requires user/product decision after baseline primitives exist | silent schema expansion | recorded decision plus new spec or plan |

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
- `link.target` must be a safe active link target. Allowed forms are `https://...`, `http://...`, `mailto:...`, `#anchor`, `./relative`, `../relative`, and repo-style relative paths such as `docs/spec.md`.
- `link.target` must reject `javascript:`, `data:`, `file:`, protocol-relative URLs (`//example.com`), absolute filesystem paths, control characters, and empty or whitespace-only values.
- Unknown span fields are rejected unless explicitly documented.

Rendering rules:

- `text`, `strong`, `emphasis`, `code`, `kbd`, and `mark` render to fixed inline styles.
- `link` renders to `<a>` only after validator target policy passes; renderer still escapes text and target.
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
- `rows` must be a non-empty array of arrays.
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
- Tests prove unsafe `link.target` values are rejected before render.
- Tests prove table rows are non-empty so a valid table cannot render invisibly.
- References explain that Phase 1 table cells and callout bodies are plain text, not nested Markdown.

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

- Recommended Phase 2 source location is `docs/stenc/content/assets/`; this remains a pending decision until `docs/DECISIONS.md` records it as accepted or deferred for Phase 2.
- `media.src` is written relative to the docs app `content/` directory and must start with `assets/`.
- For the example `src: "assets/stenc-flow.png"`, the source file is `<docsDir>/content/assets/stenc-flow.png`.
- The renderer copies `<docsDir>/content/assets/**` to generated `<docsDir>/assets/**`.
- Document detail pages reference generated media through a route-relative URL to `<docsDir>/assets/<path-after-assets/>`.
- Generated asset files are derived artifacts. Source assets under `content/assets/` are not generated artifacts.
- Asset handling must not require network access.
- `check-rendered-pages.js` traverses `supportingSections[].blocks` recursively and fails when a `media.src` source file is missing. The renderer may also show a visible placeholder in generated HTML, but the completion gate must fail until the source asset exists.

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
- `taskList` is valid only under `body.supportingSections[].blocks`; it is not valid under `body.slices[]` or as a replacement for `body.slices[].steps[]`.
- `check-rendered-pages.test.js` covers present and missing media assets.
- References define the accepted or explicitly deferred asset-root policy before examples use media.

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
- Follow-up rendered diagram work requires an explicit decision because it changes dependency and runtime posture.

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

The system design stays deliberately small:

- The validator owns the allowed data shapes.
- The renderer owns all visual output.
- References and templates teach the same contract.
- Examples prove the contract in a generated docs app.
- `check-rendered-pages.js` remains the final guard against JSON-only drift.

No new plugin system, schema registry, renderer hook, Markdown parser, or client runtime is required for Phase 1. Phase 2 may need a small path-policy helper for assets, but that helper should stay local to validation/rendered-page checking unless repeated policy logic appears elsewhere.

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

Unsafe link target:

- Case: a `link` span uses `target: "javascript:alert(1)"`, `target: "data:text/html,..."`, `target: "//example.com"`, or `target: "/etc/passwd"`.
- Behavior: Phase 1 validation fails before render.

Visual-control drift:

- Case: a block includes `component`, `layout`, `variant`, or `kind`.
- Behavior: validation fails. These fields remain reserved as rejected control fields.

Unknown block field:

- Case: a `table` block includes `align`, or a `taskList.items[]` entry includes `owner`.
- Behavior: validation fails because every block, span, and nested item uses an explicit allowed-key set.

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
- Rejects empty table rows.
- Rejects unsafe `link.target` values.
- Rejects visual-control fields.
- Rejects unknown keys for every new block, span, and nested item shape.

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
- Rejects `taskList` anywhere except `body.supportingSections[].blocks`.

Renderer:

- Renders image alt text and caption.
- Copies `content/assets/**` to generated `assets/**` when the accepted Phase 2 asset-root decision is in force.
- Produces a visible missing-asset state.
- Renders task list as read-only.
- `check-rendered-pages.js` fails when a referenced media source asset is absent.

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

### Grill-With-Docs Review Checks

- Terminology check: `block`, `primitive`, `supporting section`, and `core field` match the product glossary in `CONTEXT.md`.
- Value check: every accepted primitive preserves JSON source of truth, fixed renderer ownership, and dependency-light validation.
- Boundary check: every rejected approach stays rejected in validator tests, not only in prose.
- Handoff check: the rollout plan names exact implementation surfaces and phase gates.
- Decision check: table cell spans, callout nested spans, rendered diagrams, and asset-root policy remain visible in `docs/DECISIONS.md` until approved or rejected.

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
- Should the fixed media asset root stay `docs/stenc/content/assets/`, or should installed target repos be allowed to configure a different source-owned asset root later?
