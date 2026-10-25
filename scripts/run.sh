#!/usr/bin/env bash
# Start AURA locally: FastAPI on :8000 and Next.js on :3000.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PYTHON="${ROOT}/.venv/bin/python"
if [[ ! -x "$PYTHON" ]]; then
  PYTHON="$(command -v python3 || true)"
fi
if [[ -z "$PYTHON" ]]; then
  echo "Need python3 or ${ROOT}/.venv/bin/python" >&2
  exit 1
fi

if [[ ! -d "${ROOT}/frontend/node_modules" ]]; then
  echo "Installing frontend dependencies…"
  (cd "${ROOT}/frontend" && npm install)
fi

if ! ls "${ROOT}/models/"*.gguf >/dev/null 2>&1; then
  echo "Warning: no .gguf files in models/. The UI will load but chat cannot run until you add one."
  echo "See models/README.md"
fi

cleanup() {
  if [[ -n "${API_PID:-}" ]]; then kill "$API_PID" 2>/dev/null || true; fi
  if [[ -n "${WEB_PID:-}" ]]; then kill "$WEB_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM

echo "API  → http://127.0.0.1:8000  ($PYTHON)"
"$PYTHON" "${ROOT}/server.py" &
API_PID=$!

echo "UI   → http://localhost:3000"
(cd "${ROOT}/frontend" && npm run dev) &
WEB_PID=$!

echo "Ctrl+C stops both."
wait
