---
name: context-kit
description: Write agent-readable, human-friendly spec, plan, decision, and agent-context documents using ContextKit templates. Use when creating or updating specs, plans, ADRs, Starlight docs, or AI coding-agent guidance.
---

# ContextKit

ContextKit is an authoring protocol for documents that humans can scan and AI
coding agents can follow without guessing. Astro Starlight is the recommended
rendering layer, but the source contract is the Markdown or MDX structure.

## Quick Start

1. Choose exactly one document type:
   - `spec`: canonical product, runtime, API, or behavior contract
   - `plan`: implementation, migration, launch, or cleanup plan
   - `decision`: ADR-style decision record
   - `agent-context`: entry context for AI coding agents
2. Read `templates/base-template.mdx` for the shared ContextKit shape, then
   copy the matching document-type file from `templates/`.
3. Fill required frontmatter and preserve required headings.
4. Keep product meaning in headings, lists, tables, and frontmatter. Do not make
   custom visual components the only source of truth.
5. Validate the result:

```bash
node ~/.codex/skills/context-kit/scripts/validate-context-kit-doc.js path/to/doc.mdx
```

## Required Authoring Rules

- Start with `Human Summary` and `Agent Summary`.
- Include the base structure: `Source Of Truth`, `Goal`, `Architecture`,
  `Scope`, `Non-Goals`, `File Or Surface Map`, `Evidence`, `Validation`,
  `Agent Instructions`, `Review Checklist`, and `Open Questions`.
- Mark unknowns as `TBD` and list them under `Open Questions`.
- If a spec changes user workflow, include the skill, API, or docs surfaces
  that must stay aligned.
- If a plan changes behavior, include concrete validation commands.
- If rendered with Starlight, use components for scanning and navigation. The
  semantic contract must remain visible in headings, tables, lists,
  frontmatter, or code blocks.

## Templates

- `templates/base-template.mdx`
- `templates/spec.mdx`
- `templates/plan.mdx`
- `templates/decision.mdx`
- `templates/agent-context.mdx`

## References

- See `references/authoring-protocol.md` for the full writing workflow.
- See `references/starlight-style.md` for Starlight component usage.
- See `references/frontmatter-schema.md` for required metadata.
