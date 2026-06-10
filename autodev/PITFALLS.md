# PITFALLS — append-only. One entry per lesson; newest first. Never edit or delete entries.
# Written on: failed attempts, gate flakes, confirmed P0s, recurring review false-positives.
# Relevant entries are pasted VERBATIM into hybrid-dev task prompts.

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

