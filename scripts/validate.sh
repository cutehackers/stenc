#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VALIDATOR="${REPO_ROOT}/skill/context-kit/scripts/validate-context-kit-doc.js"

node "${VALIDATOR}" \
  "${REPO_ROOT}/skill/context-kit/templates" \
  "${REPO_ROOT}/examples"

if [[ ! -f "${REPO_ROOT}/starlight/package.json" || ! -d "${REPO_ROOT}/starlight/node_modules" ]]; then
  "${REPO_ROOT}/scripts/setup-starlight.sh"
fi

(
  cd "${REPO_ROOT}/starlight"
  npm run build
)
