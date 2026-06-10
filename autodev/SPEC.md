# SPEC — chess-tutor   (v1)
Owned by /autodev-plan. FROZEN mid-run: contradiction ⇒ BLOCKED: spec-drift; revise only via /autodev-plan replan.

## Product
A browser-based chess app for learning and playing (国际象棋教学+对局). A human plays
against a built-in AI on an interactive board, with teaching aids: legal-move
highlighting, a hint button, a move list in standard algebraic notation (SAN), and undo.
Pure static front-end — vanilla ES modules + plain HTML/CSS, zero npm dependencies, no
build step, no backend, no accounts. The chess rules core and the engines are
UI-independent pure ES modules that import cleanly in both the browser and Node (≥20),
which is what makes every acceptance criterion machine-checkable.

## Acceptance criteria
Each AC is checkable in principle by `autodev/gate.sh` (exit-code verdict).

- **AC-1 — Complete legal move generation per FIDE rules.** Covers castling (incl. cannot
  castle out of / through / into check, empty squares between, castling rights), en
  passant, promotion (all four pieces), check, checkmate, stalemate, and the 50-move-rule
  field (halfmove clock parsed and surfaced). Verified by `node --test` perft counts:
  - startpos `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`: depth 1/2/3 = **20 / 400 / 8902**.
  - Kiwipete `r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -`: depth 1/2 = **48 / 2039**.
    (The FEN parser MUST default a missing halfmove/fullmove field to `0 1`.)
  - FEN round-trips: `toFen(parseFen(fen)) === fen` for both positions (with counters normalized).

- **AC-2 — Game API: SAN, game-over status, undo.** A `Game` wrapper over the core exposes:
  move history rendered in correct SAN (incl. captures `x`, checks `+`, mate `#`, castling
  `O-O`/`O-O-O`, promotion `=Q`, and disambiguation); a status query returning one of
  `ongoing | check | checkmate | stalemate | draw-50move`; and `undo()` that pops the last
  applied move. Verified by `node --test` unit tests over fixed positions with known SAN
  strings and known terminal statuses.

- **AC-3 — Pluggable engine interface + two engines + contract test.** A documented contract
  `{ name: string, async bestMove(game) -> move }` such that stronger external engines can be
  plugged in later. Ships exactly TWO built-in implementations: `RandomEngine` (uniform random
  legal move) and `SimpleAI` (negamax/minimax, depth ≥ 2, evaluation = material + mobility). A
  contract test runs BOTH engines over a fixed set of positions and asserts every returned move
  is a member of the position's legal move list. Verified by `node --test`.

- **AC-4 — Headless full-game smoke.** `RandomEngine` vs `SimpleAI` from the start position
  plays to game end (checkmate / stalemate / draw) or a 200-ply cap, with EVERY move validated
  legal (present in the legal move list before it is applied); exits 0. Run under plain `node`.

- **AC-5 — Playable in the browser.** Static `index.html` mounts an interactive board
  (`id="board"`). Click a piece → its legal destinations highlight → click a destination to
  move → the active engine replies. Game-over (checkmate / stalemate / draw) is detected and
  displayed. The UI can switch the active engine between RandomEngine and SimpleAI. Machine-checkable
  bound: a static-serve smoke (`python3 -m http.server` on a free localhost port) returns HTTP 200
  for `/` containing the `id="board"` mount marker and the engine-switch control marker, and 200
  for every `<script src>` / module referenced by `index.html`.

- **AC-6 — Teaching aids in the UI.** A hint button (shows the engine's suggested move for the
  human), a move-history panel in SAN, and an undo button (removes the last human move and the AI
  reply). Machine-checkable bound: the served `index.html` exposes the teaching-aid control markers
  (`id="hint"`, `id="undo"`, `id="moves"`); the underlying SAN/undo logic is unit-tested under AC-2.

- **AC-7 — Standing secret-leak probe.** `bash autodev/probes/secret-leak.sh` reports clean over
  the diff on every gate run (always-on, must-zero).

## Non-goals
Multiplayer / networking; accounts or server-side persistence; chess clocks; engine
strength / ELO targets; opening books or endgame tablebases; threefold-repetition detection
(backlog); PGN import/export (backlog); mobile-specific UI; any framework, build step, or npm
dependency; headless-browser (DOM) testing of the UI — UI is bounded by static-serve marker
checks plus unit-tested core logic.

## Decisions (append-only)
- D1: Stack = vanilla ES modules (`.js` / `.mjs`), plain HTML/CSS, zero npm deps. Tests via
  Node built-in `node --test` (Node ≥ 20). Static serving via `python3 -m http.server`.
- D2: Core is representation-agnostic at its boundary. The public contract that tests pin is
  FEN in/out and the move-object shape — NOT the internal board encoding. This lets the perft
  oracle validate move generation regardless of internal representation.
- D3: Public move object shape: `{ from, to, promotion? }` where `from`/`to` are algebraic
  square strings (e.g. `'e2'`, `'e4'`) and `promotion` is one of `'q' | 'r' | 'b' | 'n'` when a
  pawn promotes, else omitted. Special-move semantics (castle / en passant / capture) are
  derived from board state at apply time, so the move object stays minimal. Engines return, and
  the contract test validates against, this shape.
- D4: `applyMove(state, move)` is immutable (returns a new state); this is simple for the weak
  model and fast enough — the deepest perft node count (8902) and the full-game smoke (≤200 ply,
  depth-2 minimax) both run in well under the 10-minute gate budget.
- D5: Game status enum = `ongoing | check | checkmate | stalemate | draw-50move`. Threefold
  repetition is out of scope (backlog), so the only draw the status reports is the 50-move rule.
- D6: UI is not DOM-unit-tested (no npm = no headless browser). AC-5/AC-6 are bounded by a
  static-serve smoke asserting HTTP 200 + required element markers; all decision logic the UI
  invokes (legal moves, SAN, undo, status, engine bestMove) is unit-tested headlessly in the core.
- D7: Gate base ref for the secret probe is `${GATE_BASE:-origin/main}`; when no remote/base
  exists (day-0, no GitHub remote configured), the probe falls back to scanning tracked files, so
  the gate is never silently absent.
- D8: Source layout — `src/core/` (rules + game), `src/engine/` (interface + two engines),
  `src/ui/` (board render + app controller + styles), `index.html` at repo root; tests in
  `test/`; headless smokes in `autodev/smoke/`.

## Revision log
- v1: initial spec from operator interview (greenfield `new`).
