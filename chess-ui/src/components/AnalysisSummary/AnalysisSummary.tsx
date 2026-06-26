import type { GameAnalysisResult, MoveClass } from '../../hooks/useGameAnalysis';
import './AnalysisSummary.css';

interface AnalysisSummaryProps {
  result: GameAnalysisResult;
  whiteName: string;
  blackName: string;
}

const ROWS: { cls: MoveClass; label: string; symbol: string; color: string }[] = [
  { cls: 'brilliant',  label: 'Brillant',    symbol: '!!', color: '#21d0d0' },
  { cls: 'excellent',  label: 'Excellent',   symbol: '!',  color: '#5ca0f5' },
  { cls: 'best',       label: 'Meilleur',    symbol: '★',  color: '#4fc97e' },
  { cls: 'very_good',  label: 'Très bien',   symbol: '✓',  color: '#80c080' },
  { cls: 'good',       label: 'Bon',         symbol: '⊙',  color: '#96a8c8' },
  { cls: 'inaccuracy', label: 'Imprécision', symbol: '?!', color: '#f5c030' },
  { cls: 'mistake',    label: 'Erreur',      symbol: '?',  color: '#e08030' },
  { cls: 'miss',       label: 'Manqué',      symbol: '✗',  color: '#d04040' },
  { cls: 'blunder',    label: 'Gaffe',       symbol: '??', color: '#cc2020' },
];

export function AnalysisSummary({ result, whiteName, blackName }: AnalysisSummaryProps) {
  const whiteCounts: Partial<Record<MoveClass, number>> = {};
  const blackCounts: Partial<Record<MoveClass, number>> = {};

  for (const c of result.classifications) {
    const isWhite = c.moveIndex % 2 === 0;
    const map = isWhite ? whiteCounts : blackCounts;
    map[c.classification] = (map[c.classification] ?? 0) + 1;
  }

  return (
    <div className="analysis-summary">
      <div className="summary-header">
        <div className="summary-player">
          <span className="summary-player__name">{whiteName}</span>
          <span className="summary-accuracy">{result.whiteAccuracy}<span className="summary-accuracy__pct">%</span></span>
          <span className="summary-accuracy__label">précision</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-player summary-player--right">
          <span className="summary-player__name">{blackName}</span>
          <span className="summary-accuracy">{result.blackAccuracy}<span className="summary-accuracy__pct">%</span></span>
          <span className="summary-accuracy__label">précision</span>
        </div>
      </div>

      <div className="summary-rows">
        {ROWS.map(row => {
          const wCount = whiteCounts[row.cls] ?? 0;
          const bCount = blackCounts[row.cls] ?? 0;
          if (wCount === 0 && bCount === 0) return null;
          return (
            <div key={row.cls} className="summary-row">
              <span className="summary-row__count summary-row__count--white"
                style={{ color: wCount > 0 ? row.color : '#333' }}>
                {wCount}
              </span>
              <span className="summary-row__badge" style={{ background: row.color }}>
                {row.symbol}
              </span>
              <span className="summary-row__label">{row.label}</span>
              <span className="summary-row__count summary-row__count--black"
                style={{ color: bCount > 0 ? row.color : '#333' }}>
                {bCount}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
