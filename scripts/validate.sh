#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VALIDATOR="${REPO_ROOT}/skill/stenc/scripts/validate-stenc-doc.js"

node "${VALIDATOR}" \
  "${REPO_ROOT}/skill/stenc/templates" \
  "${REPO_ROOT}/examples" \
  "${REPO_ROOT}/examples-app/content"

node "${REPO_ROOT}/skill/stenc/scripts/validate-stenc-doc.test.js"
node "${REPO_ROOT}/skill/stenc/scripts/setup-project.test.js"
node "${REPO_ROOT}/skill/stenc/scripts/check-rendered-pages.test.js"
node "${REPO_ROOT}/bin/stenc.test.js"
node "${REPO_ROOT}/scripts/bootstrap.test.js"
node "${REPO_ROOT}/scripts/open-docs.test.js"
node "${REPO_ROOT}/scripts/install.test.js"
node "${REPO_ROOT}/scripts/release.test.js"

if [[ ! -f "${REPO_ROOT}/examples-app/index.html" ]]; then
  "${REPO_ROOT}/scripts/setup-examples-app.sh"
fi

node "${REPO_ROOT}/skill/stenc/scripts/check-rendered-pages.js" \
  "${REPO_ROOT}/examples-app"
