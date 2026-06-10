import { parseFen, toFen, generateMoves, applyMove, perft } from '../../src/core/chess.js';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const start = parseFen(START);

if (toFen(start) !== START) {
  console.error('FAIL: toFen round-trip mismatch');
  process.exit(1);
}

const moves = generateMoves(start);
if (moves.length !== 20) {
  console.error(`FAIL: expected 20 moves, got ${moves.length}`);
  process.exit(1);
}

const move = moves[0];
const origSide = start.side;
const newState = applyMove(start, move);

if (newState === start) {
  console.error('FAIL: applyMove returned the same object');
  process.exit(1);
}

if (start.side !== origSide) {
  console.error('FAIL: applyMove mutated original side-to-move');
  process.exit(1);
}

if (perft(start, 2) !== 400) {
  console.error('FAIL: perft(2) !== 400');
  process.exit(1);
}

console.log('CORE SMOKE OK');
process.exit(0);
