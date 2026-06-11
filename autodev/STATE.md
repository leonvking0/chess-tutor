# STATE — machine-maintained cache. If git/gh disagree with this file, git/gh win.
status: ready                # ready | BLOCKED
milestone: M4                # M4 — Teaching aids in the UI: hint (id="hint"), SAN move list (id="moves"), undo (id="undo")
attempts: 0                  # attempts at THIS milestone; 3 ⇒ BLOCKED
last_failure: none           # canonical signature "GATE FAIL step=<name>", or none
blocked_reason: none
last_session: M3 merged PR #10 (strong=claude-opus-4-8; weak=qwen3.6-27b GREEN-gen index.html + src/ui/{board,app}.js + styles.css + autodev/smoke/serve-smoke.sh, 0 fix rounds; Opus authored test/ui-wiring.test.js + the gate static-serve & ui-wiring steps. Review: Lane A + Lane B (codex) + evaluator, 2 confirmed & patched — Lane-B P0 board.js empty-square render (click-to-move broken) + Lane-A P1 ui-wiring.test.js never gated; 3 P2 backlogged. 2 strong review repairs.)
last_gate: green @ M3 close-out (steps: secrets, integrity, perft, core-smoke, core-api, ui-wiring 15/15, engine-contract 8/8, full-game, static-serve → SERVE SMOKE OK)
updated: 2026-06-10

## Notes (this milestone only; wiped at close-out)
- M4 EDITS existing UI (strong, RED): wire hint button (id="hint"), SAN move-history panel (id="moves"),
  undo button (id="undo") into index.html / src/ui/app.js (+ optional NEW src/ui/teaching.js = weak/GREEN).
  EDIT (strong, RED): extend the static-serve step (or add teaching-serve) in autodev/gate.sh to assert the
  teaching markers are served.
- Reuse the M3 UI: src/ui/app.js controller already holds the Game + active engine + render loop; hint calls
  the ACTIVE engine's bestMove for the human side and surfaces it WITHOUT applying; move list renders
  game.history() SAN in order; undo removes the last HUMAN move AND the AI reply (two game.undo() when an AI
  reply exists), keeping board/list/status in sync. board.js renderBoard()/highlightSquares() are the hooks.
- serve-smoke.sh is a FROZEN oracle (added M3, byte-identical under integrity). M4 must ADD the teaching-marker
  assertions to the SAME free-port harness — but editing serve-smoke.sh trips step=integrity. So either (a) the
  gate teaching step curls the markers separately, or (b) M4 legitimately re-authors serve-smoke.sh on a fresh
  branch as the milestone's own new oracle (the integrity freeze is per-milestone-introducing-commit). Decide
  at S1/S2; don't try to patch the frozen smoke in place mid-milestone (see M2/M3 PITFALL).
- Latent (Backlog): full-game smoke non-mutation hardening (M2 P1, frozen-oracle); serve-smoke substring→element
  hardening + app.js input-lock + board square-color parity (M3 P2s); canonical-EP toFen (M0); SimpleAI mobility
  weight + history() defensive copy.
