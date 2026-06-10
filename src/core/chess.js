function algToSq(alg) {
  const file = alg.charCodeAt(0) - 97;
  const rank = parseInt(alg[1], 10) - 1;
  return rank * 8 + file;
}

function sqToAlg(idx) {
  const file = idx % 8;
  const rank = Math.floor(idx / 8);
  return String.fromCharCode(97 + file) + (rank + 1);
}

function isSquareAttacked(sq, board, attacker) {
  const isEnemy = (p) => p && (attacker === 'w' ? p === p.toUpperCase() : p === p.toLowerCase());

  // Knights
  const knightOffsets = [-17, -15, -10, -6, 6, 10, 15, 17];
  for (const off of knightOffsets) {
    const n = sq + off;
    if (n >= 0 && n < 64 && Math.abs((n % 8) - (sq % 8)) <= 2 && isEnemy(board[n]) && (board[n] === 'N' || board[n] === 'n')) return true;
  }
  // Kings
  const kingOffsets = [-9, -8, -7, -1, 1, 7, 8, 9];
  for (const off of kingOffsets) {
    const n = sq + off;
    if (n >= 0 && n < 64 && Math.abs((n % 8) - (sq % 8)) <= 1 && isEnemy(board[n]) && (board[n] === 'K' || board[n] === 'k')) return true;
  }
  // Pawns
  const pawnDir = attacker === 'w' ? -1 : 1;
  const pawnChar = attacker === 'w' ? 'P' : 'p';
  const p1 = sq + pawnDir * 8 - 1;
  const p2 = sq + pawnDir * 8 + 1;
  if (p1 >= 0 && p1 < 64 && Math.abs((p1 % 8) - (sq % 8)) === 1 && board[p1] === pawnChar) return true;
  if (p2 >= 0 && p2 < 64 && Math.abs((p2 % 8) - (sq % 8)) === 1 && board[p2] === pawnChar) return true;
  // Sliding
  const dirs = [-9, -8, -7, -1, 1, 7, 8, 9];
  for (const d of dirs) {
    let cur = sq + d;
    while (cur >= 0 && cur < 64) {
      if (Math.abs((cur % 8) - ((cur - d) % 8)) > 1) break;
      const p = board[cur];
      if (p) {
        if (isEnemy(p)) {
          const isDiag = Math.abs(d) === 7 || Math.abs(d) === 9;
          const isOrth = Math.abs(d) === 1 || Math.abs(d) === 8;
          if ((isDiag && (p === 'B' || p === 'Q' || p === 'b' || p === 'q')) ||
              (isOrth && (p === 'R' || p === 'Q' || p === 'r' || p === 'q'))) {
            return true;
          }
        }
        break;
      }
      cur += d;
    }
  }
  return false;
}

function addPawnMoves(to, from, promoRank, moves, side) {
  const toRank = Math.floor(to / 8);
  if (toRank === promoRank) {
    for (const prom of ['q', 'r', 'b', 'n']) {
      moves.push({ from: sqToAlg(from), to: sqToAlg(to), promotion: prom });
    }
  } else {
    moves.push({ from: sqToAlg(from), to: sqToAlg(to) });
  }
}

function isMoveLegal(state, move) {
  const from = algToSq(move.from);
  const to = algToSq(move.to);
  const piece = state.board[from];
  const opponent = state.side === 'w' ? 'b' : 'w';

  // Castling specific checks
  if (piece === 'K' || piece === 'k') {
    if (Math.abs(to - from) === 2) {
      if (isSquareAttacked(from, state.board, opponent)) return false;
      const mid = (from + to) / 2;
      if (isSquareAttacked(mid, state.board, opponent)) return false;
    }
  }

  // Simulate move on copy
  const board = [...state.board];
  if ((piece === 'P' || piece === 'p') && state.ep && to === algToSq(state.ep)) {
    const capturedIdx = (from >> 3) * 8 + (to & 7);
    board[capturedIdx] = null;
  }
  board[to] = piece;
  board[from] = null;
  if ((piece === 'K' || piece === 'k') && Math.abs(to - from) === 2) {
    if (to === 6) { board[5] = board[7]; board[7] = null; }
    else if (to === 2) { board[3] = board[0]; board[0] = null; }
    else if (to === 62) { board[61] = board[63]; board[63] = null; }
    else if (to === 58) { board[59] = board[56]; board[56] = null; }
  }

  const kingChar = state.side === 'w' ? 'K' : 'k';
  let kingSq = -1;
  for (let i = 0; i < 64; i++) {
    if (board[i] === kingChar) { kingSq = i; break; }
  }
  return !isSquareAttacked(kingSq, board, opponent);
}

export function parseFen(fen) {
  const parts = fen.trim().split(/\s+/);
  const placement = parts[0] || '8/8/8/8/8/8/8/8';
  const side = parts[1] || 'w';
  const castlingStr = parts[2] || '-';
  const epStr = parts[3] || '-';
  const halfmove = parts[4] !== undefined ? parseInt(parts[4], 10) : 0;
  const fullmove = parts[5] !== undefined ? parseInt(parts[5], 10) : 1;

  const board = new Array(64).fill(null);
  const rows = placement.split('/');
  for (let rr = 0; rr < rows.length; rr++) {
    let idx = (7 - rr) * 8;
    for (const char of rows[rr]) {
      if (char >= '1' && char <= '8') {
        idx += parseInt(char, 10);
      } else {
        board[idx++] = char;
      }
    }
  }

  const castling = { K: false, Q: false, k: false, q: false };
  if (castlingStr !== '-') {
    for (const c of castlingStr) {
      if (c === 'K' || c === 'Q' || c === 'k' || c === 'q') castling[c] = true;
    }
  }

  const ep = epStr !== '-' ? epStr : null;

  return { board, side, castling, ep, halfmove, fullmove };
}

export function toFen(state) {
  let fen = '';
  for (let r = 7; r >= 0; r--) {
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = state.board[r * 8 + f];
      if (p === null) {
        empty++;
      } else {
        if (empty > 0) { fen += empty; empty = 0; }
        fen += p;
      }
    }
    if (empty > 0) fen += empty;
    if (r > 0) fen += '/';
  }
  fen += ' ' + state.side;
  let c = '';
  if (state.castling.K) c += 'K';
  if (state.castling.Q) c += 'Q';
  if (state.castling.k) c += 'k';
  if (state.castling.q) c += 'q';
  fen += ' ' + (c || '-');
  fen += ' ' + (state.ep || '-');
  fen += ' ' + state.halfmove + ' ' + state.fullmove;
  return fen;
}

export function generateMoves(state) {
  const moves = [];
  const side = state.side;
  const isOwn = (p) => p && (side === 'w' ? p === p.toUpperCase() : p === p.toLowerCase());
  const isEnemy = (p) => p && (side === 'w' ? p === p.toLowerCase() : p === p.toUpperCase());

  for (let from = 0; from < 64; from++) {
    const piece = state.board[from];
    if (!isOwn(piece)) continue;

    const file = from % 8;
    const rank = Math.floor(from / 8);

    if (piece === 'P' || piece === 'p') {
      const dir = piece === 'P' ? 1 : -1;
      const startRank = piece === 'P' ? 1 : 6;
      const promoRank = piece === 'P' ? 7 : 0;
      const push = from + dir * 8;
      const push2 = from + dir * 16;

      if (state.board[push] === null) {
        if (rank === startRank && state.board[push2] === null) {
          addPawnMoves(push2, from, promoRank, moves, side);
        }
        addPawnMoves(push, from, promoRank, moves, side);
      }
      for (const capDir of [-1, 1]) {
        const cap = push + capDir;
        const capFile = cap % 8;
        if (Math.abs(capFile - file) === 1) {
          const target = state.board[cap];
          const isEp = state.ep && cap === algToSq(state.ep);
          if (isEnemy(target) || isEp) {
            addPawnMoves(cap, from, promoRank, moves, side);
          }
        }
      }
      continue;
    }

    if (piece === 'N' || piece === 'n') {
      const offsets = [-17, -15, -10, -6, 6, 10, 15, 17];
      for (const off of offsets) {
        const to = from + off;
        if (to >= 0 && to < 64 && Math.abs((to % 8) - file) <= 2) {
          if (!isOwn(state.board[to])) moves.push({ from: sqToAlg(from), to: sqToAlg(to) });
        }
      }
      continue;
    }

    if ('BRQ'.includes(piece.toUpperCase())) {
      const pu = piece.toUpperCase();
      const dArr = pu === 'B' ? [-9, -7, 7, 9] : pu === 'R' ? [-8, -1, 1, 8] : [-9, -8, -7, -1, 1, 7, 8, 9];
      for (const d of dArr) {
        let cur = from + d;
        while (cur >= 0 && cur < 64 && Math.abs((cur % 8) - ((cur - d) % 8)) <= 1) {
          if (state.board[cur] === null) {
            moves.push({ from: sqToAlg(from), to: sqToAlg(cur) });
          } else {
            if (!isOwn(state.board[cur])) moves.push({ from: sqToAlg(from), to: sqToAlg(cur) });
            break;
          }
          cur += d;
        }
      }
      continue;
    }

    if (piece === 'K' || piece === 'k') {
      const offsets = [-9, -8, -7, -1, 1, 7, 8, 9];
      for (const off of offsets) {
        const to = from + off;
        if (to >= 0 && to < 64 && Math.abs((to % 8) - file) <= 1) {
          if (!isOwn(state.board[to])) moves.push({ from: sqToAlg(from), to: sqToAlg(to) });
        }
      }
      if (side === 'w' && from === 4) {
        if (state.castling.K && state.board[5] === null && state.board[6] === null) moves.push({ from: 'e1', to: 'g1' });
        if (state.castling.Q && state.board[3] === null && state.board[2] === null && state.board[1] === null) moves.push({ from: 'e1', to: 'c1' });
      }
      if (side === 'b' && from === 60) {
        if (state.castling.k && state.board[61] === null && state.board[62] === null) moves.push({ from: 'e8', to: 'g8' });
        if (state.castling.q && state.board[59] === null && state.board[58] === null && state.board[57] === null) moves.push({ from: 'e8', to: 'c8' });
      }
    }
  }

  return moves.filter(m => isMoveLegal(state, m));
}

export function applyMove(state, move) {
  const newState = {
    board: [...state.board],
    side: state.side === 'w' ? 'b' : 'w',
    castling: { ...state.castling },
    ep: state.ep,
    halfmove: state.halfmove,
    fullmove: state.fullmove
  };

  const from = algToSq(move.from);
  const to = algToSq(move.to);
  const piece = newState.board[from];
  const captured = newState.board[to];
  const isPawn = piece === 'P' || piece === 'p';
  const isCapture = captured !== null;

  let epCapture = false;
  if (isPawn && state.ep && to === algToSq(state.ep)) {
    const capturedIdx = (from >> 3) * 8 + (to & 7);
    newState.board[capturedIdx] = null;
    epCapture = true;
  }

  if (move.promotion) {
    const color = state.side;
    newState.board[to] = color === 'w' ? move.promotion.toUpperCase() : move.promotion.toLowerCase();
  } else {
    newState.board[to] = piece;
  }
  newState.board[from] = null;

  if (piece === 'K' || piece === 'k') {
    if (Math.abs(to - from) === 2) {
      if (to === 6) { newState.board[5] = newState.board[7]; newState.board[7] = null; }
      else if (to === 2) { newState.board[3] = newState.board[0]; newState.board[0] = null; }
      else if (to === 62) { newState.board[61] = newState.board[63]; newState.board[63] = null; }
      else if (to === 58) { newState.board[59] = newState.board[56]; newState.board[56] = null; }
    }
  }

  if (piece === 'K') { newState.castling.K = false; newState.castling.Q = false; }
  if (piece === 'k') { newState.castling.k = false; newState.castling.q = false; }
  if (from === 0) newState.castling.Q = false;
  if (from === 7) newState.castling.K = false;
  if (from === 56) newState.castling.q = false;
  if (from === 63) newState.castling.k = false;
  if (to === 0) newState.castling.q = false;
  if (to === 7) newState.castling.k = false;
  if (to === 56) newState.castling.Q = false;
  if (to === 63) newState.castling.K = false;

  newState.ep = null;
  if (isPawn && Math.abs(to - from) === 16) {
    newState.ep = sqToAlg((from + to) / 2);
  }

  const resetClock = isPawn || isCapture || epCapture;
  newState.halfmove = resetClock ? 0 : state.halfmove + 1;
  newState.fullmove = state.side === 'b' ? state.fullmove + 1 : state.fullmove;

  return newState;
}

export function perft(state, depth) {
  if (depth === 0) return 1;
  let count = 0;
  const moves = generateMoves(state);
  for (const m of moves) {
    count += perft(applyMove(state, m), depth - 1);
  }
  return count;
}
