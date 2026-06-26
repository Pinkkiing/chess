import { useState } from 'react';
import './AnalysisControls.css';

interface AnalysisControlsProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onReset: () => void;
  onLoadFen: (fen: string) => void;
  onLoadPgn: (pgn: string) => void;
}

export function AnalysisControls({ canGoBack, canGoForward, onBack, onForward, onReset, onLoadFen, onLoadPgn }: AnalysisControlsProps) {
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'fen' | 'pgn'>('fen');
  const [error, setError] = useState('');

  function handleLoad() {
    setError('');
    const val = input.trim();
    if (!val) return;
    try {
      if (inputType === 'fen') onLoadFen(val);
      else onLoadPgn(val);
      setInput('');
    } catch {
      setError('Format invalide');
    }
  }

  return (
    <div className="analysis-controls">
      <div className="analysis-nav">
        <button className="nav-btn" onClick={onReset} title="Début">⏮</button>
        <button className="nav-btn" onClick={onBack} disabled={!canGoBack} title="Coup précédent">◀</button>
        <button className="nav-btn" onClick={onForward} disabled={!canGoForward} title="Coup suivant">▶</button>
      </div>

      <div className="analysis-import">
        <div className="import-tabs">
          <button className={`import-tab ${inputType === 'fen' ? 'import-tab--active' : ''}`} onClick={() => setInputType('fen')}>FEN</button>
          <button className={`import-tab ${inputType === 'pgn' ? 'import-tab--active' : ''}`} onClick={() => setInputType('pgn')}>PGN</button>
        </div>
        <textarea
          className="import-textarea"
          placeholder={inputType === 'fen' ? 'Collez un FEN…' : 'Collez un PGN…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={inputType === 'pgn' ? 4 : 2}
        />
        {error && <p className="import-error">{error}</p>}
        <button className="btn btn--primary import-btn" onClick={handleLoad}>Charger</button>
      </div>
    </div>
  );
}
