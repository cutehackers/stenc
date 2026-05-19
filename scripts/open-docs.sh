#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${PWD}"
DOCS_DIR="docs/context-kit"
PORT=""
DRY_RUN=0

usage() {
  cat <<'EOF'
Usage: ./scripts/open-docs.sh [options]

Open a ContextKit docs app and stop it with Enter.

Options:
  --project-root <path>  Target repository root. Defaults to the current directory.
  --docs-dir <path>      Docs app path inside --project-root. Defaults to docs/context-kit.
  --port <number>        Preferred local port. Defaults to the first free port from 4321.
  --dry-run              Print resolved paths without starting the dev server.
  -h, --help             Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
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
    --port)
      PORT="${2:-}"
      if [[ -z "${PORT}" ]]; then
        echo "Missing value for --port" >&2
        exit 2
      fi
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
  esac
done

PROJECT_ROOT="$(cd "${PROJECT_ROOT}" && pwd)"
if [[ "${DOCS_DIR}" = /* ]]; then
  DOCS_PATH="${DOCS_DIR}"
else
  DOCS_PATH="${PROJECT_ROOT}/${DOCS_DIR}"
fi

if [[ "${DRY_RUN}" -eq 1 ]]; then
  echo "projectRoot=${PROJECT_ROOT}"
  echo "docsPath=${DOCS_PATH}"
  exit 0
fi

if [[ ! -f "${DOCS_PATH}/package.json" ]]; then
  echo "ContextKit docs app not found: ${DOCS_PATH}" >&2
  echo "Run setup first, for example:" >&2
  echo "  ./scripts/install.sh --project-root ${PROJECT_ROOT} --docs-dir ${DOCS_DIR}" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required to open the ContextKit docs app." >&2
  exit 1
fi

if [[ -z "${PORT}" ]]; then
  PORT="$(node - <<'NODE'
const net = require("node:net");

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

(async () => {
  for (let port = 4321; port < 4400; port += 1) {
    if (await canListen(port)) {
      console.log(port);
      return;
    }
  }
  process.exit(1);
})();
NODE
)"
fi

URL="http://127.0.0.1:${PORT}/"
LOG_FILE="${TMPDIR:-/tmp}/context-kit-open-docs-${PORT}.log"

(
  cd "${DOCS_PATH}"
  npm run dev -- --host 127.0.0.1 --port "${PORT}" >"${LOG_FILE}" 2>&1
) &
SERVER_PID=$!

cleanup() {
  if kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    pkill -TERM -P "${SERVER_PID}" >/dev/null 2>&1 || true
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

for _ in $(seq 1 80); do
  if ! kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    echo "ContextKit docs server failed to start. Log: ${LOG_FILE}" >&2
    exit 1
  fi
  if curl -fsS "${URL}" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

if ! curl -fsS "${URL}" >/dev/null 2>&1; then
  echo "ContextKit docs server did not become ready. Log: ${LOG_FILE}" >&2
  exit 1
fi

if command -v open >/dev/null 2>&1; then
  open "${URL}"
fi

echo "ContextKit docs running at ${URL}"
echo "Press Enter to stop."
IFS= read -r _
