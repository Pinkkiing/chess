import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess, type Square } from 'chess.js';
import { fetchRandomPuzzle, fetchDailyPuzzle, type LichessPuzzle } from '../api/puzzles';
import type { GameState, Color } from '../types/game';

export type PuzzleStatus = 'loading' | 'playing' | 'wrong' | 'correct_partial' | 'solved' | 'error';

export interface PuzzleGameState {
  puzzle: LichessPuzzle | null;
  gameState: GameState;
  status: PuzzleStatus;
  solutionIndex: number;  // which move in solution the player needs to find next
  attemptedMove: string | null;
}

const BLANK: GameState = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn: 'white', moves: [], status: 'playing', check: false,
};

export function usePuzzleGame() {
  const [ps, setPs] = useState<PuzzleGameState>({
    puzzle: null, gameState: BLANK, status: 'loading', solutionIndex: 0, attemptedMove: null,
  });
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const oppTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (wrongTimerRef.current !== null) clearTimeout(wrongTimerRef.current);
      if (oppTimerRef.current !== null)   clearTimeout(oppTimerRef.current);
    };
  }, []);

  const applyUciMove = (fen: string, uci: string): string => {
    const chess = new Chess(fen);
    chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] ?? 'q' });
    return chess.fen();
  };

  const fenToGameState = (fen: string, extraMoves?: string[]): GameState => {
    const chess = new Chess(fen);
    const over = chess.isGameOver();
    let winner: Color | undefined;
    if (chess.isCheckmate()) winner = chess.turn() === 'w' ? 'black' : 'white';
    return {
      fen, turn: chess.turn() === 'w' ? 'white' : 'black',
      moves: extraMoves ?? [], status: over ? 'ended' : 'playing', winner, check: chess.inCheck(),
    };
  };

  const loadPuzzle = useCallback(async (daily = false) => {
    setPs(prev => ({ ...prev, status: 'loading', puzzle: null, solutionIndex: 0, attemptedMove: null }));
    try {
      const puzzle = daily ? await fetchDailyPuzzle() : await fetchRandomPuzzle();
      setPs({
        puzzle,
        gameState: fenToGameState(puzzle.fen),
        status: 'playing',
        solutionIndex: 0,
        attemptedMove: null,
      });
    } catch {
      setPs(prev => ({ ...prev, status: 'error' }));
    }
  }, []);

  // Load first puzzle on mount
  useEffect(() => { loadPuzzle(); }, [loadPuzzle]);

  const makeMove = useCallback((from: string, to: string): boolean => {
    const { puzzle, solutionIndex, gameState } = ps;
    if (!puzzle || ps.status !== 'playing') return false;

    const uciAttempt = from + to;
    const expectedUci = puzzle.solution[solutionIndex];

    // Accept both with and without promotion suffix for simplicity
    const isCorrect = expectedUci.startsWith(uciAttempt);

    if (!isCorrect) {
      setPs(prev => ({ ...prev, status: 'wrong', attemptedMove: uciAttempt }));
      if (wrongTimerRef.current !== null) clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => {
        wrongTimerRef.current = null;
        setPs(prev => prev.status === 'wrong' ? { ...prev, status: 'playing', attemptedMove: null } : prev);
      }, 1500);
      return false;
    }

    // Apply player's move
    const fenAfterPlayer = applyUciMove(gameState.fen, expectedUci);
    const nextSolIdx = solutionIndex + 1;

    if (nextSolIdx >= puzzle.solution.length) {
      // Puzzle complete!
      setPs(prev => ({ ...prev, gameState: fenToGameState(fenAfterPlayer, [...prev.gameState.moves, from + to]), status: 'solved', solutionIndex: nextSolIdx }));
      return true;
    }

    // Apply opponent's response after a short delay
    const opponentUci = puzzle.solution[nextSolIdx];
    setPs(prev => ({
      ...prev,
      gameState: fenToGameState(fenAfterPlayer, [...prev.gameState.moves, from + to]),
      status: 'correct_partial',
      solutionIndex: nextSolIdx,
    }));

    if (oppTimerRef.current !== null) clearTimeout(oppTimerRef.current);
    oppTimerRef.current = setTimeout(() => {
      oppTimerRef.current = null;
      setPs(prev => {
        if (prev.status !== 'correct_partial') return prev;
        const fenAfterOpp = applyUciMove(fenAfterPlayer, opponentUci);
        const nextIdx = nextSolIdx + 1;
        const solved = nextIdx >= puzzle.solution.length;
        return {
          ...prev,
          gameState: fenToGameState(fenAfterOpp, [...prev.gameState.moves, opponentUci.slice(0, 4)]),
          status: solved ? 'solved' : 'playing',
          solutionIndex: nextIdx,
        };
      });
    }, 500);

    return true;
  }, [ps]);

  const getLegalMoves = useCallback((square: string): string[] => {
    if (!ps.puzzle || ps.status !== 'playing') return [];
    const chess = new Chess(ps.gameState.fen);
    return chess.moves({ square: square as Square, verbose: true }).map(m => m.to);
  }, [ps]);

  const nextPuzzle = useCallback(() => loadPuzzle(false), [loadPuzzle]);
  const retryPuzzle = useCallback(() => {
    const { puzzle } = ps;
    if (!puzzle) return;
    setPs({ puzzle, gameState: fenToGameState(puzzle.fen), status: 'playing', solutionIndex: 0, attemptedMove: null });
  }, [ps]);

  return { ps, makeMove, getLegalMoves, nextPuzzle, retryPuzzle, loadDailyPuzzle: () => loadPuzzle(true) };
}
