import { parseFen, toFen, generateMoves, applyMove } from './chess.js';
import { toSan } from './san.js';

const STARTPOS = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function inCheck(state) {
  const kingChar = state.side === 'w' ? 'K' : 'k';
  const kingIdx = state.board.indexOf(kingChar);
  if (kingIdx === -1) return false;
  const kingAlg = String.fromCharCode(97 + (kingIdx % 8)) + (Math.floor(kingIdx / 8) + 1);
  const probe = { ...state, side: state.side === 'w' ? 'b' : 'w', ep: null };
  return generateMoves(probe).some(m => m.to === kingAlg);
}

export class Game {
  constructor(fen) {
    this._state = parseFen(fen || STARTPOS);
    this._history = [];
    this._past = [];
  }

  legalMoves() {
    return generateMoves(this._state);
  }

  fen() {
    return toFen(this._state);
  }

  history() {
    return this._history;
  }

  move(m) {
    const san = toSan(this._state, m);
    this._past.push(this._state);
    const next = applyMove(this._state, m);
    this._state = next;

    const opponentInCheck = inCheck(next);
    const opponentHasMoves = generateMoves(next).length > 0;
    let suffix = '';
    if (opponentInCheck && !opponentHasMoves) suffix = '#';
    else if (opponentInCheck) suffix = '+';

    const full = san + suffix;
    this._history.push(full);
    return full;
  }

  undo() {
    if (this._past.length === 0) return;
    this._state = this._past.pop();
    this._history.pop();
  }

  status() {
    const moves = generateMoves(this._state);
    const chk = inCheck(this._state);
    if (moves.length === 0) return chk ? 'checkmate' : 'stalemate';
    if (this._state.halfmove >= 100) return 'draw-50move';
    if (chk) return 'check';
    return 'ongoing';
  }
}
