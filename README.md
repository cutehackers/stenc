# ContextKit

ContextKit is an installable Codex skill for creating fixed-format spec, plan,
decision, and agent-context pages.

ContextKit no longer uses Markdown or MDX as the document source. Each document
is structured JSON. Humans read the generated Astro web app, while AI coding
agents read the same JSON files directly.

## Install

Use the single installer script for all setup flows:

Install the skill into the default Codex skills directory and prepare the local
ContextKit examples app:

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

If `--title` is omitted, the generated app uses `Docs`.

For any refresh of local or target docs setup, rerun `./scripts/install.sh` with
the desired options:

Then open the docs app:

```bash
cd /path/to/project
/path/to/context-kit/scripts/open-docs.sh
```

`open-docs.sh` defaults to the current directory as the project root and
`docs/context-kit` as the docs app path. It starts the local Astro server, opens
the browser, and stops the server when you press Enter.

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
  "schemaVersion": 1,
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
    "agentSummary": "What an AI coding agent must preserve."
  },
  "body": {}
}
```

List pages and navigation are derived from `content/<collection>/*.json`; a
document file must not contain other documents.

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
  starlight/                  # local fixed web examples app
```

## Design Rule

Keep the contract in JSON fields. The fixed web app may improve visual scanning,
but it must render from the same structured data that AI coding agents read.
