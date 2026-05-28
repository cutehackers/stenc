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
prepares the local Stenc examples app. It also installs the `stenc`
command into a writable PATH directory when possible.

Options:
  --project-root <path>       Also prepare this target project's Stenc
                              web documentation app.
  --docs-dir <path>           Docs app path inside --project-root. Defaults to
                              docs/stenc.
  --title <text>              Target docs app title. Defaults to "Docs".
  --skip-project-install      Deprecated compatibility flag.

Environment:
  STENC_BIN_DIR               Directory for the stenc command. Defaults to a
                              writable PATH directory, then ~/.local/bin.
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

path_contains() {
  case ":${PATH:-}:" in
    *":$1:"*) return 0 ;;
    *) return 1 ;;
  esac
}

choose_bin_dir() {
  if [[ -n "${STENC_BIN_DIR:-}" ]]; then
    printf '%s\n' "${STENC_BIN_DIR}"
    return
  fi

  local candidate
  for candidate in \
    "${HOME}/.local/bin" \
    "${HOME}/bin" \
    "${HOME}/.cargo/bin" \
    "${HOME}/.npm-global/bin" \
    "/opt/homebrew/bin" \
    "/usr/local/bin"
  do
    if path_contains "${candidate}" && { [[ -d "${candidate}" && -w "${candidate}" ]] || [[ ! -e "${candidate}" && -w "$(dirname "${candidate}")" ]]; }; then
      printf '%s\n' "${candidate}"
      return
    fi
  done

  local path_dir
  IFS=':' read -r -a path_dirs <<< "${PATH:-}"
  for path_dir in "${path_dirs[@]}"; do
    if [[ -n "${path_dir}" && "${path_dir}" = /* && -d "${path_dir}" && -w "${path_dir}" ]]; then
      printf '%s\n' "${path_dir}"
      return
    fi
  done

  printf '%s\n' "${HOME}/.local/bin"
}

install_cli_wrapper() {
  local bin_dir="$1"
  local wrapper_path="${bin_dir}/stenc"
  local tmp_path="${wrapper_path}.tmp.$$"

  mkdir -p "${bin_dir}"
  cat > "${tmp_path}" <<EOF
#!/usr/bin/env bash
exec node "${REPO_ROOT}/bin/stenc.js" "\$@"
EOF
  chmod +x "${tmp_path}"
  mv "${tmp_path}" "${wrapper_path}"

  echo "Installed Stenc command to ${wrapper_path}"
  if ! path_contains "${bin_dir}"; then
    echo "Add this directory to PATH to run 'stenc' from a new shell:" >&2
    echo "  export PATH=\"${bin_dir}:\$PATH\"" >&2
  fi
}

if [[ ! -f "${SOURCE_DIR}/SKILL.md" ]]; then
  echo "Stenc skill source not found: ${SOURCE_DIR}" >&2
  exit 1
fi

mkdir -p "${TARGET_ROOT}"
rm -rf "${TARGET_DIR}"
cp -R "${SOURCE_DIR}" "${TARGET_DIR}"

echo "Installed Stenc skill to ${TARGET_DIR}"
install_cli_wrapper "$(choose_bin_dir)"
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
