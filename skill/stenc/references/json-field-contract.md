# Stenc JSON Field Contract

Each Stenc source file is exactly one document artifact. Collection pages,
navigation, and indexes are derived by the renderer from files on disk.

## Common Shape

All document types use the same top-level shape:

```json
{
  "schemaVersion": 2,
  "docType": "spec | plan | decision | agent-context",
  "id": "spec:yyyy-mm-dd-topic",
  "slug": "yyyy-mm-dd-topic",
  "status": "draft | proposed | approved | canonical | superseded",
  "title": "Human-readable page title",
  "description": "One-sentence page summary",
  "owner": "Team, package, module, or role",
  "createdAt": "YYYY-MM-DD",
  "updatedAt": "YYYY-MM-DD",
  "links": {
    "sourceOfTruth": ["Canonical files, APIs, docs, or artifacts"]
  },
  "page": {
    "humanSummary": "Short page-scanning summary",
    "agentSummary": "Short agent-action summary",
    "styleTemplate": "task-first | operator-console | evidence-led"
  },
  "body": {}
}
```

`slug` must contain only lowercase letters, numbers, and hyphens. It is used as
the generated route segment, so path separators, dots, whitespace, uppercase
letters, and URL-like values are rejected.

## Spec Body

Specs own canonical behavior, runtime, API, schema, or workflow contracts.

`schemaVersion: 1` nested spec documents remain valid for compatibility with
the original Stenc JSON shape. New spec templates use `schemaVersion: 2`
and require the Superpowers coverage fields below.

Required `body` fields:

- `goal`
- `problem`
- `scope.in`
- `scope.out`
- `architecture.summary`
- `requirements[].id`
- `requirements[].title`
- `requirements[].detail`
- `requirements[].acceptanceCriteria`
- `approaches[].name`
- `approaches[].tradeoffs`
- `approaches[].recommendation`
- `components[].name`
- `components[].responsibility`
- `components[].interfaces`
- `components[].dependencies`
- `dataFlow`
- `errorHandling[].case`
- `errorHandling[].behavior`
- `contracts[].name`
- `contracts[].rules`
- `surfaces[].path`
- `surfaces[].role`
- `surfaces[].owner`
- `testingStrategy[].command`
- `testingStrategy[].expected`
- `validation[].command`
- `validation[].purpose`
- `agentInstructions`
- `reviewChecklist`
- `selfReviewChecks[].name`
- `selfReviewChecks[].purpose`
- `implementationHandoff.planLocation`
- `implementationHandoff.requiredSkill`
- `implementationHandoff.notes`
- `supportingSections[].heading`
- `supportingSections[].content`
- `supportingSections[].items`
- `openQuestions`

Spec `links` may include `relatedPlans` and `relatedDecisions`.

The extended spec fields are designed to preserve Superpowers brainstorming
output without flattening it into prose. Use `requirements` for explicit
requirements and acceptance criteria, `approaches` for the considered
alternatives and recommendation, `components`/`dataFlow`/`errorHandling` for
the presented design, `testingStrategy` for the test plan, `selfReviewChecks`
for the Superpowers spec self-review gate, and `supportingSections` for
reviewer calibration or other structured source sections.

Optional spec fields:

- `architecture.flow`
- `supportingSections[].codeBlocks`
- `supportingSections[].facts[].label`
- `supportingSections[].facts[].value`
- `supportingSections[].links[].label`
- `supportingSections[].links[].target`
- `supportingSections[].links[].purpose`
- `supportingSections[].steps[].id`
- `supportingSections[].steps[].title`
- `supportingSections[].steps[].status`
- `supportingSections[].steps[].instruction`
- `supportingSections[].steps[].command`
- `supportingSections[].steps[].expected`
- `supportingSections[].steps[].codeBlocks`
- `supportingSections[].blocks`
- `supportingSections[].subSections[]`

`supportingSections` supports only five optional extension fields: `facts`,
`links`, `steps`, `blocks`, and `subSections`. These fields preserve
user-defined document outlines without introducing user-defined components,
layouts, variants, kinds, or renderer hooks.

### Supporting Section Blocks

`supportingSections[].blocks` is optional and ordered. Blocks render after
`content`, `items`, `facts`, `links`, `steps`, and `codeBlocks`, and before
nested `subSections`.

Phase 1 block types:

- `paragraph`: `{ "type": "paragraph", "spans": [...] }`
- `callout`: `{ "type": "callout", "tone": "neutral | info | success | warning | danger", "title": "...", "body": "..." }`
- `quote`: `{ "type": "quote", "text": "...", "source": "optional source" }`
- `table`: `{ "type": "table", "columns": ["..."], "rows": [["..."]] }`

Phase 2 block types:

- `media`: `{ "type": "media", "src": "assets/...", "alt": "...", "caption": "optional caption" }`
- `taskList`: `{ "type": "taskList", "items": [{ "label": "...", "checked": false }] }`

Phase 3 block type:

- `diagram`: `{ "type": "diagram", "language": "mermaid | dot | plain", "title": "...", "source": "..." }`

Paragraph span types:

- `text`, `strong`, `emphasis`, `code`, `kbd`, and `mark` require `type` and `text`.
- `link` requires `type`, `text`, and `target`.

Safe link targets are `https://...`, `http://...`, `mailto:...`, `#anchor`,
`./relative`, `../relative`, or repo-style relative paths such as
`docs/spec.md`. `javascript:`, `data:`, `file:`, protocol-relative URLs,
absolute filesystem paths, control characters, and whitespace-wrapped values
are rejected.

Table cells and callout bodies are plain escaped strings in Phase 1. Do not
put Markdown syntax, nested spans, alignment syntax, or raw HTML in those
fields and expect it to render semantically.

Media sources are local only. `media.src` is relative to the docs app
`content/` directory, must start with `assets/`, and resolves to a source file
under `docs/stenc/content/assets/`. The renderer copies source assets to the
generated `docs/stenc/assets/` directory. Generated assets are derived
artifacts; source assets under `content/assets/` are not generated artifacts.

Task lists are read-only supporting material. They do not replace
`body.slices[].steps[]` in plan documents and do not persist user interaction.

Diagram blocks render escaped source text in a fixed panel. The renderer does
not execute Mermaid, DOT, scripts, remote dependencies, or client-side diagram
runtime. Rendered diagrams require a separate accepted decision.

When Stenc already has a dedicated body field for a concept, authors must use
that dedicated field first. Use `body.supportingSections` only for bounded
legacy outline content or supporting material that does not fit the core
schema.

## Plan Body

Plans own execution order and validation flow. They should point to the spec
that owns the durable product or runtime truth.

`schemaVersion: 1` nested plan documents remain valid for compatibility with
the original Stenc JSON shape. New plan templates use `schemaVersion: 2`
and require the Superpowers coverage fields below.

Required `links` fields:

- `sourceOfTruth`
- `relatedSpec`

Required `body` fields:

- `goal`
- `architecture`
- `techStack`
- `workerInstructions.requiredSubSkills`
- `workerInstructions.trackingSyntax`
- `workerInstructions.note`
- `scopeCheck.assessment`
- `scopeCheck.decomposition`
- `currentState`
- `targetState`
- `scope.in`
- `scope.out`
- `fileStructure[].action`
- `fileStructure[].path`
- `fileStructure[].responsibility`
- `slices[].id`
- `slices[].title`
- `slices[].status`
- `slices[].surfaces`
- `slices[].files[].action`
- `slices[].files[].path`
- `slices[].files[].role`
- `slices[].steps[].id`
- `slices[].steps[].title`
- `slices[].steps[].status`
- `slices[].doneWhen`
- `executionOrder`
- `risks[].risk`
- `risks[].mitigation`
- `validation[].command`
- `validation[].purpose`
- `agentInstructions`
- `selfReviewChecks[].name`
- `selfReviewChecks[].purpose`
- `executionHandoff.defaultPath`
- `executionHandoff.options[].label`
- `executionHandoff.options[].description`
- `executionHandoff.options[].requiredSkill`
- `supportingSections[].heading`
- `supportingSections[].content`
- `supportingSections[].items`
- `openQuestions`

Plan steps are structured objects, not plain strings. This preserves the
Superpowers plan format: checkbox-style tracking, exact files, code blocks,
commands to run, expected output, and commit or handoff steps.
`workerInstructions` preserves the required agentic-worker header, and
`scopeCheck`/`supportingSections` preserve the official scope-check,
no-placeholder, reminder, and reviewer-calibration content.

Optional plan fields:

- `slices[].files[].lines`
- `slices[].steps[].instruction`
- `slices[].steps[].command`
- `slices[].steps[].expected`
- `slices[].steps[].codeBlocks`
- `supportingSections[].codeBlocks`
- `supportingSections[].facts[].label`
- `supportingSections[].facts[].value`
- `supportingSections[].links[].label`
- `supportingSections[].links[].target`
- `supportingSections[].links[].purpose`
- `supportingSections[].steps[].id`
- `supportingSections[].steps[].title`
- `supportingSections[].steps[].status`
- `supportingSections[].steps[].instruction`
- `supportingSections[].steps[].command`
- `supportingSections[].steps[].expected`
- `supportingSections[].steps[].codeBlocks`
- `supportingSections[].blocks`
- `supportingSections[].subSections[]`

Each `slices[].steps[]` entry must include actionable content through a
non-empty `instruction`, a `command` with matching `expected`, or at least one
non-empty code block. Empty `codeBlocks` alone is not actionable.

Each `supportingSections[].steps[]` entry follows the same actionable-content
rule. If a supporting step has `command`, it must also have `expected`; if it
has `expected`, it must also have `command`.

## Decision Body

Decisions record rationale and consequences.

Required `links` fields:

- `sourceOfTruth`
- `relatedSpec`

Required `body` fields:

- `context`
- `decision`
- `optionsConsidered[].option`
- `optionsConsidered[].outcome`
- `consequences`
- `validation[].command`
- `validation[].purpose`
- `agentInstructions`
- `openQuestions`

## Agent Context Body

Agent-context documents provide scoped working rules.

Required `body` fields:

- `whenToUse`
- `requiredReading`
- `workingRules`
- `validation[].command`
- `validation[].purpose`
- `agentInstructions`
- `openQuestions`
