---
name: caissa-design
description: Charte graphique et composants de Caïssa, plateforme d'échecs & d'apprentissage. À utiliser pour générer ou coder des interfaces cohérentes avec la marque (thème sombre, dégradé mauve/violet). Contient tokens CSS, composants React (CSS vanilla), et le guide de design.
user-invocable: true
---

# Skill : Caïssa Design System

Tu construis le front d'une plateforme d'échecs & d'apprentissage. Respecte cette
charte pour toute interface produite (production ou maquette).

## Avant de coder
1. Lis `README.md` (la charte complète : couleurs, type, espacement, composants, ton).
2. Ouvre `preview.html` pour voir le rendu de tous les composants.
3. Parcours `tokens.css` — n'invente jamais de couleur ; utilise les alias sémantiques
   (`--surface`, `--accent`, `--grad-brand`, etc.).

## Comment consommer le système
- **Une seule** feuille à importer : `styles.css` (elle `@import` tokens + base + composants).
  ```js
  import './chess-design-system/styles.css';
  ```
- Composants React via exports nommés :
  ```js
  import { Button, Card, Modal, Tier, Input } from './chess-design-system/components.jsx';
  ```
- Ou, sans React, les classes `c-*` directement (voir `components.css`).

## Règles d'or
- Thème **sombre** par défaut. Fond indigo sombre, jamais noir pur.
- `--grad-brand` = action principale / marque / état actif uniquement. Pas de fond plein écran dégradé.
- Hiérarchie par empilement de surfaces, pas par bordures.
- Espacement sur l'échelle 4px (`--space-*`). Rayons `--r-*`. Motion courte (`--dur-*`, `--ease-spring` pour les bascules).
- Français, tutoiement, impératif sur les boutons. Pas d'emoji dans l'UI ; glyphes Unicode pour les pièces.
- Notation, Elo, horloges en `--font-mono` (DM Mono), chiffres tabulaires.

## Production de livrables
- Maquettes / prototypes jetables → fichiers HTML statiques liant `styles.css` + composants, à montrer à l'utilisateur.
- Code de production → réutilise tokens + composants ; adapte aux conventions du dépôt cible (Vite/Next/CRA), garde les noms de tokens.

Si l'utilisateur invoque ce skill sans précision, demande ce qu'il veut construire
(écran de jeu, lobby, page de cours, profil…), pose quelques questions, puis livre.
