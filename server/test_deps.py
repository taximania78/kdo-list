from datetime import datetime, timedelta, timezone

import jwt
import pytest_asyncio
from fastapi import Depends, FastAPI
from httpx import ASGITransport, AsyncClient

from auth import create_refresh_token
from config import SECRET_KEY, ALGORITHM
from deps import CurrentUser, get_current_user, require_admin, require_megaadmin

deps_app = FastAPI()


def _as_dict(user: CurrentUser) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "is_admin": user.is_admin,
        "is_megaadmin": user.is_megaadmin,
    }


@deps_app.get("/connected")
def connected(current_user: CurrentUser = Depends(get_current_user)):
    return _as_dict(current_user)


@deps_app.get("/admin")
def admin_only(current_user: CurrentUser = Depends(require_admin)):
    return _as_dict(current_user)


@deps_app.get("/megaadmin")
def megaadmin_only(current_user: CurrentUser = Depends(require_megaadmin)):
    return _as_dict(current_user)


@pytest_asyncio.fixture
async def deps_client():
    transport = ASGITransport(app=deps_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c


def _bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _signed(payload: dict, key: str = SECRET_KEY) -> str:
    return jwt.encode(payload, key, algorithm=ALGORITHM)


def _in(minutes: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)


# ─── 401 : non authentifié ──────────────────────────────────────────────

async def test_no_token_is_401(deps_client):
    res = await deps_client.get("/connected")
    assert res.status_code == 401


async def test_expired_token_is_401(deps_client):
    token = _signed({"sub": "1", "type": "access", "exp": _in(-1)})
    res = await deps_client.get("/connected", headers=_bearer(token))
    assert res.status_code == 401
    assert res.json()["detail"] == "Token invalide ou expiré"
    assert res.headers["www-authenticate"] == "Bearer"


async def test_bad_signature_is_401(deps_client):
    token = _signed({"sub": "1", "type": "access", "exp": _in(5)}, key="autre-secret")
    res = await deps_client.get("/connected", headers=_bearer(token))
    assert res.status_code == 401


async def test_missing_sub_is_401(deps_client):
    token = _signed({"type": "access", "exp": _in(5)})
    res = await deps_client.get("/connected", headers=_bearer(token))
    assert res.status_code == 401


async def test_non_numeric_sub_is_401(deps_client):
    token = _signed({"sub": "abc", "type": "access", "exp": _in(5)})
    res = await deps_client.get("/connected", headers=_bearer(token))
    assert res.status_code == 401


async def test_refresh_token_used_as_access_is_401(deps_client):
    token, _ = create_refresh_token({"sub": "1"})
    res = await deps_client.get("/connected", headers=_bearer(token))
    assert res.status_code == 401


async def test_legacy_access_token_without_type_is_401(deps_client):
    token = _signed({"sub": "1", "username": "admin", "isAdmin": True, "isMegaAdmin": True, "exp": _in(5)})
    res = await deps_client.get("/megaadmin", headers=_bearer(token))
    assert res.status_code == 401


# ─── 403 : authentifié sans le rôle ─────────────────────────────────────

async def test_user_on_admin_is_403(deps_client, user_token):
    res = await deps_client.get("/admin", headers=_bearer(user_token))
    assert res.status_code == 403
    assert res.json()["detail"] == "Non autorisé"


async def test_admin_non_mega_on_megaadmin_is_403(deps_client, admin_non_mega_token):
    res = await deps_client.get("/megaadmin", headers=_bearer(admin_non_mega_token))
    assert res.status_code == 403
    assert res.json()["detail"] == "Non autorisé"


# ─── Cas nominaux ───────────────────────────────────────────────────────

async def test_user_is_connected(deps_client, user_token):
    res = await deps_client.get("/connected", headers=_bearer(user_token))
    assert res.status_code == 200
    assert res.json() == {"id": 2, "username": "user", "is_admin": False, "is_megaadmin": False}


async def test_admin_non_mega_passes_admin(deps_client, admin_non_mega_token):
    res = await deps_client.get("/admin", headers=_bearer(admin_non_mega_token))
    assert res.status_code == 200
    assert res.json() == {"id": 3, "username": "petit-admin", "is_admin": True, "is_megaadmin": False}


async def test_megaadmin_passes_all(deps_client, admin_token):
    for path in ("/connected", "/admin", "/megaadmin"):
        res = await deps_client.get(path, headers=_bearer(admin_token))
        assert res.status_code == 200
        assert res.json() == {"id": 1, "username": "admin", "is_admin": True, "is_megaadmin": True}
