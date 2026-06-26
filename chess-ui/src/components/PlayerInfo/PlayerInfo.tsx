import './PlayerInfo.css';
import type { Player } from '../../types/game';

interface PlayerInfoProps {
  player: Player;
  isActive: boolean;
}

export function PlayerInfo({ player, isActive }: PlayerInfoProps) {
  return (
    <div className={`player-info ${isActive ? 'player-info--active' : ''}`}>
      <div className={`player-info__piece player-info__piece--${player.color}`} />
      <div className="player-info__details">
        {player.title && <span className="player-info__title">{player.title}</span>}
        <span className="player-info__name">{player.name}</span>
        {player.rating !== undefined && (
          <span className="player-info__rating">({player.rating})</span>
        )}
      </div>
    </div>
  );
}
