export type Color = 'white' | 'black';
export type Role = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type Square = string; // e.g. "e4"

export interface Player {
  name: string;
  rating?: number;
  title?: string;
  color: Color;
}

export type EndReason = 'checkmate' | 'stalemate' | 'resignation' | 'draw';

export interface GameState {
  fen: string;
  turn: Color;
  moves: string[];
  status: 'waiting' | 'playing' | 'ended';
  winner?: Color;
  endReason?: EndReason;
  check: boolean;
}

export interface ClockState {
  white: number; // milliseconds remaining
  black: number;
  running: boolean;
  activeColor: Color;
}
