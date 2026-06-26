import type { Color, EndReason } from '../../types/game';
import './GameOverModal.css';

interface GameOverModalProps {
  winner?: Color;
  endReason?: EndReason;
  myColor?: Color;
  whiteName: string;
  blackName: string;
  onNewGame: () => void;
  onMenu: () => void;
}

const REASON_LABEL: Record<EndReason, string> = {
  checkmate:   'par échec et mat',
  stalemate:   'par pat',
  resignation: 'par abandon',
  draw:        'partie nulle',
};

export function GameOverModal({ winner, endReason, myColor, whiteName, blackName, onNewGame, onMenu }: GameOverModalProps) {
  const isDraw = !winner;
  const iWon  = myColor ? winner === myColor : false;
  const iLost = myColor ? !isDraw && !iWon : false;

  let icon: string;
  let title: string;
  let titleClass: string;

  if (isDraw) {
    icon = '🤝'; title = 'Partie nulle'; titleClass = 'modal-title--draw';
  } else if (myColor) {
    icon = iWon ? '🏆' : '💀';
    title = iWon ? 'Victoire !' : 'Défaite';
    titleClass = iWon ? 'modal-title--win' : 'modal-title--loss';
  } else {
    icon = '🏆';
    title = `${winner === 'white' ? whiteName : blackName} gagne !`;
    titleClass = 'modal-title--win';
  }

  const winnerName = winner === 'white' ? whiteName : blackName;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-icon">{icon}</div>
        <h2 className={`modal-title ${titleClass}`}>{title}</h2>

        {endReason && (
          <p className="modal-reason">{REASON_LABEL[endReason]}</p>
        )}

        {!isDraw && (
          <div className="modal-players">
            <span className={winner === 'white' ? 'modal-player modal-player--winner' : 'modal-player'}>
              {whiteName}
            </span>
            <span className="modal-vs">vs</span>
            <span className={winner === 'black' ? 'modal-player modal-player--winner' : 'modal-player'}>
              {blackName}
            </span>
          </div>
        )}

        {!isDraw && (
          <p className="modal-winner-line">
            {winnerName} gagne
          </p>
        )}

        <div className="modal-actions">
          <button className="btn btn--primary modal-btn" onClick={onNewGame}>
            ↺ Nouvelle partie
          </button>
          <button className="btn btn--ghost modal-btn" onClick={onMenu}>
            ← Menu
          </button>
        </div>
      </div>
    </div>
  );
}
