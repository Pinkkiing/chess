type PieceType = 'q' | 'r' | 'b' | 'n' | 'p';

const INITIAL_COUNTS: Record<PieceType, number> = { q: 1, r: 2, b: 2, n: 2, p: 8 };
const PIECE_VALUES:   Record<PieceType, number> = { q: 9, r: 5, b: 3, n: 3, p: 1 };
const ORDER: PieceType[] = ['q', 'r', 'b', 'n', 'p'];

export interface CapturedResult {
  byWhite: PieceType[]; // black pieces white captured
  byBlack: PieceType[]; // white pieces black captured
  advantage: number;    // positive = white leads, negative = black leads
}

export function computeCaptured(fen: string): CapturedResult {
  const placement = fen.split(' ')[0];
  const current: Record<'white' | 'black', Record<PieceType, number>> = {
    white: { q: 0, r: 0, b: 0, n: 0, p: 0 },
    black: { q: 0, r: 0, b: 0, n: 0, p: 0 },
  };

  for (const ch of placement) {
    if (ch === '/') continue;
    if (ch >= '1' && ch <= '8') continue;
    const lower = ch.toLowerCase() as PieceType;
    if (!ORDER.includes(lower)) continue;
    if (ch === ch.toUpperCase()) current.white[lower]++;
    else current.black[lower]++;
  }

  const byWhite: PieceType[] = [];
  const byBlack: PieceType[] = [];

  for (const p of ORDER) {
    const missingBlack = INITIAL_COUNTS[p] - current.black[p];
    const missingWhite = INITIAL_COUNTS[p] - current.white[p];
    for (let i = 0; i < missingBlack; i++) byWhite.push(p);
    for (let i = 0; i < missingWhite; i++) byBlack.push(p);
  }

  const whiteScore = byWhite.reduce((s, p) => s + PIECE_VALUES[p], 0);
  const blackScore = byBlack.reduce((s, p) => s + PIECE_VALUES[p], 0);

  return { byWhite, byBlack, advantage: whiteScore - blackScore };
}
