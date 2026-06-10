# STATE — machine-maintained cache. If git/gh disagree with this file, git/gh win.
status: ready                # ready | BLOCKED
milestone: M1                # M1 — Game wrapper: SAN, status, undo
attempts: 0                  # attempts at THIS milestone; 3 ⇒ BLOCKED
last_failure: none           # canonical signature "GATE FAIL step=<name>", or none
blocked_reason: none
last_session: M0 merged PR #1 (strong=claude-opus-4-8; weak=qwen3.6-27b GREEN-gen, 1 fix round; review-clean)
last_gate: green @ M0 close-out (steps: secrets, perft, core-smoke — perft 20/400/8902, Kiwipete 48/2039)
updated: 2026-06-10

## Notes (this milestone only; wiped at close-out)
- M1 builds on src/core/chess.js public API (move shape {from,to,promotion?}). NEW (weak): src/core/game.js,
  src/core/san.js, test/san.test.js, test/status.test.js. RED (strong): add a `core-api` step to autodev/gate.sh.
- gate.sh is now a real one-step-per-line gate; M1 adds the `core-api` step with a single surgical diff.
- Watch: `undo()` must restore EXACT prior state — simplest correct approach is a stack of prior immutable states.
- Latent from M0 (Backlog): toFen emits non-canonical EP on every double-push; fine for M0, may bite FEN-compare later.
