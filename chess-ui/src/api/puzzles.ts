import { Chess } from 'chess.js';

export interface LichessPuzzle {
  id: string;
  fen: string;          // starting position (before player's first move)
  solution: string[];   // UCI moves — solution[0] = player's first move
  rating: number;
  themes: string[];
  playerColor: 'white' | 'black';
}

interface RawPuzzleResponse {
  puzzle: {
    id: string;
    initialPly: number;
    rating: number;
    solution: string[];
    themes: string[];
  };
  game: {
    pgn: string;
  };
}

export async function fetchRandomPuzzle(): Promise<LichessPuzzle> {
  const r = await fetch('https://lichess.org/api/puzzle/next');
  if (!r.ok) throw new Error('Impossible de charger le puzzle');
  const data: RawPuzzleResponse = await r.json();
  return parsePuzzle(data);
}

export async function fetchDailyPuzzle(): Promise<LichessPuzzle> {
  const r = await fetch('https://lichess.org/api/puzzle/daily');
  if (!r.ok) throw new Error('Impossible de charger le puzzle du jour');
  const data: RawPuzzleResponse = await r.json();
  return parsePuzzle(data);
}

function parsePuzzle(data: RawPuzzleResponse): LichessPuzzle {
  const chess = new Chess();
  chess.loadPgn(data.game.pgn);
  const verboseHistory = chess.history({ verbose: true });

  // Replay up to initialPly to get the starting position
  const start = new Chess();
  for (let i = 0; i < data.puzzle.initialPly; i++) {
    if (verboseHistory[i]) start.move(verboseHistory[i]);
  }

  // Apply the "setup" move (the move that creates the puzzle position)
  // initialPly is the ply BEFORE the position the player needs to solve
  // The player's color is whoever is to move at initialPly
  const playerColor = start.turn() === 'w' ? 'white' : 'black';

  return {
    id: data.puzzle.id,
    fen: start.fen(),
    solution: data.puzzle.solution,
    rating: data.puzzle.rating,
    themes: data.puzzle.themes,
    playerColor,
  };
}
