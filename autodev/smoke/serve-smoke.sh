#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

PORT="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1]); s.close()')"
if [[ -z "$PORT" ]] || ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
  echo "FAIL: invalid port"
  exit 1
fi

python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null; wait "$SERVER_PID" 2>/dev/null' EXIT

for i in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:$PORT/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done
if ! curl -fsS "http://127.0.0.1:$PORT/" >/dev/null 2>&1; then
  echo "FAIL: server did not become ready"
  exit 1
fi

BODY="$(curl -fsS "http://127.0.0.1:$PORT/")"
if [ $? -ne 0 ]; then echo "FAIL: cannot fetch /"; exit 1; fi

printf '%s' "$BODY" | grep -q 'id="board"' || { echo 'FAIL: missing id="board"'; exit 1; }
printf '%s' "$BODY" | grep -q 'id="engine"' || { echo 'FAIL: missing id="engine"'; exit 1; }

# AC-6 teaching aids: served / must expose the hint button, SAN move-history panel, and undo button.
printf '%s' "$BODY" | grep -q 'id="hint"' || { echo 'FAIL: missing id="hint"'; exit 1; }
printf '%s' "$BODY" | grep -q 'id="moves"' || { echo 'FAIL: missing id="moves"'; exit 1; }
printf '%s' "$BODY" | grep -q 'id="undo"' || { echo 'FAIL: missing id="undo"'; exit 1; }

SRCS="$(printf '%s' "$BODY" | grep -oE 'src="[^"]+"' | sed -E 's/^src="//; s/"$//')"
[ -n "$SRCS" ] || { echo 'FAIL: no src= modules referenced'; exit 1; }

while IFS= read -r src; do
  REL="${src#./}"
  REL="${REL#/}"
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/$REL")"
  [ "$CODE" = "200" ] || { echo "FAIL: $REL -> HTTP $CODE"; exit 1; }
done <<< "$SRCS"

echo 'SERVE SMOKE OK'
exit 0
