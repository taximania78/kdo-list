from datetime import datetime, timedelta, timezone

import jwt
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.future import select

from auth import create_access_token, decode_jwt, hash_password
from config import SECRET_KEY, ALGORITHM
from database import get_db
from main import app
from models import RefreshToken, User
from refresh_tokens import hash_refresh_token, revoke_refresh_token


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
    rows = (await session.execute(select(RefreshToken.token_hash))).scalars().all()
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
    session.add(RefreshToken(user_id=normal_user.id, token_hash=hash_refresh_token(legacy), expires_at=expire))
    await session.commit()
    await async_gen.aclose()

    res = await client.post("/api/refresh/", json={"refresh_token": legacy})
    assert res.status_code == 401
    assert res.json()["detail"] == "Refresh Token invalide ou expiré"
    assert hash_refresh_token(legacy) not in await _stored_tokens()


async def test_refresh_rejects_non_numeric_sub(client: AsyncClient):
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    token = jwt.encode({"sub": "abc", "type": "refresh", "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
    res = await client.post("/api/refresh/", json={"refresh_token": token})
    assert res.status_code == 401
    assert res.json()["detail"] == "Refresh Token invalide ou expiré"


async def _refresh(client: AsyncClient, token: str):
    return await client.post("/api/refresh/", json={"refresh_token": token})


async def _backdate_rotation(token: str, minutes: int) -> None:
    """Recule rotated_at pour sortir de la fenêtre de grâce."""
    async_gen = app.dependency_overrides[get_db]()
    session = await anext(async_gen)
    await session.execute(
        update(RefreshToken)
        .where(RefreshToken.token_hash == hash_refresh_token(token))
        .values(rotated_at=datetime.now(timezone.utc) - timedelta(minutes=minutes))
    )
    await session.commit()
    await async_gen.aclose()


async def test_replay_within_grace_window_does_not_revoke(client: AsyncClient, normal_user):
    """Rejeu juste après l'échange (page tuée en plein refresh) : 401 sans révoquer les sessions."""
    a = (await _login(client))["refresh_token"]
    first = await _refresh(client, a)
    assert first.status_code == 200
    a2 = first.json()["refresh_token"]

    replay = await _refresh(client, a)
    assert replay.status_code == 401
    assert replay.json()["detail"] == "Refresh Token non reconnu"

    assert (await _refresh(client, a2)).status_code == 200


async def test_replay_after_grace_window_revokes_all(client: AsyncClient, normal_user):
    """Rejeu au-delà de la fenêtre de grâce : toutes les sessions sont révoquées."""
    a = (await _login(client))["refresh_token"]
    b = (await _login(client))["refresh_token"]
    first = await _refresh(client, a)
    assert first.status_code == 200
    a2 = first.json()["refresh_token"]
    await _backdate_rotation(a, minutes=2)

    replay = await _refresh(client, a)
    assert replay.status_code == 401

    assert (await _refresh(client, b)).status_code == 401
    assert (await _refresh(client, a2)).status_code == 401
    assert await _stored_tokens() == []


async def test_reused_refresh_token_revokes_all_sessions(client: AsyncClient, normal_user):
    """Rejouer un jeton déjà échangé révoque toutes les sessions de l'utilisateur."""
    a = (await _login(client))["refresh_token"]
    b = (await _login(client))["refresh_token"]
    first = await _refresh(client, a)
    assert first.status_code == 200
    a2 = first.json()["refresh_token"]
    await _backdate_rotation(a, minutes=2)

    replay = await _refresh(client, a)
    assert replay.status_code == 401
    assert replay.json()["detail"] == "Refresh Token non reconnu"

    assert (await _refresh(client, b)).status_code == 401
    assert (await _refresh(client, a2)).status_code == 401
    assert await _stored_tokens() == []


async def test_revoked_token_does_not_revoke_other_sessions(client: AsyncClient, normal_user):
    """Un jeton révoqué (logout) n'est pas une réutilisation : les autres sessions survivent."""
    a = (await _login(client))["refresh_token"]
    b = (await _login(client))["refresh_token"]
    async_gen = app.dependency_overrides[get_db]()
    session = await anext(async_gen)
    await revoke_refresh_token(session, a)
    await session.commit()
    await async_gen.aclose()

    assert (await _refresh(client, a)).status_code == 401
    assert (await _refresh(client, b)).status_code == 200


async def test_refresh_purges_expired_tokens(client: AsyncClient, normal_user):
    """Un refresh réussi purge les jetons expirés (y compris ceux d'autres utilisateurs)."""
    expired_hash = hash_refresh_token("jeton-expire")
    async_gen = app.dependency_overrides[get_db]()
    session = await anext(async_gen)
    other = User(name="autre", password=hash_password("Autre@12345"), isAdmin=False, isMegaAdmin=False, firstConnection=False)
    session.add(other)
    await session.commit()
    await session.refresh(other)
    session.add(RefreshToken(user_id=other.id, token_hash=expired_hash, expires_at=datetime.now(timezone.utc) - timedelta(days=1)))
    await session.commit()
    await async_gen.aclose()

    tokens = await _login(client)
    assert expired_hash in await _stored_tokens()
    assert (await _refresh(client, tokens["refresh_token"])).status_code == 200
    assert expired_hash not in await _stored_tokens()


async def test_logout_revokes_only_that_session(client: AsyncClient, normal_user):
    """La déconnexion révoque uniquement le jeton envoyé, pas les autres sessions."""
    a = (await _login(client))["refresh_token"]
    b = (await _login(client))["refresh_token"]

    res = await client.post("/api/logout/", json={"refresh_token": a})
    assert res.status_code == 204
    assert res.content == b""

    assert (await _refresh(client, a)).status_code == 401
    assert (await _refresh(client, b)).status_code == 200


async def test_logout_with_unknown_or_garbage_token_returns_204(client: AsyncClient, normal_user):
    """Déconnexion idempotente : jeton illisible ou valide mais jamais stocké, toujours 204."""
    from auth import create_refresh_token
    never_stored, _ = create_refresh_token({"sub": str(normal_user.id)})

    assert (await client.post("/api/logout/", json={"refresh_token": "garbage"})).status_code == 204
    assert (await client.post("/api/logout/", json={"refresh_token": never_stored})).status_code == 204
