import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import {
  streamBoardEvents,
  streamGame,
  makeMove,
  resignGame,
  type LichessGameFull,
  type LichessGameState,
} from '../api/lichess';
import type { Color, GameState } from '../types/game';

export interface LichessGameInfo {
  id: string;
  myColor: Color;
  opponentName: string;
  opponentRating?: number;
}

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function useLichessGame(token: string | null, myUserId: string | null) {
  const [gameInfo, setGameInfo] = useState<LichessGameInfo | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    fen: INITIAL_FEN, turn: 'white', moves: [], status: 'waiting', check: false,
  });
  const [clocks, setClocks] = useState({ white: 600_000, black: 600_000 });
  const [seeking, setSeeking] = useState(false);

  const stopGameStream = useRef<(() => void) | null>(null);
  const stopEventStream = useRef<(() => void) | null>(null);

  // Replay moves list into FEN
  const movesToFen = useCallback((movesStr: string): GameState => {
    const chess = new Chess();
    if (movesStr) {
      for (const m of movesStr.split(' ')) {
        if (m) chess.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] ?? 'q' });
      }
    }
    const isOver = chess.isGameOver();
    let winner: Color | undefined;
    if (chess.isCheckmate()) winner = chess.turn() === 'w' ? 'black' : 'white';
    return {
      fen: chess.fen(),
      turn: chess.turn() === 'w' ? 'white' : 'black',
      moves: chess.history(),
      status: isOver ? 'ended' : 'playing',
      winner,
      check: chess.inCheck(),
    };
  }, []);

  const handleGameFull = useCallback((e: LichessGameFull, myId: string) => {
    const myColor: Color = e.white.id === myId ? 'white' : 'black';
    const opp = myColor === 'white' ? e.black : e.white;
    const oppName = opp.aiLevel != null ? `Stockfish niveau ${opp.aiLevel}` : (opp.name ?? 'Adversaire');
    setGameInfo({ id: e.id, myColor, opponentName: oppName, opponentRating: opp.rating });
    const gs = movesToFen(e.state.moves);
    setGameState(gs);
    setClocks({ white: e.state.wtime, black: e.state.btime });
  }, [movesToFen]);

  const handleGameState = useCallback((e: LichessGameState) => {
    const gs = movesToFen(e.moves);
    if (e.winner) gs.winner = e.winner;
    if (e.status !== 'started') gs.status = 'ended';
    setGameState(gs);
    setClocks({ white: e.wtime, black: e.btime });
  }, [movesToFen]);

  // Start streaming board events (to detect game start/end)
  useEffect(() => {
    if (!token || !myUserId) return;
    const stop = streamBoardEvents(token, event => {
      if (event.type === 'gameStart' && 'game' in event) {
        const { fullId, color } = (event as { type: 'gameStart'; game: { fullId: string; color: 'white' | 'black' } }).game;
        setSeeking(false);
        // Stream the actual game
        stopGameStream.current?.();
        stopGameStream.current = streamGame(token, fullId, e => {
          if (e.type === 'gameFull') handleGameFull(e as LichessGameFull, myUserId);
          if (e.type === 'gameState') handleGameState(e as LichessGameState);
        });
        void color; // used implicitly via gameFull
      }
    });
    stopEventStream.current = stop;
    return () => { stop(); stopGameStream.current?.(); };
  }, [token, myUserId, handleGameFull, handleGameState]);

  const sendMove = useCallback(async (from: string, to: string, promotion?: string) => {
    if (!token || !gameInfo) return false;
    const uci = from + to + (promotion ?? '');
    return makeMove(token, gameInfo.id, uci);
  }, [token, gameInfo]);

  const resign = useCallback(async () => {
    if (!token || !gameInfo) return;
    await resignGame(token, gameInfo.id);
  }, [token, gameInfo]);

  return { gameInfo, gameState, clocks, seeking, setSeeking, sendMove, resign };
}
