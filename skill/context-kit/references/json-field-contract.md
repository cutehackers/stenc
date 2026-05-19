# ContextKit JSON Field Contract

Each ContextKit source file is exactly one document artifact. Collection pages,
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

## Spec Body

Specs own canonical behavior, runtime, API, schema, or workflow contracts.

`schemaVersion: 1` nested spec documents remain valid for compatibility with
the original ContextKit JSON shape. New spec templates use `schemaVersion: 2`
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

## Plan Body

Plans own execution order and validation flow. They should point to the spec
that owns the durable product or runtime truth.

`schemaVersion: 1` nested plan documents remain valid for compatibility with
the original ContextKit JSON shape. New plan templates use `schemaVersion: 2`
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

Each `slices[].steps[]` entry must include actionable content through a
non-empty `instruction`, a `command` with matching `expected`, or at least one
non-empty code block. Empty `codeBlocks` alone is not actionable.

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
