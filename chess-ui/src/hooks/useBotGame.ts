import { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import type { GameState, Color, EndReason } from '../types/game';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// skill 1-8 → UCI Skill Level 0-20 + movetime ms
const SKILL_CONFIG: Record<number, { uciSkill: number; movetime: number }> = {
  1: { uciSkill: 0,  movetime: 50  },
  2: { uciSkill: 3,  movetime: 100 },
  3: { uciSkill: 6,  movetime: 200 },
  4: { uciSkill: 9,  movetime: 400 },
  5: { uciSkill: 12, movetime: 700 },
  6: { uciSkill: 15, movetime: 1000 },
  7: { uciSkill: 18, movetime: 1500 },
  8: { uciSkill: 20, movetime: 2000 },
};

export function useBotGame(playerColor: Color, skillLevel: number) {
  const botColor: Color = playerColor === 'white' ? 'black' : 'white';
  const chessRef = useRef(new Chess());
  const workerRef = useRef<Worker | null>(null);
  const thinkingRef = useRef(false);

  const [gameState, setGameState] = useState<GameState>({
    fen: INITIAL_FEN, turn: 'white', moves: [], status: 'playing', check: false,
  });
  const [botThinking, setBotThinking] = useState(false);

  const syncState = useCallback(() => {
    const chess = chessRef.current;
    const over = chess.isGameOver();
    let winner: Color | undefined;
    let endReason: EndReason | undefined;
    if (chess.isCheckmate()) { winner = chess.turn() === 'w' ? 'black' : 'white'; endReason = 'checkmate'; }
    else if (chess.isStalemate()) endReason = 'stalemate';
    else if (over) endReason = 'draw';
    setGameState({
      fen: chess.fen(),
      turn: chess.turn() === 'w' ? 'white' : 'black',
      moves: chess.history(),
      status: over ? 'ended' : 'playing',
      winner,
      endReason,
      check: chess.inCheck(),
    });
  }, []);

  // Init Stockfish worker
  useEffect(() => {
    const cfg = SKILL_CONFIG[skillLevel] ?? SKILL_CONFIG[3];
    const worker = new Worker('/stockfish.js');
    workerRef.current = worker;

    worker.postMessage('uci');
    worker.postMessage(`setoption name Skill Level value ${cfg.uciSkill}`);
    worker.postMessage('isready');

    worker.onmessage = (e: MessageEvent<string>) => {
      if (!e.data.startsWith('bestmove')) return;
      const uci = e.data.split(' ')[1];
      if (!uci || uci === '(none)') { thinkingRef.current = false; setBotThinking(false); return; }

      const from = uci.slice(0, 2);
      const to   = uci.slice(2, 4);
      const prom = uci[4];
      try {
        chessRef.current.move({ from, to, promotion: prom ?? 'q' });
        syncState();
      } catch { /* illegal move from engine, shouldn't happen */ }
      thinkingRef.current = false;
      setBotThinking(false);
    };

    // If bot plays white, let it move first
    if (botColor === 'white') requestBotMove(worker, INITIAL_FEN, cfg.movetime);

    return () => { worker.terminate(); workerRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillLevel, botColor]);

  // Trigger bot move when it's the bot's turn
  useEffect(() => {
    if (gameState.turn !== botColor) return;
    if (gameState.status !== 'playing') return;
    if (thinkingRef.current) return;
    const worker = workerRef.current;
    if (!worker) return;

    const cfg = SKILL_CONFIG[skillLevel] ?? SKILL_CONFIG[3];
    thinkingRef.current = true;
    setBotThinking(true);
    requestBotMove(worker, gameState.fen, cfg.movetime);
  }, [gameState.turn, gameState.fen, gameState.status, botColor, skillLevel]);

  const makeMove = useCallback((from: string, to: string, promotion?: string): boolean => {
    if (gameState.turn !== playerColor || gameState.status !== 'playing') return false;
    try {
      chessRef.current.move({ from, to, promotion: promotion ?? 'q' });
      syncState();
      return true;
    } catch {
      return false;
    }
  }, [gameState.turn, gameState.status, playerColor, syncState]);

  const getLegalMoves = useCallback((square: string): string[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return chessRef.current.moves({ square: square as any, verbose: true }).map(m => m.to);
  }, []);

  const reset = useCallback(() => {
    chessRef.current.reset();
    thinkingRef.current = false;
    setBotThinking(false);
    syncState();
    if (botColor === 'white') {
      const worker = workerRef.current;
      const cfg = SKILL_CONFIG[skillLevel] ?? SKILL_CONFIG[3];
      if (worker) {
        thinkingRef.current = true;
        setBotThinking(true);
        requestBotMove(worker, INITIAL_FEN, cfg.movetime);
      }
    }
  }, [botColor, skillLevel, syncState]);

  const resign = useCallback(() => {
    thinkingRef.current = false;
    setBotThinking(false);
    setGameState(prev => ({
      ...prev,
      status: 'ended',
      winner: botColor,
      endReason: 'resignation',
    }));
  }, [botColor]);

  return { gameState, botThinking, botColor, makeMove, getLegalMoves, reset, resign };
}

function requestBotMove(worker: Worker, fen: string, movetime: number) {
  worker.postMessage(`position fen ${fen}`);
  worker.postMessage(`go movetime ${movetime}`);
}
