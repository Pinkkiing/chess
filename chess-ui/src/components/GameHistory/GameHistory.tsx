import type { GameRecord } from '../../types/history';
import './GameHistory.css';

interface GameHistoryProps {
  games: GameRecord[];
  onAnalyze: (record: GameRecord) => void;
  onClear: () => void;
  onBack: () => void;
}

const END_REASON_LABEL: Record<string, string> = {
  checkmate:   'Échec et mat',
  stalemate:   'Pat',
  resignation: 'Abandon',
  draw:        'Nulle',
};

function ResultBadge({ record }: { record: GameRecord }) {
  if (record.result === 'draw') return <span className="result-badge result-badge--draw">½</span>;
  return <span className="result-badge result-badge--win">1</span>;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function GameHistory({ games, onAnalyze, onClear, onBack }: GameHistoryProps) {
  return (
    <div className="history-screen">
      <header className="history-header">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>← Menu</button>
        <h1 className="history-title">Historique des parties</h1>
        {games.length > 0 && (
          <button className="btn btn--ghost btn--sm btn--danger" onClick={onClear}>
            Effacer tout
          </button>
        )}
      </header>

      {games.length === 0 ? (
        <div className="history-empty">
          <span className="history-empty__icon">📋</span>
          <p>Aucune partie enregistrée</p>
          <p className="history-empty__sub">Les parties locales et contre Stockfish apparaîtront ici</p>
        </div>
      ) : (
        <div className="history-list">
          {games.map(g => (
            <div key={g.id} className="history-card">
              <div className="history-card__result">
                <ResultBadge record={g} />
                <span className="history-card__reason">{END_REASON_LABEL[g.endReason]}</span>
              </div>

              <div className="history-card__info">
                <div className="history-card__players">
                  <span className={g.result === 'white' ? 'player--winner' : ''}>♔ {g.whiteName}</span>
                  <span className="vs">vs</span>
                  <span className={g.result === 'black' ? 'player--winner' : ''}>♚ {g.blackName}</span>
                </div>
                <div className="history-card__meta">
                  <span>{formatDate(g.date)}</span>
                  <span>·</span>
                  <span>{g.moves.length} coups</span>
                  <span>·</span>
                  <span>{g.mode === 'bot' ? 'vs Stockfish' : '2 Joueurs'}</span>
                </div>
              </div>

              <button
                className="btn btn--ghost btn--sm history-card__analyze"
                onClick={() => onAnalyze(g)}
                disabled={g.moves.length === 0}
              >
                🔍 Analyser
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
