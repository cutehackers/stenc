---
name: stenc
description: Create fixed-format Stenc spec, plan, decision, and agent-context web documents backed by structured JSON.
---

# Stenc

Stenc is an authoring protocol for documents that humans can scan in a
fixed web interface and AI coding agents can follow without guessing.

The source contract is structured JSON. The generated fixed web interface
renders that JSON as consistent pages. Do not author Stenc documents as
Markdown or MDX.

## Product Values

- Keep document meaning agent-readable through explicit JSON fields.
- Keep pages human-friendly through consistent fixed rendering.
- Keep generation deterministic and reproducible from source.
- Keep authoring dependency-light and installable across target repositories.
- When Stenc itself grows, add validator-known bounded primitives instead of
  Markdown parsing, MDX, raw HTML, or per-document component systems.

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
node ~/.codex/skills/stenc/scripts/validate-stenc-doc.js path/to/doc.json
```

7. Regenerate the styled static web pages from the target project root:

```bash
node ~/.codex/skills/stenc/scripts/setup-project.js \
  --project-root "$(pwd)" \
  --docs-dir docs/stenc
```

8. Verify that every JSON document has a matching styled web page:

```bash
node ~/.codex/skills/stenc/scripts/check-rendered-pages.js docs/stenc
```

Do not call Stenc authoring complete until the JSON source and generated web
page both exist and pass these checks.

## Target Project Setup

When installing Stenc for a repository that should render Stenc docs,
run the one-command installer from the target project root:

```bash
cd /absolute/path/to/project
curl -fsSL https://raw.githubusercontent.com/cutehackers/stenc/main/scripts/bootstrap.sh | bash -s -- --title "Project Docs"
```

This installs the Codex skill and creates `docs/stenc` in one pass. If
`--title` is omitted on a new setup, the generated app uses `Docs`; reruns
preserve the existing `content/site.json` title unless `--title` is supplied.
The installer caches the Stenc repository under `~/.cache/stenc`, so users do
not need to pass a local Stenc repository path. It also installs a `stenc`
command into a writable PATH directory when possible; if that is not available,
it writes `~/.local/bin/stenc` and prints the PATH line to add.

If the skill is already installed and only the docs app needs repair, run the
installed setup script directly:

```bash
node ~/.codex/skills/stenc/scripts/setup-project.js \
  --project-root /absolute/path/to/project \
  --docs-dir docs/stenc
```

The generated app lives at `<project>/docs/stenc` by default. From the
target project root, run:

```bash
./open-docs.sh
```

`open-docs.sh` regenerates generated HTML/CSS before serving. Existing target
repositories that already committed generated Stenc pages should run this
one-time migration from the target project root:

```bash
stenc migrate
./open-docs.sh
```

Use `stenc migrate --docs-dir <path>` for custom docs locations and
`stenc migrate --dry-run` to preview without writing `.gitignore` or changing
the Git index. Only `stenc migrate` may remove generated artifacts from the Git
index; install, setup, and open-docs must not run Git mutation commands.

## Required Authoring Rules

- Treat JSON as the source of truth.
- Unless the user explicitly asks for a different language, write responses and
  Stenc document content in the user's prompt language.
- Keep `page.humanSummary` short and useful for page scanning.
- Keep `page.agentSummary`, `links.sourceOfTruth`, `body.surfaces`,
  `body.validation`, and `body.agentInstructions` exact enough for an AI coding
  agent to act safely.
- Do not flatten Superpowers spec or plan output into prose when the source
  has structured requirements, alternatives, task files, code blocks, commands,
  expected output, review gates, worker instructions, scope checks, or
  execution handoff.
- Use only `facts`, `links`, `steps`, `blocks`, and `subSections` when
  extending `body.supportingSections`; do not create user-defined components
  or layout fields.
- Use `body.supportingSections[].blocks` only for validator-known rich
  primitives. Do not put Markdown syntax, raw HTML, custom layout fields, or
  per-document components in block data.
- Use `media` blocks only for local assets under `docs/stenc/content/assets/`;
  write `src` as `assets/...`. Generated `docs/stenc/assets/` files are derived
  renderer output.
- Use `taskList` blocks only for read-only supporting checklists. Do not
  replace plan `body.slices[].steps[]`.
- Use `diagram` blocks as escaped source panels only. Do not add Mermaid, DOT,
  CDN, script, or client-side diagram execution.
- When converting existing spec or plan Markdown, fill native Stenc body fields
  first and use `body.supportingSections` only for bounded legacy outline
  content that has no dedicated core field.
- Put unresolved work in `body.openQuestions`.
- Let the renderer derive indexes from `content/<collection>/*.json`.
- After adding or editing any document JSON, regenerate the static web pages and
  run `check-rendered-pages.js`.
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
