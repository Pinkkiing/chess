import type { GameMode } from '../../types/mode';
import './ModeSelect.css';

interface ModeSelectProps {
  onSelect: (mode: Exclude<GameMode, 'menu' | 'history' | 'profile'>) => void;
  lichessUser?: { username: string } | null;
  onLichessLogin: () => void;
}

const MODES = [
  { id: 'local'    as const, icon: '👥', label: '2 Joueurs' },
  { id: 'bot'      as const, icon: '🤖', label: 'vs Stockfish' },
  { id: 'lichess'  as const, icon: '🌐', label: 'Lichess' },
  { id: 'analysis' as const, icon: '🔍', label: 'Analyse' },
  { id: 'puzzle'   as const, icon: '🧩', label: 'Puzzles' },
];

export function ModeSelect({ onSelect, lichessUser, onLichessLogin }: ModeSelectProps) {
  return (
    <div className="mode-select">
      <h1 className="mode-select__title">Choisissez un mode</h1>
      <p className="mode-select__subtitle">Jouez, entraînez-vous, analysez</p>

      <div className="mode-grid">
        {MODES.map(({ id, icon, label }) => {
          const handleClick = id === 'lichess' && !lichessUser
            ? onLichessLogin
            : () => onSelect(id);

          return (
            <button key={id} className="mode-btn" onClick={handleClick}>
              <span className="mode-btn__icon">{icon}</span>
              <span className="mode-btn__label">{label}</span>
              {id === 'lichess' && lichessUser && (
                <span className="mode-btn__sub">{lichessUser.username}</span>
              )}
              {id === 'lichess' && !lichessUser && (
                <span className="mode-btn__sub">Se connecter</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
