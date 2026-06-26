import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import type { GameState, Color, EndReason } from '../types/game';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function useChessGame() {
  const [chess] = useState(() => new Chess());
  const [gameState, setGameState] = useState<GameState>({
    fen: INITIAL_FEN,
    turn: 'white',
    moves: [],
    status: 'playing',
    check: false,
  });

  const makeMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      try {
        const result = chess.move({ from, to, promotion: promotion ?? 'q' });
        if (!result) return false;

        const isGameOver = chess.isGameOver();
        let winner: Color | undefined;
        let endReason: EndReason | undefined;
        if (chess.isCheckmate()) { winner = chess.turn() === 'w' ? 'black' : 'white'; endReason = 'checkmate'; }
        else if (chess.isStalemate()) endReason = 'stalemate';
        else if (isGameOver) endReason = 'draw';

        setGameState({
          fen: chess.fen(),
          turn: chess.turn() === 'w' ? 'white' : 'black',
          moves: chess.history(),
          status: isGameOver ? 'ended' : 'playing',
          winner,
          endReason,
          check: chess.inCheck(),
        });
        return true;
      } catch {
        return false;
      }
    },
    [chess],
  );

  const reset = useCallback(() => {
    chess.reset();
    setGameState({
      fen: INITIAL_FEN,
      turn: 'white',
      moves: [],
      status: 'playing',
      check: false,
    });
  }, [chess]);

  const resign = useCallback((resigningColor: Color) => {
    setGameState(prev => ({
      ...prev,
      status: 'ended',
      winner: resigningColor === 'white' ? 'black' : 'white',
      endReason: 'resignation',
    }));
  }, []);

  const getLegalMoves = useCallback(
    (square: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return chess.moves({ square: square as any, verbose: true }).map((m) => m.to);
    },
    [chess],
  );

  return { gameState, makeMove, reset, resign, getLegalMoves };
}
