import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import type { GameState, Color } from '../types/game';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

interface AnalysisState extends GameState {
  currentIndex: number;
  allMoves: string[];
  lastMove?: { from: string; to: string };
}

function replayToIndex(moves: string[], index: number): Chess {
  const chess = new Chess();
  for (let i = 0; i <= index && i < moves.length; i++) {
    chess.move(moves[i]);
  }
  return chess;
}

function chessToState(chess: Chess): Omit<AnalysisState, 'currentIndex' | 'allMoves'> {
  const over = chess.isGameOver();
  let winner: Color | undefined;
  if (chess.isCheckmate()) winner = chess.turn() === 'w' ? 'black' : 'white';
  const hist = chess.history({ verbose: true });
  const last = hist.length > 0 ? hist[hist.length - 1] : null;
  return {
    fen: chess.fen(),
    turn: chess.turn() === 'w' ? 'white' : 'black',
    moves: chess.history(),
    status: over ? 'ended' : 'playing',
    winner,
    check: chess.inCheck(),
    lastMove: last ? { from: last.from, to: last.to } : undefined,
  };
}

export function useAnalysisGame() {
  const [state, setState] = useState<AnalysisState>({
    fen: INITIAL_FEN, turn: 'white', moves: [], status: 'playing', check: false,
    currentIndex: -1, allMoves: [], lastMove: undefined,
  });

  const makeMove = useCallback((from: string, to: string): boolean => {
    const chess = replayToIndex(state.allMoves, state.currentIndex);
    try {
      const result = chess.move({ from, to, promotion: 'q' });
      if (!result) return false;
      const newMoves = [...state.allMoves.slice(0, state.currentIndex + 1), result.san];
      const newIndex = state.currentIndex + 1;
      setState({ ...chessToState(chess), currentIndex: newIndex, allMoves: newMoves });
      return true;
    } catch { return false; }
  }, [state]);

  const goToIndex = useCallback((index: number) => {
    setState(prev => {
      const chess = index < 0 ? new Chess() : replayToIndex(prev.allMoves, index);
      return { ...chessToState(chess), currentIndex: index, allMoves: prev.allMoves };
    });
  }, []);

  const goBack = useCallback(() => setState(prev => {
    const idx = Math.max(-1, prev.currentIndex - 1);
    const chess = idx < 0 ? new Chess() : replayToIndex(prev.allMoves, idx);
    return { ...chessToState(chess), currentIndex: idx, allMoves: prev.allMoves };
  }), []);

  const goForward = useCallback(() => setState(prev => {
    if (prev.currentIndex >= prev.allMoves.length - 1) return prev;
    const idx = prev.currentIndex + 1;
    const chess = replayToIndex(prev.allMoves, idx);
    return { ...chessToState(chess), currentIndex: idx, allMoves: prev.allMoves };
  }), []);

  const loadFen = useCallback((fen: string) => {
    try {
      const chess = new Chess(fen);
      setState({ ...chessToState(chess), currentIndex: -1, allMoves: [] });
    } catch { /* invalid FEN */ }
  }, []);

  const loadPgn = useCallback((pgn: string) => {
    try {
      const chess = new Chess();
      chess.loadPgn(pgn);
      const moves = chess.history();
      setState({ ...chessToState(chess), currentIndex: moves.length - 1, allMoves: moves });
    } catch { /* invalid PGN */ }
  }, []);

  const reset = useCallback(() => {
    setState({ fen: INITIAL_FEN, turn: 'white', moves: [], status: 'playing', check: false,
      currentIndex: -1, allMoves: [], lastMove: undefined });
  }, []);

  const getLegalMoves = useCallback((square: string): string[] => {
    const chess = replayToIndex(state.allMoves, state.currentIndex);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return chess.moves({ square: square as any, verbose: true }).map(m => m.to);
  }, [state]);

  return { state, makeMove, goBack, goForward, goToIndex, loadFen, loadPgn, reset, getLegalMoves };
}
