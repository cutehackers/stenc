# ContextKit Frontmatter Schema

Required fields for all document types:

```yaml
title: Human-readable page title
description: One-sentence summary
docType: spec | plan | decision | agent-context
status: draft | proposed | approved | canonical | superseded
owner: Team, package, module, or role that owns the page
appliesTo:
  - Files, directories, APIs, skills, or surfaces affected by this page
agentEntryPoints:
  - Files or docs an AI coding agent should read first
validationCommands:
  - Commands that prove the relevant behavior
lastUpdated: YYYY-MM-DD
```

Additional recommended fields:

```yaml
relatedSpec: Path or URL to canonical spec
supersedes: Path or URL to older page
reviewCadence: When this page should be reviewed
```

`docType: base` is reserved for `templates/base-template.mdx`. Do not use it
for project documents.

## Status Semantics

- `draft`: not yet accepted
- `proposed`: ready for review
- `approved`: accepted plan or decision
- `canonical`: source of truth
- `superseded`: preserved for history, no longer active guidance
