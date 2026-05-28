#!/usr/bin/env bash
#
# Stenc release helper.
#
# Usage:
#   ./scripts/release.sh 0.2.0 --dry-run
#   ./scripts/release.sh 0.2.0
#   ./scripts/release.sh 0.2.0 --push
#
# Release notes:
#   - CHANGELOG.md is created when missing.
#   - A missing ## vX.Y.Z section is inserted automatically.
#   - docs/releases/vX.Y.Z.md is created when missing.
#   - Existing release notes are preserved.
#
# What this script does:
#   - requires a clean working tree;
#   - validates MAJOR.MINOR.PATCH version input;
#   - creates or updates CHANGELOG.md and docs/releases/vX.Y.Z.md;
#   - synchronizes package.json and package-lock.json versions;
#   - runs ./scripts/validate.sh, npm test, and git diff --check;
#   - creates chore(release): vX.Y.Z;
#   - creates annotated tag vX.Y.Z;
#   - pushes the current branch and tag only when --push is supplied.
#
# This script does not publish npm packages and does not run target-project
# migrations. Existing target projects should run `stenc migrate` separately.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION=""
DRY_RUN=0
PUSH=0

usage() {
  cat <<'EOF'
Usage: ./scripts/release.sh <version> [options]

Prepare a Stenc release by synchronizing package versions, running release
checks, creating a release commit, and creating an annotated Git tag.

CHANGELOG.md and docs/releases/vX.Y.Z.md are generated automatically when
missing. Existing release notes are preserved, and missing CHANGELOG sections
are inserted for the release version.

Options:
  --dry-run              Print the planned release without changing files.
  --push                 Push the current branch and release tag after tagging.
  -h, --help             Show this help.

Environment overrides for tests and local troubleshooting:
  STENC_RELEASE_VALIDATE_COMMAND   Defaults to ./scripts/validate.sh
  STENC_RELEASE_TEST_COMMAND       Defaults to npm test
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --push)
      PUSH=1
      shift
      ;;
    -*)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
    *)
      if [[ -n "${VERSION}" ]]; then
        echo "Unexpected argument: $1" >&2
        exit 2
      fi
      VERSION="$1"
      shift
      ;;
  esac
done

if [[ -z "${VERSION}" ]]; then
  echo "Missing release version." >&2
  usage >&2
  exit 2
fi

if [[ ! "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Release version must use MAJOR.MINOR.PATCH: ${VERSION}" >&2
  exit 2
fi

TAG="v${VERSION}"
RELEASE_NOTE="${REPO_ROOT}/docs/releases/${TAG}.md"
CHANGELOG="${REPO_ROOT}/CHANGELOG.md"
VALIDATE_COMMAND="${STENC_RELEASE_VALIDATE_COMMAND:-./scripts/validate.sh}"
TEST_COMMAND="${STENC_RELEASE_TEST_COMMAND:-npm test}"

cd "${REPO_ROOT}"

if [[ "$(git rev-parse --is-inside-work-tree 2>/dev/null)" != "true" ]]; then
  echo "release.sh must run inside a Git repository." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "working tree must be clean before running release.sh" >&2
  exit 1
fi

if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  echo "release tag already exists: ${TAG}" >&2
  exit 1
fi

node - "${VERSION}" "${REPO_ROOT}" inspect <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const [version, repoRoot] = process.argv.slice(2);
const tag = `v${version}`;
const releaseNotePath = path.join(repoRoot, "docs", "releases", `${tag}.md`);
const changelogPath = path.join(repoRoot, "CHANGELOG.md");

function hasChangelogSection(content) {
  return content
    .split(/\r?\n/)
    .some((line) => line.trim() === `## ${tag}`);
}

const releaseNoteAction = fs.existsSync(releaseNotePath) ? "exists" : "create";
let changelogAction = "create";
if (fs.existsSync(changelogPath)) {
  const changelog = fs.readFileSync(changelogPath, "utf8");
  changelogAction = hasChangelogSection(changelog) ? "exists" : "insert-section";
}

console.log(`releaseNoteAction=${releaseNoteAction}`);
console.log(`changelogAction=${changelogAction}`);
NODE

echo "version=${VERSION}"
echo "tag=${TAG}"
echo "releaseNote=${RELEASE_NOTE}"
echo "validate=${VALIDATE_COMMAND}"
echo "test=${TEST_COMMAND}"

if [[ "${DRY_RUN}" -eq 1 ]]; then
  echo "dryRun=1"
  exit 0
fi

node - "${VERSION}" "${REPO_ROOT}" write <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const [version, repoRoot] = process.argv.slice(2);
const tag = `v${version}`;

function hasChangelogSection(content) {
  return content
    .split(/\r?\n/)
    .some((line) => line.trim() === `## ${tag}`);
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function releaseNoteBody() {
  return [
    `# Stenc ${tag}`,
    "",
    "## Summary",
    "",
    `Release Stenc ${tag}.`,
    "",
    "## Changes",
    "",
    "See [CHANGELOG.md](../../CHANGELOG.md) for the release change list.",
    "",
    "## Migration",
    "",
    "No migration steps are recorded for this release.",
    "",
  ].join("\n");
}

function changelogSection() {
  return [
    `## ${tag}`,
    "",
    "### Changed",
    "",
    `- Prepare Stenc ${tag} release.`,
    "",
    "### Migration",
    "",
    "- No migration steps are recorded for this release.",
    "",
  ].join("\n");
}

function ensureReleaseDocs() {
  const releaseNotePath = path.join(repoRoot, "docs", "releases", `${tag}.md`);
  const changelogPath = path.join(repoRoot, "CHANGELOG.md");

  fs.mkdirSync(path.dirname(releaseNotePath), { recursive: true });
  if (!fs.existsSync(releaseNotePath)) {
    fs.writeFileSync(releaseNotePath, releaseNoteBody());
  }

  if (!fs.existsSync(changelogPath)) {
    fs.writeFileSync(changelogPath, `# Changelog\n\n${changelogSection()}`);
    return;
  }

  const changelog = fs.readFileSync(changelogPath, "utf8");
  if (hasChangelogSection(changelog)) return;

  const lines = changelog.replace(/\s*$/, "\n").split("\n");
  if (lines[0] && lines[0].trim() === "# Changelog") {
    let insertAt = 1;
    while (insertAt < lines.length && lines[insertAt].trim() === "") insertAt += 1;
    lines.splice(insertAt, 0, "", changelogSection().trimEnd(), "");
    fs.writeFileSync(changelogPath, `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`);
    return;
  }

  fs.writeFileSync(changelogPath, `# Changelog\n\n${changelogSection()}\n${changelog.trimEnd()}\n`);
}

ensureReleaseDocs();

const packageJsonPath = path.join(repoRoot, "package.json");
const packageLockPath = path.join(repoRoot, "package-lock.json");

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
packageJson.version = version;
writeJson(packageJsonPath, packageJson);

const packageLock = JSON.parse(fs.readFileSync(packageLockPath, "utf8"));
packageLock.version = version;
if (packageLock.packages && packageLock.packages[""]) {
  packageLock.packages[""].version = version;
}
writeJson(packageLockPath, packageLock);
NODE

bash -lc "${VALIDATE_COMMAND}"
bash -lc "${TEST_COMMAND}"
git diff --check

git add -- package.json package-lock.json CHANGELOG.md "${RELEASE_NOTE}"
git commit -m "chore(release): ${TAG}"
git tag -a "${TAG}" -m "Stenc ${TAG}"

if [[ "${PUSH}" -eq 1 ]]; then
  CURRENT_BRANCH="$(git branch --show-current)"
  git push origin "${CURRENT_BRANCH}"
  git push origin "${TAG}"
fi

echo "Released ${TAG}"
