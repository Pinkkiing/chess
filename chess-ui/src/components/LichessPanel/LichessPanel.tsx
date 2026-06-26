import { useState } from 'react';
import { createSeek } from '../../api/lichess';
import type { LichessUser } from '../../hooks/useLichessAuth';
import type { LichessGameInfo } from '../../hooks/useLichessGame';
import './LichessPanel.css';

interface LichessPanelProps {
  token: string;
  user: LichessUser;
  gameInfo: LichessGameInfo | null;
  seeking: boolean;
  onSeek: () => void;
  onResign: () => void;
}

const TIME_PRESETS = [
  { label: '1+0',  time: 1, inc: 0 },
  { label: '3+0',  time: 3, inc: 0 },
  { label: '5+3',  time: 5, inc: 3 },
  { label: '10+0', time: 10, inc: 0 },
];

export function LichessPanel({ token, user, gameInfo, seeking, onSeek, onResign }: LichessPanelProps) {
  const [preset, setPreset] = useState(TIME_PRESETS[1]);
  const [error, setError] = useState<string | null>(null);

  async function handleSeek() {
    setError(null);
    onSeek();
    const r = await createSeek(token, { time: preset.time, increment: preset.inc, rated: false });
    if (!r.ok) {
      setError('Impossible de créer un seek. Vérifiez que votre app OAuth a le scope board:play.');
    }
  }

  return (
    <div className="lichess-panel">
      <div className="lichess-panel__user">
        <span className="lichess-panel__avatar">♟</span>
        <div>
          <div className="lichess-panel__username">{user.username}</div>
          {user.rating && <div className="lichess-panel__rating">{user.rating}</div>}
        </div>
      </div>

      {gameInfo ? (
        <div className="lichess-panel__game">
          <div className="lichess-panel__vs">
            vs <strong>{gameInfo.opponentName}</strong>
            {gameInfo.opponentRating && ` (${gameInfo.opponentRating})`}
          </div>
          <div className="lichess-panel__color">Tu joues les {gameInfo.myColor === 'white' ? 'Blancs' : 'Noirs'}</div>
          <button className="btn btn--danger" onClick={onResign}>Abandonner</button>
        </div>
      ) : (
        <div className="lichess-panel__seek">
          <div className="preset-grid">
            {TIME_PRESETS.map(p => (
              <button
                key={p.label}
                className={`btn btn--preset ${preset.label === p.label ? 'btn--preset-active' : ''}`}
                onClick={() => setPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            className="btn btn--primary"
            onClick={handleSeek}
            disabled={seeking}
          >
            {seeking ? 'Recherche…' : 'Trouver une partie'}
          </button>
          {error && <p className="lichess-panel__error">{error}</p>}
        </div>
      )}
    </div>
  );
}
