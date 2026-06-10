# PLAN — chess-tutor (spec: autodev/SPEC.md)
PM writes; orchestrator ticks boxes + edits FUTURE milestones only; changelog append-only.
Format: `- [ ] M<n> — <title>` + indented `goal:` / `accept:` (runnable commands) / optional `landmines:`.

Truth hierarchy: merged PRs → git → these checkboxes → STATE.md. M0 is the oracle; every
milestone ends gate-green and extends the gate. accept: commands run from the repo root.

## Milestones

- [ ] M0 — Oracle + rules core (FEN, legal move generation, perft)
    goal: Land the real `autodev/gate.sh` AND the UI-independent rules core that satisfies AC-1.
      NEW files (weak model, GREEN): `src/core/chess.js` (one self-contained ES module) and
      `test/perft.test.js` and `autodev/smoke/core-smoke.mjs`. EDITS (strong model, RED):
      replace the placeholder `autodev/gate.sh` with the real deterministic gate.
      `src/core/chess.js` exports: `parseFen(fen)->state`, `toFen(state)->fen`,
      `generateMoves(state)->move[]` (FULLY LEGAL — king never left in check),
      `applyMove(state, move)->newState` (immutable), `perft(state, depth)->number`.
    accept:
      - node --test test/perft.test.js          # startpos 20/400/8902 ; Kiwipete 48/2039 ; FEN round-trip
      - node autodev/smoke/core-smoke.mjs        # imports the ESM core, prints "CORE SMOKE OK", exit 0
      - bash autodev/probes/secret-leak.sh --repo . --base "${GATE_BASE:-origin/main}"
      - bash autodev/gate.sh                     # exit 0 ; writes .autodev/gate-green unless phase==implement
      - INVERSION PROOF: temporarily change the expected startpos depth-1 count in the smoke/test from
        20 to 21, run `bash autodev/gate.sh`, confirm it exits NON-zero and prints `GATE FAIL step=...`,
        then revert. Record the observed failing exit code in the PR body.
    landmines:
      - MUST: `generateMoves` returns only LEGAL moves (generate pseudo-legal, then drop any move that
        leaves your own king attacked). Perft numbers are wrong by a lot if illegal moves leak through.
      - MUST: exact constants. startpos FEN `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`
        → perft 1=20, 2=400, 3=8902. Kiwipete FEN
        `r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1` → perft 1=48, 2=2039.
      - MUST: `parseFen` defaults a missing halfmove/fullmove field to `0` / `1` (Kiwipete is often
        written with the trailing `- 0 1` omitted; tests may pass either form).
      - MUST: public move object shape is exactly `{ from, to, promotion? }` — `from`/`to` are algebraic
        strings like `'e2'`; `promotion` ∈ `{'q','r','b','n'}` only when a pawn reaches the last rank,
        otherwise the property is absent. Generate FOUR promotion moves (q,r,b,n) per promoting push/capture.
      - MUST: castling — king moves two squares; only with the right in FEN; squares between king and rook
        empty; king is not currently in check, does not pass THROUGH an attacked square, and does not land
        on an attacked square. King/rook moves and rook captures clear the relevant castling rights.
      - MUST: en passant — only immediately after the opponent's two-square pawn advance; the en-passant
        target square comes from FEN; the captured pawn sits on the square the moving pawn passed over
        (NOT the destination square).
      - MUST: `applyMove` is pure (returns a NEW state; never mutates its argument) — perft relies on this.
      - MUST: `autodev/gate.sh` — `cd` to repo root; run steps in order; on any step failure print exactly
        `GATE FAIL step=<name>` as the LAST line and `exit 1`; on success write
        `git rev-parse HEAD > .autodev/gate-green` UNLESS `.autodev/phase` reads `implement`, then `exit 0`.
        Steps in M0: `secrets` (runs `autodev/probes/secret-leak.sh`), `perft` (runs the perft test),
        `core-smoke` (runs the node smoke). Keep each step a one-line `run`-style call so later milestones
        add a step with a single surgical diff. ≤10 min, localhost only, no network beyond the probe's base ref.
      - MUST-NOT: import anything outside the Node/browser standard runtime. Zero npm dependencies. No
        Date.now()/Math.random() in `chess.js` (engines own randomness later).

- [ ] M1 — Game wrapper: SAN, status, undo
    goal: NEW files (weak model, GREEN): `src/core/game.js` (a `Game` class/factory wrapping the core),
      `src/core/san.js` (move → SAN string), `test/san.test.js`, `test/status.test.js`. EDIT (strong, RED):
      add a `core-api` step to `autodev/gate.sh`. `Game` exposes: `legalMoves()`, `move(m)` (apply +
      record history + SAN), `undo()` (pop last applied move, restoring prior state), `history()` (SAN
      strings in order), `status()` → `ongoing | check | checkmate | stalemate | draw-50move`, `fen()`.
    accept:
      - node --test test/san.test.js             # known positions → exact SAN incl x, +, #, O-O, O-O-O, =Q, disambiguation
      - node --test test/status.test.js          # checkmate (e.g. fool's mate), stalemate, 50-move, ongoing/check
      - bash autodev/gate.sh                      # green, now includes the core-api step
      - INVERSION PROOF: break one expected SAN string in test, confirm gate exits non-zero with
        `GATE FAIL step=core-api`, then revert.
    landmines:
      - MUST: SAN correctness — captures use `x`; pawn captures include the file of origin (`exd5`);
        checks append `+`, checkmate appends `#` (mate wins over `+`); castling is `O-O` (kingside) /
        `O-O-O` (queenside); promotion appends `=Q`/`=R`/`=B`/`=N`; disambiguate by file, else rank, else
        both when two same-type pieces can reach the same square.
      - MUST: `undo()` restores the EXACT prior state (board, side to move, castling rights, en-passant
        target, halfmove clock). Simplest correct approach: keep a stack of prior immutable states.
      - MUST: `status()` returns `checkmate` when side-to-move has no legal moves AND is in check;
        `stalemate` when no legal moves AND not in check; `draw-50move` when the halfmove clock ≥ 100
        (plies); `check` when in check with legal moves; else `ongoing`. Checkmate/stalemate take
        precedence over the 50-move check.
      - MUST: build only on `src/core/chess.js`'s public API (D3 move shape). Zero npm deps.

- [ ] M2 — Engine interface + RandomEngine + SimpleAI + contract + full-game smoke
    goal: NEW files (weak model, GREEN): `src/engine/engine.js` (documents the contract + a tiny
      `isLegalMove` helper or shared validator), `src/engine/random-engine.js` (`RandomEngine`),
      `src/engine/simple-ai.js` (`SimpleAI`), `test/engine-contract.test.js`,
      `autodev/smoke/full-game.mjs`. EDIT (strong, RED): add `engine-contract` and `full-game` steps to
      `autodev/gate.sh`. Contract: `{ name: string, async bestMove(game) -> move }` returning a move from
      `game.legalMoves()`.
    accept:
      - node --test test/engine-contract.test.js  # BOTH engines over fixed positions; every bestMove ∈ legalMoves
      - node autodev/smoke/full-game.mjs          # RandomEngine vs SimpleAI to game end or 200-ply cap; every move validated legal; prints result; exit 0
      - bash autodev/gate.sh                       # green, now includes engine-contract + full-game steps
      - INVERSION PROOF: make `full-game.mjs` apply a deliberately illegal move once, confirm it exits
        non-zero and the gate prints `GATE FAIL step=full-game`, then revert.
    landmines:
      - MUST: `RandomEngine.bestMove` picks uniformly at random from `game.legalMoves()`; returns a valid
        move object (D3 shape) and never mutates the game.
      - MUST: `SimpleAI.bestMove` is minimax/negamax to depth ≥ 2 with evaluation = material (standard
        piece values P1 N3 B3 R5 Q9, king effectively infinite) + a mobility term (e.g. legal-move count
        difference). Returns the move maximizing the side-to-move's score. Deterministic given a position
        is fine (tie-break by first encountered).
      - MUST: `full-game.mjs` loops: for the side to move, call the assigned engine's `bestMove`, ASSERT
        the returned move is in `game.legalMoves()` (exit 1 if not), apply it, check `status()`; stop on
        a terminal status or after 200 plies; print the final status and exit 0.
      - MUST: engines depend ONLY on the public `Game`/core API. Randomness lives in the engine, seeded or
        unseeded is fine, but the contract test must not depend on a particular random choice — only on legality.
      - MUST-NOT: introduce npm deps or a search depth that blows the 10-minute gate budget (depth 2 is fine).

- [ ] M3 — Browser UI: interactive board, click-to-move, engine reply, engine switch
    goal: NEW files (weak model, GREEN): `index.html` (board mount `id="board"`, an engine-select control
      `id="engine"`, links the ES modules), `src/ui/board.js` (render board + pieces, highlight legal
      destinations), `src/ui/app.js` (controller: click piece → highlight → click target → apply human move
      → active engine replies → detect & display game-over → switch engine), `src/ui/styles.css`. NEW file:
      `autodev/smoke/serve-smoke.sh` (find a free port, `python3 -m http.server`, curl, tear down). EDIT
      (strong, RED): add a `static-serve` step to `autodev/gate.sh`.
    accept:
      - bash autodev/smoke/serve-smoke.sh          # HTTP 200 for / containing id="board" AND id="engine"; 200 for every module/script referenced by index.html; exit 0
      - bash autodev/gate.sh                        # green, now includes the static-serve step
      - INVERSION PROOF: rename the board mount to `id="board-x"` in index.html, confirm serve-smoke /
        gate exits non-zero with `GATE FAIL step=static-serve`, then revert.
    landmines:
      - MUST: `index.html` mounts the board under `id="board"` and an engine selector under `id="engine"`
        offering RandomEngine and SimpleAI; it loads the app as `<script type="module" src="...">`.
      - MUST: `serve-smoke.sh` — pick a FREE localhost port (don't hard-code a busy one), start
        `python3 -m http.server <port>` from repo root in the background, `curl -fsS` `/` and assert it
        contains `id="board"` and `id="engine"`, then parse every `src="..."` referenced by index.html and
        `curl -fsS` each expecting 200; ALWAYS kill the server in a trap; exit non-zero on any miss.
      - MUST: UI imports the SAME core/engine ES modules used by the tests — no logic forked into the UI.
      - MUST: legal-destination highlighting comes from `game.legalMoves()` filtered by the clicked square.
      - MUST-NOT: any framework, bundler, or npm dependency; no remote asset fetches (localhost/static only).

- [ ] M4 — Teaching aids in the UI: hint, SAN move list, undo
    goal: EDITS (strong model, RED — touches existing UI): wire a hint button (`id="hint"`), a SAN
      move-history panel (`id="moves"`), and an undo button (`id="undo"`) into `index.html` /
      `src/ui/app.js` (+ small `src/ui/teaching.js` if helpful, NEW = weak model). EDIT (strong, RED):
      extend the `static-serve` step (or add a `teaching-serve` step) in `autodev/gate.sh` to assert the
      teaching markers are served.
    accept:
      - bash autodev/smoke/serve-smoke.sh           # now also asserts served / contains id="hint", id="moves", id="undo"
      - bash autodev/gate.sh                         # green; static-serve/teaching step now checks teaching markers
      - INVERSION PROOF: remove `id="hint"` from index.html, confirm the serve smoke / gate exits non-zero
        with the matching `GATE FAIL step=...`, then revert.
    landmines:
      - MUST: hint button calls the ACTIVE engine's `bestMove` for the human's side and surfaces the
        suggested move (e.g. highlight from→to and/or show its SAN) WITHOUT applying it.
      - MUST: the move list renders `game.history()` SAN strings in order, updating after every applied move.
      - MUST: undo removes the last HUMAN move AND the AI reply (two `game.undo()` calls when an AI reply
        exists), keeping board, move list, and status in sync.
      - MUST: serve-smoke assertions for `id="hint"`, `id="moves"`, `id="undo"` are added to the SAME
        free-port serve harness from M3 (don't fork a second server).
      - MUST-NOT: add npm deps; don't fork core/SAN logic into the UI — reuse `src/core` and `src/engine`.

## Backlog (review nice-to-haves + parked ideas; triaged every plan-refresh)
- Threefold-repetition detection (status enum would gain `draw-repetition`).
- PGN import/export.
- Mobile-responsive board layout.
- Optional: seedable RNG for RandomEngine to make full-game smoke fully reproducible.

## Plan changelog (append-only)
- v1: greenfield plan from operator interview — M0 oracle+rules(perft), M1 game/SAN/status/undo,
  M2 engines+contract+full-game smoke, M3 browser UI+static-serve smoke, M4 teaching aids.
