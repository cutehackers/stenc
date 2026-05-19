---
name: context-kit
description: Create fixed-format ContextKit spec, plan, decision, and agent-context web documents backed by structured JSON.
---

# ContextKit

ContextKit is an authoring protocol for documents that humans can scan in a
fixed web interface and AI coding agents can follow without guessing.

The source contract is structured JSON. The generated Astro app renders that
JSON as consistent web pages. Do not author ContextKit documents as Markdown or
MDX.

## Quick Start

1. Choose exactly one document type:
   - `spec`: canonical product, runtime, API, or behavior contract
   - `plan`: implementation, migration, launch, or cleanup plan
   - `decision`: ADR-style decision record
   - `agent-context`: entry context for AI coding agents
2. Copy the matching JSON file from `templates/`.
3. Fill required fields. Keep arrays and object shapes intact.
4. Validate the document:

```bash
node ~/.codex/skills/context-kit/scripts/validate-context-kit-doc.js path/to/doc.json
```

## Target Project Setup

When installing ContextKit for a repository that should render ContextKit docs,
prepare the target repository in the same one-time install:

```bash
cd /path/to/context-kit
./scripts/install.sh \
  --project-root /absolute/path/to/project \
  --docs-dir docs/context-kit \
  --title "Project Docs"
```

If the skill is already installed and only the docs app needs repair, run the
installed setup script directly:

```bash
node ~/.codex/skills/context-kit/scripts/setup-project.js \
  --project-root /absolute/path/to/project \
  --docs-dir docs/context-kit \
  --title "Project Docs"
```

The generated app lives at `<project>/docs/context-kit` by default. Run:

```bash
cd <project>/docs/context-kit
npm run dev
```

## Required Authoring Rules

- Treat JSON as the source of truth.
- Keep `humanSummary` short and useful for page scanning.
- Keep `agentSummary`, `sourceOfTruth`, `surfaces`, `validationCommands`, and
  `agentInstructions` exact enough for an AI coding agent to act safely.
- Put unresolved work in `openQuestions`.
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
