import { test } from 'node:test';
import { strictEqual, deepStrictEqual } from 'node:assert/strict';
import { Game } from '../src/core/game.js';

// status() -> one of: ongoing | check | checkmate | stalemate | draw-50move
// Every fixture FEN below was verified against the real core (parseFen + generateMoves)
// before being committed.

test('status: startpos is ongoing', () => {
  const g = new Game(); // default startpos
  strictEqual(g.status(), 'ongoing');
});

test('status: fool\'s-mate post-position FEN is checkmate', () => {
  const g = new Game('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');
  strictEqual(g.status(), 'checkmate');
});

test('status: checkmate reached by playing the fool\'s-mate moves', () => {
  const g = new Game();
  g.move({ from: 'f2', to: 'f3' });
  g.move({ from: 'e7', to: 'e5' });
  g.move({ from: 'g2', to: 'g4' });
  g.move({ from: 'd8', to: 'h4' });
  strictEqual(g.status(), 'checkmate');
});

test('status: stalemate (black king stalemated)', () => {
  const g = new Game('5k2/5P2/5K2/8/8/8/8/8 b - - 0 1');
  strictEqual(g.status(), 'stalemate');
});

test('status: draw-50move when halfmove clock >= 100', () => {
  const g = new Game('8/8/8/8/8/8/8/k6K w - - 100 1');
  strictEqual(g.status(), 'draw-50move');
});

test('status: check when in check with legal moves available', () => {
  const g = new Game('4k3/8/8/8/8/8/8/4R1K1 b - - 0 1');
  strictEqual(g.status(), 'check');
  // sanity: there are legal moves out of check (so it is NOT mate)
  strictEqual(g.legalMoves().length, 4);
});

// undo() must restore the EXACT prior state across all fields (board, side, castling,
// en-passant, halfmove, fullmove). The FEN round-trip is the observable proxy.

test('undo: restores exact prior FEN and history', () => {
  const g = new Game();
  const start = g.fen();
  g.move({ from: 'e2', to: 'e4' });
  strictEqual(g.fen() !== start, true);
  deepStrictEqual(g.history(), ['e4']);
  g.undo();
  strictEqual(g.fen(), start);
  deepStrictEqual(g.history(), []);
});

test('undo: restores castling rights, ep target, and clocks exactly', () => {
  // After 1.e4 the ep target becomes e3 and clocks change; undo must restore precisely.
  const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const g = new Game(fen);
  g.move({ from: 'g1', to: 'f3' }); // halfmove -> 1
  g.move({ from: 'b8', to: 'c6' }); // halfmove -> 2, fullmove -> 2
  const snapshot = g.fen();
  g.move({ from: 'e2', to: 'e4' }); // ep target e3, halfmove reset to 0
  g.undo();
  strictEqual(g.fen(), snapshot);
});
