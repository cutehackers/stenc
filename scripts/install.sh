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

Installs the Stenc Codex skill into ~/.codex/skills/stenc and
prepares the local Stenc examples app.

Options:
  --project-root <path>       Also prepare this target project's Stenc
                              web documentation app.
  --docs-dir <path>           Docs app path inside --project-root. Defaults to
                              docs/stenc.
  --title <text>              Target docs app title. Defaults to "Docs".
  --skip-project-install      Deprecated compatibility flag.
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
    --docs-source)
      echo "$1 was removed; use --docs-dir for the Stenc web app" >&2
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
SOURCE_DIR="${REPO_ROOT}/skill/stenc"
TARGET_ROOT="${CODEX_SKILLS_DIR:-${HOME}/.codex/skills}"
TARGET_DIR="${TARGET_ROOT}/stenc"

if [[ ! -f "${SOURCE_DIR}/SKILL.md" ]]; then
  echo "Stenc skill source not found: ${SOURCE_DIR}" >&2
  exit 1
fi

mkdir -p "${TARGET_ROOT}"
rm -rf "${TARGET_DIR}"
cp -R "${SOURCE_DIR}" "${TARGET_DIR}"

echo "Installed Stenc skill to ${TARGET_DIR}"
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
  if [[ "${#PROJECT_INSTALL_ARGS[@]}" -gt 0 ]]; then
    SETUP_ARGS+=("${PROJECT_INSTALL_ARGS[@]}")
  fi

  node "${TARGET_DIR}/scripts/setup-project.js" "${SETUP_ARGS[@]}"
fi
