# ContextKit JSON Field Contract

Each ContextKit source file is exactly one document artifact. Collection pages,
navigation, and indexes are derived by the renderer from files on disk.

## Common Shape

All document types use the same top-level shape:

```json
{
  "schemaVersion": 1,
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
    "agentSummary": "Short agent-action summary"
  },
  "body": {}
}
```

## Spec Body

Specs own canonical behavior, runtime, API, schema, or workflow contracts.

Required `body` fields:

- `goal`
- `problem`
- `scope.in`
- `scope.out`
- `architecture.summary`
- `architecture.flow`
- `contracts[].name`
- `contracts[].rules`
- `surfaces[].path`
- `surfaces[].role`
- `surfaces[].owner`
- `validation[].command`
- `validation[].purpose`
- `agentInstructions`
- `reviewChecklist`
- `openQuestions`

Spec `links` may include `relatedPlans` and `relatedDecisions`.

## Plan Body

Plans own execution order and validation flow. They should point to the spec
that owns the durable product or runtime truth.

Required `links` fields:

- `sourceOfTruth`
- `relatedSpec`

Required `body` fields:

- `goal`
- `currentState`
- `targetState`
- `scope.in`
- `scope.out`
- `slices[].id`
- `slices[].title`
- `slices[].status`
- `slices[].surfaces`
- `slices[].steps`
- `slices[].doneWhen`
- `executionOrder`
- `risks[].risk`
- `risks[].mitigation`
- `validation[].command`
- `validation[].purpose`
- `agentInstructions`
- `openQuestions`

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
