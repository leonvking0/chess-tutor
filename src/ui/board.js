const PIECES = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

export function renderBoard(mountEl, fen, handlers) {
  mountEl.innerHTML = '';
  
  const placement = fen.split(' ')[0];
  const rows = placement.split('/');
  
  // rows[0] is rank 8, rows[7] is rank 1
  for (let rank = 8; rank >= 1; rank--) {
    const rowIndex = 8 - rank;
    const rowStr = rows[rowIndex];
    let file = 0;
    
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      
      if (char >= '1' && char <= '8') {
        file += parseInt(char, 10);
      } else {
        const fileChar = String.fromCharCode(97 + file);
        const squareName = fileChar + rank;
        
        const squareDiv = document.createElement('div');
        squareDiv.className = 'square';
        squareDiv.dataset.square = squareName;
        
        if ((file + rank) % 2 === 0) {
          squareDiv.classList.add('dark');
        } else {
          squareDiv.classList.add('light');
        }
        
        if (PIECES[char]) {
          const pieceSpan = document.createElement('span');
          pieceSpan.className = 'piece';
          pieceSpan.textContent = PIECES[char];
          squareDiv.appendChild(pieceSpan);
        }
        
        if (handlers && typeof handlers.onSquareClick === 'function') {
          squareDiv.addEventListener('click', () => {
            handlers.onSquareClick(squareName);
          });
        }
        
        mountEl.appendChild(squareDiv);
        file++;
      }
    }
  }
}

export function highlightSquares(mountEl, squares, selectedSquare) {
  const existing = mountEl.querySelectorAll('.highlight, .selected');
  existing.forEach(el => {
    el.classList.remove('highlight');
    el.classList.remove('selected');
  });
  
  if (Array.isArray(squares)) {
    for (const sq of squares) {
      const el = mountEl.querySelector('[data-square="' + sq + '"]');
      if (el) {
        el.classList.add('highlight');
      }
    }
  }
  
  if (selectedSquare && typeof selectedSquare === 'string' && selectedSquare.length > 0) {
    const el = mountEl.querySelector('[data-square="' + selectedSquare + '"]');
    if (el) {
      el.classList.add('selected');
    }
  }
}
