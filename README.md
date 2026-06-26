# Chess UI

Application d'échecs complète tournant entièrement dans le navigateur, construite avec React + TypeScript + Vite.

## Modes de jeu

| Mode | Description |
|------|-------------|
| **2 Joueurs** | Partie locale sur le même écran avec pendule 10 min |
| **vs Stockfish** | Affrontez le moteur IA à 8 niveaux de difficulté (Novice → Maximum) |
| **Lichess** | Jouez en ligne via l'API Board de Lichess (authentification OAuth PKCE) |
| **Analyse** | Échiquier libre avec évaluation Stockfish, import FEN/PGN, classification des coups |
| **Puzzles** | Résolvez des tactiques tirées de la base Lichess (aléatoire ou puzzle du jour) |
| **Historique** | Consultez et ré-analysez vos parties passées |

## Stack technique

- **React 19** + **TypeScript 6** + **Vite 8**
- [`@lichess-org/chessground`](https://github.com/lichess-org/chessground) — rendu de l'échiquier
- [`chess.js`](https://github.com/jhlywa/chess.js) — logique des règles d'échecs
- [`chessops`](https://github.com/niklasf/chessops) — opérations avancées
- **Stockfish 18** (WASM) en Web Worker — moteur d'analyse
- **Lichess Board API** (streaming NDJSON) — parties en ligne

## Architecture

```
chess-ui/
├── src/
│   ├── api/
│   │   ├── lichess.ts       # Board API, streaming NDJSON, types
│   │   └── puzzles.ts       # Fetch puzzle aléatoire / du jour
│   ├── components/
│   │   ├── Board/           # Échiquier (chessground)
│   │   ├── EvalBar/         # Barre d'évaluation verticale
│   │   ├── EvalChart/       # Graphe d'évaluation sur la partie
│   │   ├── AnalysisSummary/ # Précision blanche/noire + comptage coups
│   │   ├── AnalysisControls/# Navigation dans l'analyse (FEN/PGN, ← →)
│   │   ├── MoveList/        # Liste des coups avec badges de classification
│   │   ├── PuzzlePanel/     # Interface puzzle (indice, suivant, rejouer)
│   │   ├── LichessPanel/    # Recherche de partie, état connexion
│   │   ├── GameHistory/     # Tableau des parties sauvegardées
│   │   ├── GameOverModal/   # Modale fin de partie
│   │   ├── Clock/           # Pendule
│   │   ├── PlayerInfo/      # Nom + elo joueur
│   │   ├── CapturedPieces/  # Pièces capturées + avantage matériel
│   │   ├── ModeSelect/      # Menu principal
│   │   └── Settings/        # Thème, options
│   ├── hooks/
│   │   ├── useChessGame.ts  # Partie locale 2 joueurs
│   │   ├── useBotGame.ts    # Partie vs Stockfish
│   │   ├── useAnalysisGame.ts # Mode analyse (navigation dans l'arbre)
│   │   ├── usePuzzleGame.ts # Logique puzzles
│   │   ├── useLichessGame.ts# Partie en ligne (streaming)
│   │   ├── useLichessAuth.ts# OAuth PKCE (login/logout/token)
│   │   ├── useStockfish.ts  # Web Worker Stockfish (éval temps réel)
│   │   ├── useGameAnalysis.ts # Analyse complète d'une partie (classification)
│   │   └── useGameHistory.ts# Persistance localStorage
│   ├── types/
│   │   ├── game.ts          # Player, Color, EndReason
│   │   ├── mode.ts          # GameMode, BotConfig
│   │   └── history.ts       # GameRecord
│   ├── contexts/
│   │   └── ThemeContext.tsx  # Thème + toggle analyse globale
│   └── utils/
│       └── capturedPieces.ts# Calcul pièces capturées depuis FEN
└── public/
    └── stockfish.js         # Stockfish WASM (copié depuis node_modules)
```

## Classification des coups (mode Analyse)

L'analyse complète d'une partie classe chaque coup en 9 catégories :

| Symbole | Catégorie | Couleur |
|---------|-----------|---------|
| `!!` | Brillant | Cyan |
| `!` | Excellent | Bleu |
| `★` | Meilleur coup | Vert |
| `✓` | Très bon | Vert clair |
| `⊙` | Bon | Gris-bleu |
| `?!` | Imprécision | Jaune |
| `?` | Erreur | Orange |
| `✗` | Raté | Rouge sombre |
| `??` | Gaffe | Rouge |

## Installation

```bash
cd chess/chess-ui
npm install
cp .env.example .env
# Renseigner VITE_LICHESS_CLIENT_ID dans .env (voir ci-dessous)
npm run dev
```

## Configuration Lichess (mode en ligne)

1. Créer une application OAuth sur <https://lichess.org/account/oauth/app>
2. **Redirect URI** : `http://localhost:5173/`
3. **Scope** : `board:play`
4. Copier le Client ID dans `.env` :

```env
VITE_LICHESS_CLIENT_ID=ton_client_id_ici
```

## Scripts

```bash
npm run dev      # Serveur de développement (Vite)
npm run build    # Build de production (tsc + vite build)
npm run preview  # Prévisualisation du build
npm run lint     # ESLint
```

## Contenu du dépôt

```
code/
├── chess/
│   ├── chess-ui/   # Application React (ce projet)
│   └── lila/       # Source Lichess (référence)
└── screen/         # Captures d'écran
```
