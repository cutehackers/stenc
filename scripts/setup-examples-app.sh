#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${REPO_ROOT}/starlight"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required to prepare the ContextKit examples app." >&2
  exit 1
fi

node "${REPO_ROOT}/skill/context-kit/scripts/setup-project.js" \
  --project-root "${REPO_ROOT}" \
  --docs-dir "starlight" \
  --title "ContextKit" \
  --skip-install

cp "${REPO_ROOT}/examples/artifact-identity.spec.json" \
  "${APP_DIR}/content/specs/artifact-identity.spec.json"
cp "${REPO_ROOT}/examples/context-kit-adoption.plan.json" \
  "${APP_DIR}/content/plans/context-kit-adoption.plan.json"

(
  cd "${APP_DIR}"
  npm install
)

echo "Prepared ContextKit examples app at ${APP_DIR}"
echo "Run: cd ${APP_DIR} && npm run dev"
