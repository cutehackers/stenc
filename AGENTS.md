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
- Starlight setup is part of installation. The current documents must be
  viewable through the local Starlight workspace after install.
- Do not make Astro Starlight rendering the source of truth. The document
  structure must remain meaningful in plain Markdown or MDX.
- If required frontmatter or headings change, update templates, references, and
  validator together.

## Validation

Run from the repo root:

```bash
./scripts/validate.sh
```

When checking Starlight directly, run:

```bash
./scripts/setup-starlight.sh
cd starlight && npm run build
```
