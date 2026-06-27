import { Settings } from '../Settings/Settings';
import type { LichessUser } from '../../hooks/useLichessAuth';
import type { GameMode } from '../../types/mode';
import './Navbar.css';

interface NavbarProps {
  mode: GameMode;
  onNavigate: (mode: GameMode) => void;
  user: LichessUser | null;
  authLoading: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const GAME_MODES: GameMode[] = ['local', 'bot', 'lichess', 'analysis', 'puzzle'];

const MODE_LABEL: Partial<Record<GameMode, string>> = {
  local: '2 Joueurs', bot: 'vs Stockfish', lichess: 'Lichess',
  analysis: 'Analyse', puzzle: 'Puzzles',
};

export function Navbar({ mode, onNavigate, user, authLoading, onLogin, onLogout }: NavbarProps) {
  const inGame = GAME_MODES.includes(mode);

  return (
    <nav className="c-nav app-nav">
      {/* Brand */}
      <button className="c-brand nav-brand-btn" onClick={() => onNavigate('menu')}>
        <span className="c-brand__mark">♟</span>
        <span className="c-brand__name">CAÏSSA</span>
      </button>

      {/* Nav links — menu/pages only */}
      {!inGame && (
        <div className="c-nav__links">
          <button
            className={`c-nav__link ${mode === 'menu' ? 'c-nav__link--active' : ''}`}
            onClick={() => onNavigate('menu')}
          >
            Jouer
          </button>
          <button
            className={`c-nav__link ${mode === 'puzzle' ? 'c-nav__link--active' : ''}`}
            onClick={() => onNavigate('puzzle')}
          >
            Puzzles
          </button>
          <button
            className={`c-nav__link ${mode === 'history' ? 'c-nav__link--active' : ''}`}
            onClick={() => onNavigate('history')}
          >
            Historique
          </button>
          {user && (
            <button
              className={`c-nav__link ${mode === 'profile' ? 'c-nav__link--active' : ''}`}
              onClick={() => onNavigate('profile')}
            >
              Profil
            </button>
          )}
        </div>
      )}

      {/* In-game breadcrumb */}
      {inGame && (
        <div className="nav-game-crumb">
          <button className="c-nav__link nav-back-btn" onClick={() => onNavigate('menu')}>
            ← Menu
          </button>
          <span className="nav-mode-chip">{MODE_LABEL[mode]}</span>
        </div>
      )}

      <div className="c-nav__spacer" />

      {/* Right actions */}
      <Settings />

      {user ? (
        <button className="nav-user-btn" onClick={() => onNavigate('profile')} title="Voir le profil">
          <div className="nav-avatar">
            {user.username[0].toUpperCase()}
          </div>
          <span className="nav-username">{user.username}</span>
          <button
            className="nav-logout-btn"
            onClick={e => { e.stopPropagation(); onLogout(); }}
            title="Se déconnecter"
          >
            ✕
          </button>
        </button>
      ) : (
        <button
          className="c-btn c-btn--outline c-btn--sm"
          onClick={onLogin}
          disabled={authLoading}
        >
          {authLoading ? '…' : '🔗 Lichess'}
        </button>
      )}
    </nav>
  );
}
