# Stenc TODO

This file tracks product-level follow-up work that is not yet part of the
active implementation plan. It is intentionally concise, but each item must be
specific enough to become a spec or implementation plan without rediscovery.

## Format

Each TODO item uses this shape:

```text
T-<number> <Title>
Status: proposed | ready | in-progress | blocked | done
Priority: P0 | P1 | P2 | P3
Why: user or repo problem this solves
Scope: files or behavior surfaces expected to change
Acceptance: concrete checks that prove the item is done
Notes: constraints, risks, or sequencing
```

## Principles

- Keep `package.json.version` as the Stenc product release version.
- Keep document `schemaVersion` independent from the product release version.
- Keep migration IDs independent from both product version and schema version.
- Keep the public migration command simple: `stenc migrate`.
- Prefer release-time policy checks over automatic hidden mutation.
- Do not let install, setup, or open-docs mutate a target project's Git index.

## T-001 Version Contract Gate

Status: proposed
Priority: P1

Why: Stenc now has three version axes: product release version,
document schema version, and migration identity. They should be checked together
before release without making `release.sh` own every policy detail.

Scope:

- Add `scripts/version-contract-gate.sh`.
- Add `scripts/version-contract-gate.test.js`.
- Call the contract gate from `scripts/release.sh` before validation.
- Add the contract gate to `scripts/validate.sh` only if it stays deterministic
  and fixture-safe.

Acceptance:

- `./scripts/version-contract-gate.sh` passes on the current repo.
- The check exits non-zero with a clear message when schema metadata drifts.
- The check exits non-zero with a clear message when migration metadata drifts.
- `./scripts/release.sh <version> --dry-run` reports that the contract gate
  would run, but does not modify files.
- Tests cover pass and fail cases using temporary fixtures.

Notes:

- `release.sh` should orchestrate this check, not duplicate its logic.
- Keep the check dependency-light: Bash plus Node standard library is enough.

## T-002 Schema Version Registry

Status: proposed
Priority: P1

Why: Supported schema versions are currently implied by validator code,
templates, examples, and references. A future schema change needs one explicit
registry so release-time checks can detect inconsistent updates.

Scope:

- Add a small registry file, for example:

```json
{
  "current": 2,
  "supported": [1, 2],
  "newDocumentDefault": 2
}
```

- Candidate path: `skill/stenc/schema-version.json`.
- Update validator/tests/templates/references only through this registry when
  practical.
- Add policy checks for:
  - every template uses `newDocumentDefault`;
  - references mention the current new-document default;
  - validator supports every `supported` version;
  - examples do not use unsupported versions.

Acceptance:

- Changing the registry without updating templates or validator fails a test.
- New document templates keep using the configured default schema version.
- Backward-compatible support for `schemaVersion: 1` remains explicit.

Notes:

- Do not bump `schemaVersion` for renderer-only, style-only, CLI-only, or
  release-tooling changes.
- Bump only when document JSON structure or validation contract changes.

## T-003 Migration ID Registry

Status: proposed
Priority: P1

Why: Migration IDs should be durable internal identifiers, while users should
continue to run only `stenc migrate`. Without a registry, future migrations can
duplicate IDs or drift from release notes and tests.

Scope:

- Add a registry file, for example:

```json
{
  "migrations": [
    {
      "id": "2026-05-generated-artifacts",
      "introducedIn": "0.2.0",
      "publicCommand": "stenc migrate",
      "description": "Stop tracking generated static docs artifacts."
    }
  ]
}
```

- Candidate path: `skill/stenc/migrations/registry.json`.
- Optional future implementation modules can live beside it:
  `skill/stenc/migrations/<id>.js`.
- Add policy checks for:
  - ID format: `YYYY-MM-<slug>`;
  - no duplicate IDs;
  - every migration has `introducedIn`;
  - `introducedIn` has a matching `docs/releases/vX.Y.Z.md`;
  - release notes mention `stenc migrate` when that release introduces a
    migration.

Acceptance:

- Duplicate migration IDs fail the policy check.
- Malformed migration IDs fail the policy check.
- A migration introduced in `0.2.0` requires `docs/releases/v0.2.0.md`.
- Public docs keep using `stenc migrate`, not versioned migration commands.

Notes:

- The registry records migration identity; it should not require users to pass
  the migration ID on the command line.

## T-004 Release Integration

Status: proposed
Priority: P2

Why: `release.sh` currently manages product release version and tag creation.
Once schema and migration registries exist, release should prove their policy
state before creating a release commit or tag.

Scope:

- Update `scripts/release.sh` to run:

```bash
./scripts/version-contract-gate.sh
./scripts/validate.sh
npm test
git diff --check
```

- Keep `--dry-run` read-only.
- Keep `--push` explicit.
- Add release tests that verify contract-gate failures stop release before
  version file edits, commits, or tags.

Acceptance:

- If `version-contract-gate.sh` fails, no package version files are edited.
- If validation fails, no release commit or tag is created.
- If all checks pass, release still creates `chore(release): vX.Y.Z` and an
  annotated `vX.Y.Z` tag.

Notes:

- This should remain local release automation. It should not run npm publish.

## T-005 Documentation Contract

Status: proposed
Priority: P2

Why: Contributors need one short explanation of the three version axes so
future changes do not overload `release.sh` or misuse `schemaVersion`.

Scope:

- Add a "Version Policy" section to `README.md`.
- Add the same operational rule to `skill/stenc/SKILL.md` only if it affects
  agents authoring or migrating Stenc docs.
- Link to `docs/TODO.md` while this policy is still proposed.

Acceptance:

- README explains:
  - product version is SemVer in `package.json`;
  - schema version is the JSON document contract;
  - migration ID is an internal identifier;
  - public migration command remains `stenc migrate`.
- Release docs for migrations include user-facing migration commands.

Notes:

- Avoid making `docs/TODO.md` the long-term source of truth. Once implemented,
  move stable policy into README, skill references, or dedicated registry files.
