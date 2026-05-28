#!/usr/bin/env bash
#
# Stenc release helper.
#
# Usage:
#   ./scripts/release.sh 0.2.0 --dry-run
#   ./scripts/release.sh 0.2.0
#   ./scripts/release.sh 0.2.0 --push
#
# Before running a release, prepare:
#   CHANGELOG.md
#   docs/releases/vX.Y.Z.md
#
# What this script does:
#   - requires a clean working tree;
#   - validates MAJOR.MINOR.PATCH version input;
#   - checks CHANGELOG.md and docs/releases/vX.Y.Z.md exist for the release;
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

if [[ ! -f "${RELEASE_NOTE}" ]]; then
  echo "release note not found: ${RELEASE_NOTE}" >&2
  exit 1
fi

if [[ ! -f "${CHANGELOG}" ]] || ! grep -q "## ${TAG}" "${CHANGELOG}"; then
  echo "CHANGELOG.md must contain a ## ${TAG} section." >&2
  exit 1
fi

echo "version=${VERSION}"
echo "tag=${TAG}"
echo "releaseNote=${RELEASE_NOTE}"
echo "validate=${VALIDATE_COMMAND}"
echo "test=${TEST_COMMAND}"

if [[ "${DRY_RUN}" -eq 1 ]]; then
  echo "dryRun=1"
  exit 0
fi

node - "${VERSION}" "${REPO_ROOT}" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const [version, repoRoot] = process.argv.slice(2);

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

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

git add -- package.json package-lock.json
git commit -m "chore(release): ${TAG}"
git tag -a "${TAG}" -m "Stenc ${TAG}"

if [[ "${PUSH}" -eq 1 ]]; then
  CURRENT_BRANCH="$(git branch --show-current)"
  git push origin "${CURRENT_BRANCH}"
  git push origin "${TAG}"
fi

echo "Released ${TAG}"
