#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VALIDATOR="${REPO_ROOT}/skill/context-kit/scripts/validate-context-kit-doc.js"

node "${VALIDATOR}" \
  "${REPO_ROOT}/skill/context-kit/templates" \
  "${REPO_ROOT}/examples" \
  "${REPO_ROOT}/starlight/content"

node "${REPO_ROOT}/skill/context-kit/scripts/validate-context-kit-doc.test.js"
node "${REPO_ROOT}/skill/context-kit/scripts/setup-project.test.js"
node "${REPO_ROOT}/scripts/open-docs.test.js"
node "${REPO_ROOT}/scripts/install.test.js"

if [[ ! -f "${REPO_ROOT}/starlight/package.json" || ! -d "${REPO_ROOT}/starlight/node_modules" ]]; then
  "${REPO_ROOT}/scripts/setup-examples-app.sh"
fi

(
  cd "${REPO_ROOT}/starlight"
  npm run build
)
