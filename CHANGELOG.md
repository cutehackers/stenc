# Changelog

## v0.3.0

### Added

- Add bounded rich supporting-section blocks for Markdown-era expression:
  `paragraph`, `callout`, `quote`, `table`, `media`, `taskList`, and
  `diagram`.
- Add deterministic local media asset copying from `content/assets/` to
  generated `assets/`.
- Add rendered-page checks for missing and stale media references.

### Changed

- Document the rich primitive source contract across the Stenc skill,
  templates, references, examples, and release planning docs.
- Keep diagram support as escaped source panels without Mermaid runtime,
  client-side scripts, or remote dependencies.

### Migration

- No migration steps are recorded for this release.

## v0.2.2

### Changed

- Prepare Stenc v0.2.2 release.

### Migration

- No migration steps are recorded for this release.

## v0.2.1

### Changed

- Prepare Stenc v0.2.1 release.

### Migration

- No migration steps are recorded for this release.

## v0.2.0

### Added

- Add `stenc migrate` for explicit generated artifact Git index cleanup.
- Add generated artifact `.gitignore` policy for Stenc docs apps.
- Add `open-docs.sh` regeneration before serving.

### Changed

- Preserve existing `content/site.json` title when setup reruns without
  `--title`.
- Treat generated HTML/CSS and collection route directories as reproducible
  local artifacts.

### Migration

Existing projects that already committed generated Stenc pages should run:

```bash
stenc migrate
./open-docs.sh
```
