# Plan : Centralisation de la gestion des thèmes

## Vue d'ensemble

Exploiter les CSS custom properties de Tailwind 4 pour centraliser toutes les couleurs de thème dans `globals.css`. Les composants utilisent des variables sémantiques (`--primary`, `--surface`) au lieu de couleurs hardcodées (`violet-600`, `red-700`).

**Objectif** : Modifier une couleur à un seul endroit (`globals.css`) pour que le changement se propage dans toute l'application.

---

## Architecture proposée

### Approche : CSS Variables + Tailwind 4

```
globals.css                    →  Définit les variables CSS par thème
src/lib/theme.ts               →  Exporte le nom du thème + config non-CSS
layout.tsx                     →  Applique la classe .theme-christmas si besoin
Composants                     →  Utilisent bg-[--primary] au lieu de bg-violet-600
```

---

## Fichier 1 : `globals.css` (modifier)

Ajouter les variables CSS pour chaque thème. On utilise les variables natives de Tailwind 4 (`--color-{name}-{shade}`) :

```css
@layer base {
  :root {
    /* Couleurs primaires */
    --primary: var(--color-violet-600);
    --primary-hover: var(--color-violet-700);
    --primary-light: var(--color-violet-50);
    --on-primary: var(--color-white);

    /* Couleurs secondaires */
    --secondary: var(--color-sky-700);
    --secondary-hover: var(--color-sky-800);
    --secondary-light: var(--color-sky-50);

    /* Surfaces et fonds */
    --surface: var(--color-white);
    --surface-hover: var(--color-gray-50);
    --surface-muted: var(--color-gray-100);

    /* Texte */
    --text-primary: var(--color-gray-900);
    --text-secondary: var(--color-gray-600);
    --text-muted: var(--color-gray-400);

    /* Bordures */
    --border: var(--color-gray-200);
    --border-light: var(--color-gray-100);

    /* Ombres (valeur complète, pas juste la couleur) */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-primary: 0 10px 15px -3px var(--color-violet-200);

    /* États */
    --danger: var(--color-red-600);
    --danger-hover: var(--color-red-700);
    --success: var(--color-green-600);

    /* Inputs */
    --input-bg: var(--color-gray-50);
    --input-border: var(--color-gray-200);
    --input-focus: var(--color-violet-500);

    /* Focus rings */
    --ring: var(--color-violet-500);
    --ring-opacity: 0.3;

    /* Liens */
    --link: var(--color-violet-600);
    --link-hover: var(--color-violet-700);
  }

  .theme-christmas {
    /* Couleurs primaires */
    --primary: var(--color-red-700);
    --primary-hover: var(--color-red-800);
    --primary-light: var(--color-red-100);
    --on-primary: var(--color-white);

    /* Couleurs secondaires */
    --secondary: var(--color-green-700);
    --secondary-hover: var(--color-green-800);
    --secondary-light: var(--color-green-100);

    /* Surfaces et fonds */
    --surface: rgb(255 255 255 / 0.1);
    --surface-hover: rgb(255 255 255 / 0.2);
    --surface-muted: rgb(255 255 255 / 0.05);

    /* Texte */
    --text-primary: var(--color-white);
    --text-secondary: rgb(255 255 255 / 0.9);
    --text-muted: rgb(255 255 255 / 0.6);

    /* Bordures */
    --border: rgb(255 255 255 / 0.2);
    --border-light: rgb(255 255 255 / 0.1);

    /* Ombres */
    --shadow-sm: 0 1px 2px 0 rgb(255 255 255 / 0.1);
    --shadow-primary: 0 10px 15px -3px rgb(255 255 255 / 0.2);

    /* États */
    --danger: var(--color-red-500);
    --danger-hover: var(--color-red-600);
    --success: var(--color-green-600);

    /* Inputs */
    --input-bg: rgb(255 255 255 / 0.2);
    --input-border: rgb(255 255 255 / 0.3);
    --input-focus: rgb(255 255 255 / 0.5);

    /* Focus rings */
    --ring: rgb(255 255 255 / 0.5);
    --ring-opacity: 0.5;

    /* Liens */
    --link: var(--color-green-600);
    --link-hover: var(--color-green-700);
  }
}
```

**Note technique** : Tailwind 4 expose automatiquement toutes les couleurs comme `--color-{name}-{shade}`. On les réutilise pour définir nos variables sémantiques.

---

## Fichier 2 : `src/lib/theme.ts` (créer)

Contient uniquement les éléments non-CSS :

```typescript
export const THEME_NAME = process.env.NEXT_PUBLIC_THEME || 'default';
export const isChristmas = THEME_NAME === 'christmas';

export const themeConfig = {
  // Classe à appliquer sur <body>
  bodyClass: isChristmas ? 'theme-christmas' : '',

  // Assets
  logo: isChristmas ? '/logo-christmas.svg' : '/logo.svg',

  // Textes
  appTitle: isChristmas ? 'Liste de Noël' : "Liste d'anniversaire",
  titleEmoji: isChristmas ? '🎄' : '',

  // Features
  showSnowflakes: isChristmas,
} as const;

export type ThemeName = 'default' | 'christmas';
```

---

## Fichier 3 : `layout.tsx` (modifier)

Appliquer la classe du thème sur le body :

```tsx
import { themeConfig } from '@/lib/theme';

export default function RootLayout({ children }) {
  return (
    <html lang="fr-FR">
      <body className={`${geistSans.variable} ${themeConfig.bodyClass} ...`}>
        ...
      </body>
    </html>
  );
}
```

---

## Utilisation dans les composants

### Avant (actuel)
```tsx
const theme = process.env.NEXT_PUBLIC_THEME || 'default';

<button className={`
  ${theme === 'christmas'
    ? 'bg-red-700 hover:bg-red-800 text-white'
    : 'bg-violet-600 hover:bg-violet-700 text-white'}
`}>
```

### Après (nouveau)
```tsx
<button className="bg-[--primary] hover:bg-[--primary-hover] text-[--on-primary] focus:ring-[--ring]">
```

### Exemples de migration

| Ancien | Nouveau |
|--------|---------|
| `bg-violet-600` | `bg-[--primary]` |
| `hover:bg-violet-700` | `hover:bg-[--primary-hover]` |
| `text-gray-900` | `text-[--text-primary]` |
| `border-gray-200` | `border-[--border]` |
| `focus:ring-violet-500/30` | `focus:ring-[--ring]` |
| `shadow-lg shadow-violet-200` | `shadow-[--shadow-primary]` |
| `text-violet-600` (liens) | `text-[--link]` |
| `hover:text-violet-700` | `hover:text-[--link-hover]` |

---

## Fichiers à modifier

### Phase 1 : Infrastructure

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/app/globals.css` | Modifier | Ajouter les variables CSS `:root` et `.theme-christmas` |
| `src/lib/theme.ts` | Créer | Exporter `themeConfig` avec assets, textes, features |
| `src/app/layout.tsx` | Modifier | Appliquer `themeConfig.bodyClass` sur le body |

### Phase 2 : Composants partagés

| Fichier | Modifications principales |
|---------|--------------------------|
| `src/components/Nav.tsx` | Remplacer couleurs par variables CSS, importer `themeConfig.logo` |
| `src/components/Footer.tsx` | Remplacer couleurs par variables CSS |
| `src/components/DialogKdo.tsx` | Remplacer couleurs + **supprimer prop `theme`** |
| `src/components/KdosList.tsx` | Remplacer couleurs, adapter l'appel à DialogKdo |

### Phase 3 : Pages

| Fichier | Modifications |
|---------|---------------|
| `src/app/page.tsx` | Remplacer couleurs par variables |
| `src/app/list/page.tsx` | Remplacer couleurs, importer `themeConfig.titleEmoji` |
| `src/app/first-connection/page.tsx` | Remplacer couleurs par variables |
| `src/app/admin/page.tsx` | Remplacer couleurs par variables |
| `src/app/admin/add/page.tsx` | Remplacer couleurs par variables |
| `src/app/admin/change-password/page.tsx` | Remplacer couleurs par variables |
| `src/app/admin/superadmin/page.tsx` | Remplacer couleurs par variables |
| `src/app/admin/superadmin/add-user/page.tsx` | Remplacer couleurs par variables |
| `src/app/admin/superadmin/password/[id]/page.tsx` | Remplacer couleurs par variables |

### Phase 4 : Formulaires

| Fichier | Modifications |
|---------|---------------|
| `src/components/FormModifyItem.tsx` | Remplacer couleurs par variables |
| `src/components/FormModifyPwd.tsx` | Remplacer couleurs par variables |

### Phase 5 : Nettoyage

- Supprimer toutes les lignes `const theme = process.env.NEXT_PUBLIC_THEME || 'default'`
- Supprimer la prop `theme` de `DialogKdo` et adapter tous les appels
- Vérifier qu'aucune couleur hardcodée ne reste

---

## Mapping des couleurs

| Ancien (default) | Ancien (christmas) | Nouvelle variable |
|------------------|-------------------|-------------------|
| `violet-600` | `red-700` | `--primary` |
| `violet-700` | `red-800` | `--primary-hover` |
| `violet-50` | `red-100` | `--primary-light` |
| `sky-700` | `green-700` | `--secondary` |
| `sky-800` | `green-800` | `--secondary-hover` |
| `gray-900` | `white` | `--text-primary` |
| `gray-600` | `white/90` | `--text-secondary` |
| `gray-400` | `white/60` | `--text-muted` |
| `white` | `white/10` | `--surface` |
| `gray-50` | `white/20` | `--surface-hover` |
| `gray-200` | `white/20` | `--border` |
| `gray-100` | `white/10` | `--border-light` |

---

## Cas spéciaux à gérer

### 1. Gradients de boutons
Le bouton de connexion utilise un gradient différent par thème :
- Default : `bg-violet-600` (couleur unie)
- Christmas : `bg-gradient-to-r from-red-600 to-green-600`

**Problème** : `bg-[--variable]` attend une couleur, pas un gradient. Un gradient nécessite `background-image`.

**Solution** : Garder un conditionnel pour ce cas isolé (un seul bouton) :
```tsx
import { isChristmas } from '@/lib/theme';

className={isChristmas
  ? "bg-gradient-to-r from-red-600 to-green-600"
  : "bg-[--primary]"}
```

C'est acceptable car c'est un cas unique. Ne pas sur-ingénierer.

### 2. Ombres colorées
Les ombres changent de couleur :
- Default : `shadow-violet-200`
- Christmas : `shadow-white/20`

**Problème** : `shadow-[valeur]` attend une ombre complète, pas juste une couleur.

**Solution** : Définir l'ombre complète dans les variables CSS (déjà fait dans globals.css) :
```css
:root {
  --shadow-primary: 0 10px 15px -3px var(--color-violet-200);
}
.theme-christmas {
  --shadow-primary: 0 10px 15px -3px rgb(255 255 255 / 0.2);
}
```

Usage dans les composants :
```tsx
className="shadow-[--shadow-primary]"
```

### 3. Gradient de fond de page
Le layout utilise un gradient différent par thème :
- Default : `bg-gradient-to-br from-slate-50 via-gray-50 to-violet-50`
- Christmas : `bg-gradient-to-br from-red-700 via-green-800 to-red-900`

**Solution** : Créer des classes utilitaires dans globals.css :
```css
.page-gradient {
  background: linear-gradient(to bottom right,
    var(--color-slate-50),
    var(--color-gray-50),
    var(--color-violet-50));
}
.theme-christmas .page-gradient {
  background: linear-gradient(to bottom right,
    var(--color-red-700),
    var(--color-green-800),
    var(--color-red-900));
}
```

Usage dans layout.tsx :
```tsx
<div className="page-gradient flex-1 ...">
```

### 4. Flocons de neige
Le composant `Snowflakes` ne s'affiche que pour Christmas.

**Solution** : Utiliser `themeConfig.showSnowflakes` :
```tsx
{themeConfig.showSnowflakes && <Snowflakes />}
```

### 5. Footer SVG décoratif
Le footer Christmas a une pile de neige SVG unique.

**Solution** : Conditionnel avec `isChristmas` importé de `theme.ts` :
```tsx
import { isChristmas } from '@/lib/theme';
{isChristmas && <SnowPileSVG />}
```

### 6. Fonts conditionnelles
Les fonts Google sont chargées dynamiquement via Next.js. Elles ne peuvent pas être des variables CSS.

**Approche actuelle** (Nav.tsx) :
```tsx
const mountains_of_christmas = Mountains_of_Christmas({ weight: '700', subsets: ['latin'] });
const knewave = Atma({ weight: '500', subsets: ['latin'] });

className={theme === 'christmas' ? mountains_of_christmas.className : knewave.className}
```

**Après migration** :
```tsx
import { isChristmas } from '@/lib/theme';

// Les imports de fonts restent identiques
className={isChristmas ? mountains_of_christmas.className : knewave.className}
```

Les fonts ne sont pas centralisées dans `themeConfig` car elles nécessitent un import Next.js spécifique. On utilise simplement `isChristmas` pour le conditionnel.

### 7. Glassmorphism (backdrop-blur)
Le thème Christmas utilise `backdrop-blur-lg` sur les cartes et dialogs pour un effet verre dépoli.

**Solution** : Créer une classe utilitaire qui combine surface + blur :
```css
.surface-card {
  background: var(--surface);
  border: 1px solid var(--border);
}
.theme-christmas .surface-card {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
```

Ou garder le conditionnel si peu d'occurrences :
```tsx
className={`bg-[--surface] border-[--border] ${isChristmas ? 'backdrop-blur-lg' : ''}`}
```

---

## Tests à effectuer

### Tests fonctionnels

| Test | Comportement attendu |
|------|---------------------|
| Build avec `NEXT_PUBLIC_THEME=default` | Couleurs violet/sky, pas de flocons |
| Build avec `NEXT_PUBLIC_THEME=christmas` | Couleurs rouge/vert, flocons visibles |
| Vérifier `:root` dans DevTools | Variables CSS présentes |
| Vérifier `.theme-christmas` dans DevTools | Variables overridées correctement |
| Tous les boutons primary | Même couleur partout |
| Tous les inputs | Même style partout |
| Dialogs de confirmation | Couleurs cohérentes |
| Navigation desktop + mobile | Couleurs cohérentes |
| Pages admin (tableaux) | Couleurs cohérentes |

### Vérification post-migration

```bash
# Vérifier qu'aucune couleur hardcodée ne reste (sauf exceptions documentées)
grep -rE "(violet-|red-[5-9]|green-[5-9]|sky-)" src/ --include="*.tsx" | grep -v "from-red\|to-green\|to-red"

# Build de production (vérifie que les classes ne sont pas purgées)
npm run build && npm run start
```

Les exceptions acceptées (gradients) :
- `from-red-600 to-green-600` (bouton connexion Christmas)
- `from-red-700 via-green-800 to-red-900` (page gradient Christmas)

---

## Avantages de cette architecture

1. **Centralisation absolue** : Toutes les couleurs dans `globals.css`
2. **Pas de duplication** : Chaque composant utilise les mêmes variables
3. **Runtime switching possible** : Suffit de toggler `.theme-christmas` sur le body
4. **Compatible Tailwind 4** : Exploite les features natives
5. **TypeScript strict** : `themeConfig` typé avec `as const`
6. **Composants simplifiés** : Plus de ternaires de couleurs
7. **Ajout de thème facile** : Ajouter `.theme-halloween { ... }` dans globals.css

---

## Notes importantes

- **Tailwind purge** : Les classes `bg-[--primary]` sont correctement détectées par Tailwind 4
- **Fallback navigateurs** : Les CSS custom properties sont supportées par tous les navigateurs modernes (IE11 exclu, non-problème)
- **Pas de breaking change** : Le rendu visuel reste identique
