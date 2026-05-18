# ContextKit Starlight Style

Astro Starlight is the recommended rendering layer for ContextKit pages. The
source document must remain meaningful without rendering.

## Starlight Component Rules

- Use `Aside` for canonical warnings, plan status, risk notes, and blocked
  states.
- Use `CardGrid` and `Card` for summaries of invariants or surfaces that are
  also written in normal Markdown sections.
- Use `Tabs` and `TabItem` for validation variants or platform variants.
- Use `Steps` for ordered procedures when each step has explanatory detail.
- Use `FileTree` for repository layout or generated artifact structure.
- Use `Badge` for compact status, ownership, or lifecycle metadata.
- Use `LinkCard` and `LinkButton` for navigation to related docs or external
  references.
- Prefer tables for scope, risks, options, and validation matrices.
- Do not put the only copy of a contract, command, or decision inside a custom
  component.

## Recommended Sidebar Groups

```text
Start Here
Specs
Plans
Decisions
Agent Context
Archive
```

## Page Style

- Lead with summary, status, and source of truth.
- Keep one idea per heading.
- Use stable headings so agents can locate sections by name.
- Prefer exact file paths, API names, artifact names, and command names.
