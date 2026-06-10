# STATE — machine-maintained cache. If git/gh disagree with this file, git/gh win.
status: ready                # ready | BLOCKED
milestone: M2                # M2 — Engine interface + RandomEngine + SimpleAI + contract + full-game smoke
attempts: 0                  # attempts at THIS milestone; 3 ⇒ BLOCKED
last_failure: none           # canonical signature "GATE FAIL step=<name>", or none
blocked_reason: none
last_session: M1 merged PR #5 (strong=claude-opus-4-8; weak=qwen3.6-27b GREEN-gen src/core/{san,game}.js, 0 fix rounds; 1 strong test-assert repair; codex lane timed out, Lane A+evaluator clean)
last_gate: green @ M1 close-out (steps: secrets, perft, core-smoke, core-api — core-api 22/22: SAN 14, status+undo 8)
updated: 2026-06-10

## Notes (this milestone only; wiped at close-out)
- M2 adds src/engine/{engine.js,random-engine.js,simple-ai.js} (weak, GREEN), test/engine-contract.test.js,
  autodev/smoke/full-game.mjs; RED (strong): add `engine-contract` + `full-game` steps to autodev/gate.sh.
- Build on the M1 public Game API: legalMoves(), move(m), status(), fen(), history(), undo(). Contract:
  { name, async bestMove(game) -> move } returning a move from game.legalMoves().
- Check-detection pattern available (from M1 game.js): flip side, generateMoves, test if any reply lands on
  the king square — public-API only, no exported attack helper. Reuse if engines need in-check queries.
- Latent from M0 (Backlog): toFen emits non-canonical EP on every double-push; may bite FEN-compare later.
