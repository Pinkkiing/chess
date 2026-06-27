import { useState } from 'react';
import type { ChartLine } from '../../hooks/useRatingHistory';

const W = 480;
const H = 180;
const PL = 44;   // left padding (y-axis labels)
const PR = 16;
const PT = 28;   // top padding (legend)
const PB = 28;   // bottom padding (x-axis labels)

interface Tooltip { x: number; y: number; date: Date; entries: { name: string; color: string; rating: number }[] }

export function RatingChart({ lines }: { lines: ChartLine[] }) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  if (lines.length === 0) return <p className="chart-empty">Aucun historique disponible</p>;

  const allPoints = lines.flatMap(l => l.points);
  const minDate   = Math.min(...allPoints.map(p => p.date.getTime()));
  const maxDate   = Math.max(...allPoints.map(p => p.date.getTime()));
  const allRatings = allPoints.map(p => p.rating);
  const rawMin = Math.min(...allRatings);
  const rawMax = Math.max(...allRatings);
  const pad    = Math.max(20, Math.round((rawMax - rawMin) * 0.1));
  const minR   = rawMin - pad;
  const maxR   = rawMax + pad;
  const rRange = maxR - minR || 1;
  const dRange = maxDate - minDate || 1;

  const cW = W - PL - PR;
  const cH = H - PT - PB;

  const toX = (d: Date) => PL + ((d.getTime() - minDate) / dRange) * cW;
  const toY = (r: number) => PT + ((maxR - r) / rRange) * cH;

  // Y-axis grid levels
  const step = Math.round((rawMax - rawMin) / 3 / 25) * 25 || 25;
  const yLevels: number[] = [];
  for (let r = Math.ceil(rawMin / step) * step; r <= rawMax; r += step) yLevels.push(r);

  // Collect all unique X positions (dates) from all lines for the tooltip hit areas
  const allDates = [...new Set(allPoints.map(p => p.date.getTime()))].sort();

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX  = ((e.clientX - rect.left) / rect.width)  * W;
    const svgY  = ((e.clientY - rect.top)  / rect.height) * H;
    if (svgX < PL || svgX > W - PR || svgY < PT || svgY > H - PB) { setTooltip(null); return; }

    // Find closest date
    const hovered = ((svgX - PL) / cW) * dRange + minDate;
    const closest = allDates.reduce((a, b) => Math.abs(a - hovered) < Math.abs(b - hovered) ? a : b);
    const date = new Date(closest);

    const entries = lines.flatMap(l => {
      const pt = l.points.find(p => p.date.getTime() === closest);
      return pt ? [{ name: l.name, color: l.color, rating: pt.rating }] : [];
    });
    if (entries.length === 0) { setTooltip(null); return; }

    setTooltip({ x: toX(date), y: svgY, date, entries });
  }

  const startLabel = new Date(minDate).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
  const endLabel   = new Date(maxDate).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

  return (
    <div className="rating-chart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ cursor: 'crosshair' }}
      >
        {/* Grid */}
        {yLevels.map(r => (
          <g key={r}>
            <line x1={PL} y1={toY(r)} x2={W - PR} y2={toY(r)} stroke="#2a2a40" strokeWidth="1" />
            <text x={PL - 6} y={toY(r) + 4} textAnchor="end" fill="#444" fontSize="10">{r}</text>
          </g>
        ))}

        {/* X-axis labels */}
        <text x={PL}      y={H - 6} textAnchor="start" fill="#444" fontSize="10">{startLabel}</text>
        <text x={W - PR}  y={H - 6} textAnchor="end"   fill="#444" fontSize="10">{endLabel}</text>

        {/* Lines */}
        {lines.map(line => {
          const pts = line.points;
          if (pts.length < 2) return null;
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.date).toFixed(1)},${toY(p.rating).toFixed(1)}`).join(' ');
          const last = pts[pts.length - 1];
          return (
            <g key={line.name}>
              <path d={d} fill="none" stroke={line.color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={toX(last.date)} cy={toY(last.rating)} r={3.5} fill={line.color} stroke="#12121f" strokeWidth="1.5" />
            </g>
          );
        })}

        {/* Tooltip vertical line */}
        {tooltip && (
          <line x1={tooltip.x} y1={PT} x2={tooltip.x} y2={H - PB} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        )}

        {/* Legend */}
        {lines.map((line, i) => (
          <g key={line.name} transform={`translate(${PL + i * 88}, 8)`}>
            <line x1={0} y1={6} x2={16} y2={6} stroke={line.color} strokeWidth="2" />
            <circle cx={8} cy={6} r={3} fill={line.color} stroke="#12121f" strokeWidth="1" />
            <text x={20} y={10} fill="#888" fontSize="10">{line.name}</text>
          </g>
        ))}
      </svg>

      {/* Tooltip box (outside SVG for easier styling) */}
      {tooltip && (
        <div className="chart-tooltip">
          <div className="chart-tooltip__date">
            {tooltip.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          {tooltip.entries.map(e => (
            <div key={e.name} className="chart-tooltip__row">
              <span className="chart-tooltip__dot" style={{ background: e.color }} />
              <span className="chart-tooltip__name">{e.name}</span>
              <span className="chart-tooltip__rating">{e.rating}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
