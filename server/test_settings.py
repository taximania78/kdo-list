import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.future import select
from main import app
from database import get_db
from models import AppSetting
from migrate_app_settings import create_app_settings_table


async def _session():
    """Ouvre une session sur la base de test (même mécanisme que test_lists.py)."""
    gen = app.dependency_overrides[get_db]()
    return gen, await anext(gen)


@pytest.mark.asyncio
async def test_get_theme_defaults_when_empty(client: AsyncClient):
    response = await client.get("/api/settings/theme")
    assert response.status_code == 200
    assert response.json() == {"theme": "default"}


@pytest.mark.asyncio
async def test_put_theme_requires_token(client: AsyncClient):
    response = await client.put("/api/settings/theme", json={"theme": "christmas"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_put_theme_rejects_invalid_token(client: AsyncClient):
    headers = {"Authorization": "Bearer pas-un-jwt"}
    response = await client.put("/api/settings/theme", json={"theme": "christmas"}, headers=headers)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_put_theme_forbidden_for_simple_user(client: AsyncClient, user_token: str):
    headers = {"Authorization": f"Bearer {user_token}"}
    response = await client.put("/api/settings/theme", json={"theme": "christmas"}, headers=headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_put_theme_forbidden_for_non_mega_admin(client: AsyncClient, admin_non_mega_token: str):
    headers = {"Authorization": f"Bearer {admin_non_mega_token}"}
    response = await client.put("/api/settings/theme", json={"theme": "christmas"}, headers=headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_put_theme_rejects_unknown_value(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.put("/api/settings/theme", json={"theme": "halloween"}, headers=headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_put_then_get_theme(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.put("/api/settings/theme", json={"theme": "christmas"}, headers=headers)
    assert response.status_code == 200
    assert response.json() == {"theme": "christmas"}

    response = await client.get("/api/settings/theme")
    assert response.json() == {"theme": "christmas"}


@pytest.mark.asyncio
async def test_put_twice_updates_single_row(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    await client.put("/api/settings/theme", json={"theme": "christmas"}, headers=headers)
    await client.put("/api/settings/theme", json={"theme": "default"}, headers=headers)

    gen, session = await _session()
    rows = (await session.execute(select(AppSetting))).scalars().all()
    await gen.aclose()
    assert [(r.key, r.value) for r in rows] == [("theme", "default")]


@pytest.mark.asyncio
async def test_get_theme_ignores_unknown_stored_value(client: AsyncClient):
    gen, session = await _session()
    session.add(AppSetting(key="theme", value="halloween"))
    await session.commit()
    await gen.aclose()

    response = await client.get("/api/settings/theme")
    assert response.status_code == 200
    assert response.json() == {"theme": "default"}


@pytest.mark.asyncio
async def test_get_theme_defaults_when_table_missing(client: AsyncClient):
    # Simule une prod où migrate_app_settings.py n'a pas encore été lancé
    gen, session = await _session()
    await session.execute(text("DROP TABLE app_settings"))
    await session.commit()
    await gen.aclose()

    response = await client.get("/api/settings/theme")
    assert response.status_code == 200
    assert response.json() == {"theme": "default"}


@pytest.mark.asyncio
async def test_migration_is_idempotent_and_inserts_nothing():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await create_app_settings_table(conn)
        await create_app_settings_table(conn)  # 2e exécution : aucune erreur
        rows = (await conn.execute(text("SELECT key, value FROM app_settings"))).all()
    await engine.dispose()
    assert rows == []


@pytest.mark.asyncio
async def test_get_theme_logs_database_error(client: AsyncClient, caplog):
    # Un repli silencieux masquerait une panne de base : il doit laisser une trace
    gen, session = await _session()
    await session.execute(text("DROP TABLE app_settings"))
    await session.commit()
    await gen.aclose()

    with caplog.at_level("WARNING"):
        response = await client.get("/api/settings/theme")
    assert response.json() == {"theme": "default"}
    assert any("thème" in r.getMessage() for r in caplog.records if r.levelname == "WARNING")
