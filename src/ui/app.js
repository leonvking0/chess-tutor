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
	const hintBtn = document.getElementById('hint');
	const undoBtn = document.getElementById('undo');
	const movesEl = document.getElementById('moves');

	function legalFrom(sq) {
		return game.legalMoves().filter(m => m.from === sq);
	}

	function isOver() {
		const st = game.status();
		return st === 'checkmate' || st === 'stalemate' || st === 'draw-50move';
	}

	function renderMoves() {
		if (!movesEl) return;
		movesEl.innerHTML = '';
		const hist = game.history();
		for (const san of hist) {
			const li = document.createElement('li');
			li.textContent = san;
			movesEl.appendChild(li);
		}
	}

	function draw() {
		renderBoard(boardEl, game.fen(), { onSquareClick: onSquareClick });
		if (selected !== null) {
			const dests = legalFrom(selected);
			highlightSquares(boardEl, dests.map(m => m.to), selected);
		}
		renderMoves();
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

	async function onHint() {
		if (isOver()) return;
		let mv;
		try {
			mv = await activeEngine.bestMove(game);
		} catch (e) {
			console.error(e);
			return;
		}
		if (!mv) return;
		highlightSquares(boardEl, [mv.from, mv.to], mv.from);
		if (statusEl) statusEl.textContent = 'Hint: ' + mv.from + mv.to;
	}

	function onUndo() {
		const len = game.history().length;
		if (len === 0) return;
		// even length => last applied ply was an AI reply (human+AI pair) => undo twice;
		// odd length => only the human's move is pending (no AI reply yet) => undo once.
		if (len % 2 === 0) {
			game.undo();
			game.undo();
		} else {
			game.undo();
		}
		selected = null;
		draw();
		maybeGameOver();
	}

	engineSel.addEventListener('change', () => {
		activeEngine = engines[engineSel.value] || engines.RandomEngine;
	});
	if (hintBtn) hintBtn.addEventListener('click', onHint);
	if (undoBtn) undoBtn.addEventListener('click', onUndo);

	draw();
}

if (document.readyState !== 'loading') {
	init();
} else {
	document.addEventListener('DOMContentLoaded', init);
}
