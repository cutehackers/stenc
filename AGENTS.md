# AGENTS.md

## Purpose

This repository owns ContextKit, an installable Codex skill for writing
agent-readable, human-friendly spec, plan, decision, and agent-context
documents.

## Working Rules

- Treat `skill/context-kit/SKILL.md` as the product entrypoint.
- Keep templates under `skill/context-kit/templates/` aligned with the
  validator.
- Keep authoring rules under `skill/context-kit/references/`.
- Keep scripts deterministic and dependency-light.
- Target project setup is part of installation. The current documents must be
  viewable through the generated ContextKit static workspace after install.
- Do not make rendering the source of truth. Each document source is one
  structured JSON file with top-level metadata fields plus `links`, `page`, and
  `body` sections.
- Do not reintroduce Markdown, MDX, frontmatter, or per-document visual
  components as the document source.
- If required JSON fields change, update templates, references, examples,
  validator, and generated renderer together.

## Validation

Run from the repo root:

```bash
./scripts/validate.sh
```

When checking the generated examples app directly, run:

```bash
./scripts/setup-examples-app.sh
./scripts/open-docs.sh --docs-dir examples-app
```
