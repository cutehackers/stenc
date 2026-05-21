#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${REPO_ROOT}/examples-app"

node "${REPO_ROOT}/skill/stenc/scripts/setup-project.js" \
  --project-root "${REPO_ROOT}" \
  --docs-dir "examples-app" \
  --title "Stenc" \
  --skip-install \
  --skip-open-docs-script

cp "${REPO_ROOT}/examples/artifact-identity.spec.json" \
  "${APP_DIR}/content/specs/artifact-identity.spec.json"
cp "${REPO_ROOT}/examples/stenc-adoption.plan.json" \
  "${APP_DIR}/content/plans/stenc-adoption.plan.json"

node "${REPO_ROOT}/skill/stenc/scripts/setup-project.js" \
  --project-root "${REPO_ROOT}" \
  --docs-dir "examples-app" \
  --title "Stenc" \
  --skip-install \
  --skip-open-docs-script

echo "Prepared Stenc examples app at ${APP_DIR}"
echo "Run: cd ${REPO_ROOT} && ./scripts/open-docs.sh --docs-dir examples-app"
