import { useEffect, useState } from 'react';
import { Chess } from 'chess.js';

export type MoveClass =
  | 'brilliant' | 'excellent' | 'best' | 'very_good' | 'good'
  | 'inaccuracy' | 'mistake' | 'miss' | 'blunder';

export interface MoveClassification {
  moveIndex: number;
  classification: MoveClass;
  loss: number;
  bestMove: string;
}

export interface GameAnalysisResult {
  classifications: MoveClassification[];
  evals: number[];           // eval at each position (0 = start, N = after move N-1)
  whiteAccuracy: number;     // 0–100
  blackAccuracy: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MATE_SCORE = 29000;

function mateToScore(mate: number) {
  return mate > 0 ? MATE_SCORE - mate * 10 : -MATE_SCORE - mate * 10;
}

// Win probability 0–100 (chess.com formula)
function winPct(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

// Per-move accuracy (chess.com formula)
function moveAccuracy(wpBefore: number, wpAfter: number): number {
  const loss = Math.max(0, wpBefore - wpAfter);
  return Math.min(100, Math.max(0, 103.1668 * Math.exp(-0.04354 * loss) - 3.1669));
}

function classify(
  loss: number,
  isBest: boolean,
  cpBefore: number,
  cpAfter: number,
  missedMate: boolean,
): MoveClass {
  if (missedMate) return 'miss';
  if (loss > 300)  return 'blunder';
  if (loss > 100)  return 'mistake';
  if (loss > 25)   return 'inaccuracy';

  if (!isBest) {
    if (loss <= 10) return 'very_good';
    return 'good';
  }

  // It's the engine's best move — decide between brilliant / excellent / best
  const wasBalanced = Math.abs(cpBefore) < 150;
  const bigGain = (cpAfter - cpBefore) > 150; // significant eval jump

  if (wasBalanced && bigGain) return 'brilliant';
  if (wasBalanced)            return 'excellent';
  return 'best';
}

// ─── Stockfish helpers ────────────────────────────────────────────────────────
type SFResult = { score: number; bestMove: string };

function analyzePosition(worker: Worker, fen: string): Promise<SFResult> {
  return new Promise(resolve => {
    let score = 0;
    let bestMove = '';

    const handler = (e: MessageEvent<string>) => {
      const line = e.data;
      if (line.startsWith('info') && line.includes('score') && line.includes(' pv ')) {
        const cp   = line.match(/score cp (-?\d+)/);
        const mate = line.match(/score mate (-?\d+)/);
        const pv   = line.match(/ pv (\w+)/);
        if (cp)   score = parseInt(cp[1]);
        if (mate) score = mateToScore(parseInt(mate[1]));
        if (pv)   bestMove = pv[1];
      }
      if (line.startsWith('bestmove')) {
        const bm = line.split(' ')[1];
        if (bm && bm !== '(none)') bestMove = bm;
        worker.removeEventListener('message', handler);
        resolve({ score, bestMove });
      }
    };

    worker.addEventListener('message', handler);
    worker.postMessage('stop');
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage('go depth 14');
  });
}

function waitForReady(worker: Worker): Promise<void> {
  return new Promise(resolve => {
    const handler = (e: MessageEvent<string>) => {
      if (e.data === 'readyok') { worker.removeEventListener('message', handler); resolve(); }
    };
    worker.addEventListener('message', handler);
    worker.postMessage('uci');
    worker.postMessage('isready');
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGameAnalysis(moves: string[], enabled: boolean) {
  const [result, setResult]     = useState<GameAnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);

  const movesKey = moves.join(',');

  useEffect(() => {
    if (!enabled || moves.length === 0) {
      setResult(null); setProgress(0); setAnalyzing(false);
      return;
    }

    let cancelled = false;
    const worker = new Worker('/stockfish.js');
    setResult(null); setProgress(0); setAnalyzing(true);

    async function run() {
      await waitForReady(worker);
      if (cancelled) return;

      const chess = new Chess();
      const sfResults: SFResult[] = [];
      const total = moves.length + 1;

      // Analyze every position (initial + after each move)
      const r0 = await analyzePosition(worker, chess.fen());
      if (cancelled) return;
      sfResults.push(r0);
      setProgress(1 / total);

      for (let i = 0; i < moves.length; i++) {
        if (cancelled) return;
        chess.move(moves[i]);
        const r = await analyzePosition(worker, chess.fen());
        if (cancelled) return;
        sfResults.push(r);
        setProgress((i + 2) / total);
      }

      // Build eval array (from white's POV)
      const evals = sfResults.map(r => r.score);

      // Classify each move
      const replay = new Chess();
      const classifications: MoveClassification[] = [];
      const whiteAccuracies: number[] = [];
      const blackAccuracies: number[] = [];

      for (let i = 0; i < moves.length; i++) {
        const cpBefore = evals[i];
        const cpAfter  = evals[i + 1];
        const whiteToMove = replay.turn() === 'w';
        const moveResult  = replay.move(moves[i]);

        const playedUci = moveResult
          ? moveResult.from + moveResult.to + (moveResult.promotion ?? '')
          : '';
        const isBest     = playedUci === sfResults[i].bestMove;
        const hadMate    = Math.abs(cpBefore) >= MATE_SCORE - 200;
        const missedMate = hadMate && !isBest && Math.abs(cpAfter) < MATE_SCORE - 200;

        const loss = whiteToMove ? (cpBefore - cpAfter) : (cpAfter - cpBefore);

        classifications.push({
          moveIndex: i,
          classification: classify(Math.max(0, loss), isBest, cpBefore, cpAfter, missedMate),
          loss: Math.max(0, loss),
          bestMove: sfResults[i].bestMove,
        });

        // Accuracy
        const wpBefore = winPct(cpBefore);
        const wpAfter  = winPct(cpAfter);
        const acc = whiteToMove
          ? moveAccuracy(wpBefore, wpAfter)
          : moveAccuracy(100 - wpBefore, 100 - wpAfter);

        if (whiteToMove) whiteAccuracies.push(acc);
        else             blackAccuracies.push(acc);
      }

      const avg = (arr: number[]) =>
        arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

      if (!cancelled) {
        setResult({
          classifications,
          evals,
          whiteAccuracy: Math.round(avg(whiteAccuracies) * 10) / 10,
          blackAccuracy: Math.round(avg(blackAccuracies) * 10) / 10,
        });
        setAnalyzing(false);
      }
    }

    run().catch(() => { if (!cancelled) setAnalyzing(false); });
    return () => { cancelled = true; worker.terminate(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movesKey, enabled]);

  return { result, progress, analyzing };
}
