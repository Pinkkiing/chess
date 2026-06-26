import './CapturedPieces.css';

type PieceType = 'q' | 'r' | 'b' | 'n' | 'p';

// Unicode symbols: index 0 = white piece, index 1 = black piece
const SYMBOLS: Record<PieceType, [string, string]> = {
  q: ['♕', '♛'],
  r: ['♖', '♜'],
  b: ['♗', '♝'],
  n: ['♘', '♞'],
  p: ['♙', '♟'],
};

interface CapturedPiecesProps {
  pieces: PieceType[];       // pieces captured by this player
  capturedColor: 'white' | 'black'; // color of the captured pieces (opponent's color)
  advantage: number;         // score lead for this player (positive = good)
}

export function CapturedPieces({ pieces, capturedColor, advantage }: CapturedPiecesProps) {
  if (pieces.length === 0 && advantage <= 0) return null;

  const symbolIndex = capturedColor === 'white' ? 0 : 1;

  return (
    <div className="captured">
      <span className="captured__pieces">
        {pieces.map((p, i) => (
          <span key={i} className="captured__piece">{SYMBOLS[p][symbolIndex]}</span>
        ))}
      </span>
      {advantage > 0 && (
        <span className="captured__advantage">+{advantage}</span>
      )}
    </div>
  );
}
