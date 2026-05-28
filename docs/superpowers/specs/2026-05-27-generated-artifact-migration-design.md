# Generated Artifact Migration Design

## Goal

Stenc 0.2.0 should keep JSON documents as the source of truth while treating generated HTML/CSS pages as reproducible local artifacts that do not create persistent Git churn in target repositories.

## Problem

Today `setup-project.js` creates source JSON and generated static pages under the same docs app directory, normally `docs/stenc`. The generated `index.html`, `styles.css`, and collection route directories can be committed by target projects because the generated `.gitignore` only ignores logs. When Stenc styling or layout changes, target projects receive noisy diffs unrelated to their document content. Existing users also need a simple, explicit migration path that does not surprise them by mutating Git index state during install or docs viewing.

## Root Cause

The real problem is not just that generated pages are missing from `.gitignore`. The generated artifact policy is not represented as a first-class contract that every runtime surface uses consistently.

Today setup writes pages, open-docs serves pages, validation checks rendered pages, and the proposed migration cleans Git state. If each surface hardcodes its own understanding of generated paths, the repo can drift again: setup may ignore one path, migration may remove another, and open-docs may regenerate a third. The fix is to centralize the generated artifact path policy and keep Git index mutation isolated to the explicit migration command.

## Requirements

### R1: Separate source documents from generated artifacts

Target repositories should track only the source and control files needed to rebuild the docs app:

- `docs/stenc/content/**`
- `docs/stenc/content/site.json`
- `docs/stenc/.gitignore`
- root `open-docs.sh`

The docs app `.gitignore` should ignore generated artifacts:

```gitignore
# Stenc generated static pages
/index.html
/styles.css
/specs/
/plans/
/decisions/
/agent-context/
*.log
```

The ignore policy must not hide `content/**` or `.gitignore`.

### R2: Keep user migration command simple

Existing users should migrate from the target repository root with:

```bash
stenc migrate
```

The command defaults to `docs/stenc`. Custom docs directories use:

```bash
stenc migrate --docs-dir stenc
```

A preview mode should be available:

```bash
stenc migrate --dry-run
```

### R3: Restrict Git index mutation to explicit migration

`stenc install`, `setup-project.js`, and `./open-docs.sh` must not run `git rm`, stage files, commit files, or otherwise mutate the Git index.

Only `stenc migrate` may remove generated artifacts from the Git index, and it must do so with `git rm --cached` so local files remain on disk.

`stenc migrate` should write or refresh the Stenc generated artifact `.gitignore` policy during normal execution. `--dry-run` must not write `.gitignore` and must not run Git mutation commands.

### R4: Regenerate before serving docs

`./open-docs.sh` should regenerate static pages before starting the local static server. This keeps collaborators from needing committed HTML/CSS just to view docs.

If the local Stenc renderer is missing, `open-docs.sh` should fail with an actionable install message instead of serving stale output.

`./open-docs.sh --dry-run` remains read-only and must not regenerate files.

### R5: Preserve custom site title

When setup is rerun without `--title`, existing `content/site.json.title` should be preserved. The default title `Docs` is used only when no explicit title and no existing valid site title are available.

If `--title` is explicitly supplied, setup updates the title.

### R6: Version and migration identity

This behavior should ship as Stenc `0.2.0` because target repository tracking behavior changes. The internal migration ID is `2026-05-generated-artifacts`, but the public command remains `stenc migrate`.

### R7: Single generated artifact policy

The generated artifact path list and `.gitignore` text should have one implementation owner reused by setup and migration. This prevents setup, migration, tests, and docs from drifting when Stenc adds or removes a generated route.

Acceptance criteria:

- Setup and migration use the same generated artifact path list.
- Setup and migration use the same `.gitignore` content.
- Tests verify both setup and migration results against the same public behavior: source JSON remains trackable, generated HTML/CSS are ignored or removed from Git index only.

## Proposed Design

### Recommended approach: `stenc migrate`

Expose one public migration command and keep migration details internal. This gives users a short command while preserving a clear implementation boundary: setup renders, open-docs serves, migrate changes Git tracking.

Rejected alternatives:

- Public versioned command such as `stenc migrate 2026-05-generated-artifacts`: too much to remember for a single current migration.
- Automatic Git cleanup in install or open-docs: surprising and unsafe because installing or viewing docs would mutate the Git index.

## Components

### `skill/stenc/scripts/setup-project.js`

Responsibilities:

- Preserve `content/site.json.title` when `--title` is omitted.
- Write deterministic generated artifact `.gitignore`.
- Generate the root `open-docs.sh` wrapper.
- Render static pages from JSON.

It must not call Git.

### `skill/stenc/scripts/generated-artifacts.js`

Responsibilities:

- Own the generated artifact directory names and root files.
- Produce docs-app-root `.gitignore` text.
- Produce docs-dir-relative generated artifact paths for migration.

This module is dependency-light and has no filesystem side effects unless a caller explicitly writes its output.

### `bin/stenc.js`

Responsibilities:

- Route `stenc migrate`.
- Parse `--docs-dir` and `--dry-run`.
- Write or refresh the generated artifact `.gitignore` policy in normal mode.
- Locate tracked generated artifacts.
- Run scoped `git rm --cached -r -- <paths>` only for generated artifacts.

### `scripts/open-docs.sh`

Responsibilities:

- Resolve project root and docs path.
- In normal mode, run installed `setup-project.js` with `--skip-open-docs-script` before serving.
- In dry-run mode, print resolved paths and exit without writing files.
- Fail clearly if the renderer is missing.

### Tests

Required test coverage:

- Title preservation in `setup-project.test.js`.
- Generated artifact `.gitignore` patterns in `setup-project.test.js`.
- Default `stenc migrate`, custom `--docs-dir`, `--dry-run`, `.gitignore` refresh, and idempotency in `bin/stenc.test.js`.
- `open-docs.sh` dry-run remains read-only, missing renderer fails clearly, and normal preflight regenerates missing pages in `scripts/open-docs.test.js`.
- Full validation through `./scripts/validate.sh`.

## Data Flow

1. User edits `docs/stenc/content/**/*.json`.
2. User runs `./open-docs.sh`.
3. `open-docs.sh` resolves project root and docs path.
4. `open-docs.sh` invokes installed `setup-project.js --skip-open-docs-script`.
5. `setup-project.js` preserves site title, writes `.gitignore`, and regenerates HTML/CSS.
6. Static server serves regenerated pages.
7. Existing users run `stenc migrate` once to refresh `.gitignore` and remove previously tracked generated artifacts from Git index.

## Error Handling

- Missing renderer: `open-docs.sh` exits with install guidance and does not serve stale pages.
- Missing docs dir during migration: `stenc migrate` exits with guidance to run install/setup first.
- Non-Git directory: migration writes or verifies `.gitignore` when possible, then reports Git cache cleanup was skipped.
- Already untracked generated artifacts: migration exits successfully.
- Malformed existing `site.json`: setup uses explicit `--title` when supplied, otherwise falls back to `Docs`.

## Validation

Run:

```bash
node skill/stenc/scripts/setup-project.test.js
node bin/stenc.test.js
node scripts/open-docs.test.js
./scripts/validate.sh
```

Expected:

- All tests pass.
- Existing source JSON remains trackable.
- Generated HTML/CSS are ignored for new setups.
- `stenc migrate` refreshes the generated artifact `.gitignore` in normal mode.
- Existing generated HTML/CSS are removed only from Git index by `stenc migrate`.

## Open Questions

None.
