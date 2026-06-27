import { useState } from 'react';
import { createSeek } from '../../api/lichess';
import type { LichessUser, LichessRatings } from '../../hooks/useLichessAuth';
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

interface Preset { label: string; time: number; inc: number; }

const CATEGORY_RATING_KEY: Record<string, keyof LichessRatings> = {
  'Bullet':    'bullet',
  'Blitz':     'blitz',
  'Rapide':    'rapid',
  'Classique': 'classical',
};

const SECTIONS: { category: string; presets: Preset[] }[] = [
  {
    category: 'Bullet',
    presets: [
      { label: '1+0', time: 1, inc: 0 },
      { label: '2+1', time: 2, inc: 1 },
    ],
  },
  {
    category: 'Blitz',
    presets: [
      { label: '3+0', time: 3, inc: 0 },
      { label: '3+2', time: 3, inc: 2 },
      { label: '5+0', time: 5, inc: 0 },
      { label: '5+3', time: 5, inc: 3 },
    ],
  },
  {
    category: 'Rapide',
    presets: [
      { label: '10+0',  time: 10, inc: 0  },
      { label: '10+5',  time: 10, inc: 5  },
      { label: '15+10', time: 15, inc: 10 },
    ],
  },
  {
    category: 'Classique',
    presets: [
      { label: '30+0',  time: 30, inc: 0  },
      { label: '30+20', time: 30, inc: 20 },
    ],
  },
];

export function LichessPanel({ token, user, gameInfo, seeking, onSeek, onResign }: LichessPanelProps) {
  const [selected, setSelected] = useState<Preset>(SECTIONS[1].presets[0]);
  const [isCustom, setIsCustom] = useState(false);
  const [customTime, setCustomTime] = useState(5);
  const [customInc, setCustomInc] = useState(3);
  const [rated, setRated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSeek = isCustom ? { time: customTime, inc: customInc } : selected;

  async function handleSeek() {
    setError(null);
    onSeek();
    const r = await createSeek(token, { time: activeSeek.time, increment: activeSeek.inc, rated });
    if (!r.ok) setError('Seek impossible. Vérifiez que votre app OAuth a le scope board:play.');
  }

  function pickPreset(p: Preset) { setSelected(p); setIsCustom(false); }

  return (
    <div className="lichess-panel">
      <div className="lp-user">
        <span className="lp-user__avatar">♟</span>
        <div>
          <div className="lp-user__name">{user.username}</div>
          {user.rating && <div className="lp-user__rating">{user.rating}</div>}
        </div>
      </div>

      {gameInfo ? (
        <div className="lp-game">
          <div className="lp-game__vs">vs <strong>{gameInfo.opponentName}</strong>{gameInfo.opponentRating && ` (${gameInfo.opponentRating})`}</div>
          <div className="lp-game__color">Tu joues les {gameInfo.myColor === 'white' ? 'Blancs' : 'Noirs'}</div>
          <button className="btn btn--ghost btn--danger" onClick={onResign}>⚑ Abandonner</button>
        </div>
      ) : (
        <div className="lp-seek">
          {SECTIONS.map((section, i) => {
            const rating = user.ratings[CATEGORY_RATING_KEY[section.category]];
            return (
            <div key={section.category}>
              {i > 0 && <div className="lp-divider" />}
              <div className="lp-row">
                <div className="lp-row__label-block">
                  <span className="lp-row__label">{section.category}</span>
                  {rating && <span className="lp-row__rating">{rating}</span>}
                </div>
                <div className="lp-row__presets">
                  {section.presets.map(p => (
                    <button
                      key={p.label}
                      className={`lp-btn ${!isCustom && selected.label === p.label ? 'lp-btn--active' : ''}`}
                      onClick={() => pickPreset(p)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            );
          })}

          <div className="lp-divider" />
          <div className="lp-row">
            <span className="lp-row__label">Perso.</span>
          </div>
          <div className={`lp-custom ${isCustom ? 'lp-custom--on' : ''}`} onClick={() => setIsCustom(true)}>
            <div className="lp-slider-row">
              <span>Minutes <strong>{customTime}</strong></span>
              <input type="range" min={1} max={60} value={customTime}
                onChange={e => { setCustomTime(Number(e.target.value)); setIsCustom(true); }} />
            </div>
            <div className="lp-slider-row">
              <span>Incrément <strong>{customInc}s</strong></span>
              <input type="range" min={0} max={60} value={customInc}
                onChange={e => { setCustomInc(Number(e.target.value)); setIsCustom(true); }} />
            </div>
            <div className="lp-mode">
              <button className={`lp-mode__btn ${!rated ? 'lp-mode__btn--on' : ''}`} onClick={e => { e.stopPropagation(); setRated(false); }}>Amical</button>
              <button className={`lp-mode__btn ${rated ? 'lp-mode__btn--on' : ''}`} onClick={e => { e.stopPropagation(); setRated(true); }}>Classé</button>
            </div>
          </div>

          <div className="lp-divider" />
          <button className="lp-seek-btn" onClick={handleSeek} disabled={seeking}>
            {seeking ? 'Recherche…' : 'Trouver une partie'}
          </button>
          {error && <p className="lp-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
