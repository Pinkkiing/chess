import './Clock.css';
import type { Color } from '../../types/game';

interface ClockProps {
  timeMs: number;
  color: Color;
  active: boolean;
}

const UNLIMITED = 2_147_483_647; // lichess sends this for bots / unlimited time

export function Clock({ timeMs, color, active }: ClockProps) {
  if (timeMs >= UNLIMITED) {
    return (
      <div className={`clock clock--${color} ${active ? 'clock--active' : ''}`}>
        <span className="clock__time clock__time--inf">∞</span>
      </div>
    );
  }

  const totalSeconds = Math.max(0, Math.floor(timeMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isLow = totalSeconds < 30;

  return (
    <div className={`clock clock--${color} ${active ? 'clock--active' : ''} ${isLow ? 'clock--low' : ''}`}>
      <span className="clock__time">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
