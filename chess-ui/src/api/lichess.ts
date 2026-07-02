const BASE = 'https://lichess.org';

export interface RatingHistoryEntry {
  name: string;
  points: [number, number, number, number][]; // [year, month(0-indexed), day, rating]
}

export async function fetchRatingHistory(username: string): Promise<RatingHistoryEntry[]> {
  try {
    const r = await fetch(`${BASE}/api/user/${username}/rating-history`);
    if (!r.ok) return [];
    return r.json();
  } catch {
    return [];
  }
}

export async function fetchAccount(token: string) {
  const r = await fetch(`${BASE}/api/account`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error('Token invalide');
  return r.json() as Promise<{ id: string; username: string; perfs: Record<string, { rating: number }> }>;
}

export async function makeMove(token: string, gameId: string, uciMove: string) {
  const r = await fetch(`${BASE}/api/board/game/${gameId}/move/${uciMove}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.ok;
}

export async function resignGame(token: string, gameId: string): Promise<boolean> {
  const r = await fetch(`${BASE}/api/board/game/${gameId}/resign`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.ok;
}

export function streamBoardEvents(
  token: string,
  onEvent: (e: LichessEvent) => void,
  onError?: (e: unknown) => void,
): () => void {
  const controller = new AbortController();
  (async () => {
    try {
      const r = await fetch(`${BASE}/api/stream/event`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      await readNdJson(r, onEvent);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) onError?.(e);
    }
  })();
  return () => controller.abort();
}

export function streamGame(
  token: string,
  gameId: string,
  onEvent: (e: LichessGameEvent) => void,
  onError?: (e: unknown) => void,
): () => void {
  const controller = new AbortController();
  (async () => {
    try {
      const r = await fetch(`${BASE}/api/board/game/stream/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      await readNdJson(r, onEvent);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) onError?.(e);
    }
  })();
  return () => controller.abort();
}

export async function createSeek(
  token: string,
  opts: { time: number; increment: number; rated: boolean },
) {
  const r = await fetch(`${BASE}/api/board/seek`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      rated: String(opts.rated),
      time: String(opts.time),
      increment: String(opts.increment),
      variant: 'standard',
    }),
  });
  return r;
}

async function readNdJson<T>(r: Response, cb: (v: T) => void) {
  const reader = r.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let chunk = await reader.read();
  while (!chunk.done) {
    buf += dec.decode(chunk.value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim()) {
        try { cb(JSON.parse(line) as T); } catch { /* skip malformed */ }
      }
    }
    chunk = await reader.read();
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface LichessPlayer {
  id: string;
  name: string;   // Board API uses 'name', not 'username'
  rating?: number;
  title?: string;
  aiLevel?: number; // set for bots
}

export interface LichessGameState {
  type: 'gameState';
  moves: string;
  wtime: number;
  btime: number;
  winc: number;
  binc: number;
  status: string;
  winner?: 'white' | 'black';
}

export interface LichessGameFull {
  type: 'gameFull';
  id: string;
  white: LichessPlayer;
  black: LichessPlayer;
  state: LichessGameState;
  initialFen: string;
}

export type LichessGameEvent = LichessGameFull | LichessGameState | { type: string };

export type LichessEvent =
  | { type: 'gameStart'; game: { gameId: string; fullId: string; color: 'white' | 'black' } }
  | { type: 'gameFinish'; game: { gameId: string } }
  | { type: string };
