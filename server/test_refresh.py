from datetime import datetime, timedelta, timezone

import jwt
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.future import select

from auth import create_access_token, decode_jwt, hash_password
from config import SECRET_KEY, ALGORITHM
from database import get_db
from main import app
from models import RefreshToken, User


@pytest_asyncio.fixture
async def normal_user(client: AsyncClient):
    async_gen = app.dependency_overrides[get_db]()
    session = await anext(async_gen)
    user = User(
        name="user", password=hash_password("NormalUser@123"),
        isAdmin=False, isMegaAdmin=False, firstConnection=False,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    await async_gen.aclose()
    return user


async def _login(client: AsyncClient) -> dict:
    res = await client.post("/api/login/", data={"username": "user", "password": "NormalUser@123"})
    assert res.status_code == 200
    return res.json()


async def _stored_tokens() -> list[str]:
    async_gen = app.dependency_overrides[get_db]()
    session = await anext(async_gen)
    rows = (await session.execute(select(RefreshToken.refresh_token))).scalars().all()
    await async_gen.aclose()
    return list(rows)


async def test_refresh_immediately_after_login(client: AsyncClient, normal_user):
    """Refresh dans la même seconde que le login : pas de collision de jeton."""
    tokens = await _login(client)
    res = await client.post("/api/refresh/", json={"refresh_token": tokens["refresh_token"]})
    assert res.status_code == 200
    data = res.json()
    assert data["isAdmin"] is False
    assert data["isMegaAdmin"] is False
    assert data["username"] == "user"
    assert decode_jwt(data["access_token"])["type"] == "access"
    assert decode_jwt(data["refresh_token"])["type"] == "refresh"


async def test_refresh_rotates_token(client: AsyncClient, normal_user):
    """Après un refresh réussi, l'ancien refresh token n'est plus accepté."""
    old = (await _login(client))["refresh_token"]
    res = await client.post("/api/refresh/", json={"refresh_token": old})
    assert res.status_code == 200
    replay = await client.post("/api/refresh/", json={"refresh_token": old})
    assert replay.status_code == 401


async def test_refresh_rejects_access_token(client: AsyncClient, normal_user):
    access = create_access_token({"sub": str(normal_user.id), "username": "user", "isAdmin": False, "isMegaAdmin": False})
    res = await client.post("/api/refresh/", json={"refresh_token": access})
    assert res.status_code == 401
    assert res.json()["detail"] == "Refresh Token invalide ou expiré"


async def test_refresh_rejects_legacy_token_without_type(client: AsyncClient, normal_user):
    """Ancien refresh token (sans claim type), pourtant présent en base → 401 et purgé."""
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    legacy = jwt.encode({"sub": str(normal_user.id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
    async_gen = app.dependency_overrides[get_db]()
    session = await anext(async_gen)
    session.add(RefreshToken(user_id=normal_user.id, refresh_token=legacy, expires_at=expire))
    await session.commit()
    await async_gen.aclose()

    res = await client.post("/api/refresh/", json={"refresh_token": legacy})
    assert res.status_code == 401
    assert res.json()["detail"] == "Refresh Token invalide ou expiré"
    assert legacy not in await _stored_tokens()


async def test_refresh_rejects_non_numeric_sub(client: AsyncClient):
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    token = jwt.encode({"sub": "abc", "type": "refresh", "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
    res = await client.post("/api/refresh/", json={"refresh_token": token})
    assert res.status_code == 401
    assert res.json()["detail"] == "Refresh Token invalide ou expiré"
