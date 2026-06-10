# STATE — machine-maintained cache. If git/gh disagree with this file, git/gh win.
status: ready                # ready | BLOCKED
milestone: M3                # M3 — Browser UI: interactive board, click-to-move, engine reply, engine switch
attempts: 0                  # attempts at THIS milestone; 3 ⇒ BLOCKED
last_failure: none           # canonical signature "GATE FAIL step=<name>", or none
blocked_reason: none
last_session: M2 merged PR #9 (strong=claude-opus-4-8; weak=qwen3.6-27b GREEN-gen src/engine/{engine,random-engine,simple-ai}.js + test/engine-contract.test.js + autodev/smoke/full-game.mjs, 0 fix rounds, 0 strong repairs; gate grew engine-contract+full-game; review: Lane A+B+evaluator, 1 confirmed P1 deferred-to-backlog (frozen-oracle), 3 P2 backlogged)
last_gate: green @ M2 close-out (steps: secrets, integrity, perft, core-smoke, core-api, engine-contract 8/8, full-game → terminal status under 200 plies)
updated: 2026-06-10

## Notes (this milestone only; wiped at close-out)
- M3 adds the browser UI (weak, GREEN): index.html (board mount id="board", engine-select id="engine"),
  src/ui/{board.js,app.js,styles.css}, autodev/smoke/serve-smoke.sh. RED (strong): add a `static-serve`
  step to autodev/gate.sh. Build ONLY on the merged public APIs — no logic forked into the UI.
- Public surface to reuse: Game (legalMoves/move/undo/history/status/fen) from src/core/game.js;
  engines from src/engine/{random-engine.js (RandomEngine), simple-ai.js (SimpleAI)}, contract
  { name, async bestMove(game) -> move }. isLegalMove helper exists in src/engine/engine.js.
- serve-smoke MUST pick a FREE localhost port, python3 -m http.server, curl / (assert id="board" + id="engine"),
  curl every module referenced by index.html (expect 200), trap-kill the server, exit non-zero on any miss.
- Latent (Backlog): full-game smoke non-mutation hardening (M2 review P1, deferred — frozen-oracle); fold into
  M3 only if M3 legitimately re-authors autodev/smoke/full-game.mjs (it doesn't — M3 adds serve-smoke.sh).
- Latent (Backlog): canonical-EP toFen (M0), history() defensive copy (M1), SimpleAI mobility weight +
  unused isLegalMove export (M2).
