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

Every page uses the unified B visual language: 17px reading text, shared
spacing/color/focus tokens, consistent semantic cards and tables, responsive
navigation, explicit empty/error states, and accessible diagram fallbacks.
`task-first`, `operator-console`, and `evidence-led` select a bounded
information emphasis within that shared system.

## Install

Run this from the project where you want Stenc docs (your **target repo**):

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

Check the installed version:

```bash
stenc --version
```

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

## Diagram Choices

Diagrams are optional supporting blocks. Choose them by meaning:

- `diagram`: escaped Mermaid, DOT, or plain source notation; Stenc displays the
  source and does not execute it.
- `layerDiagram`: ordered architecture or ownership layers.
- `flowDiagram`: directed processing or data movement.
- `relationDiagram`: directed ownership, adaptation, or lifecycle relations.

Structured diagrams use validator-known IDs, roles, nodes, and connections.
The renderer creates the visual and its text/table fallback from the same JSON.
It does not load a diagram CDN or client-side diagram runtime.

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

Regenerate a target project's static app after editing canonical JSON:

```bash
node ~/.codex/skills/stenc/scripts/setup-project.js \
  --project-root "$(pwd)" \
  --docs-dir docs/stenc
```

Validate the regenerated pages and local media assets:

```bash
node ~/.codex/skills/stenc/scripts/check-rendered-pages.js docs/stenc
```

The normal authoring loop is validate JSON, regenerate, check rendered pages,
then inspect the page with `./open-docs.sh`.

The spec template includes a media primitive backed by the installed
`templates/assets/architecture-overview.svg`. Install/bootstrap seeds that
asset into `docs/stenc/content/assets/`; direct setup also copies it when the
template references it and the target asset is missing. Existing target assets
are not overwritten, and a freshly copied template passes rendered-page
checks. The bundled SVG is a project-authored, script-free Stenc template asset
with no external dependency or source. Bundled sources and seeded targets must
be regular files; symlinked asset directories, symlink targets, directory
collisions, and canonical path escapes are rejected without replacing the
target.

## Developing Stenc

If you are developing Stenc itself and want a local `stenc` command, link this
repository once:

```bash
cd /path/to/stenc
npm link
```

Then run `stenc install` from the target project where you want docs.

Check the installed Stenc version:

```bash
stenc --version
```

Useful repo commands:

```bash
./scripts/install.sh
./scripts/setup-examples-app.sh
node skill/stenc/scripts/validate-stenc-doc.js skill/stenc/templates examples examples-app/content
node skill/stenc/scripts/check-rendered-pages.js examples-app
./scripts/open-docs.sh --docs-dir examples-app
./scripts/validate.sh
```

`./scripts/setup-examples-app.sh` regenerates both the local examples app and
the tracked style specimens from the canonical renderer. Do not hand-edit their
generated HTML or CSS.

After starting the examples app, use the printed local port with these routes:

- `/specs/component-catalog/`
- `/plans/component-catalog/`

The corresponding generated files are
`examples-app/specs/component-catalog/index.html` and
`examples-app/plans/component-catalog/index.html`. Renderer-owned style
specimens are tracked at:

- `samples/stenc-doc-styles/task-first.html`
- `samples/stenc-doc-styles/operator-console.html`
- `samples/stenc-doc-styles/evidence-led.html`
- `samples/stenc-doc-styles/styles.css`

## Compatibility

- Schema-version 1 and 2 documents remain supported.
- Existing source `diagram` blocks remain valid escaped-source panels.
- Structured diagrams are optional; existing documents do not need them.
- Canonical documents remain JSON. Markdown, MDX, raw HTML, per-document CSS,
  and custom visual-component fields are not Stenc source formats.
- Generated pages and `styles.css` are reproducible renderer output; commit and
  review canonical JSON and tracked source assets.

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
