import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/game.js';
import { RandomEngine } from '../src/engine/random-engine.js';
import { SimpleAI } from '../src/engine/simple-ai.js';

const FENS = [
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
  'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
  'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1'
];

const engines = [new RandomEngine(), new SimpleAI()];

const sameMove = (a, b) => a.from === b.from && a.to === b.to && (a.promotion || undefined) === (b.promotion || undefined);

for (const engine of engines) {
  for (const fen of FENS) {
    test(`${engine.name} - ${fen}`, async () => {
      const game = new Game(fen);
      const before = game.fen();
      
      const move = await engine.bestMove(game);

      assert.ok(
        game.legalMoves().some(m => sameMove(m, move)),
        `Engine ${engine.name} returned an illegal move for position: ${fen}`
      );

      assert.equal(
        game.fen(),
        before,
        `Engine ${engine.name} mutated the game state for position: ${fen}`
      );
    });
  }
}
