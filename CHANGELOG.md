# Changelog

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
