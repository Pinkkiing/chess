import type { StockfishResult } from '../../hooks/useStockfish';
import './EvalBar.css';

interface EvalBarProps {
  result: StockfishResult;
}

export function EvalBar({ result }: EvalBarProps) {
  const { evaluation, mate, isAnalyzing } = result;

  let whitePercent = 50;
  let label = '0.0';

  if (mate !== null) {
    whitePercent = mate > 0 ? 97 : 3;
    label = `M${Math.abs(mate)}`;
  } else if (evaluation !== null) {
    whitePercent = 100 / (1 + Math.exp(-0.005 * evaluation));
    label = evaluation >= 0
      ? `+${(evaluation / 100).toFixed(1)}`
      : (evaluation / 100).toFixed(1);
  }

  return (
    <div className="eval-bar-wrap" title={`Évaluation : ${label}`}>
      <div className={`eval-bar ${isAnalyzing ? 'eval-bar--analyzing' : ''}`}>
        <div className="eval-bar__black" style={{ height: `${100 - whitePercent}%` }} />
        <div className="eval-bar__white" style={{ height: `${whitePercent}%` }} />
      </div>
      <span className="eval-bar__label">{label}</span>
    </div>
  );
}
