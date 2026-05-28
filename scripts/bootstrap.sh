#!/usr/bin/env bash
set -euo pipefail

DEFAULT_REPO="https://github.com/cutehackers/stenc.git"
STENC_REPO="${STENC_REPO:-${DEFAULT_REPO}}"
STENC_REF="${STENC_REF:-main}"
STENC_CACHE_DIR="${STENC_CACHE_DIR:-${XDG_CACHE_HOME:-${HOME}/.cache}/stenc}"
SOURCE_DIR="${STENC_CACHE_DIR}/source"
TARGET_PROJECT_ROOT="$(pwd)"

usage() {
  cat <<'EOF'
Usage: curl -fsSL https://raw.githubusercontent.com/cutehackers/stenc/main/scripts/bootstrap.sh | bash
       curl -fsSL https://raw.githubusercontent.com/cutehackers/stenc/main/scripts/bootstrap.sh | bash -s -- [install] [options]

Install Stenc into the current project without manually downloading the
Stenc repository or passing a local repository path.

Options are forwarded to `stenc install`:
  --project-root <path>       Target project root. Defaults to the current directory.
  --docs-dir <path>           Docs app path inside the current project.
                              Defaults to docs/stenc.
  --title <text>              Target docs app title. Defaults to "Docs".
  --skip-project-install      Deprecated compatibility flag.
  -h, --help                  Show this help.

Advanced environment overrides:
  STENC_REPO            Git repository to clone.
  STENC_REF             Git ref to fetch. Defaults to main.
  STENC_CACHE_DIR       Cache directory. Defaults to ~/.cache/stenc.
  STENC_BIN_DIR         Directory for the stenc command. Defaults to a writable
                        PATH directory, then ~/.local/bin.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "${1:-}" == "install" ]]; then
  shift
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git is required to install Stenc with the one-command installer." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node is required to install Stenc." >&2
  exit 1
fi

mkdir -p "${STENC_CACHE_DIR}"

if [[ -d "${SOURCE_DIR}/.git" ]]; then
  git -C "${SOURCE_DIR}" remote set-url origin "${STENC_REPO}"
  git -C "${SOURCE_DIR}" fetch --depth 1 origin "${STENC_REF}"
  git -C "${SOURCE_DIR}" checkout -B "${STENC_REF}" FETCH_HEAD >/dev/null
else
  if [[ -e "${SOURCE_DIR}" ]]; then
    echo "Stenc cache path exists but is not a git repository: ${SOURCE_DIR}" >&2
    exit 1
  fi
  git clone --depth 1 --branch "${STENC_REF}" "${STENC_REPO}" "${SOURCE_DIR}"
fi

echo "Using Stenc from ${SOURCE_DIR}"
echo "Installing into ${TARGET_PROJECT_ROOT}"

(
  cd "${TARGET_PROJECT_ROOT}"
  node "${SOURCE_DIR}/bin/stenc.js" install "$@"
)
