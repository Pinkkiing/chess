import { useState, useEffect } from 'react';
import { fetchRatingHistory } from '../api/lichess';

export interface ChartLine {
  name: string;
  color: string;
  points: { date: Date; rating: number }[];
}

const SHOWN: Record<string, string> = {
  'Bullet':    '#e07040',
  'Blitz':     '#5ca0f5',
  'Rapid':     '#4fc97e',
  'Classical': '#c080d0',
};

export function useRatingHistory(username: string | null) {
  const [lines, setLines] = useState<ChartLine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username) { setLines([]); return; }
    setLoading(true);
    fetchRatingHistory(username).then(entries => {
      const result: ChartLine[] = [];
      for (const entry of entries) {
        const color = SHOWN[entry.name];
        if (!color || entry.points.length === 0) continue;
        result.push({
          name: entry.name,
          color,
          points: entry.points.slice(-60).map(([y, m, d, r]) => ({
            date: new Date(y, m, d),
            rating: r,
          })),
        });
      }
      setLines(result);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [username]);

  return { lines, loading };
}
