# Stenc

Stenc is an installable Codex skill for writing agent-readable,
human-friendly docs.

It creates fixed web pages for:

- specs
- implementation plans
- decision records
- agent-context docs

The source is one JSON file per document. The generated web pages are only the
human-readable view.

## Install

Run this from the project where you want Stenc docs(from your **target-repo**):

```bash
curl -fsSL https://raw.githubusercontent.com/cutehackers/stenc/main/scripts/bootstrap.sh | bash
```

That command does three things:

- installs the Stenc Codex skill into `~/.codex/skills/stenc`
- installs the `stenc` command into a writable PATH directory when possible
- creates `docs/stenc` and `./open-docs.sh` in the target project

The default docs app title is `Docs`. The installer keeps Stenc itself in
`~/.cache/stenc`, so you do not need to download the repository or pass a
local repository path.

If your shell does not have a writable PATH directory, the installer writes the
command to `~/.local/bin/stenc` and prints the PATH line to add.

To set a title in the same one-command install:

```bash
curl -fsSL https://raw.githubusercontent.com/cutehackers/stenc/main/scripts/bootstrap.sh | bash -s -- --title "Project Docs"
```

### Optional Install Parameters

Most users do not need these. Use them only when the default install location or
title is not enough:

```bash
curl -fsSL https://raw.githubusercontent.com/cutehackers/stenc/main/scripts/bootstrap.sh | bash -s -- --title "Project Docs"
curl -fsSL https://raw.githubusercontent.com/cutehackers/stenc/main/scripts/bootstrap.sh | bash -s -- --docs-dir docs/internal/stenc
curl -fsSL https://raw.githubusercontent.com/cutehackers/stenc/main/scripts/bootstrap.sh | bash -s -- --project-root /path/to/target-repo
```

## Open Docs

After install, open the generated docs from the target project root:

```bash
./open-docs.sh
```

`open-docs.sh` starts a small local server, opens the docs in your browser, and
stops the server when you press Enter. It regenerates the static HTML/CSS before
serving, so collaborators do not need generated pages committed to Git.

## Migrate Existing Docs

If an existing repository already committed generated Stenc HTML/CSS, run the
one-time migration from the target project root:

```bash
stenc migrate
./open-docs.sh
```

`stenc migrate` refreshes `docs/stenc/.gitignore` and removes generated pages
from the Git index with `git rm --cached`; local files remain on disk. It does
not touch JSON sources under `docs/stenc/content`.

For custom docs locations:

```bash
stenc migrate --docs-dir stenc
stenc migrate --docs-dir stenc --dry-run
```

## Validate

From this repository root, validate the package:

```bash
./scripts/validate.sh
```

Validate a single document:

```bash
node ~/.codex/skills/stenc/scripts/validate-stenc-doc.js path/to/doc.json
```

Validate the rendered pages for a docs app:

```bash
node ~/.codex/skills/stenc/scripts/check-rendered-pages.js docs/stenc
```

## Developing Stenc

If you are developing Stenc itself and want a local `stenc` command, link this
repository once:

```bash
cd /path/to/stenc
npm link
```

Then run `stenc install` from the target project where you want docs.

Useful repo commands:

```bash
./scripts/install.sh
./scripts/setup-examples-app.sh
./scripts/open-docs.sh --docs-dir examples-app
./scripts/validate.sh
```

## Releasing Stenc

Run the release script from a clean working tree:

```bash
./scripts/release.sh 0.2.0 --dry-run
./scripts/release.sh 0.2.0
```

The script creates missing `CHANGELOG.md` and `docs/releases/vX.Y.Z.md`
entries, preserves existing release notes, synchronizes `package.json` and
`package-lock.json`, runs the validation commands, creates
`chore(release): vX.Y.Z`, and creates an annotated Git tag. It pushes only when
`--push` is supplied.

Main paths:

```text
skill/stenc/SKILL.md          # product entrypoint
skill/stenc/templates/        # JSON templates
skill/stenc/references/       # authoring rules
skill/stenc/scripts/          # installed skill scripts
scripts/                            # repo install, setup, open, validation scripts
examples/                           # sample JSON documents
examples-app/                       # generated local example docs app
```

## Hard Rule

Do not use Markdown, MDX, frontmatter, or per-document visual components as the
document source. Keep the contract in JSON fields.
