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
  "status": "draft | proposed | approved | canonical | done | superseded",
  "language": "en",
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

`language` is optional for backward compatibility. When present, it must be a
safe BCP-47-like tag: an ASCII alphabetic primary subtag of 2–8 characters,
followed by zero or more hyphen-separated ASCII alphanumeric subtags of 1–8
characters. The validated value becomes the escaped detail-page `<html lang>`
attribute. A missing value defaults to `en`; site and collection pages also
explicitly use `en`.

`status: "done"` records a completed execution document such as a plan whose
steps and evidence checks are complete. Specs normally remain `approved` or
`canonical` rather than using the plan completion state.

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

The optional extension-field registry is exact:

- Optional supporting section extension fields: `blocks`, `codeBlocks`, `facts`, `links`, `steps`, `subSections`

These fields preserve user-defined document outlines without introducing
user-defined components, layouts, variants, kinds, or renderer hooks.

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

Phase 3 source block type:

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
The spec template's `assets/architecture-overview.svg` example is shipped in
`templates/assets/`. Install/bootstrap seeds that exact file into the target
`content/assets/` directory. Direct non-render-only setup does the same when a
copied template references it and no target asset exists. Existing target
source assets are not overwritten. The SVG is a project-authored, script-free
Stenc template asset with no external dependency or source. Bundled sources
and seeded targets must be regular files. Symlinked asset directories, symlink
targets, directory collisions, and canonical path escapes are invalid and are
not followed or replaced.

Task lists are read-only supporting material. They do not replace
`body.slices[].steps[]` in plan documents and do not persist user interaction.

Source `diagram` blocks render escaped source text in a fixed panel. The
renderer does not execute Mermaid, DOT, scripts, remote dependencies, or
client-side diagram runtimes. Use this block when exact source notation is the
artifact that readers must inspect.

### Structured Diagram Blocks

Structured diagrams are optional `supportingSections[].blocks` entries. They
are additive to the source `diagram` block: existing documents and existing
escaped source diagrams remain valid without any structured diagram.

The validator registry is normative and the renderer uses the same registry:

- Registered structured diagram types: `flowDiagram`, `layerDiagram`, `relationDiagram`
- Registered diagram roles: `boundary`, `consumer`, `engine`, `neutral`, `session`, `surface`, `value`
- Registered diagram ID pattern: `^[a-z][a-z0-9-]*$`

Every structured diagram requires a non-empty single-line `title` and a
non-empty, multiline-capable `summary`. Unknown fields are rejected. Array
order is meaningful: the renderer and text/table fallback preserve the source
order of layers, nodes, edges, and relations.

#### `layerDiagram`

```json
{
  "type": "layerDiagram",
  "title": "Feature to engine boundary",
  "summary": "Dependencies cross explicit layers in source order.",
  "layers": [
    {
      "id": "feature",
      "label": "Feature",
      "role": "consumer",
      "summary": "Consumes the public surface.",
      "nodes": [
        {
          "id": "home-page",
          "label": "HomePage",
          "detail": "Owns feature composition."
        }
      ],
      "transition": "Calls the public API."
    },
    {
      "id": "surface",
      "label": "Surface",
      "role": "surface",
      "summary": "Owns the public API.",
      "nodes": [
        {
          "id": "world-surface",
          "label": "WorldSurface",
          "detail": "Creates the session."
        }
      ]
    }
  ]
}
```

Exact fields and rules:

- The block fields are exactly `type`, `title`, `summary`, and `layers`.
- `layers` contains at least one layer.
- A layer has exactly `id`, `label`, `role`, `summary`, `nodes`, and the
  optional `transition`.
- Each layer `id` matches the registered ID pattern and is unique among all
  layer IDs in the block.
- Each layer has a single-line `label`, a registered `role`, a
  multiline-capable `summary`, and at least one node.
- A layer node has exactly `id`, `label`, and `detail`. Node IDs match the
  registered pattern and are unique across every layer in the block. `label`
  is single-line; `detail` is multiline-capable.
- `transition` is optional and multiline-capable. It describes the transition
  to the next layer, so it is rejected on the final layer.
- Layer and node source order is preserved in the visual and fallback.

#### `flowDiagram`

```json
{
  "type": "flowDiagram",
  "title": "Artifact projection flow",
  "summary": "A validated handle flows from persistence to projection.",
  "nodes": [
    {
      "id": "persist",
      "label": "Persist",
      "detail": "Creates a validated handle.",
      "role": "value"
    },
    {
      "id": "project",
      "label": "Project",
      "detail": "Reads persisted artifacts.",
      "role": "surface"
    }
  ],
  "edges": [
    {
      "from": "persist",
      "to": "project",
      "label": "provides handle"
    }
  ]
}
```

Exact fields and rules:

- The block fields are exactly `type`, `title`, `summary`, `nodes`, and
  `edges`.
- `nodes` contains at least two graph nodes and `edges` contains at least one
  directed edge.
- A graph node has exactly `id`, `label`, `detail`, and `role`. IDs match the
  registered pattern and are unique in the block; `label` is single-line,
  `detail` is multiline-capable, and `role` is registered.
- An edge has exactly `from`, `to`, and `label`. Both endpoints match the ID
  pattern and reference nodes in the same block.
- Every node participates as `from` or `to` in at least one edge.
- Self-edges are rejected. An exact duplicate `from`, `to`, `label` tuple is
  rejected; a different label on the same ordered endpoints is allowed.
- Directed cycles and reverse-direction edges are allowed. Node and edge
  source order is preserved.

#### `relationDiagram`

```json
{
  "type": "relationDiagram",
  "title": "Runtime ownership",
  "summary": "Session ownership and engine adaptation remain explicit.",
  "nodes": [
    {
      "id": "session",
      "label": "Session",
      "detail": "Owns the runtime handle.",
      "role": "session"
    },
    {
      "id": "engine",
      "label": "Engine",
      "detail": "Owns the external resource.",
      "role": "boundary"
    }
  ],
  "relations": [
    {
      "from": "session",
      "to": "engine",
      "label": "adapts to"
    }
  ]
}
```

`relationDiagram` uses the same graph-node, endpoint, participation, cycle,
self-edge, exact-duplicate, free-label, and order rules as `flowDiagram`.
Its block fields are exactly `type`, `title`, `summary`, `nodes`, and
`relations`; `nodes` has at least two entries and `relations` has at least one
entry. Each relation has exactly `from`, `to`, and `label`.

#### Text, controls, and escaping

- IDs are ASCII identifiers and must match `^[a-z][a-z0-9-]*$`.
- `title`, node and layer `label`, and edge/relation `label` are non-empty
  single-line strings. They reject tab, CR, LF, U+2028, and U+2029.
- `summary`, `detail`, layer `summary`, and `transition` are non-empty
  multiline-capable strings. They may contain tab, CR, LF, U+2028, and U+2029.
- All diagram strings reject NUL, U+0001–U+0008, U+000B, U+000C,
  U+000E–U+001F, and U+007F.
- Edge and relation labels are free plain Unicode domain text; there is no
  fixed label vocabulary.
- The fixed renderer escapes every title, summary, ID, label, detail, role,
  transition, and endpoint before inserting it into HTML. Strings never become
  markup, styles, script, or renderer configuration.

#### Invalid structured diagram matrix

| Invalid input | Validator behavior |
| --- | --- |
| Unknown block, layer, node, edge, or relation field | Reject at the exact field path |
| Unknown type or role | Reject against the registered vocabulary |
| Missing, empty, or undersized required array | Reject with its required minimum |
| ID outside the registered pattern | Reject at that ID or endpoint |
| Duplicate layer ID or node ID | Reject the later duplicate |
| `transition` on the final layer | Reject the final-layer transition |
| Missing edge or relation endpoint | Reject the referencing `from` or `to` |
| Node with no edge or relation participation | Reject that node ID |
| Self-edge or self-relation | Reject `to` |
| Exact duplicate `from`, `to`, `label` tuple | Reject the later connection |
| Empty, unsafe-control, or disallowed multiline text | Reject the exact text field |

These invalid cases fail before rendering. Structured diagram cycles are not
an invalid case.

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
