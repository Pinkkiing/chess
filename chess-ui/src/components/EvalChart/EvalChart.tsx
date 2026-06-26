import type { MoveClassification, MoveClass } from '../../hooks/useGameAnalysis';
import './EvalChart.css';

interface EvalChartProps {
  evals: number[];
  classifications: MoveClassification[];
  currentIndex: number;
  onSelectMove: (index: number) => void;
}

const DOT_COLORS: Partial<Record<MoveClass, string>> = {
  brilliant:  '#21d0d0',
  excellent:  '#5ca0f5',
  inaccuracy: '#f5c030',
  mistake:    '#e08030',
  miss:       '#d04040',
  blunder:    '#cc2020',
};

const W = 320;
const H = 80;
const PAD = 4;

// Clamp eval to ±600cp for display, mate = ±700
function normalize(cp: number): number {
  const v = Math.abs(cp) >= 29000 - 200
    ? Math.sign(cp) * 700
    : Math.max(-600, Math.min(600, cp));
  return (v + 700) / 1400; // 0 = black winning, 1 = white winning
}

export function EvalChart({ evals, classifications, currentIndex, onSelectMove }: EvalChartProps) {
  if (evals.length < 2) return null;

  const n = evals.length;
  const xs = evals.map((_, i) => PAD + (i / (n - 1)) * (W - PAD * 2));
  const ys = evals.map(cp => PAD + (1 - normalize(cp)) * (H - PAD * 2));
  const mid = PAD + (1 - normalize(0)) * (H - PAD * 2);

  // White area (above midline)
  const whitePoints = [
    `${xs[0]},${mid}`,
    ...xs.map((x, i) => `${x},${Math.min(ys[i], mid)}`),
    `${xs[n - 1]},${mid}`,
  ].join(' ');

  // Black area (below midline)
  const blackPoints = [
    `${xs[0]},${mid}`,
    ...xs.map((x, i) => `${x},${Math.max(ys[i], mid)}`),
    `${xs[n - 1]},${mid}`,
  ].join(' ');

  const linePath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');

  // Dots for notable moves (skip 'best', 'very_good', 'good')
  const clsMap = new Map(classifications.map(c => [c.moveIndex, c]));

  return (
    <div className="eval-chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H}>
        {/* White advantage area */}
        <polygon points={whitePoints} fill="rgba(240,220,180,0.35)" />
        {/* Black advantage area */}
        <polygon points={blackPoints} fill="rgba(40,40,40,0.55)" />
        {/* Midline */}
        <line x1={PAD} y1={mid} x2={W - PAD} y2={mid} stroke="#444" strokeWidth="0.5" />
        {/* Eval line */}
        <path d={linePath} fill="none" stroke="#b58863" strokeWidth="1.5" />
        {/* Current position marker */}
        {currentIndex >= 0 && currentIndex + 1 < xs.length && (
          <line
            x1={xs[currentIndex + 1]} y1={PAD}
            x2={xs[currentIndex + 1]} y2={H - PAD}
            stroke="rgba(255,255,255,0.4)" strokeWidth="1"
          />
        )}
        {/* Notable move dots */}
        {classifications.map(c => {
          const color = DOT_COLORS[c.classification];
          if (!color) return null;
          const xi = c.moveIndex + 1; // eval after move i is at index i+1
          if (xi >= xs.length) return null;
          return (
            <circle
              key={c.moveIndex}
              cx={xs[xi]} cy={ys[xi]} r={3}
              fill={color} stroke="#0d0d1a" strokeWidth="0.5"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectMove(c.moveIndex)}
            />
          );
        })}
      </svg>
    </div>
  );
}
