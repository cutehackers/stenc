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
cp "${REPO_ROOT}/examples/component-catalog.spec.json" \
  "${APP_DIR}/content/specs/component-catalog.spec.json"
cp "${REPO_ROOT}/examples/component-catalog.plan.json" \
  "${APP_DIR}/content/plans/component-catalog.plan.json"
mkdir -p "${APP_DIR}/content/assets"
cp "${REPO_ROOT}/examples/content/assets/stenc-flow.svg" \
  "${APP_DIR}/content/assets/stenc-flow.svg"

node "${REPO_ROOT}/skill/stenc/scripts/setup-project.js" \
  --project-root "${REPO_ROOT}" \
  --docs-dir "examples-app" \
  --title "Stenc" \
  --skip-install \
  --skip-open-docs-script

node -e \
  'const fs = require("node:fs"); const { buildUnifiedStyles } = require(process.argv[1]); fs.writeFileSync(process.argv[2], buildUnifiedStyles());' \
  "${REPO_ROOT}/skill/stenc/scripts/unified-styles.js" \
  "${REPO_ROOT}/samples/stenc-doc-styles/styles.css"

node "${REPO_ROOT}/skill/stenc/scripts/render-style-samples.js"

echo "Prepared Stenc examples app at ${APP_DIR}"
echo "Run: cd ${REPO_ROOT} && ./scripts/open-docs.sh --docs-dir examples-app"
