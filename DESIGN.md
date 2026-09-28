---
# gstack: design-md-format=spec
name: kdo-list
description: Papier cadeau — kraft, ruban et étiquettes au quotidien ; sapin de nuit, ivoire et neige à Noël.
colors:
  # Thème Anniversaire (par défaut)
  bg: "#F2E4C9"
  paper: "#FFFBF2"
  paper-2: "#F6ECD8"
  ink: "#2B2019"
  ink-muted: "#7A6752"
  on-bg: "#2B2019"
  on-bg-muted: "#7A6752"
  primary: "#D8432B"
  primary-hover: "#B8351F"
  primary-deep: "#9E2C19"
  on-primary: "#FFF8EE"
  foil: "#E9A93A"
  mine: "#2F6B4E"
  line: "#E4D4B3"
  error: "#B8351F"
  # Thème Noël
  noel-bg: "#10291F"
  noel-paper: "#F6EEDD"
  noel-paper-2: "#EADFC7"
  noel-ink: "#221D16"
  noel-ink-muted: "#6E6352"
  noel-on-bg: "#F6EEDD"
  noel-on-bg-muted: "#9DB3A6"
  noel-primary: "#C21F3A"
  noel-primary-hover: "#A0162E"
  noel-primary-deep: "#7E0F22"
  noel-on-primary: "#FFF6EA"
  noel-foil: "#D4A548"
  noel-mine: "#1F6B45"
  noel-line: "#D8C9A8"
typography:
  display:
    fontFamily: Bricolage Grotesque
    fontWeight: 800
    fontSize: clamp(44px, 7.4cqi, 92px)
    letterSpacing: -0.035em
  title:
    fontFamily: Bricolage Grotesque
    fontWeight: 700
    fontSize: 1.25rem
    letterSpacing: -0.02em
  body:
    fontFamily: Figtree
    fontSize: 1rem
    lineHeight: 1.5
  label:
    fontFamily: Figtree
    fontWeight: 600
    fontSize: 0.875rem
  mono:
    fontFamily: DM Mono
    fontSize: 0.875rem
    fontFeature: tnum
  hand:
    fontFamily: Caveat
    fontWeight: 600
    fontSize: 1.375rem
rounded:
  sm: 3px
  md: 6px
  lg: 8px
  sheet: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-ghost:
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  input:
    backgroundColor: "{colors.paper}"
    borderColor: "{colors.line}"
    rounded: "{rounded.md}"
  tag:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  chip:
    rounded: "{rounded.full}"
  nav-link:
    textColor: "{colors.on-bg-muted}"
---

# kdo-list

## Overview

**Creative North Star :** ouvrir l'app, c'est déballer un cadeau. Chaleureux au quotidien, magique à Noël.
**Product context :** app web perso de listes de cadeaux pour une famille (10–20 personnes). On choisit la liste de quelqu'un, on réserve une idée en secret. Un admin gère les idées, un super-admin gère les comptes, les listes et le thème de toute l'app.
**Mode per surface :** Choix de liste et liste = Experience (le moment chaleureux) ; admin et super-admin = Operate (rapide, dense, lisible) ; connexion = Persuade léger.
**Reference :** aperçu validé le 2026-09-27 (`docs/design/preview.html`, à ouvrir dans un navigateur).
**Key characteristics :**
- Du papier, pas des cartes : fond papier, étiquettes découpées avec trou et ficelle, rubans.
- Le prénom est le héros : très grand, aligné à gauche.
- Un cadeau réservé est « emballé » : ruban croisé, nœud, tampon. Il reste à sa place et net.
- Mobile d'abord : barre d'onglets en bas, panneau qui monte du bas pour réserver.
- Deux thèmes, une seule grammaire : seuls les jetons et deux couches décoratives changent.

## Colors

**Strategy :** Committed. Le papier (fond) possède la page ; une seule couleur d'action, le ruban (`primary`). La moutarde / l'or (`foil`) est un détail imprimé (ficelle, ruban de la liste commune, touches manuscrites à Noël), jamais un bouton.
**Light or dark :** fixé par le thème et non par l'appareil. Anniversaire = papier clair (journée, table de cuisine). Noël = sapin de nuit (soir de réveillon) avec étiquettes ivoire claires : le contenu reste toujours sur papier clair.

- `bg` / `on-bg` / `on-bg-muted` : fond de page et texte posé directement dessus (titres, prénom, filtres, onglets du haut).
- `paper` / `ink` / `ink-muted` : tout ce qui est sur une étiquette, une feuille, un panneau, un champ.
- `paper-2` : surface secondaire sur papier (encart dans le panneau de réservation, dos d'étiquette, survol de ligne).
- `primary` : l'unique action principale d'un écran (« Je prends ! », « Se connecter », « Ajouter une idée ») et le ruban d'emballage. `primary-deep` sert aux liserés du ruban et au nœud.
- `mine` : « c'est toi qui l'offres » (tampon, note manuscrite).
- Le thème s'applique par la classe `.theme-christmas` posée sur `<html>` par le layout serveur ; `:root.theme-christmas` redéfinit les variables. Jetons dérivés : `--hand` (touches manuscrites : `on-bg-muted`, or à Noël) et `--wordmark` (icône du nom de l'app : `primary`, or à Noël). **Aucun composant ne teste le thème pour choisir une couleur.**
- Les messages d'erreur sont posés sur une pastille `paper` : `error` reste lisible sur les deux fonds.

## Typography

Toutes chargées une seule fois dans `app/layout.tsx` via `next/font/google` (variables CSS), disponibilités vérifiées dans `next/font` le 2026-09-27.

- **Bricolage Grotesque** (variable, opsz 12–96, wght 400–800) : prénoms, titres de page (800, interlignage 0,92, approche −0,035em), noms d'idées (700). Grotesque expressive et un peu artisanale, qui fait « étiquette imprimée ».
- **Figtree** (400–700) : texte, formulaires, boutons, navigation. Neutre et chaleureuse, très lisible sur mobile.
- **DM Mono** (400/500, chiffres tabulaires) : prix (« 42,00 € »), compteurs, tampons (« DÉJÀ EMBALLÉ »), métadonnées d'admin. Donne le côté « tapé à la machine ».
- **Caveat** (600) : touche manuscrite, **deux ou trois endroits seulement** : la phrase sous « À qui fait-on plaisir ? », « chut… c'est toi qui l'offres », « Léa n'en saura rien. ». Jamais pour un titre ou un bouton.
- Échelle : prénom de liste 88–210px (`cqi`), titre de page 40–92px, nom d'idée 19–21px, texte 16px, méta 12–14px. Les niveaux diffèrent par la taille, pas seulement le poids.
- Les polices Atma, Mountains of Christmas et Geist sont retirées.

## Layout

- Largeur max 1280px ; gouttières 20px (mobile), 40px (≥ 720px).
- Grille de 4px ; espacement confortable.
- Point de bascule unique : 720px (requêtes de conteneur ou `md:`), le même composant s'adapte.
- **Choix d'une liste :** mobile = titre puis une bande par liste sur toute la largeur. Ordinateur = 5/12 à gauche (titre collant) et 7/12 à droite (bandes).
- **Liste :** retour « Toutes les listes », « Les envies de » + prénom géant, filtres Tout / Disponibles / Pris par moi (compteurs en mono). Mobile = étiquettes horizontales (image carrée à 38 %, trou à droite ; l'action — avec « chut… » ou « Pris par X » — occupe toute la largeur sous l'image et le texte). Ordinateur = grille alignée `auto-fill, minmax(236px, 1fr)`, étiquettes verticales (image 4:3, trou en haut, ficelle).
- **Admin :** jamais de tableau qui défile horizontalement. Mobile = lignes empilées sur une seule feuille (vignette 48px, nom, prix · liste en mono, actions texte « Modifier » / « Supprimer »). Ordinateur = tableau posé sur une feuille de papier.
- **Super-admin :** trois onglets texte Personnes / Listes / Thème ; le choix du thème montre deux miniatures de papier et « Appliquer à toute la famille ».
- **Navigation :** mobile = barre d'onglets en bas (Listes, Mes idées, Admin selon le rôle) + en-tête avec le nom de l'app ; ordinateur = liens texte en haut à droite, onglet actif souligné par le ruban. Le pied de page actuel est supprimé.

## Elevation & Depth

- Pas de verre dépoli, pas de lueur. La profondeur vient d'ombres portées décalées vers le bas : `drop-shadow(0 1px 0 …) drop-shadow(0 10px 14px …)` (plus sombre à Noël). `drop-shadow` plutôt que `box-shadow` car les étiquettes sont découpées (`clip-path`).
- Surfaces opaques partout. Le fond de réservation est un voile sombre à 42 %.
- Ordre des couches à Noël : neige arrière → contenu → neige avant → panneaux/fenêtres.

## Shapes

- Étiquettes : 8px et coins coupés de 16–18px en biseau (`clip-path`) du côté du trou.
- Boutons et champs : 6px. Tampons : 3px. Filtres : pilule. Panneau du bas : 16px en haut.
- Le trou de l'étiquette est un cercle de 11px de la couleur du fond de page.
- Une image imbriquée dans une étiquette de 8px utilise un rayon imbriqué de 5px.

## Components

- **Bouton principal :** `primary` plein, texte `on-primary`, 700, 15px ; survol `primary-hover` ; appui : descend de 1px ; désactivé : opacité 0,5. Jamais de dégradé.
- **Bouton secondaire :** contour 1,5px encre à 22 %, fond `paper-2` au survol.
- **Étiquette d'idée :** image (ou nom de l'idée en gros sur fond teinté s'il n'y a pas d'image), nom, prix mono, « Voir le produit ↗ » en `primary`, commentaire en `ink-muted`, action en bas. Prix et lien absents : rien n'est affiché à leur place.
- **États d'une étiquette :** libre (bouton « Je prends ! ») ; à moi (emballée, tampon « Pris par toi » en `mine`, note Caveat « chut… c'est toi qui l'offres », bouton secondaire « Je ne prends plus ») ; prise par quelqu'un (emballée, texte mono « Pris par {prénom} » ou « Déjà pris » en `ink-muted` ; un admin voit « Libérer la réservation »).
- **Réservation :** panneau qui monte du bas sur mobile, fenêtre centrée de 440px sur ordinateur. Prendre : titre « Tu prends ce cadeau ? », encart avec l'idée (image, nom, prix ; le commentaire de l'idée, s'il existe, sous un fin séparateur `line`, en `ink` 15px, précédé d'une petite icône de bulle en `ink-muted`), note Caveat, « Oui, je le prends » + « Annuler ». Ne plus prendre : titre « Tu ne prends plus ce cadeau ? », « Oui, je ne le prends plus ». Admin (réservation d'un autre) : titre « Libérer la réservation ? », « Oui, libérer ». Les trois fenêtres montrent le même encart (image, nom, prix ; commentaire seulement pour la prise), suivi de leur phrase. Seule la prise a un bouton de confirmation `primary` ; « ne plus prendre » et « libérer » confirment avec le bouton secondaire (`ghost`). En cas d'erreur, un message reste dans le panneau (plus d'erreur silencieuse). La confirmation de suppression utilise ce même composant (plus de `window.confirm`).
- **Bande de liste :** feuille `paper`, prénom en display, ligne mono « Voir les idées », ruban vertical `primary` (ou `foil` pour la liste commune), flèche. Pas de compteur : l'API ne le fournit pas, et le nombre d'idées déjà prises gâcherait la surprise sur sa propre liste.
- **Champs :** libellé visible au-dessus (14px, 600), fond `paper`, bordure `line`, focus = contour 2,5px `primary`. Erreur sous le champ en `error`.
- **Chargement / vide / erreur :** un seul composant par état, sur papier, avec une phrase précise (« Aucune idée pour Léa pour l'instant »).
- **Décors Noël :** neige posée (vague blanche) sur le bord haut des bandes et des étiquettes.

## Do's and Don'ts

- Do : faire passer toute couleur par un jeton ; un nouveau thème = un bloc de variables.
- Do : une seule action principale colorée par écran.
- Do : laisser un cadeau réservé à sa place, net, et emballé.
- Do : tester chaque écran à 390px de large avant l'ordinateur.
- Don't : tester `isChristmas` dans un composant pour choisir une couleur ou une police (autorisé uniquement pour afficher/masquer une couche décorative).
- Don't : dégradés sur les boutons, verre dépoli, lueurs, emojis décoratifs, icône dans un carré arrondi au-dessus des titres.
- Don't : flouter ou griser l'image d'un cadeau réservé.
- Don't : tableau à défilement horizontal sur mobile.

## Motion

- **Approach :** intentional, avec un moment signature.
- **Easing :** entrée ease-out, sortie ease-in, déplacement ease-in-out ; ouverture du papier `cubic-bezier(.7,0,.2,1)`.
- **Duration :** micro 100ms, court 150–250ms (boutons, filtres, panneau 280ms), moyen 300–400ms, long 600ms (ouverture).
- **Le moment signature — le ruban se noue (≈1s) :** ruban horizontal (340ms), ruban vertical (340ms, +160ms), nœud qui apparaît avec un léger rebond (+420ms), tampon qui se pose (+780ms), note manuscrite (+950ms). « Dénouer » joue une disparition courte (350ms).
- **Ouverture « déballage » :** une fois par session (`sessionStorage`), le papier cadeau du thème (vermillon à pois crème / sapin à points dorés) couvre l'écran ; le nœud et les rubans s'en vont, puis le papier se déchire au milieu et s'ouvre des deux côtés (< 1,1s). Un toucher passe directement à la fin.
- **Neige (Noël) :** exactement **250 flocons**, dessinés sur `<canvas>` en une seule boucle `requestAnimationFrame` (sprites pré-rendus, DPR ≤ 2). 230 petits flocons derrière le contenu, 20 gros flocons flous devant (`pointer-events: none`). Dérive sinusoïdale, pause quand l'onglet est caché.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-27 | Système « Papier cadeau » créé | /design-consultation : direction propre + Codex + sous-agent Claude convergents ; cap « déballer un cadeau » |
| 2026-09-27 | Noël = sapin de nuit + ivoire (fin du dégradé rouge→vert) | Les flocons blancs se voient sur fond sombre, le contenu reste sur papier clair |
| 2026-09-27 | Risques retenus : ruban qui se noue, neige devant/derrière, ouverture déballage | Choix du propriétaire ; étiquettes penchées écartées |
| 2026-09-27 | Accessibilité (contraste WCAG) non contraignante | App perso ; lisibilité conservée |
| 2026-09-27 | Polices : Bricolage Grotesque, Figtree, DM Mono, Caveat | Vérifiées dans next/font ; Fraunces écartée (surutilisée) |
| 2026-09-27 | Classe de thème sur `<html>` ; jetons dérivés `--hand`, `--wordmark` | Les variables dérivées suivent le thème sans duplication |
| 2026-09-27 | Bande de liste sans compteur (« Voir les idées ») | Pas de compteur dans l'API ; ne pas révéler les réservations sur sa propre liste |
| 2026-09-27 | « Emballé par {prénom} » conservé pour les réservations des autres | Comportement actuel de l'app gardé |
| 2026-09-27 | Image imbriquée dans une étiquette 8px : rayon imbriqué 5px | Cohérence visuelle du rayon intérieur avec le rayon extérieur de l'étiquette |
| 2026-09-27 | Neige avant au-dessus de l'en-tête et des onglets (z-45), sous les panneaux (z-50) | Les gros flocons passent aussi devant l'en-tête collant, qui reçoit son propre grain de papier |
| 2026-09-27 | Ouverture « déballage » sautée si `prefers-reduced-motion: reduce` ; la neige reste | Respect de la préférence système pour l'animation plein écran ; la neige (250 flocons) est fixée par la spec |
| 2026-09-28 | Vocabulaire : « prendre » / « disponible » au lieu d'« emballer » ; « Libérer la réservation » gardé pour l'admin ; commentaire rappelé dans le panneau de prise | Plus clair pour la famille |
| 2026-09-28 | Titre de connexion : « Des idées, juste au cas où. » | Les listes servent à donner des idées, pas une liste d'achats |
| 2026-09-28 | Confirmation secondaire (`ghost`) pour « Je ne prends plus » et « Libérer la réservation » ; les suppressions gardent `primary` | Le rouge reste réservé à l'action principale ; annuler une prise n'est pas une action à mettre en avant |
