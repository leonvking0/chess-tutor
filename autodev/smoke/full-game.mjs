import { Game } from '../../src/core/game.js';
import { RandomEngine } from '../../src/engine/random-engine.js';
import { SimpleAI } from '../../src/engine/simple-ai.js';

async function main() {
    const game = new Game();
    const white = new RandomEngine();
    const black = new SimpleAI();
    let plies = 0;

    while (plies < 200) {
        const st = game.status();
        if (st === 'checkmate' || st === 'stalemate' || st === 'draw-50move') {
            break;
        }

        const side = game.fen().split(' ')[1];
        const engine = (side === 'w') ? white : black;
        const move = await engine.bestMove(game);

        const legal = game.legalMoves();
        const ok = legal.some(m => m.from === move.from && m.to === move.to && (m.promotion || undefined) === (move.promotion || undefined));

        if (!ok) {
            console.error('ILLEGAL MOVE from engine', engine.name, JSON.stringify(move));
            process.exit(1);
        }

        game.move(move);
        plies++;
    }

    console.log('FULL GAME OK status=' + game.status() + ' plies=' + plies);
    process.exit(0);
}

main();
