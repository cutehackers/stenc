# ContextKit JSON Field Contract

Required common fields for all document types:

```json
{
  "slug": "url-safe-document-id",
  "docType": "spec | plan | decision | agent-context",
  "status": "draft | proposed | approved | canonical | superseded",
  "title": "Human-readable page title",
  "description": "One-sentence summary",
  "owner": "Team, package, module, or role that owns the page",
  "lastUpdated": "YYYY-MM-DD",
  "humanSummary": "Short page-scanning summary",
  "agentSummary": "Short agent-action summary",
  "sourceOfTruth": ["Canonical files, APIs, docs, or artifacts"],
  "goal": "What this document settles or guides",
  "architecture": "System shape, boundaries, or decision path",
  "scope": {
    "in": ["Covered behavior, files, APIs, workflows, or docs"],
    "out": ["Adjacent work this page does not authorize"]
  },
  "nonGoals": ["Tempting but excluded changes"],
  "surfaces": [
    {
      "surface": "Exact file, API, workflow, or product surface",
      "role": "Why it matters",
      "owner": "Owning team or module"
    }
  ],
  "evidence": ["Real inputs behind the document"],
  "validationCommands": ["Commands that prove relevant behavior"],
  "agentInstructions": ["Operational instructions for AI coding agents"],
  "reviewChecklist": ["Human review checks"],
  "openQuestions": ["Unresolved questions"]
}
```

## Type-Specific Fields

`spec` documents additionally require:

- `problem`
- `vocabulary`
- `contract`
- `interfaces`
- `invariants`

`plan` documents additionally require:

- `relatedSpec`
- `currentState`
- `targetState`
- `implementationSlices`
- `executionOrder`
- `risks`

`decision` documents additionally require:

- `relatedSpec`
- `context`
- `decision`
- `optionsConsidered`
- `consequences`

`agent-context` documents additionally require:

- `whenToUse`
- `requiredReading`
- `workingRules`
