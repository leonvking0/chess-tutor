function evaluate(game) {
  const parts = game.fen().split(' ');
  const placement = parts[0];
  const stm = parts[1];

  const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let whiteMat = 0;
  let blackMat = 0;

  for (const ch of placement) {
    if (ch === '/' || /\d/.test(ch)) continue;
    const val = values[ch.toLowerCase()] || 0;
    if (ch === ch.toUpperCase()) {
      whiteMat += val;
    } else {
      blackMat += val;
    }
  }

  const materialFromStm = stm === 'w' ? (whiteMat - blackMat) : (blackMat - whiteMat);
  const mobility = game.legalMoves().length * 0.1;

  return materialFromStm + mobility;
}

function negamax(game, depth) {
  const moves = game.legalMoves();
  if (moves.length === 0) {
    const s = game.status();
    return s === 'checkmate' ? -100000 : 0;
  }
  if (depth === 0) return evaluate(game);

  let best = -Infinity;
  for (const m of moves) {
    game.move(m);
    const score = -negamax(game, depth - 1);
    game.undo();
    if (score > best) best = score;
  }
  return best;
}

export class SimpleAI {
  constructor() {
    this.name = 'SimpleAI';
  }

  async bestMove(game) {
    const moves = game.legalMoves();
    let best = -Infinity;
    let bestMove = moves[0];
    for (const m of moves) {
      game.move(m);
      const score = -negamax(game, 1);
      game.undo();
      if (score > best) {
        best = score;
        bestMove = m;
      }
    }
    return bestMove;
  }
}
