import type { EndReason } from './game';

export interface GameRecord {
  id: string;
  date: string;          // ISO string
  mode: 'local' | 'bot';
  whiteName: string;
  blackName: string;
  result: 'white' | 'black' | 'draw';
  endReason: EndReason;
  moves: string[];       // SAN history
}
