# Supporting Sections Extension Design Spec

## Purpose

Stenc는 문서의 source of truth를 structured JSON으로 유지하고, 설치 후 생성되는 정적 웹페이지는 그 JSON을 deterministic하게 렌더링한다. 이번 설계는 사용자가 기존에 쓰던 여러 형태의 spec/plan Markdown 문서 골격을 Stenc JSON으로 변환해 웹페이지에 표현할 수 있도록 `supportingSections`를 확장하되, 사용자 정의 컴포넌트나 렌더러 DSL을 도입하지 않는 것을 목표로 한다.

핵심 운영 원칙은 Stenc core field를 먼저 쓰고, core schema에 직접 대응되지 않는 기존 문서 골격만 `supportingSections` 확장 필드로 보존하는 것이다.

## Problem

현재 `supportingSections`는 `heading`, `content`, `items`, `codeBlocks`만 표현한다. 이 구조는 보조 설명과 간단한 bullet에는 충분하지만, 기존 운영 문서나 runbook에서 자주 등장하는 metadata, 관련 링크, 절차 단계, 중첩 하위 섹션을 구조적으로 보존하기 어렵다.

그 결과 사용자는 중요한 정보를 긴 `content` 문자열이나 `items` 배열에 섞어 넣어야 한다. 이는 사람에게도 스캔성이 떨어지고, AI coding agent가 담당자, 원문 링크, 실행 단계, 하위 구조를 안정적으로 추출하기 어렵게 만든다.

## Scope

In scope:

- `body.supportingSections[]`에 선택 필드 `facts`, `links`, `steps`, `subSections`를 추가한다.
- `subSections`는 같은 section shape를 재귀적으로 사용한다.
- 기존 필드 `heading`, `content`, `items`, `codeBlocks`는 유지한다.
- 기존 spec/plan Markdown 문서를 Stenc JSON으로 옮길 때 적용할 core-field-first 변환 규칙을 문서화한다.
- validator, renderer, templates, references, tests를 같은 계약으로 정렬한다.
- generated static web page에서 새 필드가 보이도록 한다.

Out of scope:

- 사용자 정의 React/MDX/HTML 컴포넌트
- per-document CSS, renderer hook, layout DSL
- `kind`, `layout`, `variant`, `component` 같은 시각 표현 지시 필드
- `docType: "custom"` 또는 custom collection 추가
- Markdown, MDX, frontmatter를 Stenc 문서 source로 허용하는 변경
- Markdown 파일을 직접 웹페이지 source로 렌더링하는 변경

## Requirements

### REQ-1: Fixed JSON Source Contract

`supportingSections` 확장은 Stenc의 JSON source-of-truth 원칙을 유지해야 한다. 새 정보는 모두 JSON field로 표현하고, 렌더된 HTML에만 의미가 존재해서는 안 된다.

Acceptance criteria:

- `supportingSections[].facts`, `links`, `steps`, `subSections`가 JSON schema contract 문서에 명시된다.
- renderer가 새 필드를 표시하더라도 source 의미는 JSON에서 직접 읽을 수 있다.
- Markdown/MDX/frontmatter source는 계속 거부된다.

### REQ-2: Bounded User-Defined Outline

확장은 user-defined component system이 아니라 user-defined outline을 지원해야 한다.

Acceptance criteria:

- 허용되는 추가 필드는 `facts`, `links`, `steps`, `subSections` 네 개뿐이다.
- `subSections`는 같은 section shape만 허용한다.
- `component`, `layout`, `variant`, `kind` 같은 렌더러 제어 필드는 도입하지 않는다.

### REQ-3: Recursive Section Rendering

정적 웹페이지는 하위 섹션을 읽기 쉬운 계층 구조로 렌더링해야 한다.

Acceptance criteria:

- top-level supporting section과 nested subsection이 모두 표시된다.
- 각 subsection은 heading, content, items, facts, links, steps, codeBlocks를 같은 규칙으로 표시한다.
- 깊은 중첩에서도 HTML escape가 적용되고, arbitrary raw HTML은 삽입되지 않는다.

### REQ-4: Actionable Steps

`supportingSections[].steps`는 runbook이나 migration guide의 절차를 표현할 수 있어야 한다.

Acceptance criteria:

- 각 step은 `id`, `title`, `status`를 가진다.
- 각 step은 `instruction`, `command` + `expected`, 또는 `codeBlocks` 중 하나 이상의 actionable content를 가진다.
- `command`가 있으면 `expected`도 있어야 하고, `expected`가 있으면 `command`도 있어야 한다.

### REQ-5: Backward Compatibility

기존 Stenc 문서는 변경 없이 계속 validate되고 render되어야 한다.

Acceptance criteria:

- 기존 `supportingSections` shape는 그대로 유효하다.
- 새 필드는 optional이다.
- schemaVersion 1 compatibility behavior는 변경하지 않는다.

### REQ-6: Core Field Priority And Markdown Conversion

여러 형태의 기존 `spec.md` 또는 `plan.md` 문서는 Markdown source로 직접 렌더링하지 않고, Stenc JSON의 core fields와 `supportingSections` 확장 필드로 변환되어야 한다.

Acceptance criteria:

- Stenc에 전용 body field가 있는 정보는 해당 core field에 먼저 배치한다.
- `supportingSections`는 core schema에 직접 대응되지 않는 기존 문서 골격, 보조 설명, 섹션 단위 metadata, 원문 링크, 절차, 중첩 구조에만 사용한다.
- references와 installed skill 문서는 `supportingSections`를 범용 dumping ground로 쓰지 말라고 명시한다.
- 기존 Markdown 문서의 섹션 구조는 `supportingSections[].heading`, `content`, `items`, `facts`, `links`, `steps`, `subSections`로 보존할 수 있지만, 변환 후 source of truth는 JSON이다.

## Proposed Section Shape

```json
{
  "heading": "Database Migration",
  "content": "기존 운영 문서의 섹션 본문.",
  "items": ["핵심 bullet"],
  "facts": [
    {
      "label": "Owner",
      "value": "Platform Team"
    }
  ],
  "links": [
    {
      "label": "Source runbook",
      "target": "https://wiki.internal/runbook",
      "purpose": "Original source"
    }
  ],
  "steps": [
    {
      "id": "step-1",
      "title": "Backup",
      "status": "todo",
      "instruction": "Run pg_dump before migration.",
      "command": "pg_dump ...",
      "expected": "Backup file exists and checksum matches."
    }
  ],
  "codeBlocks": [
    {
      "language": "bash",
      "content": "pg_dump ..."
    }
  ],
  "subSections": []
}
```

## Core Field Priority And Conversion Rules

When converting existing `spec.md` or `plan.md` documents, authors must preserve Stenc's core schema before using extension fields.

1. Use Stenc core fields first.
   - For specs, map canonical behavior to fields such as `goal`, `problem`, `scope`, `requirements`, `approaches`, `components`, `dataFlow`, `errorHandling`, `contracts`, `surfaces`, `testingStrategy`, `validation`, `agentInstructions`, and `reviewChecklist`.
   - For plans, map execution structure to fields such as `goal`, `architecture`, `techStack`, `workerInstructions`, `scopeCheck`, `currentState`, `targetState`, `scope`, `fileStructure`, `slices`, `executionOrder`, `risks`, `validation`, and `agentInstructions`.
2. Use `body.supportingSections` only for bounded legacy outline content or supporting material that does not fit the core schema.
3. Inside each supporting section, use only the allowed section fields:
   - `heading` for the original section title.
   - `content` for the section's main prose.
   - `items` for simple bullets.
   - `facts` for section-level key/value metadata.
   - `links` for section-level source, issue, PR, runbook, or evidence references.
   - `steps` for section-level runbook/checklist/procedure steps.
   - `codeBlocks` for exact code or command snippets.
   - `subSections` for nested original heading structure.
4. Do not move content into `supportingSections` just because it came from Markdown. If the content has a native Stenc field, use the native field.
5. Do not keep Markdown, MDX, or frontmatter as the document source. The conversion output is one structured JSON document.

## Architecture

The validator remains dependency-light Node.js. `validateSupportingSections()` becomes recursive and validates optional `facts`, `links`, `steps`, and `subSections` when present.

The renderer remains a fixed static HTML generator. It gains helper functions for rendering facts, links, supporting steps, and recursive supporting sections. The page still uses the existing Stenc shell, stylesheet, panel, table, list, step, and code block primitives.

The documentation contract is updated in the installed skill references and templates so authoring rules, examples, validation, and rendered output all describe the same shape.

## Components

### Validator

Responsibility:

- Validate `supportingSections` recursively.
- Keep the optional extension fields bounded and typed.
- Preserve existing schemaVersion behavior.

Interfaces:

- `node skill/stenc/scripts/validate-stenc-doc.js <file-or-dir>`
- `validateSupportingSections(entries, errors, prefix)`

Dependencies:

- Node.js `fs` and `path`
- Existing helper functions such as `requireString`, `requireStringArray`, `validateCodeBlocks`

### Renderer

Responsibility:

- Render extended supporting sections into deterministic HTML.
- Escape all user-provided strings.
- Reuse existing visual primitives instead of adding user-defined components.

Interfaces:

- `node skill/stenc/scripts/setup-project.js --project-root "$(pwd)" --docs-dir docs/stenc`
- `renderDocument(doc, collection)`

Dependencies:

- Existing `escapeHtml`, `listItems`, `codeBlocks`, `renderTable`, `renderPlanStep` patterns

### Documentation Contract

Responsibility:

- Teach authors which four optional fields are allowed.
- Make clear that this is not a renderer extension mechanism.
- Keep templates and references aligned with validator behavior.

Interfaces:

- `skill/stenc/SKILL.md`
- `skill/stenc/references/json-field-contract.md`
- `skill/stenc/references/authoring-protocol.md`
- `skill/stenc/references/fixed-page-style.md`
- `skill/stenc/templates/spec.json`
- `skill/stenc/templates/plan.json`

## Data Flow

1. Author converts an existing spec/plan Markdown outline into one Stenc JSON document.
2. Author maps content with dedicated Stenc meaning into core body fields first.
3. Author maps remaining bounded legacy outline content into `body.supportingSections`.
4. Validator checks the common top-level Stenc contract and the type-specific body contract.
5. Validator recursively checks any `supportingSections[].subSections`.
6. Renderer reads `content/<collection>/*.json`.
7. Renderer writes static HTML pages where supporting sections and nested subsections are visible.
8. `check-rendered-pages.js` verifies every JSON document has a styled page.

## Error Handling

Invalid facts:

- Case: `facts` is not an array, or an entry lacks `label` or `value`.
- Behavior: validation fails with a field-specific error such as `body.supportingSections[0].facts[0].label must be a non-empty string`.

Invalid links:

- Case: `links` is not an array, or an entry lacks `label`, `target`, or `purpose`.
- Behavior: validation fails with a field-specific error.

Invalid steps:

- Case: a step has no `instruction`, no valid `command` + `expected`, and no code block.
- Behavior: validation fails and names the exact step path.

Invalid nested section:

- Case: `subSections` is not an array, or a nested section lacks required `heading`, `content`, or `items`.
- Behavior: validation fails with the recursive field path.

Renderer safety:

- Case: section text includes HTML-like content.
- Behavior: renderer escapes it through the existing HTML escape path and does not execute it as markup.

## Testing Strategy

Validator tests:

- Add a passing test for a spec with `facts`, `links`, `steps`, `codeBlocks`, and nested `subSections`.
- Add a failing test for malformed extension fields.
- Confirm existing v1/v2 spec and plan tests still pass.

Renderer tests:

- Add a setup-project test proving rendered HTML includes fact labels, link labels/targets, step title, command, expected output, nested subsection heading, and nested subsection content.
- Confirm existing rendering tests still pass.

Repo validation:

- Run `node skill/stenc/scripts/validate-stenc-doc.test.js`.
- Run `node skill/stenc/scripts/setup-project.test.js`.
- Run `./scripts/validate.sh`.

Documentation review:

- Confirm the references state that core body fields must be used before `supportingSections`.
- Confirm the references describe Markdown conversion as Markdown-to-JSON mapping, not Markdown-as-source rendering.

## Self-Review Checks

- Completeness: The spec names exactly four new fields: `facts`, `links`, `steps`, `subSections`.
- Scope: The spec does not add `docType: "custom"` or a user-defined component system.
- Compatibility: Existing `heading`, `content`, `items`, and `codeBlocks` remain valid.
- Conversion discipline: Existing Markdown sections are converted to core fields first and `supportingSections` second.
- Renderer safety: The design keeps escaping and deterministic static HTML generation.
- Agent usability: Steps and facts are structured enough for AI coding agents to extract without guessing.

## Implementation Handoff

Plan location:

- `docs/superpowers/plans/2026-05-27-supporting-sections-extension.md`

Required skill:

- `superpowers:writing-plans`

Notes:

- Implement this after reviewing the paired plan.
- Keep implementation and docs updates in the same branch because validator, renderer, templates, references, and examples must not drift.
- Do not introduce Markdown, MDX, frontmatter, per-document components, layout DSL, or renderer hook support.
