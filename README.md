# ContextKit

ContextKit is an installable Codex skill for writing spec, plan, decision, and
agent-context documents that are readable by humans and reliable for AI coding
agents.

Astro Starlight is the required rendering layer for the local documentation
view. ContextKit's primary authoring contract is still the source structure:
frontmatter, headings, explicit scope, validation, and agent instructions.

## Install

Install the skill into the default Codex skills directory and prepare the local
Astro Starlight docs workspace:

```bash
./scripts/install.sh
```

Install from another location:

```bash
CODEX_SKILLS_DIR=/absolute/path/to/skills ./scripts/install.sh
```

Repair or refresh only the Starlight workspace:

```bash
./scripts/setup-starlight.sh
```

## Use

Ask Codex to use the `context-kit` skill when creating or updating:

- specs
- implementation plans
- decision records
- agent-facing context docs
- Astro Starlight documentation pages derived from those documents

The installed skill lives at:

```text
~/.codex/skills/context-kit/
```

ContextKit templates share a base structure inspired by Superpowers plan
discipline: goal, architecture, owned surfaces, evidence, validation, and review
checks stay explicit before each document type adds its own contract or
execution sections.

## Validate

Validate the templates, examples, and Starlight build:

```bash
./scripts/validate.sh
```

Validate any ContextKit document:

```bash
node skill/context-kit/scripts/validate-context-kit-doc.js path/to/doc.mdx
```

## Repository Layout

```text
context-kit/
  skill/context-kit/       # installable Codex skill
  skill/context-kit/templates/base-template.mdx
  examples/                # sample ContextKit documents
  scripts/install.sh       # local skill installer
  scripts/setup-starlight.sh # required Starlight workspace setup
  scripts/validate.sh
  starlight/               # local docs workspace
```

## Design Rule

Keep semantic meaning in Markdown structure. Starlight components may improve
scanability, but they must not be the only place where a contract, decision,
validation command, or agent instruction exists.
