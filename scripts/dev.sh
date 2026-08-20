#!/usr/bin/env bash
#
# Starts all three Phase 1 local services — Firestore emulator, backend,
# frontend — with one command, and stops all of them together on Ctrl+C.
#
# Assumes the one-time setup in docs/architecture/local-dev.md has already
# been done (uv, pnpm, firebase-tools, openjdk installed).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.dev-logs"
mkdir -p "$LOG_DIR"

FIRESTORE_PORT=8080
FIRESTORE_UI_PORT=4000
BACKEND_PORT=8001
FRONTEND_PORT=3100

# --- prerequisites ---------------------------------------------------------

# macOS ships a `java` stub at /usr/bin/java that satisfies `command -v`
# but fails at runtime ("Unable to locate a Java Runtime") unless a real
# JDK is registered — same issue this project hit manually before. So
# always prefer Homebrew's openjdk (keg-only, not on PATH by default) over
# whatever `java` already resolves to, not just when java is missing.
if command -v brew >/dev/null 2>&1; then
  OPENJDK_PREFIX="$(brew --prefix openjdk 2>/dev/null || true)"
  if [ -n "$OPENJDK_PREFIX" ] && [ -d "$OPENJDK_PREFIX/bin" ]; then
    export PATH="$OPENJDK_PREFIX/bin:$PATH"
  fi
fi

# pnpm's global bin (where `firebase` gets installed) is only added to PATH
# via ~/.zshrc, which non-interactive shells — like this script running from
# an agent or CI — don't source. PNPM_HOME is set by `pnpm setup` regardless.
if ! command -v firebase >/dev/null 2>&1; then
  PNPM_BIN="${PNPM_HOME:-$HOME/Library/pnpm}/bin"
  if [ -d "$PNPM_BIN" ]; then
    export PATH="$PNPM_BIN:$PATH"
  fi
fi

missing=()
for cmd in java firebase uv pnpm curl lsof; do
  command -v "$cmd" >/dev/null 2>&1 || missing+=("$cmd")
done
if [ "${#missing[@]}" -gt 0 ]; then
  echo "error: missing required command(s): ${missing[*]}" >&2
  echo "  See docs/architecture/local-dev.md 'One-time setup'." >&2
  exit 1
fi

# --- port check --------------------------------------------------------

check_port() {
  local port="$1" name="$2"
  if lsof -i ":$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "error: port $port ($name) is already in use." >&2
    echo "  lsof -i :$port   # see what's using it" >&2
    echo "  Either stop that process, or this script (or the services it" >&2
    echo "  starts) may already be running." >&2
    exit 1
  fi
}
check_port "$FIRESTORE_PORT" "Firestore emulator"
check_port "$BACKEND_PORT" "backend"
check_port "$FRONTEND_PORT" "frontend"

# --- env files (first run only) -----------------------------------------

[ -f "$ROOT_DIR/backend/.env" ] || cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
[ -f "$ROOT_DIR/frontend/.env.local" ] || cp "$ROOT_DIR/frontend/.env.local.example" "$ROOT_DIR/frontend/.env.local"

# --- start services ------------------------------------------------------

# Job control (`set -m`) gives each backgrounded job its own process group,
# so `kill -- -$pid` below can kill the whole tree — e.g. `uv run uvicorn
# --reload` forks a reloader-supervisor plus a worker process, and plain
# `kill $pid` on the subshell only killed the subshell itself, leaking both
# uvicorn processes (and Next's process tree) on every restart.
set -m

PIDS=()

cleanup() {
  echo ""
  echo "Stopping services…"
  for pid in "${PIDS[@]}"; do
    kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting Firestore emulator…"
(cd "$ROOT_DIR" && firebase emulators:start --only firestore --project ai-engineering-lab-dev) \
  >"$LOG_DIR/firestore.log" 2>&1 &
PIDS+=("$!")

echo "Starting backend…"
(cd "$ROOT_DIR/backend" && uv run uvicorn app.main:app --port "$BACKEND_PORT" --reload) \
  >"$LOG_DIR/backend.log" 2>&1 &
PIDS+=("$!")

echo "Starting frontend…"
(cd "$ROOT_DIR/frontend" && pnpm exec next dev -p "$FRONTEND_PORT") \
  >"$LOG_DIR/frontend.log" 2>&1 &
PIDS+=("$!")

# --- wait for health -----------------------------------------------------

wait_for() {
  local url="$1" name="$2" log="$3"
  for _ in $(seq 1 60); do
    if curl -s -o /dev/null -m 2 "$url"; then
      echo "  - $name ready"
      return 0
    fi
    sleep 1
  done
  echo "error: $name did not come up in time — check $log" >&2
  exit 1
}

echo "Waiting for services to come up…"
wait_for "http://127.0.0.1:$FIRESTORE_PORT" "Firestore emulator" "$LOG_DIR/firestore.log"
wait_for "http://127.0.0.1:$BACKEND_PORT/health" "backend" "$LOG_DIR/backend.log"
wait_for "http://localhost:$FRONTEND_PORT" "frontend" "$LOG_DIR/frontend.log"

cat <<EOF

All services running:
  Frontend            http://localhost:$FRONTEND_PORT
  Backend             http://127.0.0.1:$BACKEND_PORT
  Firestore emulator  http://127.0.0.1:$FIRESTORE_PORT  (UI: http://127.0.0.1:$FIRESTORE_UI_PORT)

Logs: $LOG_DIR/{firestore,backend,frontend}.log
Press Ctrl+C to stop everything.
EOF

wait
