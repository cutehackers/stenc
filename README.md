# ContextKit

ContextKit is an installable Codex skill for creating fixed-format spec, plan,
decision, and agent-context pages.

ContextKit no longer uses Markdown or MDX as the document source. Each document
is structured JSON. Humans read the generated fixed web pages, while AI coding
agents read the same JSON files directly.

## Install

From the target project root, run one command:

```bash
npx /path/to/context-kit install --title "Project Docs"
```

This installs the ContextKit Codex skill into `~/.codex/skills/context-kit` and
creates the target project's `docs/context-kit` app. If `--title` is omitted,
the generated app uses `Docs`.

For repeat local use, link this repository once:

```bash
cd /path/to/context-kit
npm link
```

Then any target project can be prepared from its own root:

```bash
cd /path/to/target-repo
context-kit install --title "Project Docs"
```

Advanced flows can still call the installer script directly. Install only the
skill into the default Codex skills directory and prepare the local ContextKit
examples app:

```bash
./scripts/install.sh
```

Install from another location:

```bash
CODEX_SKILLS_DIR=/absolute/path/to/skills ./scripts/install.sh
```

Install the skill and prepare a target project's ContextKit docs app in one pass:

```bash
./scripts/install.sh \
  --project-root /path/to/target-repo \
  --docs-dir docs/context-kit \
  --title "Project Docs"
```

For any refresh of local or target docs setup, rerun the same install command
with the desired options.

Then open the docs app:

```bash
cd /path/to/project
./open-docs.sh
```

The generated `open-docs.sh` lives in the target project root and opens that
project's `docs/context-kit` app. It starts the local docs server, opens the
browser, and stops the server when you press Enter.

## Document Model

ContextKit documents live as JSON:

```text
docs/context-kit/
  content/
    specs/*.spec.json
    plans/*.plan.json
    decisions/*.decision.json
    agent-context/*.agent-context.json
  src/
    pages/
    layouts/
    components/
```

The JSON is the source of truth. The web app is the human-readable page. There
is no Markdown projection, no MDX component import, and no separate rendered
copy to keep in sync.

Each JSON file is one document:

```json
{
  "schemaVersion": 2,
  "docType": "spec",
  "id": "spec:yyyy-mm-dd-topic",
  "slug": "yyyy-mm-dd-topic",
  "status": "draft",
  "title": "Document Title",
  "description": "One-sentence summary.",
  "owner": "owning-team",
  "createdAt": "YYYY-MM-DD",
  "updatedAt": "YYYY-MM-DD",
  "links": {
    "sourceOfTruth": ["docs/SPEC.md"]
  },
  "page": {
    "humanSummary": "What a person should understand first.",
    "agentSummary": "What an AI coding agent must preserve.",
    "styleTemplate": "task-first"
  },
  "body": {}
}
```

`schemaVersion: 1` nested JSON documents remain accepted for existing ContextKit
content. New templates use `schemaVersion: 2` so specs and plans can preserve
the official Superpowers output structure.

List pages and navigation are derived from `content/<collection>/*.json`; a
document file must not contain other documents.

Specs and plans can represent Superpowers output without dropping source
sections:

- specs carry requirements, approaches, components, data flow, error handling,
  testing strategy, self-review checks, implementation handoff, and supporting
  sections as structured JSON fields
- plans carry architecture, tech stack, worker instructions, scope check, file
  structure, task files, structured steps, code blocks, commands, expected
  output, no-placeholder guidance, self-review checks, and execution handoff as
  structured JSON fields

Do not collapse those sections into a single prose summary when converting
from `docs/superpowers/specs/*.md` or `docs/superpowers/plans/*.md`.

## Use

Ask Codex to use the `context-kit` skill when creating or updating:

- specs
- implementation plans
- decision records
- agent-facing context docs
- fixed ContextKit web documentation pages derived from JSON

The installed skill lives at:

```text
~/.codex/skills/context-kit/
```

## Validate

Validate the JSON templates, examples, and examples app build:

```bash
./scripts/validate.sh
```

Validate any ContextKit JSON document:

```bash
node skill/context-kit/scripts/validate-context-kit-doc.js path/to/doc.json
```

## Repository Layout

```text
context-kit/
  skill/context-kit/          # installable Codex skill
  skill/context-kit/templates # JSON templates
  examples/                   # sample JSON documents
  scripts/install.sh          # local skill installer
  scripts/open-docs.sh        # open docs app and stop it with Enter
  scripts/setup-examples-app.sh # local examples app setup
  scripts/setup-project.sh    # target project docs app setup
  scripts/validate.sh
  examples-app/               # local fixed web examples app
```

## Design Rule

Keep the contract in JSON fields. The fixed web app may improve visual scanning,
but it must render from the same structured data that AI coding agents read.

### Fixed Page Style Profiles

Use one of these 3 document render styles for all planned documentation work:

- `task-first`
- `operator-console`
- `evidence-led`

Choose one in `page.styleTemplate` when creating each `spec` or `plan`
document.
