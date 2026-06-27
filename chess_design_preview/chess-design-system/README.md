# Caïssa — Charte graphique & Design System

Système de design de **Caïssa**, plateforme d'échecs et d'apprentissage.
Direction : **interface sombre**, signée d'un **dégradé mauve → violet → indigo**.
Stack cible : **React + CSS vanilla** (variables CSS, aucune dépendance de styling).

> Ce dossier est conçu pour être lu et réutilisé par un agent (Claude Code) ou un
> développeur. Tout est piloté par des *tokens* CSS : changez une variable, tout suit.

---

## 1. Démarrage rapide

```jsx
// 1. Importer la feuille de styles globale UNE fois (racine de l'app)
import './chess-design-system/styles.css';

// 2. Importer les composants là où vous en avez besoin
import { Button, Card, Modal, Tier } from './chess-design-system/components.jsx';

function Exemple() {
  return (
    <Card>
      <Tier level="gm" />
      <Button variant="primary">Nouvelle partie</Button>
    </Card>
  );
}
```

Sans bundler, on peut aussi lier la CSS directement :
```html
<link rel="stylesheet" href="chess-design-system/styles.css" />
```
et utiliser les classes `c-*` à la main (voir `components.css`).

**Aperçu visuel complet : ouvrez `preview.html`.**

---

## 2. Principes

1. **Sombre par défaut.** Le fond est un indigo très sombre, jamais noir pur. La lumière vient de l'accent.
2. **Le dégradé est rare et précieux.** `--grad-brand` (rose→violet) signale l'action principale, la marque, l'état actif. Jamais en aplat de fond plein écran.
3. **Hiérarchie par la surface, pas par la bordure.** On empile des `--surface` de plus en plus claires plutôt que de multiplier les traits.
4. **Densité maîtrisée.** Espacements sur une échelle de 4px. De l'air autour des blocs de jeu.
5. **Mouvement discret et réactif.** Transitions courtes (120–320ms), ressort léger sur les bascules. Rien d'infini ni de décoratif.

---

## 3. Couleurs

Toutes définies dans `tokens.css`. Utilisez **les alias sémantiques**, pas les valeurs brutes.

| Rôle | Token | Valeur |
|---|---|---|
| Fond application | `--bg` | `#110e1a` |
| Surface (carte, panneau) | `--surface` | `#1d1730` |
| Surface 2 (champ, piste) | `--surface-2` | `#261e3d` |
| Survol | `--hover` | `#2f254a` |
| Texte primaire | `--text` | `#ede9f7` |
| Texte atténué | `--text-muted` | `#a89fc4` |
| Texte discret | `--text-faint` | `#6f6791` |
| Bordure | `--border` | `rgba(255,255,255,.07)` |
| **Accent** | `--accent` | `#cf8be6` |
| Accent fort | `--accent-strong` | `#9b6ae8` |
| Accent profond | `--accent-deep` | `#7a30bc` |

**Dégradés** (signature) : `--grad-brand`, `--grad-brand-hover`, `--grad-brand-vertical`, `--grad-glow` (halo de fond), `--grad-surface` (lustre subtil sur cartes).

**États** : `--c-success` (vert menthe), `--c-warning` (ambre), `--c-danger` (rose-rouge), `--c-info` (bleu). Chacun a une variante `*-soft` translucide pour les fonds de badges.

**Contraste** : texte clair sur fonds sombres ≥ 7:1. Sur le dégradé/accent, utiliser `--text-on-accent` (#fff).

---

## 4. Typographie

- **Titres & UI :** `Plus Jakarta Sans` (400→800). Titres en 800, interlettrage serré (`--ls-tight`).
- **Données / notation d'échecs :** `DM Mono` (`--font-mono`), chiffres tabulaires. Horloges, Elo, coups SAN.
- **Wordmark / labels capitales :** `--ls-caps` (0.14em), classe `.u-caps`.

Échelle : `--fs-xs`(12) · `--fs-sm`(13.5) · `--fs-base`(15) · `--fs-md`(17) · `--fs-lg`(20) · `--fs-xl`(25) · `--fs-2xl`(32) · `--fs-3xl`(42) · `--fs-4xl`(56).

Texte en dégradé : classe `.u-gradient-text` (réservée au wordmark / gros titres héro).

---

## 5. Espacement, rayons, ombres, motion

- **Espacement** — échelle 4px : `--space-1`…`--space-20`. Padding de carte = `--space-6` (24px). Gap de groupe de boutons = `--space-3`.
- **Rayons** : `--r-sm`(9) champs/petits boutons · `--r-md`(11) boutons · `--r-lg`(14) cartes/panneaux · `--r-xl`(20) modales · `--r-full` pilules & badges.
- **Ombres** : `--shadow-sm/md/lg/xl`. Lueur d'accent `--glow-accent-strong` sur boutons primaires et poignées de slider.
- **Motion** : durées `--dur-fast`(120) → `--dur-slower`(500) ; easings `--ease-out`, `--ease-in-out`, `--ease-spring` (bascules).

---

## 6. Composants

React (`components.jsx`) + classes CSS (`components.css`). Liste :

| Composant | Variantes / props clés |
|---|---|
| `Button` | `variant` = primary · secondary · ghost · outline · danger ; `size` = sm/lg ; `block`, `loading`, `iconOnly`, `icon` |
| `IconButton` | `variant`, `size`, `label` (a11y) |
| `Card` | `interactive` (survol surélevé) |
| `Panel` | `title`, `action`, `foot` — conteneur en-tête/corps/pied |
| `Badge` | `tone` = accent · success · warning · danger · info · solid ; `dot` |
| `Tier` | `level` = beginner · intermediate · advanced · expert · master · gm (classification joueur/difficulté) |
| `Input` / `Textarea` / `Select` | `label`, `help`, `error`, `icon`, `invalid` |
| `Switch` | `checked`, `onChange(bool)`, `label` |
| `Checkbox` / `Radio` | `checked`, `label` |
| `Segmented` | `options[]`, `value`, `onChange` (sélecteur en pilule) |
| `Slider` | `value`, `min/max/step`, `unit`, `onChange(num)` |
| `Tabs` | `tabs[]`, `value`, `onChange` |
| `Avatar` | `name`, `size`, `status='online'`, `gradient` |
| `Modal` | `open`, `onClose`, `title`, `footer` (Échap pour fermer) |
| `Toast` | `tone` = success/danger |
| `Progress` | `value` (0–100) — progression de cours |

Chaque composant React n'est qu'une fine enveloppe autour des classes `c-*`. Vous pouvez utiliser l'un ou l'autre.

---

## 7. Ton & rédaction

- **Tutoiement / langue : français**, ton clair et encourageant, jamais condescendant.
- **Concision.** Boutons à l'impératif : « Nouvelle partie », « Analyser », « Continuer ».
- **Vocabulaire échiquéen** assumé : cadences (Bullet 1+0, Blitz 5+0, Rapide 10+5), SAN (`1. e4 e5`), Elo, niveaux (Débutant → Grand Maître).
- **Pas d'emoji** dans l'UI. Les pièces utilisent les glyphes Unicode (♞♛♚) ; le reste s'appuie sur des icônes au trait.

---

## 8. Iconographie

- Glyphes d'échecs : **Unicode** (`♙♘♗♖♕♔` / `♟♞♝♜♛♚`) — déjà couverts par les polices système.
- Icônes d'interface : prévoir un set **au trait, 1.5–2px**, coins légèrement arrondis (style Lucide / Phosphor). Non fourni ici — si besoin, lier [Lucide](https://lucide.dev) via CDN et conserver `currentColor`.
- Les `IconButton` de la démo utilisent des glyphes (`⟲ ⋯ ✕`) en attendant le set définitif.

---

## 9. Carte du dossier

```
chess-design-system/
├── styles.css        ← POINT D'ENTRÉE unique (n'importe que les 3 fichiers ci-dessous)
├── tokens.css        ← toutes les variables (couleurs, type, espacement, motion…)
├── base.css          ← reset, typo de fond, helpers .u-*
├── components.css    ← classes c-* de tous les composants
├── components.jsx    ← composants React (export nommés)
├── preview.html      ← galerie visuelle de tout le système
├── README.md         ← ce document (la charte)
└── SKILL.md          ← métadonnées pour usage comme skill Claude Code
```

---

## 10. À faire / limites

- Set d'icônes définitif à choisir (placeholder Unicode pour l'instant).
- Pas de logo vectoriel fourni — le wordmark est typographique (♞ + « CAÏSSA » en dégradé). À remplacer par votre logo si vous en avez un.
- Un thème **clair** est inclus (`[data-theme="light"]`) mais secondaire ; la direction principale reste sombre.
