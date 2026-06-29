# Gestion des listes & des rôles + durcissement sécurité — Design

**Date :** 2026-06-29
**Statut :** approuvé (brainstorming)
**Branche :** `refactor/depersonnalisation-roles`

## Objectif

Rendre les listes et les rôles **gérables au runtime par le megaadmin**, de sorte que plus aucun nom de personne ne vive dans le code source — tout en corrigeant les deux findings HIGH de l'audit `/cso` (privilège `isMegaAdmin` non appliqué côté serveur ; SSRF du téléchargement d'images).

Appli concernée : liste de cadeaux familiale (Next.js 15 + FastAPI). Cible volontairement **simple** : pas de moteur RBAC générique, juste deux niveaux (`isAdmin`, `isMegaAdmin`) rendus administrables.

## Contexte (état actuel)

- `GiftList` : `slug` (unique), `label`, `user_name` (chaîne, lien fragile vers `User.name`), `enabled`. **Aucun endpoint CRUD** — les listes sont seedées par `migrate_lists.py`.
- `User` : `name`, `password`, `isAdmin`, `isMegaAdmin`, `firstConnection`.
- `create_user_api` ne crée que `name` + `password` : **les flags de rôle sont ignorés** (tout user créé est non-admin).
- Les endpoints « superadmin » (`create-user`, `delete-user`, `modify-password-admin`, `toggle-list`, `users`) ne vérifient que `isAdmin` — **jamais `isMegaAdmin`** (finding #1, élévation de privilège).
- `image.get_image(url)` fait `requests.get(url)` sur une URL fournie par un admin, sans validation (finding #2, SSRF).
- `create_db.py` ne crée que les tables ; **aucun seed d'utilisateur** n'existe (le 1er user a été inséré manuellement).
- Un utilisateur peut exister **sans liste** (il réserve seulement) — comportement à préserver.

## Décisions de design (validées)

1. **Lien liste→propriétaire = FK `owner_id → users.id`** (nullable = giftee **sans compte**), **source de vérité unique**. La colonne `user_name` est **supprimée**. Un flag distinct `is_common` marque l'**unique liste commune** (≠ une liste nommée sans compte).
2. **CRUD listes complet** (créer / renommer / réassigner / supprimer / activer-désactiver), megaadmin uniquement.
3. **Suppression de liste = cascade** (idées + images supprimées), transactionnelle, avec **confirmation explicite** dans l'UI.
4. **Gestion de rôle** : le megaadmin peut basculer `isAdmin` sur un user existant et le définir à la création. `isMegaAdmin` n'est **pas** modifiable via l'UI (fixé en base / bootstrap).
5. **Propriétaire = un compte user existant, OU aucun**. `owner_id = NULL` = liste nommée pour un giftee **sans compte** (ex. un enfant) — visible des admins comme n'importe quelle liste. Un user à compte possède **au plus une liste** ; plusieurs listes sans compte sont autorisées.
6. **Bootstrap du 1er megaadmin** = script CLI idempotent `create_superadmin.py`, piloté par env.
7. **Approche A** : extension en place dans `main.py` (style inline existant + helper `ensure_megaadmin`), UI greffée sur `/admin/superadmin`. Pas de modularisation en routers.

## Modèle de données

### `GiftList` (modifié)
```
id         int PK
slug       str unique          # auto-généré depuis label
label      str                 # nom affiché, toujours présent (indépendant du owner)
owner_id   int FK users.id NULL    # NULL = giftee sans compte ; remplace user_name
is_common  bool default False  # True = l'unique liste commune partagée
enabled    bool
```
- Suppression de `user_name`.
- Relation : `GiftList.owner` (User, `foreign_keys=[owner_id]`).
- Règle applicative : `owner_id` unique parmi les listes à propriétaire (un user à compte ≤ 1 liste). Plusieurs listes `owner_id NULL` (sans compte) sont autorisées. **Au plus une** liste `is_common = True`. Vérifié en applicatif (pas de contrainte DB partielle, pour rester portable SQLite/PG).
- `is_common` est **immuable via l'API** : il n'est posé qu'au bootstrap/migration. L'UI ne crée que des listes normales (`is_common = False`).

### `User` — inchangé
`isAdmin` / `isMegaAdmin` / `firstConnection` existent déjà.

### Schémas Pydantic (modifiés / ajoutés)
- `UserCreate` : ajout `isAdmin: bool = False`.
- `GiftListResponse` : exposer `slug`, `label`, `enabled`, `is_common: bool`, `owner_id: Optional[int]`, `owner_name: Optional[str]` (dérivé de la relation). Retrait de `user_name`.
- `GiftListCreate` : `{ label: str (min 1), owner_id: Optional[int] }`.
- `GiftListUpdate` : `{ label: Optional[str], owner_id: Optional[int] }`.
- `RoleUpdate` : `{ isAdmin: bool }`.

## Migration

Script `server/migrate_owner_id.py` (PostgreSQL prod ; idempotent) :
1. `ALTER TABLE gift_lists ADD COLUMN owner_id INTEGER REFERENCES users(id);` (si absent).
2. `ALTER TABLE gift_lists ADD COLUMN is_common BOOLEAN NOT NULL DEFAULT FALSE;` (si absent).
3. Backfill owner : `UPDATE gift_lists gl SET owner_id = u.id FROM users u WHERE gl.user_name = u.name AND gl.owner_id IS NULL;`
4. Backfill commune : `UPDATE gift_lists SET is_common = TRUE WHERE user_name IS NULL;` (l'ancienne commune avait `user_name IS NULL`).
5. `ALTER TABLE gift_lists DROP COLUMN user_name;` (après backfill).

Les tests (SQLite mémoire) créent le schéma via `Base.metadata.create_all`, donc reflètent directement le nouveau modèle ; la migration est testée séparément sur sa logique de backfill.

## Endpoints

Tous **megaadmin** (`ensure_megaadmin`, 403 sinon) sauf indication contraire. Le helper `ensure_megaadmin` provient du lot sécurité D.

### Listes
| Méthode | Route | Corps | Notes |
|---|---|---|---|
| POST | `/api/lists/` | `GiftListCreate` | slug auto-unique ; valide owner existant + non déjà propriétaire ; 400 sinon |
| PATCH | `/api/lists/{slug}` | `GiftListUpdate` | renomme label / réassigne owner ; mêmes validations owner ; 404 si liste absente |
| DELETE | `/api/lists/{slug}` | — | cascade : `remove_image` sur chaque idée, suppression des idées, puis de la liste (transactionnel) |
| PATCH | `/api/lists/{slug}/toggle` | — | **existant**, passe megaadmin (lot D) |
| GET | `/api/lists/all/` | — | **reste `isAdmin`** ; réponse `GiftListResponse` enrichie (`owner_id`, `owner_name`) |

### Users / rôles
| Méthode | Route | Corps | Notes |
|---|---|---|---|
| PATCH | `/api/users/{user_id}/role` | `RoleUpdate` | bascule `isAdmin` ; 400 si `user_id` == soi-même ; 404 si absent |
| POST | `/api/create-user/` | `UserCreate` (+`isAdmin`) | **existant**, megaadmin (lot D) ; applique désormais `isAdmin` |

## Logique clé

### Slug
`_slugify(label)` : NFKD → ASCII, minuscule, `[^a-z0-9]+ → "-"`, trim des tirets. Unicité : si le slug existe, suffixe `-2`, `-3`, … Le megaadmin ne saisit jamais le slug.

### Validation propriétaire
À la création/réassignation : `owner_id` doit référencer un user existant ; ce user ne doit pas déjà posséder une autre liste. Sinon `400`.

### Suppression cascade (transactionnelle)
Récupérer les idées de la liste → `remove_image(idea.id)` pour chacune → `DELETE FROM ideas WHERE list_id = …` → `DELETE FROM gift_lists WHERE slug = …`, le tout dans une transaction.

### Répercussion sur les endpoints existants (retrait de `user_name`)
- `get_lists` : « l'admin ne voit pas sa liste » → `gift_list.owner_id == int(payload["sub"])` ; « ni la commune » → `gift_list.is_common`. **Les listes sans compte (`owner_id NULL`, `is_common False`) restent visibles de tous, admins compris.**
- `add-item` / `modify-item` : `userId` de l'idée = `gift_list.owner_id` directement (NULL pour les listes sans compte et la commune ; plus de lookup par nom).

## Bootstrap (1er megaadmin)

`server/create_superadmin.py`, idempotent, env-driven :
- Lit `SUPERADMIN_NAME` + `SUPERADMIN_PASSWORD` (via `config.py`).
- Si un megaadmin existe déjà → ne fait rien (log).
- Sinon crée `User(name, hash_password(password), isAdmin=True, isMegaAdmin=True, firstConnection=True)` (mot de passe d'env temporaire, changé à la 1ʳᵉ connexion).
- `.env.example` documente les deux variables.
- **Seed de la commune** : `create_superadmin.py` crée aussi, si absente, l'unique liste commune (`label "Liste commune"`, `owner_id NULL`, `is_common True`) — car l'UI ne peut pas créer de liste `is_common`.
- Ordre déploiement neuf : `create_db.py` → `migrate_owner_id.py` → `create_superadmin.py` → le megaadmin crée users/listes (à compte ou sans compte) via l'UI.

## UI — extension de `/admin/superadmin`

La page gère déjà la table des users (suppression, reset mot de passe) et une section listes (toggle). Ajouts :
- **Section listes** : bouton « Créer une liste » (label + dropdown propriétaire = users existants + « Aucun (sans compte) ») ; par ligne, **renommer** (label + propriétaire) et **supprimer** (réutilise le dialog de confirmation déjà présent). La liste commune apparaît mais son flag `is_common` n'est pas modifiable.
- **Table users** : **toggle « Admin »** par ligne (confirmation ; désactivé sur soi-même et sur le megaadmin) ; case **« Admin »** dans le formulaire de création d'utilisateur.

### Frontend — dropdowns d'items (lot B intégré)
- `add/page.tsx`, `FormModifyItem.tsx`, `admin/page.tsx` chargent les options depuis `GET /api/lists/all/`.
- Le filtre admin de `admin/page.tsx` passe à **`value = slug`** et interroge `kdos-admin` via **`?list=<slug>`** (filtrage 100 % par liste, plus aucun filtrage par nom de personne côté frontend).

## Gestion d'erreurs

- `403` : non-megaadmin sur tout endpoint protégé (`ensure_megaadmin`).
- `400` : owner inexistant / owner possédant déjà une liste / label vide / auto-rétrogradation de rôle.
- `404` : liste ou user introuvable.
- Suppression cascade transactionnelle (rollback si échec partiel).
- Validation des entrées via schémas Pydantic.

## Stratégie de tests

### Backend (pytest, SQLite mémoire — infra existante)
- **Listes** : création avec owner, sans compte (`owner_id NULL`), et plusieurs listes sans compte autorisées ; l'UI/API ne peut pas créer de liste `is_common` ; unicité de slug (deux labels identiques → `-2`) ; owner inexistant → 400 ; owner possédant déjà une liste → 400 ; non-megaadmin → 403.
- **Visibilité** : une liste sans compte est visible d'un admin via `get_lists` ; la liste `is_common` reste masquée aux admins.
- **Rename/réassignation** : label modifié ; owner réassigné ; libère l'ancien owner.
- **Delete cascade** : idées de la liste supprimées ; `image.remove_image` appelé pour chacune (monkeypatch) ; liste absente après.
- **Rôles** : promotion/rétrogradation `isAdmin` ; auto-rétrogradation bloquée (400) ; non-megaadmin → 403.
- **create-user** : `isAdmin=True` respecté.
- **Migration** : backfill `owner_id` depuis `user_name` et `is_common=True` sur l'ancienne commune (`user_name IS NULL`), sur un jeu de données réduit.
- **Régression** : `get_lists` (admin ne voit pas sa liste/commune), `add-item`/`modify-item` (userId dérivé de owner_id) restent verts.

### Frontend (jest + Testing Library)
- Page superadmin : le formulaire de création de liste rend les options users ; le toggle de rôle appelle l'API ; le formulaire de création expose la case Admin.
- Lot B : `AddItem` (options issues de l'API, pas de noms en dur) et `Nav` (gate `isMegaAdmin`) restent verts.

### E2E (Playwright)
- Smoke du flux superadmin (créer une liste, créer un user admin, supprimer une liste) — noté ; peut nécessiter backend+DB.

## Sécurité incluse dans ce chantier

Ce design intègre, en plus de la feature :
- **Lot D** — `ensure_megaadmin` appliqué aux endpoints superadmin **existants ET nouveaux** (finding #1).
- **SSRF** — validation d'URL (schéma + IP résolues non internes, timeout, taille, content-type) avant `requests.get` (finding #2).
- **Lot A** — gate frontend basé sur `isMegaAdmin` au lieu du nom codé en dur.
- **Lot B** — dropdowns d'items chargés depuis l'API.

**Le lot C** (génériciser le seed de `migrate_lists.py`) est **abandonné** : la gestion de listes au runtime supprime tout nom du code. `migrate_lists.py` reste comme migration historique (déjà exécutée) ; les nouvelles installations passent par `create_superadmin.py` + l'UI.

Hors périmètre (notés à l'audit, non traités ici) : finding #3 (contrôle d'appartenance sur modify/delete-item), finding #4 (défaut DB `admin/admin` en prod), IDOR `untake`, rate-limit login.

## Unités & frontières

- `ensure_megaadmin(payload)` — garde d'autorisation réutilisable (auth).
- `_slugify(label)` + résolveur d'unicité — génération de slug (pur, testable).
- `image._is_safe_image_url` / `_is_blocked_ip` — validation anti-SSRF (pur, testable).
- Endpoints listes / rôles — chacun une opération, validations explicites.
- `create_superadmin.py` — bootstrap isolé, idempotent.
- UI superadmin — composants de section (listes, users) sur la page existante.
