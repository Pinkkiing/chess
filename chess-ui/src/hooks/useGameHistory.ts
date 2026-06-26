import { useState, useCallback } from 'react';
import type { GameRecord } from '../types/history';

const KEY = 'chess-ui-history';
const MAX = 100;

function load(): GameRecord[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

function save(records: GameRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

export function useGameHistory() {
  const [games, setGames] = useState<GameRecord[]>(load);

  const addGame = useCallback((record: Omit<GameRecord, 'id' | 'date'>) => {
    const full: GameRecord = {
      ...record,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    setGames(prev => {
      const next = [full, ...prev].slice(0, MAX);
      save(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(KEY);
    setGames([]);
  }, []);

  return { games, addGame, clearHistory };
}
