#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=""
DOCS_DIR=""
SITE_TITLE=""
PROJECT_INSTALL_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      cat <<'EOF'
Usage: ./scripts/install.sh [options]

Installs the ContextKit Codex skill into ~/.codex/skills/context-kit and
prepares the local ContextKit examples app.

Options:
  --project-root <path>       Also prepare this target project's ContextKit
                              web documentation app.
  --docs-dir <path>           Docs app path inside --project-root. Defaults to
                              docs/context-kit.
  --title <text>              Target docs app title. Defaults to "Docs".
  --skip-project-install      Write target app files without npm install.
EOF
      exit 0
      ;;
    --project-root)
      PROJECT_ROOT="${2:-}"
      if [[ -z "${PROJECT_ROOT}" ]]; then
        echo "Missing value for --project-root" >&2
        exit 2
      fi
      shift 2
      ;;
    --docs-dir)
      DOCS_DIR="${2:-}"
      if [[ -z "${DOCS_DIR}" ]]; then
        echo "Missing value for --docs-dir" >&2
        exit 2
      fi
      shift 2
      ;;
    --docs-source|--starlight-dir)
      echo "$1 was removed; use --docs-dir for the ContextKit web app" >&2
      exit 2
      ;;
    --title)
      SITE_TITLE="${2:-}"
      if [[ -z "${SITE_TITLE}" ]]; then
        echo "Missing value for --title" >&2
        exit 2
      fi
      shift 2
      ;;
    --skip-project-install)
      PROJECT_INSTALL_ARGS+=("--skip-install")
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${REPO_ROOT}/skill/context-kit"
TARGET_ROOT="${CODEX_SKILLS_DIR:-${HOME}/.codex/skills}"
TARGET_DIR="${TARGET_ROOT}/context-kit"

if [[ ! -f "${SOURCE_DIR}/SKILL.md" ]]; then
  echo "ContextKit skill source not found: ${SOURCE_DIR}" >&2
  exit 1
fi

mkdir -p "${TARGET_ROOT}"
rm -rf "${TARGET_DIR}"
cp -R "${SOURCE_DIR}" "${TARGET_DIR}"

echo "Installed ContextKit skill to ${TARGET_DIR}"
"${REPO_ROOT}/scripts/setup-examples-app.sh"

if [[ -n "${PROJECT_ROOT}" ]]; then
  SETUP_ARGS=(
    "--project-root" "${PROJECT_ROOT}"
  )
  if [[ -n "${DOCS_DIR}" ]]; then
    SETUP_ARGS+=("--docs-dir" "${DOCS_DIR}")
  fi
  if [[ -n "${SITE_TITLE}" ]]; then
    SETUP_ARGS+=("--title" "${SITE_TITLE}")
  fi
  SETUP_ARGS+=("${PROJECT_INSTALL_ARGS[@]}")

  node "${TARGET_DIR}/scripts/setup-project.js" "${SETUP_ARGS[@]}"
fi
