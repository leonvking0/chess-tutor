# PITFALLS — append-only. One entry per lesson; newest first. Never edit or delete entries.
# Written on: failed attempts, gate flakes, confirmed P0s, recurring review false-positives.
# Relevant entries are pasted VERBATIM into hybrid-dev task prompts.

## M2 (PR #9) — a review-confirmed HARDENING of a frozen oracle file can't land in-place mid-milestone
- The step=integrity probe freezes EVERY acceptance-test and smoke file (incl. autodev/smoke/*) at its first
  commit this milestone — it cannot tell strengthening from weakening; any post-authoring edit ⇒
  `GATE FAIL step=integrity`. So when adversarial review confirms a P1 that would EDIT such a file (here: add a
  pre-call fen snapshot + non-mutation assertion to full-game.mjs), patching it in-place turns the gate red.
- RESOLUTION (sanctioned by the review protocol): a confirmed P1 that can't be patched surgically →
  PLAN.md Backlog with the reason, review STILL clean. Land it only when a LATER milestone legitimately
  re-authors that file. Litmus for "safe to defer": the finding is defense-in-depth, NOT a live bug —
  here both shipped engines were verified non-mutating and the contract test already asserts per-engine
  non-mutation, so the smoke's missing guard could never actually fire against shipped code.
- Don't confuse this with M1's weakening case: that was DIRT rewriting tests to pass (discard it); this is a
  legitimate improvement blocked by the freeze (defer it). The freeze is intentionally blunt; respect it.

## M1 (PR #5) — frozen acceptance tests: distinguish a WEAKENED test from a genuinely BROKEN assertion
- RECOVERY: the milestone branch was found with committed red acceptance tests PLUS uncommitted dirt that
  had REWRITTEN those tests to pass — deleting both undo() round-trip tests and replacing the exact `Qh4#`
  mate assertion with a status-tolerant `'Ra8#'|'Ra8+'` check. That is the canonical "weaken tests to pass"
  failure mode. Correct move: discard the dirt (kept in stash, recoverable), keep the frozen committed tests,
  and regenerate ONLY the implementation (src/core/{san,game}.js) via the weak model. attempts NOT incremented
  (no gate/review cycle had completed; local-only branch = pre-attempt dirt, not a failed attempt).
- LEGITIMATE REPAIR ≠ weakening: the committed san.test.js compared `g.history()` to an array literal with
  `strictEqual` (Object.is / reference equality) — it can NEVER pass for any implementation (status.test.js
  already used `deepStrictEqual` for the same purpose). Fixing it to `deepStrictEqual` preserves the exact
  asserted value and is a valid strong-model surgical repair. Litmus: a weakening makes a passing impl of a
  DIFFERENT/wrong behavior also pass; a repair only makes a correct impl actually checkable.
- CHECK DETECTION with no exported attack helper: chess.js exports only {parseFen,toFen,generateMoves,
  applyMove,perft}. Reusable public-API trick (correct for this generator, which emits king-captures as
  pseudo-legal and filters only the mover's own-king safety): flip side-to-move, run generateMoves, return
  true iff any reply lands on the king's square. Verified vs fool's-mate/stalemate/check fixtures.

## M0 (PR #1) — weak-model chess move-gen: two recurring traps that leak illegal moves
Front-load these as MUST in any milestone touching move generation / board indexing (M1 SAN, M2 engines):
- BOARD ORIENTATION: FEN ranks are written rank 8 → rank 1, but a `0=a1` board index means FEN row `rr`
  maps to base index `(7-rr)*8`. The weak model's first pass flipped this vertically — all perft counts
  wrong. Pin the index convention (index 0 = a1) explicitly in the prompt.
- COLOR-AGNOSTIC PIECE DISPATCH: switching on the literal upper-case letter (`piece==='B'` / `piece==='R'`)
  never matches BLACK lowercase pieces, so black rooks/bishops fell through to the queen's all-8-directions
  branch and leaked ~426 illegal moves at Kiwipete depth 2. Always normalize with `piece.toUpperCase()` (or
  compare case-insensitively) before dispatching sliding-piece directions.
- Attack tests must guard by PIECE TYPE, not "any enemy piece on an attacking square" — a black pawn on h3 was
  falsely treated as attacking g1 and wrongly rejected white kingside castling. Knight/king/pawn attack checks
  need a type guard. (All three fixed in one hybrid-dev fix round; perft then exact.)

