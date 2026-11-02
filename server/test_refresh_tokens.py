"""Module refresh_tokens : seuls les empreintes SHA-256 des jetons sont stockées."""
import hashlib

from sqlalchemy.future import select

from database import get_db
from main import app
from models import RefreshToken, User
from refresh_tokens import (
    hash_refresh_token,
    issue_refresh_token,
    revoke_all_refresh_tokens,
    revoke_refresh_token,
)


async def _session():
    async_gen = app.dependency_overrides[get_db]()
    session = await anext(async_gen)
    return async_gen, session


async def _add_users(session, *names):
    users = [User(name=n, password="x", isAdmin=False, isMegaAdmin=False, firstConnection=False) for n in names]
    session.add_all(users)
    await session.commit()
    return [u.id for u in users]


async def _hashes(session) -> list[str]:
    return list((await session.execute(select(RefreshToken.token_hash))).scalars().all())


def test_hash_is_sha256_hex():
    assert hash_refresh_token("abc") == hashlib.sha256(b"abc").hexdigest()


async def test_issue_stores_hash_not_raw_token(client):
    async_gen, session = await _session()
    (uid,) = await _add_users(session, "paul")
    raw = await issue_refresh_token(session, uid)
    await session.commit()
    assert await _hashes(session) == [hash_refresh_token(raw)]
    assert raw not in await _hashes(session)
    await async_gen.aclose()


async def test_revoke_one_keeps_others(client):
    async_gen, session = await _session()
    (uid,) = await _add_users(session, "paul")
    t1 = await issue_refresh_token(session, uid)
    t2 = await issue_refresh_token(session, uid)
    await session.commit()
    await revoke_refresh_token(session, t1)
    await session.commit()
    assert await _hashes(session) == [hash_refresh_token(t2)]
    await async_gen.aclose()


async def test_revoke_all_only_targets_user(client):
    async_gen, session = await _session()
    u1, u2 = await _add_users(session, "paul", "anne")
    await issue_refresh_token(session, u1)
    await issue_refresh_token(session, u1)
    other = await issue_refresh_token(session, u2)
    await session.commit()
    await revoke_all_refresh_tokens(session, u1)
    await session.commit()
    assert await _hashes(session) == [hash_refresh_token(other)]
    await async_gen.aclose()
