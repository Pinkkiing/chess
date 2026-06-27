import { useState } from 'react';
import type { GameMode, BotConfig } from '../../types/mode';
import './ModeSelect.css';

interface ModeSelectProps {
  onSelect: (mode: Exclude<GameMode, 'menu' | 'history' | 'profile'>, botConfig?: BotConfig) => void;
  lichessUser?: { username: string } | null;
  onLichessLogin: () => void;
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Novice', 2: 'Débutant', 3: 'Casual', 4: 'Intermédiaire',
  5: 'Avancé', 6: 'Expert', 7: 'Maître', 8: 'Maximum',
};

export function ModeSelect({ onSelect, lichessUser, onLichessLogin }: ModeSelectProps) {
  const [botSkill, setBotSkill] = useState(3);
  const [botColor, setBotColor] = useState<BotConfig['playerColor']>('white');

  return (
    <div className="mode-select">
      <h1 className="mode-select__title">Choisissez un mode</h1>
      <p className="mode-select__subtitle">Jouez, entraînez-vous, analysez</p>

      <div className="mode-grid">

        {/* Local 2 players */}
        <div className="mode-card" onClick={() => onSelect('local')}>
          <span className="mode-card__icon">👥</span>
          <h2 className="mode-card__title">2 Joueurs</h2>
          <p className="mode-card__desc">Jouez à deux sur le même écran</p>
        </div>

        {/* vs Bot */}
        <div className="mode-card mode-card--bot">
          <span className="mode-card__icon">🤖</span>
          <h2 className="mode-card__title">vs Stockfish</h2>
          <p className="mode-card__desc">Affrontez le moteur d'IA local</p>

          <div className="mode-card__config" onClick={e => e.stopPropagation()}>
            <label className="config-label">
              Difficulté — <strong>{DIFFICULTY_LABELS[botSkill]}</strong>
              <input
                type="range" min={1} max={8} value={botSkill}
                onChange={e => setBotSkill(Number(e.target.value))}
                className="config-slider"
              />
            </label>
            <div className="config-colors">
              {(['white', 'black', 'random'] as const).map(c => (
                <button
                  key={c}
                  className={`color-btn ${botColor === c ? 'color-btn--active' : ''}`}
                  onClick={() => setBotColor(c)}
                >
                  {c === 'white' ? '♔ Blancs' : c === 'black' ? '♚ Noirs' : '🎲 Aléatoire'}
                </button>
              ))}
            </div>
          </div>

          <button
            className="mode-card__cta"
            onClick={() => onSelect('bot', { skillLevel: botSkill, playerColor: botColor })}
          >
            Jouer
          </button>
        </div>

        {/* Lichess online */}
        <div className="mode-card" onClick={lichessUser ? () => onSelect('lichess') : undefined}>
          <span className="mode-card__icon">🌐</span>
          <h2 className="mode-card__title">Lichess</h2>
          <p className="mode-card__desc">Jouez en ligne contre des joueurs du monde entier</p>
          {lichessUser ? (
            <span className="mode-card__badge">Connecté : {lichessUser.username}</span>
          ) : (
            <button
              className="mode-card__cta mode-card__cta--secondary"
              onClick={e => { e.stopPropagation(); onLichessLogin(); }}
            >
              Se connecter à Lichess
            </button>
          )}
        </div>

        {/* Analyse */}
        <div className="mode-card" onClick={() => onSelect('analysis')}>
          <span className="mode-card__icon">🔍</span>
          <h2 className="mode-card__title">Analyse</h2>
          <p className="mode-card__desc">Explorez librement, importez un FEN ou naviguez l'historique</p>
        </div>

        {/* Puzzles */}
        <div className="mode-card" onClick={() => onSelect('puzzle')}>
          <span className="mode-card__icon">🧩</span>
          <h2 className="mode-card__title">Puzzles</h2>
          <p className="mode-card__desc">Résolvez des tactiques depuis la base Lichess</p>
        </div>

      </div>

    </div>
  );
}
