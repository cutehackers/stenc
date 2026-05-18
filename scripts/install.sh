#!/usr/bin/env bash
set -euo pipefail

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      cat <<'EOF'
Usage: ./scripts/install.sh

Installs the ContextKit Codex skill into ~/.codex/skills/context-kit and
prepares the local Astro Starlight docs workspace.
EOF
      exit 0
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
"${REPO_ROOT}/scripts/setup-starlight.sh"
