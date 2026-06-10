/**
 * ENGINE CONTRACT
 * ================
 * Every engine is an object/instance shaped `{ name: string, async bestMove(game) -> move }`.
 * bestMove receives a Game instance and returns a move object that is a MEMBER of game.legalMoves().
 * The move shape is exactly { from, to, promotion? } with from/to algebraic strings like 'e2'/'e4',
 * and promotion present ONLY for a pawn reaching the last rank.
 * bestMove MUST NOT leave the game mutated: any exploratory game.move() must be matched by a game.undo().
 */

export function isLegalMove(game, move) {
  return game.legalMoves().some(
    (c) =>
      c.from === move.from &&
      c.to === move.to &&
      (c.promotion || undefined) === (move.promotion || undefined)
  );
}
