#!/usr/bin/env bash
# autodev/gate.sh — deterministic gate. Exit 0 = pass.
# On fail: the last line printed is exactly "GATE FAIL step=<name>", then exit 1.
# On pass: write `git rev-parse HEAD > .autodev/gate-green` unless .autodev/phase == implement.
# Localhost only, no network beyond the secret-leak probe's base ref; <=10 min.
# Each step is a single one-line run-style invocation so later milestones append one step
# with a one-line surgical diff.
set -uo pipefail
cd "$(cd "$(dirname "$0")/.." && pwd)" || { echo "GATE FAIL step=chdir"; exit 1; }

run() { # run NAME CMD...  — on non-zero exit, last line is "GATE FAIL step=NAME" then exit 1
  local name="$1"; shift
  if ! "$@"; then echo "GATE FAIL step=${name}"; exit 1; fi
}

run secrets bash autodev/probes/secret-leak.sh --repo . --base "${GATE_BASE:-origin/main}"
run integrity bash autodev/probes/oracle-integrity.sh
run perft node --test test/perft.test.js
run core-smoke node autodev/smoke/core-smoke.mjs
run core-api node --test test/san.test.js test/status.test.js

if [ -f .autodev/phase ] && [ "$(tr -d '[:space:]' < .autodev/phase)" = "implement" ]; then
  exit 0
fi
git rev-parse HEAD > .autodev/gate-green
exit 0
