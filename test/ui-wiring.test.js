// AC-5 static-wiring acceptance: assert the browser UI is wired to the REAL public
// core/engine ES modules (no forked chess/engine logic), mounts the required markers,
// offers both engines, and that the controller's runtime assumptions about the public
// API actually hold. These are content/semantic checks that complement the HTTP-level
// serve-smoke.sh oracle. Pure static analysis + Node import — no browser needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { Game } from '../src/core/game.js';
import { RandomEngine } from '../src/engine/random-engine.js';
import { SimpleAI } from '../src/engine/simple-ai.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const read = (rel) => readFileSync(resolve(ROOT, rel), 'utf8');

test('index.html exists at repo root', () => {
  assert.ok(existsSync(resolve(ROOT, 'index.html')), 'index.html must exist at repo root');
});

test('index.html mounts the board under id="board"', () => {
  const html = read('index.html');
  assert.match(html, /id="board"/, 'index.html must contain the board mount marker id="board"');
});

test('index.html exposes an engine-switch control id="engine"', () => {
  const html = read('index.html');
  assert.match(html, /id="engine"/, 'index.html must contain the engine-switch control id="engine"');
});

test('engine-switch control offers BOTH RandomEngine and SimpleAI', () => {
  const html = read('index.html');
  assert.match(html, /RandomEngine/, 'engine selector must offer a RandomEngine option');
  assert.match(html, /SimpleAI/, 'engine selector must offer a SimpleAI option');
});

test('index.html loads the app as a type="module" script', () => {
  const html = read('index.html');
  // a module <script> tag (attribute order independent) that points at the app module
  assert.match(html, /<script[^>]*type="module"[^>]*>/i, 'app must load via <script type="module">');
  assert.match(html, /src="[^"]*src\/ui\/app\.js"/, 'index.html must load src/ui/app.js');
});

test('index.html uses only local/static src references (no remote/CDN)', () => {
  const html = read('index.html');
  const srcs = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(srcs.length > 0, 'index.html must reference at least one script src');
  for (const s of srcs) {
    assert.ok(
      !/^(https?:)?\/\//i.test(s),
      `script src must be local/static, got remote reference: ${s}`,
    );
  }
});

test('UI modules exist as ES modules', () => {
  for (const rel of ['src/ui/app.js', 'src/ui/board.js', 'src/ui/styles.css']) {
    assert.ok(existsSync(resolve(ROOT, rel)), `${rel} must exist`);
  }
});

test('app.js imports the REAL core Game module (no forked chess logic)', () => {
  const app = read('src/ui/app.js');
  assert.match(
    app,
    /import\s+\{[^}]*\bGame\b[^}]*\}\s+from\s+['"][^'"]*core\/game\.js['"]/,
    'app.js must import { Game } from the shared core/game.js module',
  );
});

test('app.js imports BOTH real engine modules (no forked engine logic)', () => {
  const app = read('src/ui/app.js');
  assert.match(
    app,
    /import\s+\{[^}]*\bRandomEngine\b[^}]*\}\s+from\s+['"][^'"]*engine\/random-engine\.js['"]/,
    'app.js must import { RandomEngine } from engine/random-engine.js',
  );
  assert.match(
    app,
    /import\s+\{[^}]*\bSimpleAI\b[^}]*\}\s+from\s+['"][^'"]*engine\/simple-ai\.js['"]/,
    'app.js must import { SimpleAI } from engine/simple-ai.js',
  );
});

test('UI does not fork chess move-generation logic (uses game.legalMoves)', () => {
  const app = read('src/ui/app.js');
  const board = existsSync(resolve(ROOT, 'src/ui/board.js')) ? read('src/ui/board.js') : '';
  const ui = app + '\n' + board;
  // the legal-destination highlighting must come from the Game API, not a re-implementation
  assert.match(ui, /legalMoves\s*\(/, 'UI must derive legal moves from game.legalMoves()');
  // guard against a forked engine: the UI must not import the low-level move generator directly
  assert.ok(
    !/generateMoves/.test(ui),
    'UI must not call the low-level generateMoves — it must go through the public Game API',
  );
});

test('app.js drives the engine reply via the engine contract bestMove(game)', () => {
  const app = read('src/ui/app.js');
  assert.match(app, /\bbestMove\s*\(/, 'app.js must call engine.bestMove(game) for the reply');
  assert.match(app, /\bstatus\s*\(/, 'app.js must read game.status() to detect game-over');
});

// --- API-sanity: confirm the controller's runtime assumptions about the public API hold ---

test('Game.legalMoves() returns { from, to, promotion? } entries with algebraic squares', () => {
  const g = new Game();
  const moves = g.legalMoves();
  assert.ok(Array.isArray(moves) && moves.length > 0, 'legalMoves() must return a non-empty array');
  const sq = /^[a-h][1-8]$/;
  for (const m of moves) {
    assert.equal(typeof m.from, 'string', 'move.from must be a string');
    assert.equal(typeof m.to, 'string', 'move.to must be a string');
    assert.match(m.from, sq, `move.from must be an algebraic square, got ${m.from}`);
    assert.match(m.to, sq, `move.to must be an algebraic square, got ${m.to}`);
    if ('promotion' in m && m.promotion !== undefined) {
      assert.match(String(m.promotion), /^[qrbn]$/i, `promotion must be q/r/b/n, got ${m.promotion}`);
    }
  }
});

test('filtering legalMoves by a clicked from-square yields that piece\'s destinations', () => {
  const g = new Game();
  // controller pattern: click e2 -> highlight its legal destinations
  const dests = g.legalMoves().filter((m) => m.from === 'e2').map((m) => m.to);
  assert.deepEqual([...dests].sort(), ['e3', 'e4'], 'e2 pawn from the start position moves to e3/e4');
});

test('applying a human move via game.move() then an engine reply advances the game', async () => {
  const g = new Game();
  const human = g.legalMoves().find((m) => m.from === 'e2' && m.to === 'e4');
  assert.ok(human, 'e2-e4 must be legal from the start position');
  g.move(human);
  assert.match(g.fen().split(' ')[1], /^b$/, 'after a white move it is black to move');

  for (const engine of [new RandomEngine(), new SimpleAI()]) {
    const reply = await engine.bestMove(g);
    assert.ok(
      g.legalMoves().some((m) => m.from === reply.from && m.to === reply.to),
      `${engine.name}.bestMove must return a move from game.legalMoves()`,
    );
  }
});

test('game.status() reports checkmate so the UI can detect game-over', () => {
  // fool's mate position: white is checkmated, black just played Qh4#
  const mate = new Game('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');
  assert.equal(mate.status(), 'checkmate', 'status() must surface checkmate for game-over display');
});
