---
name: context-kit
description: Create fixed-format ContextKit spec, plan, decision, and agent-context web documents backed by structured JSON.
---

# ContextKit

ContextKit is an authoring protocol for documents that humans can scan in a
fixed web interface and AI coding agents can follow without guessing.

The source contract is structured JSON. The generated fixed web interface
renders that JSON as consistent pages. Do not author ContextKit documents as
Markdown or MDX.

## Quick Start

1. Choose exactly one document type:
   - `spec`: canonical product, runtime, API, or behavior contract
   - `plan`: implementation, migration, launch, or cleanup plan
   - `decision`: ADR-style decision record
   - `agent-context`: entry context for AI coding agents
2. Pick one fixed page style in `page.styleTemplate`:
   - `task-first`
   - `operator-console`
   - `evidence-led`
3. Copy the matching JSON file from `templates/`.
4. Create one JSON file for one document. Do not include collection data or
   other documents inside it.
5. Fill `links`, `page`, and the type-specific `body`. Keep arrays and object
   shapes intact.
   - For Superpowers-derived specs, preserve requirements, approaches,
     components, data flow, error handling, testing strategy, self-review
     checks, handoff, and supporting sections in the matching fields.
   - For Superpowers-derived plans, preserve the agentic-worker header,
     checkbox tracking syntax, scope check, file structure, task files,
     structured steps, code blocks, commands, expected output, no-placeholder
     guidance, self-review checks, and execution handoff in the matching
     fields.
6. Validate the document:

```bash
node ~/.codex/skills/context-kit/scripts/validate-context-kit-doc.js path/to/doc.json
```

## Target Project Setup

When installing ContextKit for a repository that should render ContextKit docs,
run the installer from the target project root:

```bash
cd /absolute/path/to/project
npx /path/to/context-kit install --title "Project Docs"
```

This installs the Codex skill and creates `docs/context-kit` in one pass. If
`--title` is omitted, the generated app uses `Docs`.

For repeat local use, link the ContextKit repository once:

```bash
cd /path/to/context-kit
npm link
```

Then run this from any target project:

```bash
context-kit install --title "Project Docs"
```

If the skill is already installed and only the docs app needs repair, run the
installed setup script directly:

```bash
node ~/.codex/skills/context-kit/scripts/setup-project.js \
  --project-root /absolute/path/to/project \
  --docs-dir docs/context-kit
```

The generated app lives at `<project>/docs/context-kit` by default. From the
target project root, run:

```bash
./open-docs.sh
```

## Required Authoring Rules

- Treat JSON as the source of truth.
- Keep `page.humanSummary` short and useful for page scanning.
- Keep `page.agentSummary`, `links.sourceOfTruth`, `body.surfaces`,
  `body.validation`, and `body.agentInstructions` exact enough for an AI coding
  agent to act safely.
- Do not flatten Superpowers spec or plan output into prose when the source
  has structured requirements, alternatives, task files, code blocks, commands,
  expected output, review gates, worker instructions, scope checks, or
  execution handoff.
- Put unresolved work in `body.openQuestions`.
- Let the renderer derive indexes from `content/<collection>/*.json`.
- Do not hide contract meaning in rendered-only UI.
- Do not add Markdown, MDX imports, or per-document visual components.

## Templates

- `templates/spec.json`
- `templates/plan.json`
- `templates/decision.json`
- `templates/agent-context.json`

## References

- See `references/authoring-protocol.md` for the full writing workflow.
- See `references/json-field-contract.md` for the JSON field contract.
- See `references/fixed-page-style.md` for fixed page rendering guidance.
