export class RandomEngine {
  name = 'RandomEngine';

  async bestMove(game) {
    const moves = game.legalMoves();
    return moves[Math.floor(Math.random() * moves.length)];
  }
}
