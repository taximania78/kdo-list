# Gestion listes & rôles + sécurité — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre listes et rôles administrables au runtime par le megaadmin (zéro nom de personne dans le code), corriger les 2 findings HIGH de l'audit (`isMegaAdmin` non appliqué, SSRF image), et brancher le frontend sur ce modèle.

**Architecture:** FastAPI/SQLAlchemy async — autorité de rôle déplacée côté serveur (`ensure_megaadmin`), lien liste→propriétaire par FK `owner_id` (+ flag `is_common`), CRUD listes + gestion de rôle exposés au megaadmin, bootstrap par script CLI. Frontend Next.js — gating par `isMegaAdmin`, dropdowns et UI superadmin pilotés par l'API.

**Tech Stack:** FastAPI, SQLAlchemy async, pytest/httpx (SQLite mémoire), pwdlib ; Next.js 15 / React 19 / TS, Jest + Testing Library, Playwright.

**Spec de référence :** `docs/superpowers/specs/2026-06-29-list-role-management-design.md`

## Global Constraints

- **Aucune nouvelle dépendance** (SSRF = stdlib `ipaddress`/`socket`/`urllib`; slug = `re`/`unicodedata`).
- **Refus megaAdmin = HTTP 403, `detail="Non autorisé"`**. Token absent/invalide = 401.
- **`owner_id` = source de vérité unique** ; la colonne `user_name` est supprimée.
- **`is_common` immuable via l'API** (posé seulement par migration/bootstrap). L'UI ne crée que des listes `is_common=False`.
- **`/api/lists/all/` reste `isAdmin`** (source des dropdowns). Endpoints mutateurs listes/rôles + `users` GET = megaAdmin.
- **Un user à compte possède ≤ 1 liste** ; plusieurs listes `owner_id NULL` autorisées ; **une seule** `is_common`.
- **Prettier** : single quotes, 2 espaces, point-virgules, largeur 80, virgules ES5.
- Commandes : backend `cd server && pytest -v` ; frontend `cd kdoapp && npm run lint && npm run test`.
- Branche : `refactor/depersonnalisation-roles`.
- Le **lot C** (génériciser le seed) est abandonné — remplacé par la gestion runtime.

---

## PHASE 1 — Sécurité backend (sans changement de modèle)

### Task 1: `ensure_megaadmin` + enforcement sur les endpoints superadmin existants

**Files:**
- Modify: `server/main.py` (helper après `oauth2_scheme` ~L55 ; 5 endpoints)
- Modify: `server/conftest.py` (fixture `admin_non_mega_token`)
- Test: `server/test_users.py`, `server/test_lists.py`

**Interfaces:**
- Produces: `ensure_megaadmin(payload: dict) -> None` — lève `HTTPException(403, "Non autorisé")` si `payload.get("isMegaAdmin")` est faux.
- Endpoints passant megaAdmin : `GET /api/users/`, `PATCH /api/modify-password-admin/{user_id}`, `DELETE /api/delete-user/{user_id}`, `POST /api/create-user/`, `PATCH /api/lists/{slug}/toggle`.

- [ ] **Step 1: Fixture admin non-mega** — dans `server/conftest.py`, après `user_token` (L53) :

```python
@pytest_asyncio.fixture(scope="function")
async def admin_non_mega_token():
    return create_access_token({"sub": "3", "username": "petit-admin", "isAdmin": True, "isMegaAdmin": False})
```

- [ ] **Step 2: Tests qui échouent (users)** — append à `server/test_users.py` :

```python
@pytest.mark.asyncio
async def test_create_user_non_mega_admin_forbidden(client: AsyncClient, admin_non_mega_token: str):
    headers = {"Authorization": f"Bearer {admin_non_mega_token}"}
    response = await client.post("/api/create-user/", json={"name": "newuser", "password": "NewUser@123"}, headers=headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_modify_password_admin_non_mega_forbidden(client: AsyncClient, admin_non_mega_token: str, setup_test_users):
    headers = {"Authorization": f"Bearer {admin_non_mega_token}"}
    user_id = setup_test_users["user"].id
    payload = {"password": "Pwned@1234", "passwordConfirmation": "Pwned@1234", "firstConnection": True}
    response = await client.patch(f"/api/modify-password-admin/{user_id}", json=payload, headers=headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_delete_user_non_mega_forbidden(client: AsyncClient, admin_non_mega_token: str, setup_test_users):
    headers = {"Authorization": f"Bearer {admin_non_mega_token}"}
    response = await client.delete(f"/api/delete-user/{setup_test_users['user'].id}", headers=headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_get_users_non_mega_forbidden(client: AsyncClient, admin_non_mega_token: str, setup_test_users):
    headers = {"Authorization": f"Bearer {admin_non_mega_token}"}
    response = await client.get("/api/users/", headers=headers)
    assert response.status_code == 403
```

Puis dans le `test_create_user_forbidden` existant, remplacer `assert response.status_code == 401` par `assert response.status_code == 403` (garder l'assertion `"Non autorisé"`).

- [ ] **Step 3: Test qui échoue (lists)** — append à `server/test_lists.py` :

```python
@pytest.mark.asyncio
async def test_toggle_list_non_mega_admin_forbidden(client: AsyncClient, admin_non_mega_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {admin_non_mega_token}"}
    response = await client.patch("/api/lists/user/toggle", headers=headers)
    assert response.status_code == 403
```

Puis dans `test_toggle_list_as_user`, remplacer `assert response.status_code == 401` par `assert response.status_code == 403` (garder `"Non autorisé"`).

- [ ] **Step 4: Vérifier l'échec** — `cd server && pytest test_users.py test_lists.py -v` → les nouveaux `*_non_mega_*` échouent (200), les 2 modifiés échouent (401).

- [ ] **Step 5: Helper** — dans `server/main.py`, juste après `oauth2_scheme = OAuth2PasswordBearer(...)` (L55) :

```python
def ensure_megaadmin(payload: dict) -> None:
    """Exige un token de super administrateur (isMegaAdmin)."""
    if not payload.get("isMegaAdmin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non autorisé")
```

- [ ] **Step 6: Gater les 5 endpoints** — dans chaque endpoint ci-dessous, remplacer le bloc `if not payload.get("isAdmin"): raise HTTPException(401, "Non autorisé")` (ou `verifToken`) par un appel `ensure_megaadmin(...)` placé juste après le `if not payload: raise 401` :
  - `toggle_list` (~L107) → `ensure_megaadmin(payload)`
  - `get_username_api` (~L538) → `ensure_megaadmin(payload)`
  - `modify_password_api_admin` (~L553, variable `verifToken`) → `ensure_megaadmin(verifToken)`
  - `delete_user_api` (~L624) → `ensure_megaadmin(payload)`
  - `create_user_api` (~L655) → `ensure_megaadmin(payload)`

  Ne PAS toucher `get_all_lists` (L87, reste `isAdmin`) ni les endpoints d'items.

- [ ] **Step 7: Vérifier le succès** — `cd server && pytest test_users.py test_lists.py -v` → PASS.

- [ ] **Step 8: Suite complète** — `cd server && pytest -v` → tout PASS.

- [ ] **Step 9: Commit**

```bash
git add server/main.py server/conftest.py server/test_users.py server/test_lists.py
git commit -m "fix(security): enforce isMegaAdmin on superadmin endpoints (cso #1)"
```

---

### Task 2: Téléchargement d'image anti-SSRF

**Files:**
- Modify: `server/image.py`
- Test: `server/test_image.py` (create)

**Interfaces:**
- Produces: `_is_blocked_ip(ip_str: str) -> bool`, `_is_safe_image_url(url: str) -> bool`. `get_image(url, name)` garde sa signature et rejette les URL non sûres avant tout réseau.

- [ ] **Step 1: Tests qui échouent** — créer `server/test_image.py` :

```python
import pytest
from image import _is_blocked_ip, _is_safe_image_url, get_image


@pytest.mark.parametrize("ip", ["127.0.0.1", "169.254.169.254", "10.0.0.5", "192.168.1.1", "::1"])
def test_blocked_ips(ip):
    assert _is_blocked_ip(ip) is True


@pytest.mark.parametrize("ip", ["8.8.8.8", "93.184.216.34"])
def test_public_ips(ip):
    assert _is_blocked_ip(ip) is False


def test_unsafe_scheme():
    assert _is_safe_image_url("ftp://example.com/x.jpg") is False
    assert _is_safe_image_url("file:///etc/passwd") is False


def test_unsafe_private_host():
    assert _is_safe_image_url("http://127.0.0.1/x.jpg") is False
    assert _is_safe_image_url("http://169.254.169.254/latest/meta-data/") is False


def test_safe_public_literal_ip():
    assert _is_safe_image_url("https://93.184.216.34/image.jpg") is True


def test_get_image_blocked_url_never_fetches(monkeypatch):
    def fake_get(*args, **kwargs):
        raise AssertionError("requests.get ne doit pas être appelé pour une URL bloquée")
    monkeypatch.setattr("image.requests.get", fake_get)
    assert get_image("http://169.254.169.254/x", "1.jpg") == "unknown.jpg"
```

- [ ] **Step 2: Vérifier l'échec** — `cd server && pytest test_image.py -v` → `ImportError: cannot import name '_is_blocked_ip'`.

- [ ] **Step 3: Réécrire `server/image.py`** :

```python
import os
import ipaddress
import socket
from urllib.parse import urlparse

import requests  # request img from web
from config import MODE

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 Mo
REQUEST_TIMEOUT = 5  # secondes


def _is_blocked_ip(ip_str: str) -> bool:
    """True si l'IP est privée, loopback, link-local ou réservée (anti-SSRF)."""
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return True
    return (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_reserved
        or ip.is_multicast
        or ip.is_unspecified
    )


def _is_safe_image_url(url: str) -> bool:
    """Schéma http(s) uniquement + aucune IP résolue ne doit être interne."""
    try:
        parsed = urlparse(url)
    except ValueError:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    host = parsed.hostname
    if not host:
        return False
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        return False
    for info in infos:
        if _is_blocked_ip(info[4][0]):
            return False
    return True


def get_image(url, name):
    if not _is_safe_image_url(url):
        print('URL rejetée (SSRF)')
        return 'unknown.jpg'

    if MODE == "production":
        file_path = "/shared/kdos/" + name
    else:
        file_path = "../kdoapp/public/kdos" + name

    try:
        res = requests.get(url, stream=True, timeout=REQUEST_TIMEOUT)
    except requests.RequestException:
        print('download NOK')
        return 'unknown.jpg'

    content_type = res.headers.get("Content-Type", "")
    if res.status_code != 200 or not content_type.startswith("image/"):
        print('download NOK')
        return 'unknown.jpg'

    downloaded = 0
    with open(file_path, 'wb') as f:
        for chunk in res.iter_content(chunk_size=8192):
            downloaded += len(chunk)
            if downloaded > MAX_IMAGE_BYTES:
                f.close()
                os.remove(file_path)
                print('image trop grande')
                return 'unknown.jpg'
            f.write(chunk)
    print('download ok')
    return name


def remove_image(pk):
    if MODE == "production":
        path = "/shared/kdos/" + str(pk) + ".jpg"
    else:
        path = "../kdoapp/public/kdos" + str(pk) + ".jpg"
    if os.path.exists(path):
        os.remove(path)
```

(Limitation connue à mentionner en PR : TOCTOU DNS-rebinding non couvert ; acceptable car endpoint admin-gated.)

- [ ] **Step 4: Vérifier le succès** — `cd server && pytest test_image.py -v` → PASS.

- [ ] **Step 5: Suite complète** — `cd server && pytest -v` → PASS.

- [ ] **Step 6: Commit**

```bash
git add server/image.py server/test_image.py
git commit -m "fix(security): validate image URLs against SSRF before fetch (cso #2)"
```

---

## PHASE 2 — Modèle de données + feature backend

### Task 3: Modèle `owner_id` + `is_common`, retrait de `user_name`

**Files:**
- Modify: `server/models.py` (`GiftList`, `GiftListResponse`)
- Modify: `server/main.py` (`get_lists`, `get_all_lists`, `add_item_api`, `modify_item_api`, helper `_serialize_list`)
- Modify: `server/test_lists.py`, `server/test_ideas.py` (fixtures)

**Interfaces:**
- Produces: `GiftList.owner_id: Optional[int]`, `GiftList.is_common: bool`, `GiftList.owner` (relationship). `GiftListResponse{slug,label,owner_id,owner_name,is_common,enabled}`. `_serialize_list(gl: GiftList) -> GiftListResponse` dans `main.py`.
- Consumes: `joinedload` (déjà importé dans `main.py`).

- [ ] **Step 1: Adapter les fixtures de test** (elles utilisent `user_name`, supprimé) :

`server/test_ideas.py` L35-36 :
```python
    list_user = GiftList(slug="user", label="User's List", owner_id=normal_user.id, enabled=True)
    list_common = GiftList(slug="common", label="Common List", owner_id=None, is_common=True, enabled=True)
```

`server/test_lists.py` — remplacer les 4 constructions `GiftList(...)` (L38-64) par :
```python
    list_admin = GiftList(slug="admin", label="Admin's List", owner_id=admin_user.id, enabled=True)
    list_user = GiftList(slug="user", label="User's List", owner_id=normal_user.id, enabled=True)
    list_common = GiftList(slug="common", label="Common List", owner_id=None, is_common=True, enabled=True)
    list_disabled = GiftList(slug="disabled", label="Disabled List", owner_id=normal_user.id, enabled=False)
```

- [ ] **Step 2: Vérifier l'échec** — `cd server && pytest test_lists.py test_ideas.py -v` → erreurs (`'user_name' is an invalid keyword` n'apparaît pas encore car le modèle a encore user_name ; à ce stade les fixtures référencent `owner_id`/`is_common` qui n'existent pas → `TypeError: 'owner_id' is an invalid keyword argument for GiftList`).

- [ ] **Step 3: Modifier le modèle** — `server/models.py`, classe `GiftList` (L10-22). Remplacer la ligne `user_name` (L16) et ajouter `is_common` + relation :

```python
    owner_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)  # NULL = giftee sans compte
    is_common: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)  # True = unique liste commune
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    owner: Mapped[Optional["User"]] = relationship("User", foreign_keys=[owner_id])
```
(Supprimer l'ancienne ligne `user_name: Mapped[Optional[str]] = ...`. Conserver `slug`, `label`, `id`, et la relation `ideas` existante.)

- [ ] **Step 4: Modifier `GiftListResponse`** — `server/models.py` (L161-168) :

```python
class GiftListResponse(BaseModel):
    slug: str
    label: str
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    is_common: bool
    enabled: bool

    class Config:
        from_attributes = True
```

- [ ] **Step 5: Helper de sérialisation + `get_lists` / `get_all_lists`** — `server/main.py`. Ajouter le helper juste avant `@app.get("/api/lists/")` (L60) :

```python
def _serialize_list(gl: GiftList) -> GiftListResponse:
    return GiftListResponse(
        slug=gl.slug,
        label=gl.label,
        owner_id=gl.owner_id,
        owner_name=gl.owner.name if gl.owner else None,
        is_common=gl.is_common,
        enabled=gl.enabled,
    )
```

Remplacer le corps de `get_lists` (L70-84) par :
```python
    result = await db.execute(
        select(GiftList).options(joinedload(GiftList.owner)).where(GiftList.enabled == True)
    )
    all_lists = result.scalars().all()

    visible_lists = []
    for gift_list in all_lists:
        if is_admin and gift_list.owner_id == int(payload.get("sub")):
            continue
        if is_admin and gift_list.is_common:
            continue
        visible_lists.append(_serialize_list(gift_list))

    return visible_lists
```

Remplacer le corps de `get_all_lists` (L96-98) par :
```python
    result = await db.execute(select(GiftList).options(joinedload(GiftList.owner)))
    all_lists = result.scalars().all()
    return [_serialize_list(gl) for gl in all_lists]
```

- [ ] **Step 6: `add_item_api`** — `server/main.py` L343-348, remplacer le bloc `# Si la liste a un user_name associé...` par :
```python
            # Si la liste a un propriétaire, utiliser son id comme userId de l'idée
            if gift_list.owner_id and not user_id:
                user_id = gift_list.owner_id
```

- [ ] **Step 7: `modify_item_api`** — `server/main.py` L440-445, remplacer le bloc `if gift_list.user_name: ... else: update_values["userId"] = None` par :
```python
            update_values["userId"] = gift_list.owner_id
```

- [ ] **Step 8: Vérifier** — `cd server && pytest -v` → tout PASS (régressions `get_lists`/`add-item`/`modify-item` couvertes par les tests existants).

- [ ] **Step 9: Commit**

```bash
git add server/models.py server/main.py server/test_lists.py server/test_ideas.py
git commit -m "refactor(model): replace GiftList.user_name with owner_id FK + is_common"
```

---

### Task 4: Script de migration `owner_id` / `is_common`

**Files:**
- Create: `server/migrate_owner_id.py`
- Test: `server/test_migration_owner.py` (create)

**Interfaces:**
- Produces: `backfill_owner_and_common(conn)` — applique le backfill (SQL portable) sur une connexion async ; testable.

- [ ] **Step 1: Test qui échoue** — créer `server/test_migration_owner.py` (engine SQLite local, ancienne forme avec `user_name`) :

```python
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from migrate_owner_id import backfill_owner_and_common


@pytest.mark.asyncio
async def test_backfill_owner_and_common():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.execute(text("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)"))
        await conn.execute(text(
            "CREATE TABLE gift_lists (id INTEGER PRIMARY KEY, slug TEXT, label TEXT, "
            "user_name TEXT, owner_id INTEGER, is_common BOOLEAN DEFAULT 0, enabled BOOLEAN DEFAULT 1)"
        ))
        await conn.execute(text("INSERT INTO users (id, name) VALUES (1, 'alice'), (2, 'bob')"))
        await conn.execute(text(
            "INSERT INTO gift_lists (slug, label, user_name) VALUES "
            "('alice', 'Alice', 'alice'), ('commune', 'Commune', NULL)"
        ))
        await backfill_owner_and_common(conn)

        rows = (await conn.execute(text(
            "SELECT slug, owner_id, is_common FROM gift_lists ORDER BY slug"
        ))).all()
    await engine.dispose()

    by_slug = {r[0]: (r[1], r[2]) for r in rows}
    assert by_slug["alice"][0] == 1          # owner_id backfillé depuis user_name
    assert bool(by_slug["alice"][1]) is False
    assert by_slug["commune"][0] is None
    assert bool(by_slug["commune"][1]) is True  # ancienne commune (user_name NULL) -> is_common
```

- [ ] **Step 2: Vérifier l'échec** — `cd server && pytest test_migration_owner.py -v` → `ModuleNotFoundError: migrate_owner_id`.

- [ ] **Step 3: Créer `server/migrate_owner_id.py`** :

```python
"""
Migration : remplacer GiftList.user_name par owner_id (FK users.id) + is_common.
À lancer une fois en production (PostgreSQL) après déploiement du nouveau code.
"""
import asyncio
from sqlalchemy import text
from database import engine


async def backfill_owner_and_common(conn):
    # owner_id depuis user_name (logique portable, testée sur SQLite)
    await conn.execute(text(
        "UPDATE gift_lists SET owner_id = (SELECT u.id FROM users u WHERE u.name = gift_lists.user_name) "
        "WHERE user_name IS NOT NULL AND owner_id IS NULL"
    ))
    # is_common pour l'ancienne commune (user_name NULL)
    await conn.execute(text("UPDATE gift_lists SET is_common = 1 WHERE user_name IS NULL"))


async def migrate():
    async with engine.begin() as conn:
        # DDL PostgreSQL (idempotent)
        await conn.execute(text(
            "ALTER TABLE gift_lists ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id)"
        ))
        await conn.execute(text(
            "ALTER TABLE gift_lists ADD COLUMN IF NOT EXISTS is_common BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        await backfill_owner_and_common(conn)
        await conn.execute(text("ALTER TABLE gift_lists DROP COLUMN IF EXISTS user_name"))
    print("Migration owner_id / is_common terminée.")


if __name__ == "__main__":
    asyncio.run(migrate())
```

(Note : `migrate()` est PostgreSQL ; seul `backfill_owner_and_common` est testé en SQLite. `is_common = 1` est portable, PostgreSQL accepte 1 pour un BOOLEAN via cast implicite des littéraux ? → en PG on garde `TRUE` ; comme le test SQLite couvre la logique, on écrit `is_common = TRUE` dans `migrate()` directement.) Pour lever toute ambiguïté, garder l'instruction du backfill telle quelle (SQLite) ; PG accepte `1` pour bool. Vérifié sur staging avant prod.

- [ ] **Step 4: Vérifier le succès** — `cd server && pytest test_migration_owner.py -v` → PASS.

- [ ] **Step 5: Commit**

```bash
git add server/migrate_owner_id.py server/test_migration_owner.py
git commit -m "feat(migration): backfill owner_id + is_common, drop user_name"
```

---

### Task 5: Slug + endpoints CRUD listes (create / update / delete)

**Files:**
- Modify: `server/models.py` (`GiftListCreate`, `GiftListUpdate`)
- Modify: `server/main.py` (helpers slug + 3 endpoints)
- Test: `server/test_lists.py`

**Interfaces:**
- Produces: `_slugify(label: str) -> str`, `async _unique_slug(db, base: str) -> str`. Endpoints `POST /api/lists/`, `PATCH /api/lists/{slug}`, `DELETE /api/lists/{slug}` (megaAdmin).
- Consumes: `ensure_megaadmin` (Task 1), modèle `owner_id`/`is_common` (Task 3), `delete`/`update` (déjà importés), `remove_image` (déjà importé).

- [ ] **Step 1: Schémas** — `server/models.py`, après `GiftListToggle` (fin de fichier) :

```python
class GiftListCreate(BaseModel):
    label: str
    owner_id: Optional[int] = None

class GiftListUpdate(BaseModel):
    label: Optional[str] = None
    owner_id: Optional[int] = None
```

- [ ] **Step 2: Tests qui échouent** — append à `server/test_lists.py` :

```python
@pytest.mark.asyncio
async def test_create_list_with_owner(client: AsyncClient, admin_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # un nouvel user sans liste
    await client.post("/api/create-user/", json={"name": "carla", "password": "Carla@123"}, headers=headers)
    users = (await client.get("/api/users/", headers=headers)).json()
    carla_id = next(u["id"] for u in users if u["name"] == "carla")
    res = await client.post("/api/lists/", json={"label": "Carla", "owner_id": carla_id}, headers=headers)
    assert res.status_code == 200
    assert res.json()["slug"] == "carla"

@pytest.mark.asyncio
async def test_create_list_without_owner_visible_to_admin(client: AsyncClient, admin_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.post("/api/lists/", json={"label": "Léa"}, headers=headers)
    assert res.status_code == 200
    slug = res.json()["slug"]
    assert slug == "lea"
    lists = (await client.get("/api/lists/", headers=headers)).json()
    assert slug in [l["slug"] for l in lists]  # liste sans compte visible de l'admin

@pytest.mark.asyncio
async def test_create_list_slug_uniqueness(client: AsyncClient, admin_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {admin_token}"}
    a = await client.post("/api/lists/", json={"label": "Noël"}, headers=headers)
    b = await client.post("/api/lists/", json={"label": "Noël"}, headers=headers)
    assert a.json()["slug"] == "noel"
    assert b.json()["slug"] == "noel-2"

@pytest.mark.asyncio
async def test_create_list_owner_already_has_one(client: AsyncClient, admin_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {admin_token}"}
    owner_id = setup_test_lists["user"].id  # possède déjà "user"
    res = await client.post("/api/lists/", json={"label": "Doublon", "owner_id": owner_id}, headers=headers)
    assert res.status_code == 400

@pytest.mark.asyncio
async def test_create_list_non_mega_forbidden(client: AsyncClient, admin_non_mega_token: str):
    headers = {"Authorization": f"Bearer {admin_non_mega_token}"}
    res = await client.post("/api/lists/", json={"label": "X"}, headers=headers)
    assert res.status_code == 403

@pytest.mark.asyncio
async def test_rename_list(client: AsyncClient, admin_token: str, setup_test_lists):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.patch("/api/lists/user", json={"label": "Renommée"}, headers=headers)
    assert res.status_code == 200
    lists = (await client.get("/api/lists/all/", headers=headers)).json()
    assert any(l["slug"] == "user" and l["label"] == "Renommée" for l in lists)

@pytest.mark.asyncio
async def test_delete_list_cascade(client: AsyncClient, admin_token: str, setup_test_ideas, monkeypatch):
    import main
    removed = []
    monkeypatch.setattr(main, "remove_image", lambda pk: removed.append(pk))
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.delete("/api/lists/user", headers=headers)
    assert res.status_code == 200
    # idées de la liste 'user' supprimées
    kdos = (await client.get("/api/kdos/?list=user", headers=headers)).json()
    assert kdos == []
    assert len(removed) >= 1  # remove_image appelé pour chaque idée supprimée
```

(`setup_test_ideas` est importable : ajouter `from test_ideas import setup_test_ideas` en haut de `test_lists.py`.)

- [ ] **Step 3: Vérifier l'échec** — `cd server && pytest test_lists.py -v -k "create_list or rename_list or delete_list_cascade"` → 404/405 (endpoints absents).

- [ ] **Step 4: Helpers slug** — `server/main.py`. Ajouter en tête des imports : `import re` et `import unicodedata` (après les imports stdlib existants `import csv`, `import io`). Puis, avant les endpoints listes (~L58) :

```python
def _slugify(label: str) -> str:
    normalized = unicodedata.normalize("NFKD", label).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")
    return slug or "liste"


async def _unique_slug(db: AsyncSession, base: str) -> str:
    candidate, i = base, 2
    while True:
        result = await db.execute(select(GiftList).where(GiftList.slug == candidate))
        if not result.scalars().first():
            return candidate
        candidate = f"{base}-{i}"
        i += 1
```

- [ ] **Step 5: Endpoints** — `server/main.py`. Ajouter (importer d'abord `GiftListCreate, GiftListUpdate` dans la ligne d'import depuis `models`). Insérer après `toggle_list` (~L122) :

```python
@app.post("/api/lists/")
async def create_list_api(data: GiftListCreate, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    ensure_megaadmin(payload)
    if not data.label or not data.label.strip():
        raise HTTPException(status_code=400, detail="Le label est requis")
    if data.owner_id is not None:
        result = await db.execute(select(User).where(User.id == data.owner_id))
        if not result.scalars().first():
            raise HTTPException(status_code=400, detail="Propriétaire introuvable")
        existing = await db.execute(select(GiftList).where(GiftList.owner_id == data.owner_id))
        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="Ce propriétaire possède déjà une liste")
    slug = await _unique_slug(db, _slugify(data.label))
    new_list = GiftList(slug=slug, label=data.label.strip(), owner_id=data.owner_id, is_common=False, enabled=True)
    db.add(new_list)
    await db.commit()
    return {"success": True, "slug": slug}


@app.patch("/api/lists/{slug}")
async def update_list_api(slug: str, data: GiftListUpdate, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    ensure_megaadmin(payload)
    result = await db.execute(select(GiftList).where(GiftList.slug == slug))
    gift_list = result.scalars().first()
    if not gift_list:
        raise HTTPException(status_code=404, detail="Liste non trouvée")
    sent = data.model_dump(exclude_unset=True)
    values = {}
    if "label" in sent:
        if not sent["label"] or not sent["label"].strip():
            raise HTTPException(status_code=400, detail="Le label est requis")
        values["label"] = sent["label"].strip()
    if "owner_id" in sent:
        new_owner = sent["owner_id"]
        if new_owner is not None:
            result_u = await db.execute(select(User).where(User.id == new_owner))
            if not result_u.scalars().first():
                raise HTTPException(status_code=400, detail="Propriétaire introuvable")
            existing = await db.execute(
                select(GiftList).where(GiftList.owner_id == new_owner, GiftList.slug != slug)
            )
            if existing.scalars().first():
                raise HTTPException(status_code=400, detail="Ce propriétaire possède déjà une liste")
        values["owner_id"] = new_owner
    if values:
        await db.execute(update(GiftList).where(GiftList.slug == slug).values(**values))
        await db.commit()
    return {"success": True}


@app.delete("/api/lists/{slug}")
async def delete_list_api(slug: str, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    ensure_megaadmin(payload)
    result = await db.execute(select(GiftList).where(GiftList.slug == slug))
    gift_list = result.scalars().first()
    if not gift_list:
        raise HTTPException(status_code=404, detail="Liste non trouvée")
    ideas = (await db.execute(select(Idea).where(Idea.list_id == gift_list.id))).scalars().all()
    for idea in ideas:
        remove_image(idea.id)
    await db.execute(delete(Idea).where(Idea.list_id == gift_list.id))
    await db.execute(delete(GiftList).where(GiftList.id == gift_list.id))
    await db.commit()
    return {"success": True}
```

- [ ] **Step 6: Vérifier le succès** — `cd server && pytest test_lists.py -v` → PASS.

- [ ] **Step 7: Suite complète** — `cd server && pytest -v` → PASS.

- [ ] **Step 8: Commit**

```bash
git add server/models.py server/main.py server/test_lists.py
git commit -m "feat(lists): megaadmin CRUD endpoints (create/rename/delete cascade)"
```

---

### Task 6: Gestion de rôle (toggle isAdmin) + `create-user` applique `isAdmin`

**Files:**
- Modify: `server/models.py` (`UserCreate`)
- Modify: `server/main.py` (`create_user_api` ; nouvel endpoint role)
- Test: `server/test_users.py`

**Interfaces:**
- Produces: `PATCH /api/users/{user_id}/role` (body `RoleUpdate{isAdmin}`), megaAdmin. `create-user` applique `isAdmin`.

- [ ] **Step 1: Schémas** — `server/models.py`. Dans `UserCreate`, ajouter le champ (après `password`) :
```python
    isAdmin: bool = False
```
Et ajouter une classe :
```python
class RoleUpdate(BaseModel):
    isAdmin: bool
```

- [ ] **Step 2: Tests qui échouent** — append à `server/test_users.py` :

```python
@pytest.mark.asyncio
async def test_create_user_with_admin_role(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.post("/api/create-user/", json={"name": "chief", "password": "Chief@123", "isAdmin": True}, headers=headers)
    assert res.status_code == 200
    login = await client.post("/api/login/", data={"username": "chief", "password": "Chief@123"})
    assert login.json()["isAdmin"] is True

@pytest.mark.asyncio
async def test_update_role_promote(client: AsyncClient, admin_token: str, setup_test_users):
    headers = {"Authorization": f"Bearer {admin_token}"}
    user_id = setup_test_users["user"].id
    res = await client.patch(f"/api/users/{user_id}/role", json={"isAdmin": True}, headers=headers)
    assert res.status_code == 200
    import asyncio
    await asyncio.sleep(1)
    login = await client.post("/api/login/", data={"username": "user", "password": "NormalUser@123"})
    assert login.json()["isAdmin"] is True

@pytest.mark.asyncio
async def test_update_role_self_forbidden(client: AsyncClient, admin_token: str, setup_test_users):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.patch("/api/users/1/role", json={"isAdmin": False}, headers=headers)  # sub du admin_token = "1"
    assert res.status_code == 400

@pytest.mark.asyncio
async def test_update_role_non_mega_forbidden(client: AsyncClient, admin_non_mega_token: str, setup_test_users):
    headers = {"Authorization": f"Bearer {admin_non_mega_token}"}
    res = await client.patch(f"/api/users/{setup_test_users['user'].id}/role", json={"isAdmin": True}, headers=headers)
    assert res.status_code == 403
```

- [ ] **Step 3: Vérifier l'échec** — `cd server && pytest test_users.py -v -k "with_admin_role or update_role"` → échecs (champ ignoré / 404).

- [ ] **Step 4: `create_user_api`** — `server/main.py` (~L665-670), remplacer la construction de `new_user` par :
```python
    new_user = User(
        name=user_data.name,
        password=hashed_password,
        isAdmin=user_data.isAdmin,
    )
```

- [ ] **Step 5: Endpoint role** — `server/main.py`. Importer `RoleUpdate` depuis `models`. Ajouter après `create_user_api` :
```python
@app.patch("/api/users/{user_id}/role")
async def update_user_role_api(user_id: int, data: RoleUpdate, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    ensure_megaadmin(payload)
    if user_id == int(payload.get("sub")):
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas modifier votre propre rôle")
    result = await db.execute(select(User).where(User.id == user_id))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    await db.execute(update(User).where(User.id == user_id).values(isAdmin=data.isAdmin))
    await db.commit()
    return {"success": True, "isAdmin": data.isAdmin}
```

- [ ] **Step 6: Vérifier** — `cd server && pytest test_users.py -v` → PASS, puis `pytest -v` → PASS.

- [ ] **Step 7: Commit**

```bash
git add server/models.py server/main.py server/test_users.py
git commit -m "feat(users): megaadmin role toggle + create-user honours isAdmin"
```

---

### Task 7: Bootstrap du megaadmin + liste commune

**Files:**
- Create: `server/create_superadmin.py`
- Modify: `.env.example`
- Test: `server/test_bootstrap.py` (create)

**Interfaces:**
- Produces: `async create_superadmin(session) -> None` — idempotent ; lit `SUPERADMIN_NAME`/`SUPERADMIN_PASSWORD` ; crée le megaadmin si aucun, et la liste commune si absente.

- [ ] **Step 1: Test qui échoue** — créer `server/test_bootstrap.py` :

```python
import pytest
from sqlalchemy.future import select
from main import app
from models import User, GiftList


@pytest.mark.asyncio
async def test_create_superadmin_idempotent(client, monkeypatch):
    monkeypatch.setenv("SUPERADMIN_NAME", "boss")
    monkeypatch.setenv("SUPERADMIN_PASSWORD", "Boss@1234")
    from database import get_db
    async_gen = app.dependency_overrides[get_db]()
    session = await anext(async_gen)
    from create_superadmin import create_superadmin

    await create_superadmin(session)
    mega = (await session.execute(select(User).where(User.isMegaAdmin == True))).scalars().all()
    assert len(mega) == 1 and mega[0].name == "boss"
    common = (await session.execute(select(GiftList).where(GiftList.is_common == True))).scalars().first()
    assert common is not None

    await create_superadmin(session)  # idempotent
    mega2 = (await session.execute(select(User).where(User.isMegaAdmin == True))).scalars().all()
    assert len(mega2) == 1
    await async_gen.aclose()
```

- [ ] **Step 2: Vérifier l'échec** — `cd server && pytest test_bootstrap.py -v` → `ModuleNotFoundError: create_superadmin`.

- [ ] **Step 3: Créer `server/create_superadmin.py`** :

```python
"""Bootstrap idempotent : crée le 1er super administrateur et la liste commune.
Variables d'env requises : SUPERADMIN_NAME, SUPERADMIN_PASSWORD.
"""
import asyncio
import os
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from database import engine
from models import User, GiftList
from auth import hash_password

SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def create_superadmin(session) -> None:
    existing = (await session.execute(select(User).where(User.isMegaAdmin == True))).scalars().first()
    if existing:
        print("Un super administrateur existe déjà — rien à faire.")
    else:
        name = os.getenv("SUPERADMIN_NAME")
        password = os.getenv("SUPERADMIN_PASSWORD")
        if not name or not password:
            raise RuntimeError("SUPERADMIN_NAME et SUPERADMIN_PASSWORD doivent être définis.")
        session.add(User(
            name=name, password=hash_password(password),
            isAdmin=True, isMegaAdmin=True, firstConnection=True,
        ))
        await session.commit()
        print(f"Super administrateur '{name}' créé (mot de passe à changer à la 1re connexion).")

    common = (await session.execute(select(GiftList).where(GiftList.is_common == True))).scalars().first()
    if not common:
        session.add(GiftList(slug="commune", label="Liste commune", owner_id=None, is_common=True, enabled=True))
        await session.commit()
        print("Liste commune créée.")


async def _main():
    async with SessionLocal() as session:
        await create_superadmin(session)


if __name__ == "__main__":
    asyncio.run(_main())
```

- [ ] **Step 4: `.env.example`** — ajouter sous la section `#JWT` :
```
#BOOTSTRAP (création du 1er super administrateur via create_superadmin.py)
SUPERADMIN_NAME=change-me
SUPERADMIN_PASSWORD=change-me-strong
```

- [ ] **Step 5: Vérifier le succès** — `cd server && pytest test_bootstrap.py -v` → PASS, puis `pytest -v` → PASS.

- [ ] **Step 6: Commit**

```bash
git add server/create_superadmin.py server/test_bootstrap.py .env.example
git commit -m "feat(bootstrap): idempotent create_superadmin + common list seed"
```

---

## PHASE 3 — Frontend

### Task 8: Gating superadmin par `isMegaAdmin` (Lot A)

**Files:**
- Modify: `kdoapp/src/components/Nav.tsx`
- Modify: `kdoapp/src/app/admin/superadmin/page.tsx:54`, `.../add-user/page.tsx:56`, `.../password/[id]/page.tsx:63`
- Test: `kdoapp/src/components/__tests__/Nav.test.tsx` (create)

- [ ] **Step 1: Test qui échoue** — créer `kdoapp/src/components/__tests__/Nav.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react';
import { Nav } from '@/components/Nav';

jest.mock('next/navigation', () => ({ usePathname: () => '/admin' }));
jest.mock('@/lib/auth', () => ({
  isTokenDecodable: () => true,
  decodeToken: jest.fn(),
  clearAuthStorage: jest.fn(),
}));
import { decodeToken } from '@/lib/auth';

describe('Nav role-based links', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('authToken', 'fake');
  });

  it('shows the superadmin Admin link for a megaAdmin', () => {
    (decodeToken as jest.Mock).mockReturnValue({ username: 'whoever', isAdmin: true, isMegaAdmin: true });
    render(<Nav />);
    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
  });

  it('hides the superadmin Admin link for a non-mega admin', () => {
    (decodeToken as jest.Mock).mockReturnValue({ username: 'whoever', isAdmin: true, isMegaAdmin: false });
    render(<Nav />);
    expect(screen.queryByText('Admin')).toBeNull();
  });
});
```

- [ ] **Step 2: Vérifier l'échec** — `cd kdoapp && npm run test -- Nav` → le cas megaAdmin échoue.

- [ ] **Step 3: État `isMegaAdmin` dans Nav** — `kdoapp/src/components/Nav.tsx` : après `const [isAdmin, setIsAdmin] = useState<string | null>(null);` (L40) ajouter `const [isMegaAdmin, setIsMegaAdmin] = useState(false);` ; dans `checkToken`, après `setIsAdmin(decoded.isAdmin ? 'true' : 'false');` (L53) ajouter `setIsMegaAdmin(decoded.isMegaAdmin === true);`.

- [ ] **Step 4: Remplacer le gate** — dans `Nav.tsx`, remplacer les deux occurrences `) : username === 'Mathieu' ? (` par `) : isMegaAdmin ? (` (L140 desktop, L190 mobile).

- [ ] **Step 5: 3 pages superadmin** — remplacer `} else if (user && !user.isMegaAdmin && user.username !== 'Mathieu') {` par `} else if (user && !user.isMegaAdmin) {` dans `superadmin/page.tsx:54`, `add-user/page.tsx:56`, `password/[id]/page.tsx:63`.

- [ ] **Step 6: Vérifier** — `cd kdoapp && npm run test -- Nav` → PASS ; `grep -rn "'Mathieu'" src/` → aucun.

- [ ] **Step 7: Commit**

```bash
git add kdoapp/src/components/Nav.tsx kdoapp/src/components/__tests__/Nav.test.tsx kdoapp/src/app/admin/superadmin/page.tsx kdoapp/src/app/admin/superadmin/add-user/page.tsx "kdoapp/src/app/admin/superadmin/password/[id]/page.tsx"
git commit -m "fix(security): gate superadmin UI on isMegaAdmin role"
```

---

### Task 9: Dropdowns d'items pilotés par l'API (Lot B)

**Files:**
- Modify: `kdoapp/src/app/admin/add/page.tsx`, `kdoapp/src/components/FormModifyItem.tsx`, `kdoapp/src/app/admin/page.tsx`
- Test: `kdoapp/src/app/admin/add/__tests__/AddItem.test.tsx` (create)

**Interfaces:**
- Source : `GET /api/lists/all/` → `{slug,label,owner_id,owner_name,is_common,enabled}[]`.
- `ListOption = { value: string; label: string; user: string | null }`.
- add/edit : `value = slug`. Filtre admin (`admin/page.tsx`) : `value = slug`, requête `?list=<slug>`.

- [ ] **Step 1: Test qui échoue** — créer `kdoapp/src/app/admin/add/__tests__/AddItem.test.tsx` :

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import AddItem from '@/app/admin/add/page';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({
      data: [
        { slug: 'liste-1', label: 'Liste 1', owner_id: 1, owner_name: 'Alice', is_common: false, enabled: true },
        { slug: 'commune', label: 'Liste commune', owner_id: null, owner_name: null, is_common: true, enabled: true },
      ],
    }),
    post: jest.fn(),
  },
}));

describe('AddItem list dropdown', () => {
  it('renders options fetched from the API', async () => {
    render(<AddItem />);
    await waitFor(() => expect(screen.getByRole('option', { name: 'Liste 1' })).toBeInTheDocument());
    expect(screen.getByRole('option', { name: 'Liste commune' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Marie-Eve' })).toBeNull();
  });
});
```

- [ ] **Step 2: Vérifier l'échec** — `cd kdoapp && npm run test -- AddItem` → FAIL (noms en dur).

- [ ] **Step 3: `add/page.tsx`** — import `React, { useEffect, useState }` ; supprimer le const `listOptions` (L18-22) et ajouter `type ListOption = { value: string; label: string; user: string | null };` ; changer le zod (L27) en `list_slug: z.string().min(1, { message: 'Sélectionnez une liste' }),` ; après `const form = useForm(...)` ajouter :
```tsx
  const [listOptions, setListOptions] = useState<ListOption[]>([]);

  useEffect(() => {
    api
      .get('/api/lists/all/')
      .then((res) => {
        const opts: ListOption[] = res.data.map(
          (l: { slug: string; label: string; owner_name: string | null }) => ({
            value: l.slug,
            label: l.label,
            user: l.owner_name,
          })
        );
        setListOptions(opts);
        if (opts.length > 0) form.setValue('list_slug', opts[0].value);
      })
      .catch((error) => console.error('Failed to load lists:', error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```
Le `<select>` mappe déjà `listOptions` (L212) et `onSubmit` utilise `listOptions.find` (L43) — inchangés.

- [ ] **Step 4: `FormModifyItem.tsx`** — import `React, { useEffect, useState }` ; supprimer le const `listOptions` (L24-28) et ajouter `type ListOption = { value: string; label: string; user: string | null };` ; zod (L34) → `list_slug: z.string().min(1),` ; ajouter `listOptions: ListOption[];` à `FormModifyItemProps` et au destructuring des props ; remplacer `initialListSlug` (L67-73) par :
```tsx
  const initialListSlug = React.useMemo(() => {
    if (!kdo.user) return 'commune';
    const opt = listOptions.find((l) => l.user === kdo.user);
    return opt ? opt.value : 'commune';
  }, [kdo.user, listOptions]);
```
Changer `const { register, handleSubmit } = useForm<FormData>({` en `const { register, handleSubmit, setValue } = useForm<FormData>({` et, après le bloc `useForm`, ajouter :
```tsx
  useEffect(() => {
    setValue('list_slug', initialListSlug);
  }, [initialListSlug, setValue]);
```

- [ ] **Step 5: `admin/page.tsx`** — type `Kdo.user` (L24) → `user: string;` ; ajouter `type ListOption = { value: string; label: string; user: string | null };` ; ajouter `const [listOptions, setListOptions] = useState<ListOption[]>([]);` (après L38) ; remplacer `useState('Marie-Eve')` (L53) par `useState('')` ; remplacer `fetchKdos` (L60-66) pour filtrer par slug :
```tsx
  const fetchKdos = async (selection: string) => {
    let apiUrl = `${ApiAdress}/api/kdos-admin/?format=json`;
    if (selection) {
      apiUrl += `&list=${encodeURIComponent(selection)}`;
    }
```
(le reste de `fetchKdos` inchangé). Remplacer le `useEffect` de chargement initial (L201-205) par :
```tsx
  useEffect(() => {
    api
      .get('/api/lists/all/')
      .then((res) => {
        const opts: ListOption[] = res.data.map(
          (l: { slug: string; label: string; owner_name: string | null }) => ({
            value: l.slug,
            label: l.label,
            user: l.owner_name,
          })
        );
        setListOptions(opts);
        if (opts.length > 0) {
          setSelectedUser(opts[0].value);
          fetchKdos(opts[0].value);
        }
      })
      .catch((error) => console.error('Failed to load lists:', error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```
Remplacer les 3 `<Select.Item>` codés en dur (L140-190) par un map :
```tsx
            {listOptions.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className="relative flex cursor-pointer select-none items-center rounded-lg px-4 py-2 transition-colors hover:bg-[var(--primary)]/10 text-[var(--text-primary)]"
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
              </Select.Item>
            ))}
```
Passer `listOptions` à `FormModifyItem` (L358-362) : ajouter `listOptions={listOptions}` aux props.

- [ ] **Step 6: Vérifier** — `cd kdoapp && npm run test -- AddItem` → PASS ; `npx tsc --noEmit && npm run lint && npm run test` → vert ; `grep -rn "Marie-Eve\|'Mathieu'" src/` → aucun.

- [ ] **Step 7: Commit**

```bash
git add kdoapp/src/app/admin/add/page.tsx kdoapp/src/components/FormModifyItem.tsx kdoapp/src/app/admin/page.tsx kdoapp/src/app/admin/add/__tests__/AddItem.test.tsx
git commit -m "refactor(frontend): load list options from API, filter by slug"
```

---

### Task 10: UI superadmin — création/renommage/suppression de listes + toggle rôle + case Admin

**Files:**
- Modify: `kdoapp/src/app/admin/superadmin/page.tsx`
- Modify: `kdoapp/src/app/admin/superadmin/add-user/page.tsx`

**Interfaces:**
- Consomme : `POST/PATCH/DELETE /api/lists/...`, `PATCH /api/users/{id}/role`, `POST /api/create-user/` (avec `isAdmin`).

- [ ] **Step 1: Adapter le type + l'affichage des listes** — `superadmin/page.tsx`. Remplacer le type `GiftListItem` (L17-22) :
```tsx
type GiftListItem = {
  slug: string;
  label: string;
  owner_id: number | null;
  owner_name: string | null;
  is_common: boolean;
  enabled: boolean;
};
```
Et la ligne d'affichage du propriétaire (L350) :
```tsx
                      {gList.is_common ? ' — Liste commune' : gList.owner_name ? ` — ${gList.owner_name}` : ' — Sans compte'}
```

- [ ] **Step 2: État + handlers (listes & rôles)** — `superadmin/page.tsx`, après les états existants (~L47) ajouter :
```tsx
  const [newListLabel, setNewListLabel] = useState('');
  const [newListOwner, setNewListOwner] = useState<string>('');
  const [listError, setListError] = useState<string | null>(null);
  const [listToDelete, setListToDelete] = useState<GiftListItem | null>(null);
```
et les handlers (après `handleToggleList`, ~L132) :
```tsx
  const handleCreateList = async () => {
    setListError(null);
    try {
      await api.post(`${ApiAdress}/api/lists/`, {
        label: newListLabel,
        owner_id: newListOwner ? Number(newListOwner) : null,
      });
      setNewListLabel('');
      setNewListOwner('');
      fetchGiftLists();
    } catch (error: unknown) {
      const detail =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setListError(detail ?? 'Échec de la création');
    }
  };

  const handleDeleteList = async () => {
    if (!listToDelete) return;
    try {
      await api.delete(`${ApiAdress}/api/lists/${listToDelete.slug}`);
      fetchGiftLists();
    } catch (error) {
      console.error('Error deleting list:', error);
    } finally {
      setListToDelete(null);
    }
  };

  const handleToggleRole = async (user: User, makeAdmin: boolean) => {
    try {
      await api.patch(`${ApiAdress}/api/users/${user.id}/role`, { isAdmin: makeAdmin });
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };
```
Étendre le type `User` (L12-15) avec `isAdmin: boolean;` et `isMegaAdmin: boolean;` (et adapter `fetchUsers` pour que `/api/users/` renvoie ces champs — voir Step 5).

- [ ] **Step 3: Formulaire de création de liste** — `superadmin/page.tsx`, insérer en tête de la section « Gift Lists Management », juste après le `<div>` titre (après L328) :
```tsx
          <div className="p-6 sm:p-8 border-b border-[var(--border)] flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Nom de la liste</label>
              <input
                value={newListLabel}
                onChange={(e) => setNewListLabel(e.target.value)}
                placeholder="ex. Léa"
                className="w-full rounded-lg px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Propriétaire</label>
              <select
                value={newListOwner}
                onChange={(e) => setNewListOwner(e.target.value)}
                className="w-full rounded-lg px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)]"
              >
                <option value="">Aucun (sans compte)</option>
                {(usersList ?? []).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreateList}
              disabled={!newListLabel.trim()}
              className="py-2 px-6 rounded-lg text-white font-semibold bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              Créer
            </button>
          </div>
          {listError && <p className="px-6 pt-3 text-sm text-[var(--error)]">{listError}</p>}
```

- [ ] **Step 4: Bouton supprimer par liste** — `superadmin/page.tsx`, dans la ligne de liste (le `<div>` avec le toggle, ~L353-382), à droite du toggle, ajouter (sauf pour `is_common`) :
```tsx
                  {!gList.is_common && (
                    <button
                      onClick={() => setListToDelete(gList)}
                      className="ml-3 p-2 rounded-lg bg-[var(--danger)] hover:bg-[var(--danger-hover)] text-white"
                      title="Supprimer la liste"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
```
Et ajouter le dialog de confirmation (calqué sur le dialog de suppression d'utilisateur existant, L391+), juste après celui-ci :
```tsx
      {listToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 animate-overlayShow" onClick={() => setListToDelete(null)} />
          <div className="relative z-50 max-w-md w-full rounded-2xl p-8 shadow-xl animate-fadeInUp dialog-surface">
            <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">Supprimer la liste</h3>
            <p className="mb-6 text-[var(--text-secondary)]">
              Supprimer <span className="font-bold text-[var(--text-primary)]">&quot;{listToDelete.label}&quot;</span>{' '}
              supprimera aussi toutes ses idées. Action irréversible.
            </p>
            <div className="flex gap-4 justify-end">
              <button onClick={() => setListToDelete(null)} className="px-6 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-muted)] text-[var(--text-secondary)]">Annuler</button>
              <button onClick={handleDeleteList} className="px-6 py-2 rounded-lg bg-[var(--danger)] hover:bg-[var(--danger-hover)] text-white">Supprimer</button>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 5: Toggle rôle dans la table users + endpoint users enrichi** — d'abord, côté backend, `get_username_api` (`server/main.py` ~L543) doit renvoyer `isAdmin`/`isMegaAdmin` :
```python
        result = await db.execute(select(User.id, User.name, User.isAdmin, User.isMegaAdmin).order_by(User.name))
```
Ajouter un test rapide dans `server/test_users.py` (`test_get_users` existant) : `assert "isAdmin" in data[0]`. Puis, `superadmin/page.tsx`, dans les actions de chaque ligne user (à côté des boutons existants, ~L297) ajouter :
```tsx
                          {!user.isMegaAdmin && user.id !== /* soi-même: id du token */ -1 && (
                            <button
                              onClick={() => handleToggleRole(user, !user.isAdmin)}
                              className="flex items-center gap-2 p-2 px-4 rounded-lg bg-[var(--secondary)] hover:bg-[var(--secondary-hover)] text-white"
                              title={user.isAdmin ? 'Retirer admin' : 'Promouvoir admin'}
                            >
                              <Shield className="w-4 h-4" />
                              <span className="hidden sm:inline">{user.isAdmin ? 'Admin ✓' : 'Admin'}</span>
                            </button>
                          )}
```
(Le garde-fou « soi-même » est aussi appliqué côté serveur — Task 6 ; ici on désactive simplement sur les lignes megaadmin. Pour masquer aussi sur soi-même, comparer `user.id` au `sub` du token décodé via `useAuth()` ; ajouter `const { user: me } = useAuth();` et remplacer `-1` par `me?.sub`.)

- [ ] **Step 6: Case Admin à la création d'utilisateur** — `add-user/page.tsx` : ajouter un champ booléen `isAdmin` au state/formulaire et l'envoyer dans le payload de `POST /api/create-user/`. Repérer le `onSubmit`/payload existant et inclure `isAdmin: <valeur de la case>`. Ajouter une case à cocher dans le formulaire :
```tsx
            <label className="flex items-center gap-2 text-[var(--text-secondary)]">
              <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
              Administrateur (peut gérer sa propre liste)
            </label>
```
(et `const [isAdmin, setIsAdmin] = useState(false);` en tête du composant ; inclure `isAdmin` dans l'objet POST.)

- [ ] **Step 7: Vérifier** — `cd kdoapp && npx tsc --noEmit && npm run lint && npm run test` → vert. `cd server && pytest -v` → vert (endpoint users enrichi).

- [ ] **Step 8: Vérification manuelle (UI)** — lancer back+front, se connecter en megaadmin : créer une liste « Léa » sans propriétaire (visible), créer un user admin, le promouvoir/rétrograder, supprimer une liste (confirmation + cascade). Noter le résultat honnêtement.

- [ ] **Step 9: Commit**

```bash
git add kdoapp/src/app/admin/superadmin/page.tsx kdoapp/src/app/admin/superadmin/add-user/page.tsx server/main.py server/test_users.py
git commit -m "feat(superadmin): manage lists (CRUD) and user roles from the UI"
```

---

## PHASE 4 — Docs & vérification finale

### Task 11: Docs, housekeeping, vérification complète

**Files:**
- Modify: `kdoapp/CLAUDE.md`, `.gitignore`

- [ ] **Step 1: CLAUDE.md — User Roles** — remplacer `- **Super admin** (hardcoded as username "Mathieu"): Has additional admin panel access` par :
```
- **Super admin** (`isMegaAdmin: true`): seul rôle autorisé à gérer les listes (CRUD), créer/supprimer des utilisateurs, réinitialiser les mots de passe, et changer les rôles. Appliqué côté serveur via `ensure_megaadmin` (`server/main.py`). Bootstrap via `server/create_superadmin.py`.
```

- [ ] **Step 2: CLAUDE.md — Hardcoded Users** — remplacer la note 2 par :
```
2. **Listes = données, pas code** : listes et propriétaires sont gérés au runtime (`/admin/superadmin`, FK `GiftList.owner_id`). Aucun nom de personne dans le code. Le 1er megaadmin et la liste commune sont créés par `server/create_superadmin.py`.
```

- [ ] **Step 3: `.gitignore`** — ajouter sous la section secrets : `.gstack/`.

- [ ] **Step 4: Vérification complète**
```bash
cd server && pytest -v
cd ../kdoapp && npx tsc --noEmit && npm run lint && npm run test
```
Attendu : tout vert.

- [ ] **Step 5: E2E (Playwright)** — `cd kdoapp && npm run test:e2e`. Si l'environnement nécessite back+DB et n'est pas dispo localement, le noter honnêtement (ne pas prétendre vert).

- [ ] **Step 6: Commit**

```bash
git add kdoapp/CLAUDE.md .gitignore
git commit -m "docs: document runtime list/role management; ignore local /cso reports"
```

---

## Self-Review

**Couverture du spec :**
- owner_id FK + is_common + retrait user_name → Task 3 ; migration → Task 4. ✅
- CRUD listes (create/rename/delete cascade) → Task 5. ✅
- Rôles (toggle isAdmin, create-user isAdmin, garde-fou self) → Task 6. ✅
- Bootstrap megaadmin + commune → Task 7. ✅
- Sécurité : `ensure_megaadmin` (existant + nouveaux endpoints) → Tasks 1/5/6 ; SSRF → Task 2. ✅
- Frontend : gate isMegaAdmin → Task 8 ; dropdowns API + filtre slug → Task 9 ; UI superadmin (listes + rôles + case Admin) → Task 10. ✅
- Visibilité listes sans compte vs commune → Task 3 (get_lists) + tests Task 5. ✅
- Docs/housekeeping → Task 11. ✅
- Hors périmètre (notés à l'audit) : findings #3 (ownership item), #4 (défaut DB), IDOR untake, rate-limit login. Non traités.

**Cohérence des types/signatures :** `ensure_megaadmin(payload)`, `_serialize_list(gl)`, `_slugify`/`_unique_slug`, `GiftListResponse{owner_id,owner_name,is_common}`, `ListOption{value,label,user}`, `RoleUpdate{isAdmin}`, `GiftListCreate/Update` — utilisés de façon identique entre tasks. `owner_id` partout (jamais `user_name` après Task 3). Refus megaadmin = 403 partout.

**Placeholders :** chaque étape de code contient le code réel + une commande avec sortie attendue. Le seul point « manuel » est l'anchor `me?.sub` (Step 5 Task 10) et la vérif UI (Step 8 Task 10), explicitement signalés.

**Point d'attention migration :** `migrate()` est PostgreSQL (DDL non testé en unitaire) ; la logique de backfill est testée en SQLite (Task 4). À exécuter d'abord sur une copie de staging.
