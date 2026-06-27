export type GameMode = 'menu' | 'local' | 'bot' | 'lichess' | 'analysis' | 'puzzle' | 'history' | 'profile';

export interface BotConfig {
  skillLevel: number; // 1–8
  playerColor: 'white' | 'black' | 'random';
}
