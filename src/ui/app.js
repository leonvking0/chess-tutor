import { Game } from '../core/game.js';
import { RandomEngine } from '../engine/random-engine.js';
import { SimpleAI } from '../engine/simple-ai.js';
import { renderBoard, highlightSquares } from './board.js';

function init() {
	const game = new Game();
	let selected = null;
	const engines = { RandomEngine: new RandomEngine(), SimpleAI: new SimpleAI() };
	let activeEngine = engines.RandomEngine;

	const boardEl = document.getElementById('board');
	const engineSel = document.getElementById('engine');
	const statusEl = document.getElementById('status');

	function legalFrom(sq) {
		return game.legalMoves().filter(m => m.from === sq);
	}

	function isOver() {
		const st = game.status();
		return st === 'checkmate' || st === 'stalemate' || st === 'draw-50move';
	}

	function draw() {
		renderBoard(boardEl, game.fen(), { onSquareClick: onSquareClick });
		if (selected !== null) {
			const dests = legalFrom(selected);
			highlightSquares(boardEl, dests.map(m => m.to), selected);
		}
	}

	function maybeGameOver() {
		const st = game.status();
		let label;
		if (st === 'checkmate') label = 'Checkmate';
		else if (st === 'stalemate') label = 'Stalemate — draw';
		else if (st === 'draw-50move') label = 'Draw (50-move rule)';
		else if (st === 'check') label = 'Check';
		else label = 'ongoing';
		if (statusEl) statusEl.textContent = label;
		return st === 'checkmate' || st === 'stalemate' || st === 'draw-50move';
	}

	async function engineReply() {
		if (isOver()) return;
		let mv;
		try {
			mv = await activeEngine.bestMove(game);
		} catch (e) {
			console.error(e);
			return;
		}
		if (!mv) return;
		game.move(mv);
		draw();
		maybeGameOver();
	}

	async function onSquareClick(sq) {
		if (isOver()) return;
		if (selected === null) {
			const dests = legalFrom(sq);
			if (dests.length === 0) return;
			selected = sq;
			highlightSquares(boardEl, dests.map(m => m.to), sq);
			return;
		}
		const candidates = legalFrom(selected).filter(m => m.to === sq);
		if (candidates.length === 0) {
			const own = legalFrom(sq);
			if (own.length > 0) {
				selected = sq;
				highlightSquares(boardEl, own.map(m => m.to), sq);
			} else {
				selected = null;
				highlightSquares(boardEl, [], null);
			}
			return;
		}
		const m = candidates.find(c => c.promotion === 'q') || candidates[0];
		game.move(m);
		selected = null;
		draw();
		if (maybeGameOver()) return;
		await engineReply();
	}

	engineSel.addEventListener('change', () => {
		activeEngine = engines[engineSel.value] || engines.RandomEngine;
	});

	draw();
}

if (document.readyState !== 'loading') {
	init();
} else {
	document.addEventListener('DOMContentLoaded', init);
}
