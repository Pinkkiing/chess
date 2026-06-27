import { useMemo } from 'react';
import type { LichessUser } from '../../hooks/useLichessAuth';
import type { GameRecord } from '../../types/history';
import { useRatingHistory } from '../../hooks/useRatingHistory';
import { RatingChart } from './RatingChart';
import './Profile.css';

interface ProfileProps {
  user: LichessUser | null;
  games: GameRecord[];
  onAnalyze: (record: GameRecord) => void;
  onBack: () => void;
}

const CATEGORIES = [
  { label: 'Bullet',    key: 'bullet'    as const, icon: '⚡' },
  { label: 'Blitz',     key: 'blitz'     as const, icon: '🔥' },
  { label: 'Rapide',    key: 'rapid'     as const, icon: '⏱' },
  { label: 'Classique', key: 'classical' as const, icon: '🏰' },
];

const END_REASON: Record<string, string> = {
  checkmate:   'Échec et mat',
  stalemate:   'Pat',
  resignation: 'Abandon',
  draw:        'Nulle',
};

function groupByDate(games: GameRecord[]) {
  const groups: { key: string; label: string; games: GameRecord[] }[] = [];
  for (const g of games) {
    const d   = new Date(g.date);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const last = groups[groups.length - 1];
    if (last?.key === key) last.games.push(g);
    else groups.push({ key, label, games: [g] });
  }
  return groups;
}

function ResultDot({ record }: { record: GameRecord }) {
  const playerColor = record.mode === 'bot'
    ? (record.whiteName === 'Vous' ? 'white' : 'black')
    : undefined;

  if (record.result === 'draw') return <span className="act-dot act-dot--draw" title="Nulle" />;
  if (!playerColor) return <span className="act-dot act-dot--neutral" title={record.result === 'white' ? 'Blancs gagnent' : 'Noirs gagnent'} />;
  const won = record.result === playerColor;
  return <span className={`act-dot ${won ? 'act-dot--win' : 'act-dot--loss'}`} title={won ? 'Victoire' : 'Défaite'} />;
}

export function Profile({ user, games, onAnalyze }: Omit<ProfileProps, 'onBack'>) {
  const { lines, loading } = useRatingHistory(user?.username ?? null);

  const stats = useMemo(() => {
    let wins = 0, draws = 0, losses = 0;
    for (const g of games) {
      if (g.result === 'draw') { draws++; continue; }
      const playerColor = g.mode === 'bot'
        ? (g.whiteName === 'Vous' ? 'white' : 'black')
        : 'white'; // local: count white as "player 1"
      if (g.result === playerColor) wins++; else losses++;
    }
    return { total: games.length, wins, draws, losses };
  }, [games]);

  const groups = useMemo(() => groupByDate(games), [games]);

  const winPct = stats.total > 0 ? Math.round((stats.wins  / stats.total) * 100) : 0;
  const drwPct = stats.total > 0 ? Math.round((stats.draws / stats.total) * 100) : 0;
  const lsPct  = stats.total > 0 ? 100 - winPct - drwPct : 0;

  return (
    <div className="profile-page">
      {/* ── Header ── */}
      <header className="profile-header">
        <div className="profile-identity">
          <div className="profile-avatar">♟</div>
          <div className="profile-identity__info">
            <span className="profile-username">{user?.username ?? 'Joueur local'}</span>
            {user && (
              <span className="profile-online">
                <span className="profile-online__dot" /> En ligne
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="profile-body">
        {/* ── Aside ── */}
        <aside className="profile-aside">

          {/* Lichess ratings */}
          {user && (
            <section className="profile-card">
              <h3 className="profile-card__title">Ratings Lichess</h3>
              <div className="rating-list">
                {CATEGORIES.map(cat => {
                  const r = user.ratings[cat.key];
                  if (!r) return null;
                  return (
                    <div key={cat.key} className="rating-item">
                      <span className="rating-item__icon">{cat.icon}</span>
                      <span className="rating-item__label">{cat.label}</span>
                      <span className="rating-item__value">{r}</span>
                    </div>
                  );
                })}
                {!Object.values(user.ratings).some(Boolean) && (
                  <p className="profile-muted">Aucun classement</p>
                )}
              </div>
            </section>
          )}

          {/* Local W/D/L */}
          <section className="profile-card">
            <h3 className="profile-card__title">Parties locales</h3>
            {stats.total === 0 ? (
              <p className="profile-muted">Aucune partie jouée</p>
            ) : (
              <>
                <p className="profile-total">{stats.total} partie{stats.total > 1 ? 's' : ''}</p>
                <div className="wdl">
                  <div className="wdl-bar">
                    <div className="wdl-seg wdl-seg--win"  style={{ width: `${winPct}%` }} />
                    <div className="wdl-seg wdl-seg--draw" style={{ width: `${drwPct}%` }} />
                    <div className="wdl-seg wdl-seg--loss" style={{ width: `${lsPct}%`  }} />
                  </div>
                  <div className="wdl-labels">
                    <span className="wdl-label wdl-label--win">{stats.wins}V <small>{winPct}%</small></span>
                    <span className="wdl-label wdl-label--draw">{stats.draws}N <small>{drwPct}%</small></span>
                    <span className="wdl-label wdl-label--loss">{stats.losses}D <small>{lsPct}%</small></span>
                  </div>
                </div>
              </>
            )}
          </section>
        </aside>

        {/* ── Main ── */}
        <main className="profile-main">

          {/* Rating chart */}
          {user && (
            <section className="profile-card">
              <h3 className="profile-card__title">Progression</h3>
              {loading
                ? <p className="profile-muted">Chargement…</p>
                : <RatingChart lines={lines} />
              }
            </section>
          )}

          {/* Activity feed */}
          <section className="profile-card">
            <h3 className="profile-card__title">Activité récente</h3>
            {groups.length === 0 ? (
              <p className="profile-muted">Aucune partie enregistrée — jouez une partie locale ou contre le bot pour la voir apparaître ici.</p>
            ) : (
              groups.map(group => (
                <div key={group.key} className="act-group">
                  <div className="act-group__date">{group.label}</div>
                  {group.games.map(g => (
                    <div key={g.id} className="act-item">
                      <ResultDot record={g} />
                      <div className="act-item__info">
                        <span className="act-item__players">{g.whiteName} vs {g.blackName}</span>
                        <span className="act-item__meta">
                          {END_REASON[g.endReason]} · {g.moves.length} coup{g.moves.length > 1 ? 's' : ''} · {g.mode === 'bot' ? 'vs Stockfish' : '2 Joueurs'}
                        </span>
                      </div>
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => onAnalyze(g)}
                        disabled={g.moves.length === 0}
                        title="Analyser cette partie"
                      >
                        🔍
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
