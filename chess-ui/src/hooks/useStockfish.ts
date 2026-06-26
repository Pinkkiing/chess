import { useEffect, useRef, useState, useCallback } from 'react';

export interface StockfishResult {
  evaluation: number | null; // centipawns, positive = white advantage
  mate: number | null;       // mate in N (negative = black mates)
  bestMove: string | null;   // UCI e.g. "e2e4"
  depth: number;
  isAnalyzing: boolean;
}

const EMPTY: StockfishResult = { evaluation: null, mate: null, bestMove: null, depth: 0, isAnalyzing: false };

export function useStockfish(enabled: boolean) {
  const workerRef = useRef<Worker | null>(null);
  const readyRef = useRef(false);
  const pendingFen = useRef<string | null>(null);
  const [result, setResult] = useState<StockfishResult>(EMPTY);

  useEffect(() => {
    if (!enabled) {
      workerRef.current?.terminate();
      workerRef.current = null;
      readyRef.current = false;
      setResult(EMPTY);
      return;
    }

    const worker = new Worker('/stockfish.js');
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<string>) => {
      const line = e.data;

      if (line === 'readyok') {
        readyRef.current = true;
        if (pendingFen.current) {
          sendAnalysis(worker, pendingFen.current);
          pendingFen.current = null;
        }
        return;
      }

      if (line.startsWith('info') && line.includes('score') && line.includes('pv')) {
        const depthMatch = line.match(/depth (\d+)/);
        const cpMatch = line.match(/score cp (-?\d+)/);
        const mateMatch = line.match(/score mate (-?\d+)/);
        const pvMatch = line.match(/ pv (\w+)/);
        setResult(prev => ({
          ...prev,
          depth: depthMatch ? parseInt(depthMatch[1]) : prev.depth,
          evaluation: cpMatch ? parseInt(cpMatch[1]) : (mateMatch ? prev.evaluation : prev.evaluation),
          mate: mateMatch ? parseInt(mateMatch[1]) : null,
          bestMove: pvMatch ? pvMatch[1] : prev.bestMove,
          isAnalyzing: true,
        }));
      }

      if (line.startsWith('bestmove')) {
        const move = line.split(' ')[1];
        if (move && move !== '(none)') {
          setResult(prev => ({ ...prev, bestMove: move, isAnalyzing: false }));
        } else {
          setResult(prev => ({ ...prev, isAnalyzing: false }));
        }
      }
    };

    worker.postMessage('uci');
    worker.postMessage('setoption name Threads value 1');
    worker.postMessage('isready');

    return () => {
      worker.terminate();
      workerRef.current = null;
      readyRef.current = false;
    };
  }, [enabled]);

  const analyze = useCallback((fen: string) => {
    const worker = workerRef.current;
    if (!worker) return;
    setResult(prev => ({ ...prev, isAnalyzing: true, depth: 0 }));
    if (!readyRef.current) {
      pendingFen.current = fen;
      return;
    }
    sendAnalysis(worker, fen);
  }, []);

  return { result, analyze };
}

function sendAnalysis(worker: Worker, fen: string) {
  worker.postMessage('stop');
  worker.postMessage(`position fen ${fen}`);
  worker.postMessage('go depth 20');
}
