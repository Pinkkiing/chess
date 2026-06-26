import { useEffect, useRef } from 'react';
import type { MoveClassification, MoveClass } from '../../hooks/useGameAnalysis';
import './MoveList.css';

interface MoveListProps {
  moves: string[];
  currentIndex?: number;
  onSelectMove?: (index: number) => void;
  classifications?: MoveClassification[];
}

const CLASS_META: Record<MoveClass, { symbol: string; color: string; title: string }> = {
  brilliant:  { symbol: '!!', color: '#21d0d0', title: 'Brillant'          },
  excellent:  { symbol: '!',  color: '#5ca0f5', title: 'Excellent'         },
  best:       { symbol: '★',  color: '#4fc97e', title: 'Meilleur'          },
  very_good:  { symbol: '✓',  color: '#80c080', title: 'Très bien'         },
  good:       { symbol: '⊙',  color: '#96a8c8', title: 'Bon'               },
  inaccuracy: { symbol: '?!', color: '#f5c030', title: 'Imprécision'       },
  mistake:    { symbol: '?',  color: '#e08030', title: 'Erreur'            },
  miss:       { symbol: '✗',  color: '#d04040', title: 'Manqué'           },
  blunder:    { symbol: '??', color: '#cc2020', title: 'Gaffe'             },
};

function ClassBadge({ cls }: { cls: MoveClass }) {
  const meta = CLASS_META[cls];
  return (
    <span
      className="move-class-badge"
      style={{ color: meta.color }}
      title={meta.title}
    >
      {meta.symbol}
    </span>
  );
}

export function MoveList({ moves, currentIndex, onSelectMove, classifications }: MoveListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moves.length]);

  const clsMap = new Map(classifications?.map(c => [c.moveIndex, c]));

  const pairs: [string, string | undefined][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1]]);
  }

  return (
    <div className="move-list">
      <div className="move-list__inner">
        {pairs.map(([white, black], pairIndex) => (
          <div key={pairIndex} className="move-list__pair">
            <span className="move-list__num">{pairIndex + 1}.</span>

            <span
              className={`move-list__move ${currentIndex === pairIndex * 2 ? 'move-list__move--active' : ''}`}
              onClick={() => onSelectMove?.(pairIndex * 2)}
            >
              {white}
              {clsMap.has(pairIndex * 2) && (
                <ClassBadge cls={clsMap.get(pairIndex * 2)!.classification} />
              )}
            </span>

            {black !== undefined && (
              <span
                className={`move-list__move ${currentIndex === pairIndex * 2 + 1 ? 'move-list__move--active' : ''}`}
                onClick={() => onSelectMove?.(pairIndex * 2 + 1)}
              >
                {black}
                {clsMap.has(pairIndex * 2 + 1) && (
                  <ClassBadge cls={clsMap.get(pairIndex * 2 + 1)!.classification} />
                )}
              </span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
