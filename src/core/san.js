import { generateMoves } from './chess.js';

function algToSq(alg) {
  const file = alg.charCodeAt(0) - 97;
  const rank = parseInt(alg[1], 10) - 1;
  return rank * 8 + file;
}

function fileOf(alg) {
  return alg[0];
}

function rankOf(alg) {
  return alg[1];
}

export function toSan(state, move) {
  const fromIdx = algToSq(move.from);
  const piece = state.board[fromIdx];
  const pieceUpper = piece.toUpperCase();

  // 2. CASTLING
  if (pieceUpper === 'K' && Math.abs(move.to.charCodeAt(0) - move.from.charCodeAt(0)) === 2) {
    if (move.to.charCodeAt(0) === 103) return 'O-O';   // 'g'
    if (move.to.charCodeAt(0) === 99) return 'O-O-O';  // 'c'
  }

  // 3. PAWN moves
  if (pieceUpper === 'P') {
    const isCapture = move.from[0] !== move.to[0];
    let san = isCapture ? fileOf(move.from) + 'x' + move.to : move.to;
    if (move.promotion) {
      san += '=' + move.promotion.toUpperCase();
    }
    return san;
  }

  // 4. PIECE moves
  let san = pieceUpper;

  // Disambiguation: collect all from-squares that can legally move to move.to
  // with the same piece type.
  const allMoves = generateMoves(state);
  const sameTypeFromSquares = [];
  for (const m of allMoves) {
    if (m.to === move.to) {
      const mFromIdx = algToSq(m.from);
      const mPiece = state.board[mFromIdx];
      if (mPiece && mPiece.toUpperCase() === pieceUpper) {
        sameTypeFromSquares.push(m.from);
      }
    }
  }

  // If more than one source square can reach the destination, disambiguate
  if (sameTypeFromSquares.length > 1) {
    const rivals = sameTypeFromSquares.filter(f => f !== move.from);
    const sameFile = rivals.some(r => r[0] === move.from[0]);
    const sameRank = rivals.some(r => r[1] === move.from[1]);

    if (!sameFile) {
      san += fileOf(move.from);
    } else if (!sameRank) {
      san += rankOf(move.from);
    } else {
      san += move.from;
    }
  }

  // Capture
  const toIdx = algToSq(move.to);
  if (state.board[toIdx] !== null) {
    san += 'x';
  }

  // Destination
  san += move.to;

  return san;
}
