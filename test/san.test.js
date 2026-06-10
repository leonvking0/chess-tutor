import { test } from 'node:test';
import { strictEqual } from 'node:assert/strict';
import { parseFen } from '../src/core/chess.js';
import { toSan } from '../src/core/san.js';
import { Game } from '../src/core/game.js';

// toSan renders SAN from the PRE-move state (no +/# suffix — that is the Game's job,
// computed from the post-move position). All fixtures below were verified against the
// real core (parseFen + generateMoves) before being committed.

const STARTPOS = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

test('plain piece move: Nf3', () => {
  const s = parseFen(STARTPOS);
  strictEqual(toSan(s, { from: 'g1', to: 'f3' }), 'Nf3');
});

test('non-capturing pawn push is just the destination: e4', () => {
  const s = parseFen(STARTPOS);
  strictEqual(toSan(s, { from: 'e2', to: 'e4' }), 'e4');
});

test('piece capture uses x: Nxe5', () => {
  const s = parseFen('rnbqkbnr/pppp1ppp/8/4p3/8/5N2/PPPPPPPP/RNBQKB1R w KQkq e6 0 2');
  strictEqual(toSan(s, { from: 'f3', to: 'e5' }), 'Nxe5');
});

test('pawn capture includes file of origin: exd5', () => {
  const s = parseFen('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2');
  strictEqual(toSan(s, { from: 'e4', to: 'd5' }), 'exd5');
});

test('kingside castling: O-O', () => {
  const s = parseFen('rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4');
  strictEqual(toSan(s, { from: 'e1', to: 'g1' }), 'O-O');
});

test('queenside castling: O-O-O', () => {
  const s = parseFen('r3kbnr/pppqpppp/2np4/8/8/2NP4/PPPQPPPP/R3KBNR w KQkq - 0 1');
  strictEqual(toSan(s, { from: 'e1', to: 'c1' }), 'O-O-O');
});

test('promotion appends =Q (uppercase): a8=Q', () => {
  const s = parseFen('8/P7/8/8/8/8/8/4k2K w - - 0 1');
  strictEqual(toSan(s, { from: 'a7', to: 'a8', promotion: 'q' }), 'a8=Q');
});

test('promotion to another piece: a8=N', () => {
  const s = parseFen('8/P7/8/8/8/8/8/4k2K w - - 0 1');
  strictEqual(toSan(s, { from: 'a7', to: 'a8', promotion: 'n' }), 'a8=N');
});

test('pawn capture-promotion: axb8=Q', () => {
  const s = parseFen('1r2k3/P7/8/8/8/8/8/4K3 w - - 0 1');
  strictEqual(toSan(s, { from: 'a7', to: 'b8', promotion: 'q' }), 'axb8=Q');
});

test('file disambiguation: Nbd2 and Nfd2 (knights b1 & f3 both reach d2)', () => {
  const s = parseFen('4k3/8/8/8/8/5N2/8/1N2K3 w - - 0 1');
  strictEqual(toSan(s, { from: 'b1', to: 'd2' }), 'Nbd2');
  strictEqual(toSan(s, { from: 'f3', to: 'd2' }), 'Nfd2');
});

test('rank disambiguation: R1a3 and R4a3 (rooks a1 & a4 share file a)', () => {
  const s = parseFen('4k3/8/8/8/R7/8/8/R3K3 w - - 0 1');
  strictEqual(toSan(s, { from: 'a1', to: 'a3' }), 'R1a3');
  strictEqual(toSan(s, { from: 'a4', to: 'a3' }), 'R4a3');
});

// The +/# suffix is appended by the Game from the post-move position.

test('Game appends + for a check-giving move: Bxf7+', () => {
  const g = new Game('4k3/5p2/8/8/2B5/8/8/4K3 w - - 0 1');
  strictEqual(g.move({ from: 'c4', to: 'f7' }), 'Bxf7+');
  strictEqual(g.history().at(-1), 'Bxf7+');
});

test('Game appends + for a promotion that gives check: a8=Q+', () => {
  const g = new Game('7k/P7/8/8/8/8/8/4K3 w - - 0 1');
  strictEqual(g.move({ from: 'a7', to: 'a8', promotion: 'q' }), 'a8=Q+');
});

test('checkmate # replaces + (never +#): fool\'s mate 1.f3 e5 2.g4 Qh4#', () => {
  const g = new Game(); // default startpos
  g.move({ from: 'f2', to: 'f3' });
  g.move({ from: 'e7', to: 'e5' });
  g.move({ from: 'g2', to: 'g4' });
  const san = g.move({ from: 'd8', to: 'h4' });
  strictEqual(san, 'Qh4#');
  strictEqual(g.history(), ['f3', 'e5', 'g4', 'Qh4#']);
  // mate suffix is '#' alone, never '+#'
  strictEqual(san.includes('+'), false);
});
