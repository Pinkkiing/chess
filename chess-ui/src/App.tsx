import { useState, useEffect, useMemo, useRef } from 'react';
import { Chess } from 'chess.js';

import { Board } from './components/Board/Board';
import { Clock } from './components/Clock/Clock';
import { MoveList } from './components/MoveList/MoveList';
import { PlayerInfo } from './components/PlayerInfo/PlayerInfo';
import { EvalBar } from './components/EvalBar/EvalBar';
import { Settings } from './components/Settings/Settings';
import { LichessPanel } from './components/LichessPanel/LichessPanel';
import { ModeSelect } from './components/ModeSelect/ModeSelect';
import { AnalysisControls } from './components/AnalysisControls/AnalysisControls';
import { PuzzlePanel } from './components/PuzzlePanel/PuzzlePanel';
import { GameOverModal } from './components/GameOverModal/GameOverModal';

import { useChessGame } from './hooks/useChessGame';
import { useBotGame } from './hooks/useBotGame';
import { useAnalysisGame } from './hooks/useAnalysisGame';
import { usePuzzleGame } from './hooks/usePuzzleGame';
import { useStockfish } from './hooks/useStockfish';
import { useGameAnalysis } from './hooks/useGameAnalysis';
import { useLichessAuth } from './hooks/useLichessAuth';
import { useLichessGame } from './hooks/useLichessGame';
import { useTheme } from './contexts/ThemeContext';

import { CapturedPieces } from './components/CapturedPieces/CapturedPieces';
import { EvalChart } from './components/EvalChart/EvalChart';
import { AnalysisSummary } from './components/AnalysisSummary/AnalysisSummary';
import { GameHistory } from './components/GameHistory/GameHistory';
import { computeCaptured } from './utils/capturedPieces';
import { useGameHistory } from './hooks/useGameHistory';
import type { Player, Color, EndReason } from './types/game';
import type { GameMode, BotConfig } from './types/mode';
import './App.css';

const INITIAL_TIME_MS = 10 * 60 * 1000;

// ─── Small helper hooks kept inline ──────────────────────────────────────────
function useLocalClock(turn: Color, status: string, moveCount: number) {
  const [clock, setClock] = useState({ white: INITIAL_TIME_MS, black: INITIAL_TIME_MS, running: false, activeColor: 'white' as Color });

  useEffect(() => {
    if (status === 'playing' && moveCount > 0) setClock(c => ({ ...c, running: true, activeColor: turn }));
    if (status === 'ended') setClock(c => ({ ...c, running: false }));
  }, [turn, status, moveCount]);

  useEffect(() => {
    if (!clock.running) return;
    const id = setInterval(() => setClock(c => {
      const next = { ...c, [c.activeColor]: c[c.activeColor] - 100 };
      return next[c.activeColor] <= 0 ? { ...next, [c.activeColor]: 0, running: false } : next;
    }), 100);
    return () => clearInterval(id);
  }, [clock.running]);

  const reset = () => setClock({ white: INITIAL_TIME_MS, black: INITIAL_TIME_MS, running: false, activeColor: 'white' });
  return { clock, resetClock: reset };
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState<GameMode>('menu');
  const [botConfig, setBotConfig] = useState<BotConfig>({ skillLevel: 3, playerColor: 'white' });
  const [botPlayerColor, setBotPlayerColor] = useState<Color>('white');

  const { analysisEnabled } = useTheme();
  const { games, addGame, clearHistory } = useGameHistory();

  // ─── Auth (always active) ─────────────────────────────────────────────────
  const { token, user, loading: authLoading, login, logout } = useLichessAuth();

  // ─── Hooks for each mode (always mounted to avoid re-init on switch) ──────
  const local = useChessGame();
  const bot = useBotGame(botPlayerColor, botConfig.skillLevel);
  const analysis = useAnalysisGame();
  const puzzle = usePuzzleGame();
  const lichess = useLichessGame(token, user?.id ?? null);

  // ─── Stockfish analysis ───────────────────────────────────────────────────
  const activeFen = (() => {
    if (mode === 'local') return local.gameState.fen;
    if (mode === 'bot') return bot.gameState.fen;
    if (mode === 'analysis') return analysis.state.fen;
    if (mode === 'puzzle') return puzzle.ps.gameState.fen;
    if (mode === 'lichess') return lichess.gameState.fen;
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  })();

  const sfEnabled = analysisEnabled || mode === 'analysis';
  const { result: sfResult, analyze } = useStockfish(sfEnabled && mode !== 'puzzle');
  useEffect(() => { if (sfEnabled) analyze(activeFen); }, [activeFen, sfEnabled, analyze]);

  const shapes = useMemo(() => {
    if (!sfEnabled || !sfResult.bestMove || sfResult.bestMove.length < 4) return [];
    return [{ orig: sfResult.bestMove.slice(0, 2), dest: sfResult.bestMove.slice(2, 4), brush: 'blue' as const }];
  }, [sfEnabled, sfResult.bestMove]);

  // ─── Full game analysis (analysis mode only) ──────────────────────────────
  const analysisMoves = mode === 'analysis' ? analysis.state.allMoves : [];
  const { result: gameAnalysis, progress: analysisProgress, analyzing: analysisRunning } =
    useGameAnalysis(analysisMoves, mode === 'analysis' && analysisMoves.length > 0);

  const captured = useMemo(() => computeCaptured(activeFen), [activeFen]);

  const badge = useMemo(() => {
    if (mode !== 'analysis' || !gameAnalysis || analysis.state.currentIndex < 0) return undefined;
    const cls = gameAnalysis.classifications[analysis.state.currentIndex];
    const dest = analysis.state.lastMove?.to;
    if (!cls || !dest) return undefined;
    const META: Record<string, { symbol: string; color: string }> = {
      brilliant:  { symbol: '!!', color: '#21d0d0' },
      excellent:  { symbol: '!',  color: '#5ca0f5' },
      best:       { symbol: '★',  color: '#4fc97e' },
      very_good:  { symbol: '✓',  color: '#80c080' },
      good:       { symbol: '⊙',  color: '#96a8c8' },
      inaccuracy: { symbol: '?!', color: '#f5c030' },
      mistake:    { symbol: '?',  color: '#e08030' },
      miss:       { symbol: '✗',  color: '#d04040' },
      blunder:    { symbol: '??', color: '#cc2020' },
    };
    const meta = META[cls];
    if (!meta) return undefined;
    return { square: dest, symbol: meta.symbol, color: meta.color };
  }, [mode, gameAnalysis, analysis.state.currentIndex, analysis.state.lastMove]);

  // ─── Local clocks ─────────────────────────────────────────────────────────
  const { clock: localClock, resetClock } = useLocalClock(local.gameState.turn, local.gameState.status, local.gameState.moves.length);

  // ─── Auto-save completed games ────────────────────────────────────────────
  const localSavedRef = useRef(false);
  useEffect(() => {
    if (local.gameState.status === 'playing') { localSavedRef.current = false; return; }
    if (local.gameState.status !== 'ended' || localSavedRef.current) return;
    localSavedRef.current = true;
    addGame({
      mode: 'local', whiteName: 'Joueur 1', blackName: 'Joueur 2',
      result: local.gameState.winner ?? 'draw',
      endReason: local.gameState.endReason ?? 'draw',
      moves: local.gameState.moves,
    });
  }, [local.gameState.status, local.gameState.winner, local.gameState.endReason, local.gameState.moves, addGame]);

  const botSavedRef = useRef(false);
  useEffect(() => {
    if (bot.gameState.status === 'playing') { botSavedRef.current = false; return; }
    if (bot.gameState.status !== 'ended' || botSavedRef.current) return;
    botSavedRef.current = true;
    const wName = botPlayerColor === 'white' ? 'Vous' : `Stockfish nv.${botConfig.skillLevel}`;
    const bName = botPlayerColor === 'black' ? 'Vous' : `Stockfish nv.${botConfig.skillLevel}`;
    addGame({
      mode: 'bot', whiteName: wName, blackName: bName,
      result: bot.gameState.winner ?? 'draw',
      endReason: bot.gameState.endReason ?? 'draw',
      moves: bot.gameState.moves,
    });
  }, [bot.gameState.status, bot.gameState.winner, bot.gameState.endReason, bot.gameState.moves, botPlayerColor, botConfig.skillLevel, addGame]);

  // ─── Analyze a past game ──────────────────────────────────────────────────
  function analyzeGame(record: import('./types/history').GameRecord) {
    const ch = new Chess();
    for (const m of record.moves) ch.move(m);
    analysis.loadPgn(ch.pgn());
    setMode('analysis');
  }

  // ─── Mode select ──────────────────────────────────────────────────────────
  function handleModeSelect(m: GameMode, bc?: BotConfig) {
    if (m === 'bot' && bc) {
      const color: Color = bc.playerColor === 'random'
        ? (Math.random() < 0.5 ? 'white' : 'black')
        : bc.playerColor;
      setBotConfig(bc);
      setBotPlayerColor(color);
    }
    setMode(m);
  }

  if (mode === 'history') {
    return (
      <GameHistory
        games={games}
        onAnalyze={analyzeGame}
        onClear={clearHistory}
        onBack={() => setMode('menu')}
      />
    );
  }

  if (mode === 'menu') {
    return (
      <ModeSelect
        onSelect={handleModeSelect}
        lichessUser={user}
        onLichessLogin={login}
      />
    );
  }

  // ─── Build the active game descriptor based on mode ───────────────────────
  type GameDescriptor = {
    fen: string; turn: Color; check: boolean; moves: string[]; status: string; winner?: Color; endReason?: EndReason;
    orientation: Color; myColor?: Color;
    whiteName: string; blackName: string; whiteRating?: number; blackRating?: number;
    whiteTimeMs?: number; blackTimeMs?: number;
    onMove: (f: string, t: string) => boolean | Promise<boolean>;
    getLegalMoves?: (sq: string) => string[];
    currentMoveIndex?: number;
  };

  let game: GameDescriptor;

  if (mode === 'local') {
    const gs = local.gameState;
    game = {
      ...gs, orientation: 'white', myColor: undefined,
      whiteName: 'Joueur 1', blackName: 'Joueur 2', whiteRating: 1500, blackRating: 1500,
      whiteTimeMs: localClock.white, blackTimeMs: localClock.black,
      onMove: (f, t) => local.makeMove(f, t),
      getLegalMoves: local.getLegalMoves,
    };
  } else if (mode === 'bot') {
    const gs = bot.gameState;
    game = {
      ...gs, orientation: botPlayerColor, myColor: botPlayerColor,
      whiteName: botPlayerColor === 'white' ? 'Vous' : `Stockfish nv.${botConfig.skillLevel}`,
      blackName:  botPlayerColor === 'black' ? 'Vous' : `Stockfish nv.${botConfig.skillLevel}`,
      onMove: (f, t) => bot.makeMove(f, t),
      getLegalMoves: bot.getLegalMoves,
    };
  } else if (mode === 'analysis') {
    const gs = analysis.state;
    game = {
      ...gs, orientation: 'white', myColor: undefined,
      whiteName: 'Blancs', blackName: 'Noirs',
      onMove: (f, t) => analysis.makeMove(f, t),
      getLegalMoves: analysis.getLegalMoves,
      currentMoveIndex: gs.currentIndex,
    };
  } else if (mode === 'puzzle') {
    const gs = puzzle.ps.gameState;
    const pz = puzzle.ps.puzzle;
    game = {
      ...gs, orientation: pz?.playerColor ?? 'white', myColor: pz?.playerColor,
      whiteName: 'Blancs', blackName: 'Noirs',
      onMove: (f, t) => puzzle.makeMove(f, t),
      getLegalMoves: puzzle.getLegalMoves,
    };
  } else {
    // lichess
    const gs = lichess.gameState;
    const info = lichess.gameInfo;
    const myColor = info?.myColor ?? 'white';
    const whiteIsMe = myColor === 'white';
    game = {
      ...gs, orientation: myColor, myColor,
      whiteName: whiteIsMe ? (user?.username ?? 'Vous') : (info?.opponentName ?? '?'),
      blackName:  whiteIsMe ? (info?.opponentName ?? '?') : (user?.username ?? 'Vous'),
      whiteRating: whiteIsMe ? user?.rating : info?.opponentRating,
      blackRating:  whiteIsMe ? info?.opponentRating : user?.rating,
      whiteTimeMs: lichess.clocks.white, blackTimeMs: lichess.clocks.black,
      onMove: (f, t) => lichess.sendMove(f, t),
    };
  }

  const whitePlayer: Player = { name: game.whiteName, color: 'white', rating: game.whiteRating };
  const blackPlayer: Player = { name: game.blackName, color: 'black', rating: game.blackRating };
  const topPlayer    = game.orientation === 'white' ? blackPlayer : whitePlayer;
  const bottomPlayer = game.orientation === 'white' ? whitePlayer : blackPlayer;
  const topTimeMs    = game.orientation === 'white' ? game.blackTimeMs : game.whiteTimeMs;
  const bottomTimeMs = game.orientation === 'white' ? game.whiteTimeMs : game.blackTimeMs;
  const topColor    = game.orientation === 'white' ? 'black' : 'white';
  const bottomColor = game.orientation === 'white' ? 'white' : 'black';
  const topActive    = game.turn === topColor    && game.status === 'playing';
  const bottomActive = game.turn === bottomColor && game.status === 'playing';

  const topIsBlack = game.orientation === 'white';
  const topCaptures    = topIsBlack ? captured.byBlack : captured.byWhite;
  const bottomCaptures = topIsBlack ? captured.byWhite : captured.byBlack;
  const topCapturedColor:    'white' | 'black' = topIsBlack ? 'white' : 'black';
  const bottomCapturedColor: 'white' | 'black' = topIsBlack ? 'black' : 'white';
  const topAdvantage    = topIsBlack ? -captured.advantage : captured.advantage;
  const bottomAdvantage = topIsBlack ?  captured.advantage : -captured.advantage;

  const modeLabel: Record<GameMode, string> = {
    menu: '', local: '2 Joueurs', bot: 'vs Bot', lichess: 'Lichess', analysis: 'Analyse', puzzle: 'Puzzles', history: 'Historique',
  };

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-left">
          <button className="btn btn--ghost btn--sm" onClick={() => setMode('menu')}>← Menu</button>
          <span className="app__mode-label">{modeLabel[mode]}</span>
        </div>
        <div className="app__header-actions">
          <Settings />
          {token ? (
            <div className="lichess-user-badge">
              <span>{user?.username}</span>
              <button className="btn btn--ghost btn--sm" onClick={logout}>✕</button>
            </div>
          ) : mode === 'lichess' ? (
            <button className="btn btn--ghost btn--sm" onClick={login} disabled={authLoading}>
              {authLoading ? '…' : '🔗 Connexion Lichess'}
            </button>
          ) : null}
        </div>
      </header>

      <main className="app__main">
        <section className="game-panel">
          <div className="game-panel__player-slot">
            <div className="game-panel__row">
              <PlayerInfo player={topPlayer} isActive={topActive} />
              {topTimeMs !== undefined && <Clock timeMs={topTimeMs} color={topColor} active={topActive} />}
              {mode === 'bot' && game.turn === bot.botColor && bot.botThinking && (
                <span className="bot-thinking">⏳</span>
              )}
            </div>
            <CapturedPieces pieces={topCaptures} capturedColor={topCapturedColor} advantage={topAdvantage} />
          </div>

          <div className="game-panel__board-row">
            {sfEnabled && mode !== 'puzzle' && <EvalBar result={sfResult} />}
            <Board
              fen={game.fen}
              turn={game.turn}
              orientation={game.orientation}
              check={game.check}
              onMove={game.onMove}
              getLegalMoves={game.getLegalMoves}
              myColor={game.myColor}
              shapes={shapes}
              badge={badge}
            />
          </div>

          <div className="game-panel__player-slot">
            <CapturedPieces pieces={bottomCaptures} capturedColor={bottomCapturedColor} advantage={bottomAdvantage} />
            <div className="game-panel__row">
              <PlayerInfo player={bottomPlayer} isActive={bottomActive} />
              {bottomTimeMs !== undefined && <Clock timeMs={bottomTimeMs} color={bottomColor} active={bottomActive} />}
            </div>
          </div>

          {(mode === 'local' || mode === 'bot') && (
            <div className="game-panel__actions">
              {game.status === 'playing' && (
                <button
                  className="btn btn--ghost btn--danger"
                  onClick={mode === 'bot' ? bot.resign : () => local.resign(game.turn)}
                >
                  ⚑ Abandonner
                </button>
              )}
              <button
                className="btn btn--ghost"
                onClick={mode === 'bot' ? bot.reset : () => { local.reset(); resetClock(); }}
              >
                ↺ Nouvelle partie
              </button>
            </div>
          )}
        </section>

        <aside className="sidebar">
          {game.status === 'ended' && (
            <div className="result-banner">
              {game.winner
                ? `${(game.winner === 'white' ? game.whiteName : game.blackName) ?? game.winner} gagne !`
                : 'Partie nulle'}
            </div>
          )}

          {mode === 'lichess' && token && user && (
            <LichessPanel
              token={token} user={user}
              gameInfo={lichess.gameInfo}
              seeking={lichess.seeking}
              onSeek={() => lichess.setSeeking(true)}
              onResign={lichess.resign}
            />
          )}

          {mode === 'analysis' && gameAnalysis && (
            <EvalChart
              evals={gameAnalysis.evals}
              classifications={gameAnalysis.classifications}
              currentIndex={analysis.state.currentIndex}
              onSelectMove={analysis.goToIndex}
            />
          )}

          {mode === 'analysis' && gameAnalysis && (
            <AnalysisSummary
              result={gameAnalysis}
              whiteName={game.whiteName}
              blackName={game.blackName}
            />
          )}

          {mode === 'analysis' && (
            <AnalysisControls
              canGoBack={analysis.state.currentIndex >= 0}
              canGoForward={analysis.state.currentIndex < analysis.state.allMoves.length - 1}
              onBack={analysis.goBack}
              onForward={analysis.goForward}
              onReset={analysis.reset}
              onLoadFen={analysis.loadFen}
              onLoadPgn={analysis.loadPgn}
            />
          )}

          {mode === 'puzzle' && (
            <PuzzlePanel
              ps={puzzle.ps}
              onNext={puzzle.nextPuzzle}
              onRetry={puzzle.retryPuzzle}
              onDaily={puzzle.loadDailyPuzzle}
            />
          )}

          {mode === 'analysis' && analysisRunning && (
            <div className="analysis-progress">
              <div className="analysis-progress__bar" style={{ width: `${Math.round(analysisProgress * 100)}%` }} />
              <span>Analyse… {Math.round(analysisProgress * 100)}%</span>
            </div>
          )}

          <MoveList
            moves={mode === 'analysis' ? analysis.state.allMoves : game.moves}
            currentIndex={mode === 'analysis' ? analysis.state.currentIndex : game.moves.length - 1}
            onSelectMove={mode === 'analysis' ? analysis.goToIndex : undefined}
            classifications={mode === 'analysis' ? gameAnalysis?.classifications : undefined}
          />
        </aside>
      </main>

      {(mode === 'local' || mode === 'bot') && game.status === 'ended' && (
        <GameOverModal
          winner={game.winner}
          endReason={game.endReason}
          myColor={game.myColor}
          whiteName={game.whiteName}
          blackName={game.blackName}
          onNewGame={() => mode === 'bot' ? bot.reset() : (local.reset(), resetClock())}
          onMenu={() => setMode('menu')}
        />
      )}
    </div>
  );
}
