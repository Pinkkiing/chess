import { useEffect, useRef } from 'react';
import { Chessground } from '@lichess-org/chessground';
import type { Api } from '@lichess-org/chessground/api';
import type { Config } from '@lichess-org/chessground/config';
import type { Key } from '@lichess-org/chessground/types';
import type { Color } from '../../types/game';
import './Board.css';

export interface BoardShape {
  orig: string;
  dest?: string;
  brush?: 'green' | 'red' | 'blue' | 'yellow';
}

export interface BoardBadge {
  square: string;        // e.g. "d5"
  symbol: string;        // e.g. "!!"
  color: string;         // CSS color
}

interface BoardProps {
  fen: string;
  turn: Color;
  orientation?: Color;
  check: boolean;
  onMove: (from: string, to: string) => boolean | Promise<boolean>;
  getLegalMoves?: (square: string) => string[];
  myColor?: Color;
  shapes?: BoardShape[];
  badge?: BoardBadge;
}

const FILES = 'abcdefgh';

function squareToPercent(square: string, orientation: Color): { left: number; top: number } {
  const fileIdx = FILES.indexOf(square[0]);
  const rankIdx = parseInt(square[1]) - 1; // 0 = rank 1 (bottom for white)
  if (orientation === 'white') {
    return { left: (fileIdx + 0.75) / 8 * 100, top: (7 - rankIdx) / 8 * 100 };
  } else {
    return { left: (7 - fileIdx + 0.25) / 8 * 100, top: (rankIdx + 1) / 8 * 100 };
  }
}

export function Board({ fen, turn, orientation = 'white', check, onMove, getLegalMoves, myColor, shapes, badge }: BoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const config: Config = {
      fen,
      orientation,
      turnColor: turn,
      check,
      movable: {
        color: myColor ?? 'both',
        free: !getLegalMoves,
        dests: getLegalMoves ? buildDests(getLegalMoves) : undefined,
        events: { after: (from, to) => { void onMove(from, to); } },
      },
      drawable: {
        enabled: true,
        visible: true,
        autoShapes: shapes?.map(s => ({
          orig: s.orig as Key,
          dest: s.dest as Key | undefined,
          brush: s.brush ?? 'blue',
        })) ?? [],
      },
      animation: { enabled: true, duration: 150 },
      highlight: { lastMove: true, check: true },
      premovable: { enabled: true },
      draggable: { enabled: true, showGhost: true },
    };
    cgRef.current = Chessground(containerRef.current, config);
    return () => cgRef.current?.destroy();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cg = cgRef.current;
    if (!cg) return;
    cg.set({
      fen,
      turnColor: turn,
      check,
      movable: {
        color: myColor ?? 'both',
        dests: getLegalMoves ? buildDests(getLegalMoves) : undefined,
      },
      drawable: {
        autoShapes: shapes?.map(s => ({
          orig: s.orig as Key,
          dest: s.dest as Key | undefined,
          brush: s.brush ?? 'blue',
        })) ?? [],
      },
    });
  }, [fen, turn, check, getLegalMoves, myColor, shapes]);

  const badgePos = badge ? squareToPercent(badge.square, orientation) : null;

  return (
    <div className="board-wrap">
      <div ref={containerRef} className="cg-board-wrap" />
      {badge && badgePos && (
        <div
          className="board-badge"
          style={{
            left: `${badgePos.left}%`,
            top: `${badgePos.top}%`,
            background: badge.color,
          }}
        >
          {badge.symbol}
        </div>
      )}
    </div>
  );
}

function buildDests(getLegalMoves: (sq: string) => string[]) {
  const files = 'abcdefgh'.split('');
  const ranks = '12345678'.split('');
  const dests = new Map<Key, Key[]>();
  for (const f of files) {
    for (const r of ranks) {
      const sq = f + r;
      const moves = getLegalMoves(sq);
      if (moves.length) dests.set(sq as Key, moves as Key[]);
    }
  }
  return dests;
}
