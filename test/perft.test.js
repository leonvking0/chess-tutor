import { test } from 'node:test';
import { strictEqual } from 'node:assert/strict';
import { parseFen, toFen, perft } from '../src/core/chess.js';

const STARTPOS = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const KIWIPETE = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';

test('perft: STARTPOS depth 1 === 20', () => {
  strictEqual(perft(parseFen(STARTPOS), 1), 20);
});

test('perft: STARTPOS depth 2 === 400', () => {
  strictEqual(perft(parseFen(STARTPOS), 2), 400);
});

test('perft: STARTPOS depth 3 === 8902', () => {
  strictEqual(perft(parseFen(STARTPOS), 3), 8902);
});

test('perft: KIWIPETE depth 1 === 48', () => {
  strictEqual(perft(parseFen(KIWIPETE), 1), 48);
});

test('perft: KIWIPETE depth 2 === 2039', () => {
  strictEqual(perft(parseFen(KIWIPETE), 2), 2039);
});

test('FEN round-trip: STARTPOS byte-exact', () => {
  strictEqual(toFen(parseFen(STARTPOS)), STARTPOS);
});

test('FEN round-trip: KIWIPETE byte-exact', () => {
  strictEqual(toFen(parseFen(KIWIPETE)), KIWIPETE);
});
