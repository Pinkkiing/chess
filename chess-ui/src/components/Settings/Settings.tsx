import { useState } from 'react';
import { BOARD_THEMES, useTheme } from '../../contexts/ThemeContext';
import './Settings.css';

export function Settings() {
  const [open, setOpen] = useState(false);
  const { boardTheme, setBoardTheme, analysisEnabled, setAnalysisEnabled } = useTheme();

  return (
    <>
      <button className="btn btn--ghost settings-btn" onClick={() => setOpen(o => !o)} title="Paramètres">
        ⚙
      </button>

      {open && (
        <div className="settings-overlay" onClick={() => setOpen(false)}>
          <div className="settings-panel" onClick={e => e.stopPropagation()}>
            <h3 className="settings-panel__title">Paramètres</h3>

            <section className="settings-section">
              <h4>Couleur du plateau</h4>
              <div className="theme-grid">
                {BOARD_THEMES.map(t => (
                  <button
                    key={t.id}
                    className={`theme-swatch ${boardTheme === t.id ? 'theme-swatch--active' : ''}`}
                    onClick={() => setBoardTheme(t.id)}
                    title={t.label}
                  >
                    <span className="theme-swatch__preview">
                      <span style={{ background: t.light }} />
                      <span style={{ background: t.dark }} />
                      <span style={{ background: t.dark }} />
                      <span style={{ background: t.light }} />
                    </span>
                    <span className="theme-swatch__label">{t.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="settings-section">
              <h4>Analyse Stockfish</h4>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={analysisEnabled}
                  onChange={e => setAnalysisEnabled(e.target.checked)}
                />
                <span className="toggle__slider" />
                <span className="toggle__label">{analysisEnabled ? 'Activée' : 'Désactivée'}</span>
              </label>
            </section>

            <button className="btn btn--ghost settings-panel__close" onClick={() => setOpen(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
