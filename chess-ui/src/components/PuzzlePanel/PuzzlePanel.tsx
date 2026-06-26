import type { PuzzleStatus, PuzzleGameState } from '../../hooks/usePuzzleGame';
import './PuzzlePanel.css';

interface PuzzlePanelProps {
  ps: PuzzleGameState;
  onNext: () => void;
  onRetry: () => void;
  onDaily: () => void;
}

const STATUS_MESSAGES: Record<PuzzleStatus, { text: string; cls: string } | null> = {
  loading:          null,
  playing:          null,
  wrong:            { text: '✗ Mauvais coup — réessayez', cls: 'puzzle-status--wrong' },
  correct_partial:  { text: '✓ Bon coup !', cls: 'puzzle-status--ok' },
  solved:           { text: '🎉 Puzzle résolu !', cls: 'puzzle-status--solved' },
  error:            { text: 'Erreur de chargement', cls: 'puzzle-status--wrong' },
};

export function PuzzlePanel({ ps, onNext, onRetry, onDaily }: PuzzlePanelProps) {
  const msg = ps.status !== 'loading' ? STATUS_MESSAGES[ps.status] : null;

  return (
    <div className="puzzle-panel">
      {ps.status === 'loading' && (
        <div className="puzzle-loading">Chargement du puzzle…</div>
      )}

      {ps.puzzle && (
        <>
          <div className="puzzle-meta">
            <span className="puzzle-rating">★ {ps.puzzle.rating}</span>
            <div className="puzzle-themes">
              {ps.puzzle.themes.slice(0, 3).map(t => (
                <span key={t} className="puzzle-theme-tag">{t}</span>
              ))}
            </div>
          </div>

          <p className="puzzle-instruction">
            {ps.puzzle.playerColor === 'white' ? '⬜ Blancs jouent' : '⬛ Noirs jouent'} et gagnent
          </p>
        </>
      )}

      {msg && (
        <div className={`puzzle-status ${msg.cls}`}>{msg.text}</div>
      )}

      <div className="puzzle-actions">
        {ps.status === 'solved' && (
          <button className="btn btn--primary" onClick={onNext}>Puzzle suivant →</button>
        )}
        {ps.status === 'wrong' && (
          <button className="btn btn--ghost" onClick={onRetry}>Réessayer</button>
        )}
        {(ps.status === 'playing' || ps.status === 'error') && (
          <>
            <button className="btn btn--ghost" onClick={onNext}>Passer</button>
            <button className="btn btn--ghost" onClick={onDaily}>Puzzle du jour</button>
          </>
        )}
      </div>
    </div>
  );
}
